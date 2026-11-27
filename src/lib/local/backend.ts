/**
 * Browser-side implementation of the student API.
 *
 * The static build has no server, so this module answers the same requests the
 * React pages make, using localStorage and the shared deterministic scoring
 * engine. It is deliberately small: only student-facing routes are handled.
 * Administrator, email and cross-device features stay in the optional Node
 * backend (see server/) and are not simulated here.
 */
import { ALGORITHM_VERSION, compareResults, labelFor, scoreAssessment } from '../../../shared/engine.js';
import type { ActivitySeed, ContentQuestion, StrandSeed } from '../../../shared/content.js';
import { ACTIVITIES, CATEGORIES, CATEGORY_KEYS, QUESTIONNAIRE_V1, STRANDS } from '../../../shared/content.js';
import type {
  Assessment,
  AssessmentResult,
  AssessmentSummary,
  AuthConfig,
  CareerField,
  Comparison,
  DashboardData,
  NotificationItem,
  Profile,
  Programme,
  ProgrammeActivity,
  QuestionnaireMeta,
  Strand,
  SupportTicket,
  User,
  VerificationState
} from '../../types/api';
import { ApiError } from '../apiError';
import { STATIC_STORAGE_NOTICE } from '../mode';
import { hashPassword, passwordProblems, verifyPassword } from './passwords';
import { ensureProfile, nextId, readDb, updateDb, writeDb } from './store';
import type {
  LocalAssessmentRecord,
  LocalAssessmentResult,
  LocalDatabase,
  LocalProgramActivityRecord,
  LocalProgramRecord,
  LocalTicketRecord,
  LocalUserRecord
} from './types';

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

const VALIDATION_NOTICE =
  'This questionnaire is a technical draft reviewed for clarity and strand coverage. It has not been pilot-tested or statistically validated, so results should be read as structured guidance rather than a diagnosis or a prediction.';

const SESSION_HOURS = 12;
const SESSION_REMEMBER_HOURS = 24 * 30;

const now = () => new Date().toISOString();

/* ------------------------------------------------------------------ shaping */

function publicUser(user: LocalUserRecord): User {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: 'student',
    status: user.status,
    emailVerified: Boolean(user.verifiedAt),
    emailVerifiedAt: user.verifiedAt,
    mustChangePassword: false,
    theme: user.theme
  };
}

function profilePayload(db: LocalDatabase, userId: number): Profile | null {
  const profile = db.profiles[String(userId)];
  if (!profile) return null;
  return { ...profile, theme: db.users.find((u) => u.id === userId)?.theme ?? 'green' };
}

function requireUser(db: LocalDatabase): LocalUserRecord {
  const session = db.session;
  if (!session) throw new ApiError(401, 'UNAUTHENTICATED', 'Sign in to continue');
  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    db.session = null;
    throw new ApiError(401, 'SESSION_EXPIRED', 'Your session expired. Sign in again.');
  }
  const user = db.users.find((u) => u.id === session.userId);
  if (!user) {
    db.session = null;
    throw new ApiError(401, 'UNAUTHENTICATED', 'Sign in to continue');
  }
  return user;
}

function strandPayload(strand: StrandSeed): Strand {
  return {
    slug: strand.slug,
    code: strand.code,
    name: strand.name,
    track: strand.track,
    tagline: strand.tagline,
    summary: strand.summary,
    interests: strand.interests,
    skills: strand.skills,
    learn: strand.learn,
    suitedFor: strand.suited,
    collegeFields: strand.college,
    careerAreas: strand.careers,
    considerations: strand.considerations,
    weights: strand.weights,
    active: true
  };
}

function questionnaireMeta(): QuestionnaireMeta {
  return {
    version: QUESTIONNAIRE_V1.version,
    title: QUESTIONNAIRE_V1.title,
    notes: QUESTIONNAIRE_V1.notes,
    algorithmVersion: ALGORITHM_VERSION,
    validationNotice: VALIDATION_NOTICE,
    categories: CATEGORY_KEYS.map((key) => ({ key, ...CATEGORIES[key] })),
    sections: [...new Set(QUESTIONNAIRE_V1.questions.map((question) => question.section))],
    questions: QUESTIONNAIRE_V1.questions.map((question, index) => ({
      id: index + 1,
      code: question.code,
      section: question.section,
      dimension: question.dimension ?? null,
      prompt: question.prompt,
      helper: question.helper ?? null,
      kind: question.kind,
      maxChoices: question.maxChoices ?? null,
      weight: question.weight ?? 1,
      validationStatus: question.validationStatus ?? 'technical-draft',
      options: question.options.map((option, optionIndex) => ({
        id: optionIndex + 1,
        code: option.code,
        label: option.label,
        hint: option.hint ?? null,
        scores: option.scores,
        orderIndex: optionIndex + 1
      }))
    }))
  };
}

function assessmentSummary(record: LocalAssessmentRecord): AssessmentSummary {
  const result = record.result;
  const top = result?.ranked?.[0] ?? null;
  return {
    id: record.id,
    type: record.type,
    status: record.status,
    startedAt: record.startedAt,
    submittedAt: record.submittedAt,
    questionnaireVersion: record.questionnaireVersion,
    algorithmVersion: record.algorithmVersion,
    selectedStrand: record.selectedStrand,
    topStrand: top ? { slug: top.slug, code: top.code, name: top.name, score: top.score, level: top.level } : null,
    ranked: result?.ranked?.map((row) => ({ rank: row.rank, slug: row.slug, code: row.code, score: row.score })) ?? [],
    answeredCount: result?.answeredCount ?? countAnswered(record.answers),
    total: result?.total ?? QUESTIONNAIRE_V1.questions.length,
    hasResult: Boolean(result)
  };
}

function countAnswered(answers: Record<string, string[]>): number {
  return QUESTIONNAIRE_V1.questions.filter((question) => (answers[question.code] ?? []).length > 0).length;
}

function assessmentPayload(db: LocalDatabase, record: LocalAssessmentRecord): Assessment {
  const result = record.result;
  const payload: Assessment = {
    id: record.id,
    type: record.type,
    status: record.status,
    startedAt: record.startedAt,
    submittedAt: record.submittedAt,
    algorithmVersion: record.algorithmVersion,
    questionnaireVersion: record.questionnaireVersion,
    questionnaireTitle: QUESTIONNAIRE_V1.title,
    answers: record.answers,
    selectedStrand: record.selectedStrand,
    selectedAt: record.selectedAt,
    baselineAssessmentId: record.baselineAssessmentId,
    ...(result ? (result as unknown as AssessmentResult) : {})
  };
  if (record.type === 'post' && record.baselineAssessmentId) {
    const baseline = db.assessments.find((row) => row.id === record.baselineAssessmentId);
    if (baseline?.result && result) {
      payload.comparison =
        (compareResults(
          { ...(baseline.result as unknown as AssessmentResult), assessmentId: baseline.id, submittedAt: baseline.submittedAt ?? undefined } as never,
          { ...(result as unknown as AssessmentResult), assessmentId: record.id, submittedAt: record.submittedAt ?? undefined } as never
        ) as unknown as Comparison) ?? undefined;
    }
  }
  return payload;
}

function activityPayload(
  activity: ActivitySeed
): Omit<ProgrammeActivity, 'id' | 'sequence' | 'status' | 'startedAt' | 'completedAt' | 'checkScore' | 'reflection'> {
  return {
    activityId: 0,
    slug: activity.slug,
    title: activity.title,
    type: activity.type,
    targetCategory: activity.targetCategory,
    targetCategoryLabel: labelFor(activity.targetCategory),
    tier: activity.tier,
    difficulty: activity.difficulty,
    minutes: activity.minutes,
    objectives: activity.objectives,
    instructions: activity.instructions,
    completionCriteria: activity.completionCriteria,
    check: activity.check
  };
}

function programPayload(program: LocalProgramRecord): Programme {
  const activities: ProgrammeActivity[] = program.activities
    .map((state) => {
      const seed = ACTIVITIES.find((activity) => activity.slug === state.activitySlug);
      if (!seed) return null;
      return {
        ...activityPayload(seed),
        id: state.id,
        sequence: state.sequence,
        status: state.status,
        startedAt: state.startedAt,
        completedAt: state.completedAt,
        checkScore: state.checkScore,
        reflection: state.reflection
      } as ProgrammeActivity;
    })
    .filter((activity): activity is ProgrammeActivity => activity !== null)
    .sort((a, b) => a.sequence - b.sequence);

  const completed = activities.filter((activity) => activity.status === 'completed').length;
  return {
    id: program.id,
    name: program.name,
    goal: program.goal,
    strandSlug: program.strandSlug,
    targetCategories: program.targetCategories.map((key) => ({
      key,
      label: CATEGORIES[key]?.label ?? key,
      description: CATEGORIES[key]?.description ?? ''
    })),
    status: program.status,
    reassessmentAfterDays: program.reassessmentAfterDays,
    createdAt: program.createdAt,
    updatedAt: program.updatedAt,
    assessmentId: program.assessmentId,
    activities,
    progress: {
      total: activities.length,
      completed,
      inProgress: activities.filter((activity) => activity.status === 'in_progress').length,
      percent: activities.length ? Math.round((completed / activities.length) * 100) : 0
    }
  };
}

function ticketPayload(ticket: LocalTicketRecord): SupportTicket {
  return {
    id: ticket.id,
    subject: ticket.subject,
    category: ticket.category,
    status: ticket.status,
    priority: ticket.priority,
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
    assignedTo: null,
    messages: [...ticket.messages].sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1))
  };
}

function latestSubmitted(db: LocalDatabase, userId: number, type?: 'pre' | 'post'): LocalAssessmentRecord | null {
  const rows = db.assessments
    .filter((row) => row.userId === userId && row.status === 'submitted' && (!type || row.type === type))
    .sort((a, b) => (a.submittedAt ?? '').localeCompare(b.submittedAt ?? '') || a.id - b.id);
  return rows[rows.length - 1] ?? null;
}

function ownAssessment(db: LocalDatabase, id: number, userId: number): LocalAssessmentRecord {
  const record = db.assessments.find((row) => row.id === id && row.userId === userId);
  if (!record) throw new ApiError(404, 'ASSESSMENT_NOT_FOUND', 'Assessment not found');
  return record;
}

function ownProgram(db: LocalDatabase, id: number, userId: number): LocalProgramRecord {
  const record = db.programs.find((row) => row.id === id && row.userId === userId);
  if (!record) throw new ApiError(404, 'PROGRAM_NOT_FOUND', 'Programme not found');
  return record;
}

function finishWithSession(db: LocalDatabase, user: LocalUserRecord, remember: boolean): void {
  const hours = remember ? SESSION_REMEMBER_HOURS : SESSION_HOURS;
  const token = `${user.id}.${window.crypto.getRandomValues(new Uint32Array(2)).join('.')}`;
  db.session = { userId: user.id, token, expiresAt: new Date(Date.now() + hours * 60 * 60 * 1000).toISOString() };
  writeDb(db);
}

function text(value: unknown, field: string, { min = 0, max = 2000 } = {}): string {
  if (typeof value !== 'string') throw new ApiError(400, 'INVALID_INPUT', `${field} must be text`);
  const trimmed = value.trim();
  if (trimmed.length < min) throw new ApiError(400, 'INVALID_INPUT', `${field} must be at least ${min} characters`);
  if (trimmed.length > max) throw new ApiError(400, 'INVALID_INPUT', `${field} must be at most ${max} characters`);
  return trimmed;
}

function optionalText(value: unknown, max = 500): string | null {
  if (value === undefined || value === null || value === '') return null;
  return text(value, 'Value', { max });
}

/* ------------------------------------------------------------- auth routes */

async function register(body: Record<string, unknown>): Promise<unknown> {
  const name = text(body.name, 'Name', { min: 2, max: 80 });
  const email = text(body.email, 'Email', { min: 3, max: 160 }).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ApiError(400, 'INVALID_EMAIL', 'Enter a valid email address');
  const password = typeof body.password === 'string' ? body.password : '';
  const problems = passwordProblems(password);
  if (problems.length) {
    throw new ApiError(400, 'WEAK_PASSWORD', `Password needs ${problems.join(', ')}.`);
  }
  if (body.password !== body.confirmPassword) throw new ApiError(400, 'PASSWORD_MISMATCH', 'The two passwords do not match.');
  if (body.consent !== true) throw new ApiError(400, 'CONSENT_REQUIRED', 'Please accept the privacy notice to create an account.');

  const existing = readDb().users.find((user) => user.email === email);
  if (existing) throw new ApiError(409, 'EMAIL_IN_USE', 'An account already exists for this email on this device.');

  const passwordHash = await hashPassword(password);
  const created = updateDb((db) => {
    if (db.users.some((user) => user.email === email)) {
      throw new ApiError(409, 'EMAIL_IN_USE', 'An account already exists for this email on this device.');
    }
    const user: LocalUserRecord = {
      id: nextId(db),
      name,
      email,
      passwordHash,
      role: 'student',
      status: 'active',
      verifiedAt: now(),
      theme: 'green',
      createdAt: now()
    };
    db.users.push(user);
    const profile = ensureProfile(db, user.id);
    profile.gradeLevel = typeof body.gradeLevel === 'string' && body.gradeLevel ? body.gradeLevel : null;
    profile.school = typeof body.school === 'string' && body.school ? body.school.slice(0, 120) : null;
    profile.consentAt = now();
    profile.updatedAt = now();
    finishWithSession(db, user, false);
    const verification: VerificationState = {
      emailSent: false,
      emailDelivery: 'none',
      note: 'This static build has no email service, so no confirmation email was sent. Your local account is ready to use.'
    };
    return { user: publicUser(user), profile: profilePayload(db, user.id), verification };
  });
  return created;
}

async function login(body: Record<string, unknown>): Promise<unknown> {
  const email = text(body.email, 'Email', { min: 3, max: 160 }).toLowerCase();
  const password = typeof body.password === 'string' ? body.password : '';
  const db = readDb();
  const user = db.users.find((row) => row.email === email);
  if (!user) throw new ApiError(401, 'INVALID_CREDENTIALS', 'The email or password is incorrect.');
  if (!(await verifyPassword(password, user.passwordHash))) {
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'The email or password is incorrect.');
  }
  const remember = body.remember === true;
  const fresh = readDb();
  const current = fresh.users.find((row) => row.id === user.id);
  if (!current) throw new ApiError(401, 'INVALID_CREDENTIALS', 'The email or password is incorrect.');
  finishWithSession(fresh, current, remember);
  return { user: publicUser(current), profile: profilePayload(fresh, current.id) };
}

async function changePassword(body: Record<string, unknown>): Promise<unknown> {
  const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : '';
  const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';
  const problems = passwordProblems(newPassword);
  if (problems.length) throw new ApiError(400, 'WEAK_PASSWORD', `Password needs ${problems.join(', ')}.`);
  const db = readDb();
  const user = requireUser(db);
  if (!(await verifyPassword(currentPassword, user.passwordHash))) {
    throw new ApiError(400, 'INVALID_PASSWORD', 'The current password is incorrect.');
  }
  const hash = await hashPassword(newPassword);
  updateDb((current) => {
    const target = current.users.find((row) => row.id === user.id);
    if (target) target.passwordHash = hash;
  });
  return { ok: true };
}

/* -------------------------------------------------------- assessment routes */

function createAssessment(user: LocalUserRecord, type: 'pre' | 'post'): LocalAssessmentRecord {
  return updateDb((db) => {
    const pre = latestSubmitted(db, user.id, 'pre');
    if (type === 'post' && !pre) {
      throw new ApiError(409, 'BASELINE_REQUIRED', 'Complete a pre-assessment before starting a follow-up assessment.');
    }
    const existing = db.assessments.find(
      (row) => row.userId === user.id && row.type === type && row.status === 'in_progress'
    );
    if (existing) return existing;
    const record: LocalAssessmentRecord = {
      id: nextId(db),
      userId: user.id,
      type,
      status: 'in_progress',
      startedAt: now(),
      submittedAt: null,
      algorithmVersion: ALGORITHM_VERSION,
      questionnaireVersion: QUESTIONNAIRE_V1.version,
      answers: {},
      selectedStrand: null,
      selectedAt: null,
      baselineAssessmentId: type === 'post' ? pre?.id ?? null : null,
      result: null
    };
    db.assessments.push(record);
    return record;
  });
}

function saveAnswers(user: LocalUserRecord, id: number, answers: unknown): unknown {
  return updateDb((db) => {
    const record = ownAssessment(db, id, user.id);
    if (record.status !== 'in_progress') throw new ApiError(409, 'ASSESSMENT_SUBMITTED', 'This assessment has already been submitted.');
    if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
      throw new ApiError(400, 'INVALID_ANSWERS', 'Answers are required');
    }
    const valid = new Set(QUESTIONNAIRE_V1.questions.flatMap((question) => question.options.map((option) => option.code)));
    const cleaned: Record<string, string[]> = { ...record.answers };
    for (const [code, selected] of Object.entries(answers as Record<string, unknown>)) {
      if (!Array.isArray(selected) || selected.some((value) => typeof value !== 'string')) {
        throw new ApiError(400, 'INVALID_ANSWERS', 'Each answer must be a list of option codes');
      }
      const codes = selected.filter((value): value is string => typeof value === 'string' && valid.has(value));
      if (codes.length) cleaned[code] = codes;
      else delete cleaned[code];
    }
    record.answers = cleaned;
    return { assessment: assessmentPayload(db, record) };
  });
}

function submitAssessment(user: LocalUserRecord, id: number, body: Record<string, unknown>): unknown {
  return updateDb((db) => {
    const record = ownAssessment(db, id, user.id);
    if (record.status === 'submitted') return { assessment: assessmentPayload(db, record) };
    const answers = (body.answers && typeof body.answers === 'object' ? body.answers : record.answers) as Record<
      string,
      string[]
    >;
    let result: LocalAssessmentResult;
    try {
      result = scoreAssessment({
        questions: QUESTIONNAIRE_V1.questions as ContentQuestion[],
        strands: STRANDS,
        answers
      }) as unknown as LocalAssessmentResult;
    } catch (error) {
      const missing = (error as { missing?: string[] }).missing;
      throw new ApiError(400, 'INCOMPLETE_ASSESSMENT', (error as Error).message, missing);
    }
    record.answers = answers;
    record.result = result;
    record.status = 'submitted';
    record.submittedAt = now();
    if (record.type === 'post' && !record.baselineAssessmentId) {
      record.baselineAssessmentId = latestSubmitted(db, user.id, 'pre')?.id ?? null;
    }
    db.notifications.push({
      id: nextId(db),
      userId: user.id,
      title: record.type === 'post' ? 'Follow-up assessment recorded' : 'Assessment recorded',
      body: 'Your results are ready. Open Your Suggested Strands to read the explanations.',
      readAt: null,
      createdAt: now()
    });
    return { assessment: assessmentPayload(db, record) };
  });
}

function selectStrand(user: LocalUserRecord, id: number, strandSlug: unknown): unknown {
  const slug = text(strandSlug, 'Strand', { min: 2, max: 40 });
  if (!STRANDS.some((strand) => strand.slug === slug)) throw new ApiError(404, 'STRAND_NOT_FOUND', 'Strand not found');
  return updateDb((db) => {
    const record = ownAssessment(db, id, user.id);
    record.selectedStrand = slug;
    record.selectedAt = now();
    const profile = ensureProfile(db, user.id);
    profile.selectedStrand = slug;
    profile.updatedAt = now();
    return { assessment: assessmentPayload(db, record) };
  });
}

/* ---------------------------------------------------------- programme logic */

const STRAND_CATEGORY_MIN = 0.06;

function pickActivitiesFor(category: string, percent: number, exclude: string[]): ActivitySeed[] {
  const candidates = ACTIVITIES.filter((activity) => activity.targetCategory === category).sort(
    (a, b) => a.difficulty - b.difficulty || a.slug.localeCompare(b.slug)
  );
  if (!candidates.length) return [];

  // Start at the student's actual level: a dimension they can already evidence
  // at 70%+ skips the foundation activity instead of repeating it.
  if (percent >= 70) {
    const core = candidates.find((activity) => activity.tier !== 'foundation' && !exclude.includes(activity.slug));
    return core ? [core] : [];
  }
  const preferredTier = percent < 35 ? 'foundation' : 'foundation';
  const first = candidates.find((activity) => activity.tier === preferredTier) ?? candidates[0];
  const rest = candidates.filter((activity) => activity.slug !== first.slug && !exclude.includes(activity.slug));
  const second = rest.find((activity) => activity.tier !== first.tier) ?? rest[0];
  return [first, second].filter((activity): activity is ActivitySeed => Boolean(activity));
}

function generateProgram(user: LocalUserRecord, body: Record<string, unknown>): unknown {
  return updateDb((db) => {
    const requested = body.assessmentId
      ? ownAssessment(db, Number(body.assessmentId), user.id)
      : latestSubmitted(db, user.id, 'pre');
    if (!requested || requested.status !== 'submitted') {
      throw new ApiError(409, 'NO_ASSESSMENT', 'Complete a pre-assessment before generating a programme.');
    }
    const result = requested.result;
    if (!result) throw new ApiError(409, 'NO_RESULT', 'This assessment has no stored result.');
    const selected = requested.selectedStrand ?? db.profiles[String(user.id)]?.selectedStrand ?? null;
    if (!selected) throw new ApiError(409, 'NO_STRAND', 'Choose a strand on your results page first.');
    const strand = STRANDS.find((row) => row.slug === selected);
    if (!strand) throw new ApiError(409, 'NO_STRAND', 'The selected strand is no longer available. Choose another strand.');

    const existing = db.programs.find(
      (program) => program.userId === user.id && program.assessmentId === requested.id && program.status === 'active'
    );
    if (existing) return { program: programPayload(existing), reused: true };

    const byKey = new Map(result.categoryScores.map((category) => [category.key, category]));
    const strandCategories = Object.entries(strand.weights ?? {})
      .filter(([, weight]) => weight >= STRAND_CATEGORY_MIN)
      .sort((a, b) => b[1] - a[1]);

    // Targets are chosen relative to the strand the student chose, not from a
    // global "weakest two" list. The gap score combines how much the strand
    // depends on a dimension with how far the student currently is from it.
    // Dimensions already at 80%+ are skipped as mastered.
    const targets = strandCategories
      .map(([key, weight]) => ({ key, weight, percent: byKey.get(key)?.percent ?? 0 }))
      .filter((row) => row.percent < 80)
      .sort((a, b) => b.weight * (100 - b.percent) - a.weight * (100 - a.percent))
      .slice(0, 3)
      .map((row) => row.key);
    if (!targets.length) targets.push(...strandCategories.slice(0, 2).map(([key]) => key));

    const chosen: ActivitySeed[] = [];
    for (const category of targets) {
      const percent = byKey.get(category)?.percent ?? 0;
      for (const activity of pickActivitiesFor(category, percent, chosen.map((row) => row.slug))) {
        if (!chosen.some((row) => row.slug === activity.slug)) chosen.push(activity);
      }
    }
    if (!chosen.length) {
      throw new ApiError(409, 'NO_ACTIVITIES', 'No improvement activities are configured for these areas.');
    }

    for (const program of db.programs) {
      if (program.userId === user.id && program.status === 'active') {
        program.status = 'archived';
        program.updatedAt = now();
      }
    }

    const program: LocalProgramRecord = {
      id: nextId(db),
      userId: user.id,
      assessmentId: requested.id,
      name: `${strand.code} Preparation Programme`,
      goal: `Build the foundations for ${strand.code} (${strand.name}) in ${targets
        .map((key) => labelFor(key))
        .join(', ')}, starting from your ${new Date(requested.submittedAt ?? now()).toLocaleDateString('en-PH', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })} assessment.`,
      strandSlug: strand.slug,
      targetCategories: targets,
      status: 'active',
      reassessmentAfterDays: 28,
      createdAt: now(),
      updatedAt: now(),
      activities: chosen.map((activity, index) => ({
        id: nextId(db),
        activitySlug: activity.slug,
        sequence: index + 1,
        status: 'not_started' as const,
        startedAt: null,
        completedAt: null,
        reflection: null,
        checkScore: null,
        responses: null
      }))
    };
    db.programs.push(program);
    return { program: programPayload(program) };
  });
}

function programActivityState(db: LocalDatabase, id: number, userId: number): {
  program: LocalProgramRecord;
  activity: LocalProgramActivityRecord;
} {
  for (const program of db.programs) {
    if (program.userId !== userId) continue;
    const activity = program.activities.find((row) => row.id === id);
    if (activity) return { program, activity };
  }
  throw new ApiError(404, 'ACTIVITY_NOT_FOUND', 'Activity not found');
}

/* ------------------------------------------------------------- the router */

export async function localRequest<T>(path: string, method: Method = 'GET', body?: unknown): Promise<T> {
  const [pathname] = path.split('?');
  const payload = (body ?? {}) as Record<string, unknown>;
  const route = `${method} ${pathname}`;

  // ---- public content
  if (route === 'GET /auth/config') {
    return {
      google: {
        configured: false,
        clientId: null,
        note: 'Google sign-in requires the optional Node backend. This static build uses local accounts instead.'
      },
      email: {
        configured: false,
        transport: 'none',
        from: null,
        host: null,
        note: 'This static build has no email service, so confirmation and reset emails are not sent.'
      },
      otpTtlMinutes: 0,
      passwordRule: 'At least 8 characters, including a letter and a number.',
      registration: 'Local account saved in this browser'
    } satisfies AuthConfig as T;
  }

  if (route === 'GET /questionnaire/active') return questionnaireMeta() as T;
  if (route === 'GET /strands') return { strands: STRANDS.map(strandPayload), algorithmVersion: ALGORITHM_VERSION } as T;
  if (route === 'GET /careers') {
    const fields: CareerField[] = [];
    for (const strand of STRANDS) {
      for (const field of strand.college) {
        fields.push({ strandSlug: strand.slug, strandCode: strand.code, field, careers: strand.careers });
      }
    }
    return { fields, strands: STRANDS.map(strandPayload) } as T;
  }
  if (method === 'GET' && pathname.startsWith('/strands/')) {
    const slug = pathname.slice('/strands/'.length);
    const strand = STRANDS.find((row) => row.slug === slug);
    if (!strand) throw new ApiError(404, 'STRAND_NOT_FOUND', 'Strand not found');
    return { strand: strandPayload(strand) } as T;
  }

  // ---- auth
  if (route === 'POST /auth/register') return (await register(payload)) as T;
  if (route === 'POST /auth/login') return (await login(payload)) as T;
  if (route === 'POST /auth/forgot') {
    return {
      ok: true,
      message:
        'This static build cannot send email, so no reset message was sent. Local accounts and their records cannot be recovered from a server.',
      delivery: 'none',
      email: {
        configured: false,
        transport: 'none',
        from: null,
        host: null,
        note: 'Email is not available in the static build. Sign in with your password, or create a new local account if it is lost.'
      }
    } as T;
  }
  if (route === 'POST /auth/reset') {
    throw new ApiError(
      400,
      'STATIC_NO_RESET',
      'Password reset needs the optional email backend. This static build cannot reset a local password.'
    );
  }
  if (route === 'POST /auth/verify-email') {
    throw new ApiError(
      400,
      'STATIC_NO_EMAIL',
      'Email confirmation is not used in this static build; your local account is already active.'
    );
  }

  return readDbRoute<T>(route, pathname, method, payload, path.split('?')[1] ?? '');
}

function readDbRoute<T>(
  route: string,
  pathname: string,
  method: Method,
  payload: Record<string, unknown>,
  search: string
): T | Promise<T> {
  const db = readDb();

  if (route === 'GET /auth/me') {
    const session = db.session;
    if (!session || new Date(session.expiresAt).getTime() <= Date.now()) {
      if (session) writeDb({ ...db, session: null });
      return { user: null, profile: null } as T;
    }
    const user = db.users.find((row) => row.id === session.userId);
    if (!user) return { user: null, profile: null } as T;
    return { user: publicUser(user), profile: profilePayload(db, user.id) } as T;
  }

  if (route === 'POST /auth/logout') {
    const next = readDb();
    next.session = null;
    writeDb(next);
    return { ok: true } as T;
  }

  if (route === 'POST /auth/resend-verification') {
    requireUser(db);
    return {
      verification: { emailSent: false, emailDelivery: 'none', note: 'This static build does not send email.' } satisfies VerificationState
    } as T;
  }

  if (route === 'POST /auth/password') {
    return changePassword(payload) as unknown as T;
  }

  if (route === 'PUT /auth/theme') {
    const user = requireUser(db);
    const theme = payload.theme;
    if (theme !== 'green' && theme !== 'blue' && theme !== 'red' && theme !== 'violet') {
      throw new ApiError(400, 'INVALID_THEME', 'Unknown theme');
    }
    return updateDb((current) => {
      const target = current.users.find((row) => row.id === user.id);
      if (target) target.theme = theme;
      return { ok: true, theme } as T;
    });
  }

  if (route === 'GET /profile') {
    const user = requireUser(db);
    return { user: publicUser(user), profile: profilePayload(db, user.id) } as T;
  }

  if (route === 'PUT /profile') {
    const user = requireUser(db);
    return updateDb((current) => {
      const target = current.users.find((row) => row.id === user.id);
      if (!target) throw new ApiError(401, 'UNAUTHENTICATED', 'Sign in to continue');
      if (payload.name !== undefined) target.name = text(payload.name, 'Name', { min: 2, max: 80 });
      const profile = ensureProfile(current, user.id);
      profile.gradeLevel = optionalText(payload.gradeLevel, 20);
      profile.school = optionalText(payload.school, 120);
      profile.city = optionalText(payload.city, 120);
      profile.interests = optionalText(payload.interests, 500);
      profile.strengths = optionalText(payload.strengths, 500);
      profile.goals = optionalText(payload.goals, 500);
      profile.learningPreference = optionalText(payload.learningPreference, 120);
      profile.careerInterest = optionalText(payload.careerInterest, 200);
      profile.updatedAt = now();
      return { user: publicUser(target), profile: profilePayload(current, user.id) } as T;
    });
  }

  if (route === 'GET /profile/export') {
    const user = requireUser(db);
    return {
      exportedAt: now(),
      account: publicUser(user),
      profile: profilePayload(db, user.id),
      assessments: db.assessments
        .filter((row) => row.userId === user.id)
        .map((row) => ({
          id: row.id,
          type: row.type,
          status: row.status,
          startedAt: row.startedAt,
          submittedAt: row.submittedAt,
          selectedStrand: row.selectedStrand,
          result: row.result
        })),
      programs: db.programs.filter((row) => row.userId === user.id).map(programPayload),
      supportRequests: db.tickets.filter((row) => row.userId === user.id).map(ticketPayload),
      storage: 'local-browser',
      note: STATIC_STORAGE_NOTICE
    } as T;
  }

  if (route === 'DELETE /account') {
    const user = requireUser(db);
    return (async () => {
      const password = typeof payload.password === 'string' ? payload.password : '';
      if (!(await verifyPassword(password, user.passwordHash))) {
        throw new ApiError(400, 'INVALID_PASSWORD', 'The password is incorrect.');
      }
      updateDb((current) => {
        current.users = current.users.filter((row) => row.id !== user.id);
        delete current.profiles[String(user.id)];
        current.assessments = current.assessments.filter((row) => row.userId !== user.id);
        current.programs = current.programs.filter((row) => row.userId !== user.id);
        current.tickets = current.tickets.filter((row) => row.userId !== user.id);
        current.notifications = current.notifications.filter((row) => row.userId !== user.id);
        current.session = null;
      });
      return { ok: true };
    })() as unknown as T;
  }

  if (route === 'GET /notifications') {
    const user = requireUser(db);
    return {
      notifications: db.notifications
        .filter((row) => row.userId === user.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((row): NotificationItem => ({
          id: row.id,
          title: row.title,
          body: row.body,
          readAt: row.readAt,
          createdAt: row.createdAt
        }))
    } as T;
  }

  if (route === 'POST /notifications/read') {
    const user = requireUser(db);
    return updateDb((current) => {
      current.notifications
        .filter((row) => row.userId === user.id && !row.readAt)
        .forEach((row) => {
          row.readAt = now();
        });
      return { ok: true } as T;
    });
  }

  if (route === 'GET /dashboard') {
    const user = requireUser(db);
    const summary = db.assessments
      .filter((row) => row.userId === user.id)
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
    const submitted = summary.filter((row) => row.status === 'submitted');
    const latestPre = [...submitted].reverse().find((row) => row.type === 'pre') ?? null;
    const latestPost = [...submitted].reverse().find((row) => row.type === 'post') ?? null;
    const inProgress = summary.find((row) => row.status === 'in_progress') ?? null;
    const program = db.programs.find((row) => row.userId === user.id && row.status === 'active') ?? null;
    const profile = profilePayload(db, user.id);
    const due = program
      ? new Date(new Date(program.createdAt).getTime() + program.reassessmentAfterDays * 86400000).toISOString()
      : null;
    const data: DashboardData = {
      user: publicUser(user),
      profile,
      assessment: {
        preSubmitted: submitted.filter((row) => row.type === 'pre').length,
        postSubmitted: submitted.filter((row) => row.type === 'post').length,
        latestPre: latestPre ? assessmentSummary(latestPre) : null,
        latestPost: latestPost ? assessmentSummary(latestPost) : null,
        inProgress: inProgress ? assessmentSummary(inProgress) : null
      },
      selectedStrand: profile?.selectedStrand ?? null,
      program: program ? programPayload(program) : null,
      reassessment: due
        ? { recommendedAt: due, due: Date.now() >= new Date(due).getTime(), completed: Boolean(latestPost) }
        : null,
      openTickets: db.tickets.filter(
        (row) => row.userId === user.id && (row.status === 'open' || row.status === 'in_review')
      ).length
    };
    return data as T;
  }

  // ---- assessments
  if (route === 'GET /assessments') {
    const user = requireUser(db);
    return {
      assessments: db.assessments
        .filter((row) => row.userId === user.id)
        .sort((a, b) => b.startedAt.localeCompare(a.startedAt) || b.id - a.id)
        .map(assessmentSummary)
    } as T;
  }

  if (route === 'POST /assessments') {
    const user = requireUser(db);
    const type = payload.type === 'post' ? 'post' : 'pre';
    const record = createAssessment(user, type);
    const fresh = readDb();
    return { assessment: assessmentPayload(fresh, ownAssessment(fresh, record.id, user.id)) } as T;
  }

  const assessmentMatch = pathname.match(/^\/assessments\/(\d+)(\/questions|\/answers|\/submit|\/selection)?$/);
  if (assessmentMatch) {
    const user = requireUser(db);
    const id = Number(assessmentMatch[1]);
    const action = assessmentMatch[2] ?? '';
    if (method === 'GET' && action === '') {
      return { assessment: assessmentPayload(db, ownAssessment(db, id, user.id)) } as T;
    }
    if (method === 'GET' && action === '/questions') {
      return { questionnaireVersion: QUESTIONNAIRE_V1.version, questions: questionnaireMeta().questions } as T;
    }
    if (method === 'PATCH' && action === '/answers') {
      return saveAnswers(user, id, payload.answers) as T;
    }
    if (method === 'POST' && action === '/submit') {
      return submitAssessment(user, id, payload) as T;
    }
    if (method === 'POST' && action === '/selection') {
      return selectStrand(user, id, payload.strandSlug) as T;
    }
  }

  // ---- programmes
  if (route === 'GET /programs/current') {
    const user = requireUser(db);
    const program = db.programs.find((row) => row.userId === user.id && row.status === 'active') ?? null;
    return { program: program ? programPayload(program) : null } as T;
  }

  if (route === 'POST /programs/generate') {
    const user = requireUser(db);
    return generateProgram(user, payload) as T;
  }

  const programMatch = pathname.match(/^\/programs\/(\d+)$/);
  if (programMatch && method === 'GET') {
    const user = requireUser(db);
    return { program: programPayload(ownProgram(db, Number(programMatch[1]), user.id)) } as T;
  }

  if (programMatch && method === 'PATCH') {
    const user = requireUser(db);
    return updateDb((current) => {
      const program = ownProgram(current, Number(programMatch[1]), user.id);
      const status = payload.status;
      if (status !== 'active' && status !== 'completed' && status !== 'archived') {
        throw new ApiError(400, 'INVALID_STATUS', 'Unknown programme status');
      }
      program.status = status;
      program.updatedAt = now();
      return { program: programPayload(program) } as T;
    });
  }

  const activityMatch = pathname.match(/^\/program-activities\/(\d+)(\/start|\/complete|\/alternatives)?$/);
  if (activityMatch) {
    const user = requireUser(db);
    const id = Number(activityMatch[1]);
    const action = activityMatch[2] ?? '';

    if (method === 'GET' && action === '') {
      const { program, activity } = programActivityState(db, id, user.id);
      const payloadProgram = programPayload(program);
      const found = payloadProgram.activities.find((row) => row.id === activity.id) ?? null;
      return { activity: found, program: { id: payloadProgram.id, name: payloadProgram.name, progress: payloadProgram.progress } } as T;
    }

    if (method === 'POST' && action === '/start') {
      return updateDb((current) => {
        const { activity } = programActivityState(current, id, user.id);
        if (activity.status !== 'completed' && activity.status !== 'in_progress') {
          activity.status = 'in_progress';
          activity.startedAt = now();
        }
        return { ok: true, status: activity.status } as T;
      });
    }

    if (method === 'POST' && action === '/complete') {
      return updateDb((current) => {
        const { program, activity: state } = programActivityState(current, id, user.id);
        const reflection = text(payload.reflection, 'Reflection', { min: 20, max: 4000 });
        const seed = ACTIVITIES.find((row) => row.slug === state.activitySlug);
        let checkScore: number | null = null;
        let checkFeedback: string | null = null;
        if (seed?.check?.length) {
          const responses = Array.isArray(payload.responses) ? payload.responses : [];
          if (responses.length !== seed.check.length) {
            throw new ApiError(400, 'CHECK_INCOMPLETE', `Answer all ${seed.check.length} knowledge-check questions.`);
          }
          const correct = seed.check.reduce(
            (sum, question, index) => sum + (Number(responses[index]) === question.answer ? 1 : 0),
            0
          );
          checkScore = Math.round((correct / seed.check.length) * 100);
          checkFeedback =
            checkScore >= 60
              ? `Knowledge check: ${correct} of ${seed.check.length} correct. The idea looks secure.`
              : `Knowledge check: ${correct} of ${seed.check.length} correct. Review the explanations and try an alternative activity for the same skill.`;
        }
        state.status = 'completed';
        state.completedAt = now();
        state.reflection = reflection;
        state.checkScore = checkScore;
        state.responses = Array.isArray(payload.responses) ? (payload.responses as (number | null)[]) : null;
        const remaining = program.activities.filter((row) => row.status !== 'completed').length;
        program.status = remaining === 0 ? 'completed' : program.status;
        program.updatedAt = now();
        const alternatives =
          checkScore !== null && checkScore < 60 && seed
            ? ACTIVITIES.filter(
                (row) =>
                  row.targetCategory === seed.targetCategory &&
                  row.slug !== seed.slug &&
                  !program.activities.some((activity) => activity.activitySlug === row.slug)
              )
                .sort((a, b) => a.difficulty - b.difficulty)
                .slice(0, 3)
                .map((row) => ({ id: 0, slug: row.slug, title: row.title, tier: row.tier, minutes: row.minutes }))
            : [];
        return {
          ok: true,
          checkScore,
          checkFeedback,
          alternatives,
          note: 'Completion is recorded from your own reflection. The knowledge check is feedback, not a grade.'
        } as T;
      });
    }

    if (method === 'GET' && action === '/alternatives') {
      const { program, activity: state } = programActivityState(db, id, user.id);
      const seed = ACTIVITIES.find((row) => row.slug === state.activitySlug);
      const alternatives = seed
        ? ACTIVITIES.filter(
            (row) =>
              row.targetCategory === seed.targetCategory &&
              row.slug !== seed.slug &&
              !program.activities.some((activity) => activity.activitySlug === row.slug)
          )
            .sort((a, b) => a.difficulty - b.difficulty)
            .slice(0, 6)
            .map((row, index) => ({
              id: index + 1,
              slug: row.slug,
              title: row.title,
              tier: row.tier,
              minutes: row.minutes,
              difficulty: row.difficulty
            }))
        : [];
      return { alternatives, category: seed?.targetCategory ?? null } as T;
    }
  }

  // ---- progress
  if (route === 'GET /progress') {
    const user = requireUser(db);
    const rows = db.assessments
      .filter((row) => row.userId === user.id && row.status === 'submitted')
      .sort((a, b) => (a.submittedAt ?? '').localeCompare(b.submittedAt ?? ''));
    const series = rows.map((row) => ({
      id: row.id,
      type: row.type,
      submittedAt: row.submittedAt,
      categories: (row.result?.categoryScores ?? []).map((category) => ({
        key: category.key,
        label: category.label,
        percent: category.percent
      })),
      topStrand: row.result?.ranked?.[0]
        ? { code: row.result.ranked[0].code, score: row.result.ranked[0].score }
        : null,
      selectedStrand: row.selectedStrand
    }));

    const comparisons = rows
      .filter((row) => row.type === 'post' && row.baselineAssessmentId)
      .map((row) => {
        const baseline = rows.find((candidate) => candidate.id === row.baselineAssessmentId);
        if (!baseline?.result || !row.result) return null;
        return {
          currentAssessmentId: row.id,
          comparison: compareResults(
            { ...(baseline.result as unknown as AssessmentResult), assessmentId: baseline.id, submittedAt: baseline.submittedAt ?? undefined } as never,
            { ...(row.result as unknown as AssessmentResult), assessmentId: row.id, submittedAt: row.submittedAt ?? undefined } as never
          ) as unknown as Comparison
        };
      })
      .filter((entry): entry is { currentAssessmentId: number; comparison: Comparison } => entry !== null);

    const programs = db.programs.filter((row) => row.userId === user.id).map(programPayload);
    const completedActivities = programs.flatMap((program) =>
      program.activities
        .filter((activity) => activity.status === 'completed')
        .map((activity) => ({
          programId: program.id,
          programName: program.name,
          title: activity.title,
          category: activity.targetCategoryLabel,
          completedAt: activity.completedAt,
          checkScore: activity.checkScore
        }))
    );

    return {
      series,
      comparisons,
      programs,
      completedActivities,
      summary: {
        assessments: rows.length,
        preAssessments: rows.filter((row) => row.type === 'pre').length,
        postAssessments: rows.filter((row) => row.type === 'post').length,
        activitiesCompleted: completedActivities.length,
        programsCompleted: programs.filter((program) => program.status === 'completed').length
      }
    } as T;
  }

  if (route === 'GET /progress/compare') {
    const user = requireUser(db);
    const params = new URLSearchParams(search);
    const from = ownAssessment(db, Number(params.get('from')), user.id);
    const to = ownAssessment(db, Number(params.get('to')), user.id);
    if (!from.result || !to.result) throw new ApiError(409, 'NO_RESULT', 'Both assessments must be submitted');
    return {
      comparison: compareResults(
        { ...(from.result as unknown as AssessmentResult), assessmentId: from.id, submittedAt: from.submittedAt ?? undefined } as never,
        { ...(to.result as unknown as AssessmentResult), assessmentId: to.id, submittedAt: to.submittedAt ?? undefined } as never
      )
    } as T;
  }

  // ---- support
  if (route === 'GET /support/tickets') {
    const user = requireUser(db);
    return {
      tickets: db.tickets
        .filter((row) => row.userId === user.id)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .map(ticketPayload)
    } as T;
  }

  if (route === 'POST /support/tickets') {
    const user = requireUser(db);
    const subject = text(payload.subject, 'Subject', { min: 4, max: 160 });
    const category = text(payload.category, 'Category', { min: 2, max: 60 });
    const message = text(payload.message, 'Message', { min: 10, max: 4000 });
    const priority = payload.priority === 'low' || payload.priority === 'high' ? payload.priority : 'normal';
    return updateDb((current) => {
      const ticket: LocalTicketRecord = {
        id: nextId(current),
        userId: user.id,
        subject,
        category,
        status: 'open',
        priority,
        createdAt: now(),
        updatedAt: now(),
        messages: [{ id: nextId(current), authorRole: 'student', authorName: user.name, body: message, createdAt: now() }]
      };
      current.tickets.push(ticket);
      return { ticket: ticketPayload(ticket) } as T;
    });
  }

  const ticketMatch = pathname.match(/^\/support\/tickets\/(\d+)\/messages$/);
  if (ticketMatch && method === 'POST') {
    const user = requireUser(db);
    return updateDb((current) => {
      const ticket = current.tickets.find((row) => row.id === Number(ticketMatch[1]) && row.userId === user.id);
      if (!ticket) throw new ApiError(404, 'TICKET_NOT_FOUND', 'Ticket not found');
      const message = text(payload.body, 'Message', { min: 2, max: 4000 });
      ticket.messages.push({ id: nextId(current), authorRole: 'student', authorName: user.name, body: message, createdAt: now() });
      ticket.updatedAt = now();
      return { ticket: ticketPayload(ticket) } as T;
    });
  }

  // The administrator area and email confirmations are not available in a
  // static deployment; they need the optional Node backend.
  if (pathname.startsWith('/admin') || pathname === '/ai/status' || pathname.startsWith('/coach') || pathname.startsWith('/support/messages')) {
    throw new ApiError(
      404,
      'STATIC_UNAVAILABLE',
      'This feature needs the optional server deployment and is not available in the static build.'
    );
  }

  throw new ApiError(404, 'NOT_FOUND', `No static handler for ${route}`);
}
