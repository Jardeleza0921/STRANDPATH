import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { all, get, run, tx, now, parseJson, audit, getSetting, setSetting } from './db.js';
import { seed } from './seed.js';
import { createRouter, HttpError } from './router.js';
import { readJson, sendJson, sendError, securityHeaders, serveStatic } from './http.js';
import { sessionUser, pruneSessions, readCookies, createRateLimiter } from './auth.js';
import { scoreAssessment, compareResults, ALGORITHM_VERSION, labelFor } from './engine.js';
import { CATEGORIES, CATEGORY_KEYS } from './content.js';
import { aiStatus, aiConfig, complete, buildMessages } from './ai.js';
import { registerAdminRoutes } from './routes/admin.js';
import { registerAuthRoutes } from './routes/auth.js';
import { createMailer } from './mailer.js';

const VALIDATION_NOTICE =
  'This questionnaire is a technical draft reviewed for clarity and strand coverage. It has not been pilot-tested or statistically validated, so results should be read as structured guidance rather than a diagnosis or a prediction.';

const MAX_AI_MESSAGE = 1200;

/* ------------------------------------------------------------------ helpers */

const str = (value, { min = 0, max = 2000, field = 'value' } = {}) => {
  if (value === undefined || value === null) value = '';
  if (typeof value !== 'string') throw new HttpError(400, `${field} must be text`);
  const trimmed = value.trim();
  if (trimmed.length < min) throw new HttpError(400, `${field} must be at least ${min} characters`);
  if (trimmed.length > max) throw new HttpError(400, `${field} must be at most ${max} characters`);
  return trimmed;
};

const optionalStr = (value, max = 2000) => (value === undefined || value === null ? null : str(value, { max }));

function publicUser(user, theme = null) {
  const verifiedAt = user.email_verified_at ?? user.emailVerifiedAt ?? null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    emailVerified: Boolean(verifiedAt ?? user.emailVerified),
    emailVerifiedAt: verifiedAt,
    mustChangePassword: Boolean(user.must_change_password ?? user.mustChangePassword),
    theme: theme || user.theme || 'green'
  };
}

function getProfile(db, userId) {
  const row = get(db, 'SELECT * FROM profiles WHERE user_id = ?', userId);
  if (!row) return null;
  return {
    gradeLevel: row.grade_level,
    school: row.school,
    city: row.city,
    interests: row.interests,
    strengths: row.strengths,
    goals: row.goals,
    learningPreference: row.learning_preference,
    careerInterest: row.career_interest,
    selectedStrand: row.selected_strand,
    theme: row.theme || 'green',
    consentAt: row.consent_at,
    updatedAt: row.updated_at
  };
}

function strandFromRow(row) {
  if (!row) return null;
  return {
    slug: row.slug,
    code: row.code,
    name: row.name,
    track: row.track,
    tagline: row.tagline,
    summary: row.summary,
    interests: parseJson(row.interests, []),
    skills: parseJson(row.skills, []),
    learn: parseJson(row.learn, []),
    suitedFor: parseJson(row.suited, []),
    collegeFields: parseJson(row.college, []),
    careerAreas: parseJson(row.careers, []),
    considerations: parseJson(row.considerations, []),
    weights: parseJson(row.weights, {}),
    active: Boolean(row.active)
  };
}

function activeStrands(db) {
  return all(db, 'SELECT * FROM strands WHERE active = 1 ORDER BY code').map(strandFromRow);
}

function questionnaireQuestions(db, questionnaireId) {
  return all(db, 'SELECT * FROM questions WHERE questionnaire_id = ? ORDER BY order_index', questionnaireId).map(
    (question) => ({
      id: Number(question.id),
      questionnaireId: Number(question.questionnaire_id),
      code: question.code,
      section: question.section,
      dimension: question.dimension,
      prompt: question.prompt,
      helper: question.helper,
      kind: question.kind,
      maxChoices: question.max_choices,
      weight: Number(question.weight),
      enabled: Boolean(question.enabled),
      orderIndex: Number(question.order_index),
      validationStatus: question.validation_status,
      options: all(
        db,
        'SELECT * FROM question_options WHERE question_id = ? ORDER BY order_index',
        question.id
      ).map((option) => ({
        id: Number(option.id),
        code: option.code,
        label: option.label,
        hint: option.hint,
        scores: parseJson(option.scores, {}),
        orderIndex: Number(option.order_index)
      }))
    })
  );
}

function activeQuestionnaire(db) {
  const q = get(db, "SELECT * FROM questionnaires WHERE status = 'active' LIMIT 1");
  if (!q) throw new HttpError(503, 'No active questionnaire is configured.', { code: 'NO_QUESTIONNAIRE' });
  return {
    id: Number(q.id),
    version: q.version,
    title: q.title,
    notes: q.notes,
    questions: questionnaireQuestions(db, q.id)
  };
}

function assessmentRow(db, id, userId = null) {
  const row = get(db, 'SELECT * FROM assessments WHERE id = ?', id);
  if (!row) throw new HttpError(404, 'Assessment not found');
  if (userId !== null && Number(row.user_id) !== Number(userId)) throw new HttpError(404, 'Assessment not found');
  return row;
}

function assessmentSummary(db, row) {
  const result = parseJson(row.result, null);
  const top = result?.ranked?.[0] ?? null;
  const strandCount = result?.ranked?.length ?? 0;
  return {
    id: Number(row.id),
    type: row.type,
    status: row.status,
    startedAt: row.started_at,
    submittedAt: row.submitted_at,
    questionnaireVersion: get(db, 'SELECT version FROM questionnaires WHERE id = ?', row.questionnaire_id)?.version ?? null,
    algorithmVersion: row.algorithm_version,
    selectedStrand: row.selected_strand,
    algorithm: result?.algorithmVersion ?? row.algorithm_version,
    topStrand: top ? { slug: top.slug, code: top.code, name: top.name, score: top.score, level: top.level } : null,
    ranked: result?.ranked?.map((r) => ({ rank: r.rank, slug: r.slug, code: r.code, score: r.score })) ?? [],
    strandCount,
    answeredCount: result?.answeredCount ?? null,
    total: result?.total ?? null,
    hasResult: Boolean(result)
  };
}

function assessmentPayload(db, row, { includeComparison = true } = {}) {
  const result = parseJson(row.result, null);
  const questionnaire = get(db, 'SELECT version, title FROM questionnaires WHERE id = ?', row.questionnaire_id);
  const payload = {
    id: Number(row.id),
    type: row.type,
    status: row.status,
    startedAt: row.started_at,
    submittedAt: row.submitted_at,
    algorithmVersion: row.algorithm_version,
    questionnaireVersion: questionnaire?.version ?? null,
    questionnaireTitle: questionnaire?.title ?? null,
    answers: parseJson(row.answers, {}),
    selectedStrand: row.selected_strand,
    selectedAt: row.selected_at,
    baselineAssessmentId: row.baseline_assessment_id ? Number(row.baseline_assessment_id) : null,
    ...(result ?? {})
  };
  if (includeComparison && row.type === 'post' && row.baseline_assessment_id) {
    const baseline = get(db, 'SELECT * FROM assessments WHERE id = ? AND user_id = ?', row.baseline_assessment_id, row.user_id);
    if (baseline) {
      payload.comparison = compareResults(
        { assessmentId: Number(baseline.id), ...parseJson(baseline.result, {}), submittedAt: baseline.submitted_at },
        { assessmentId: Number(row.id), ...(result ?? {}), submittedAt: row.submitted_at }
      );
    }
  }
  return payload;
}

function latestSubmitted(db, userId, type = null) {
  const row = type
    ? get(
        db,
        "SELECT * FROM assessments WHERE user_id = ? AND status = 'submitted' AND type = ? ORDER BY submitted_at DESC, id DESC LIMIT 1",
        userId,
        type
      )
    : get(
        db,
        "SELECT * FROM assessments WHERE user_id = ? AND status = 'submitted' ORDER BY submitted_at DESC, id DESC LIMIT 1",
        userId
      );
  return row ?? null;
}

function programPayload(db, program) {
  const activities = all(
    db,
    `SELECT pa.*, a.slug, a.title, a.type, a.target_category, a.tier, a.difficulty, a.minutes,
            a.objectives, a.instructions, a.completion_criteria, a.check_questions
     FROM program_activities pa JOIN activities a ON a.id = pa.activity_id
     WHERE pa.program_id = ? ORDER BY pa.sequence`,
    program.id
  ).map((row) => ({
    id: Number(row.id),
    activityId: Number(row.activity_id),
    slug: row.slug,
    title: row.title,
    type: row.type,
    targetCategory: row.target_category,
    targetCategoryLabel: labelFor(row.target_category),
    tier: row.tier,
    difficulty: Number(row.difficulty),
    minutes: Number(row.minutes),
    objectives: parseJson(row.objectives, []),
    instructions: row.instructions,
    completionCriteria: row.completion_criteria,
    check: parseJson(row.check_questions, null),
    sequence: Number(row.sequence),
    status: row.status,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    checkScore: row.check_score,
    reflection: row.reflection
  }));
  const completed = activities.filter((a) => a.status === 'completed').length;
  return {
    id: Number(program.id),
    name: program.name,
    goal: program.goal,
    strandSlug: program.strand_slug,
    targetCategories: parseJson(program.target_categories, []).map((key) => ({
      key,
      label: labelFor(key),
      description: CATEGORIES[key]?.description ?? ''
    })),
    status: program.status,
    reassessmentAfterDays: Number(program.reassessment_after_days),
    createdAt: program.created_at,
    updatedAt: program.updated_at,
    assessmentId: Number(program.assessment_id),
    activities,
    progress: {
      total: activities.length,
      completed,
      inProgress: activities.filter((a) => a.status === 'in_progress').length,
      percent: activities.length ? Math.round((completed / activities.length) * 100) : 0
    }
  };
}

function getProgram(db, id, userId = null) {
  const program = get(db, 'SELECT * FROM programs WHERE id = ?', id);
  if (!program) throw new HttpError(404, 'Programme not found');
  if (userId !== null && Number(program.user_id) !== Number(userId)) throw new HttpError(404, 'Programme not found');
  return program;
}

function currentProgram(db, userId) {
  return get(
    db,
    "SELECT * FROM programs WHERE user_id = ? AND status = 'active' ORDER BY created_at DESC, id DESC LIMIT 1",
    userId
  );
}

function supportTicketPayload(db, ticket) {
  return {
    id: Number(ticket.id),
    subject: ticket.subject,
    category: ticket.category,
    status: ticket.status,
    priority: ticket.priority,
    createdAt: ticket.created_at,
    updatedAt: ticket.updated_at,
    assignedTo: ticket.assigned_to ? Number(ticket.assigned_to) : null,
    messages: all(
      db,
      `SELECT m.id, m.body, m.author_role, m.created_at, u.name AS author_name
       FROM support_messages m LEFT JOIN users u ON u.id = m.author_id
       WHERE m.ticket_id = ? ORDER BY m.created_at, m.id`,
      ticket.id
    ).map((m) => ({
      id: Number(m.id),
      body: m.body,
      authorRole: m.author_role,
      authorName: m.author_name ?? 'STRANDPATH',
      createdAt: m.created_at
    }))
  };
}

function addTicketMessage(db, ticketId, authorId, authorRole, body) {
  run(
    db,
    'INSERT INTO support_messages (ticket_id, author_id, author_role, body, created_at) VALUES (?, ?, ?, ?, ?)',
    ticketId,
    authorId,
    authorRole,
    body,
    now()
  );
  run(db, 'UPDATE support_tickets SET updated_at = ? WHERE id = ?', now(), ticketId);
}

/* ------------------------------------------------------------ AI grounding */

const SUPPORT_HELP = [
  'Creating an account: Register with a name, email, password, grade level and school, then tick the privacy consent box.',
  'Signing in: use the email and password you registered with. If sign-in fails, check the email spelling; passwords are case-sensitive.',
  'Taking the assessment: Student → Assessment → Begin. Answers save automatically as you go, and you can leave and resume.',
  'Viewing results: Student → Results opens your latest submitted assessment, with scores, explanations and evidence.',
  'Retaking: Start a new assessment from the Assessment page. Previous attempts are preserved in History and are never overwritten.',
  'Improvement programme: after selecting a strand on the Results page, open Programme and generate your plan.',
  'Activities: open an activity, read the steps, write the reflection, then mark it complete. Some activities include a short knowledge check.',
  'Progress: the Progress page compares submitted assessments and shows programme completion. It only shows recorded data.',
  'Password: Settings → Change password. Account data questions should go to the school guidance office.',
  'Support requests: Support → New request. Include what you expected, what happened, and the assessment or activity name.'
].join('\n');

function buildStudentContext(db, user, agent, question) {
  if (agent === 'support') {
    return `Student account: ${user.name} (role: ${user.role}).\nSTRANDPATH help topics:\n${SUPPORT_HELP}\nSupport email on file: ${getSetting(db, 'support.email', 'the school guidance office')}`;
  }
  const grounding = getSetting(db, 'ai.grounding', { strands: true, activities: true, assessment: true, careers: true });
  const profile = getProfile(db, user.id);
  const latest = latestSubmitted(db, user.id);
  const result = latest ? parseJson(latest.result, null) : null;
  const program = currentProgram(db, user.id);
  const lines = [];

  lines.push(`Student: ${user.name}. Profile: grade ${profile?.gradeLevel ?? 'not set'}, school ${profile?.school ?? 'not set'}.`);
  if (profile?.interests) lines.push(`Self-described interests: ${profile.interests}`);
  if (profile?.strengths) lines.push(`Self-described strengths: ${profile.strengths}`);
  if (profile?.goals) lines.push(`Goals: ${profile.goals}`);
  if (profile?.careerInterest) lines.push(`Career interest: ${profile.careerInterest}`);

  if (result && grounding.assessment !== false) {
    lines.push(
      `Latest assessment: ${latest.type === 'post' ? 'post-assessment' : 'pre-assessment'} #${latest.id}, submitted ${latest.submitted_at}, questionnaire v${get(db, 'SELECT version FROM questionnaires WHERE id = ?', latest.questionnaire_id)?.version ?? '?'}, algorithm ${ALGORITHM_VERSION}.`
    );
    lines.push(
      'Dimension scores (percent of attainable range in this attempt): ' +
        result.categoryScores.map((c) => `${c.label} ${c.percent}`).join('; ')
    );
    lines.push(
      'Ranked strand alignment: ' +
        result.ranked
          .slice(0, 3)
          .map((r) => `#${r.rank} ${r.code} ${r.score} (${r.level})`)
          .join('; ')
    );
    if (result.strengths?.length) lines.push(`Strengths identified: ${result.strengths.map((s) => s.label).join(', ')}`);
    if (result.development?.length)
      lines.push(`Development areas identified: ${result.development.map((s) => s.label).join(', ')}`);
    if (latest.selected_strand) lines.push(`Student-selected strand: ${latest.selected_strand}`);
  } else {
    lines.push('The student has not completed an assessment yet. Do not reference scores.');
  }

  if (program) {
    const payload = programPayload(db, program);
    lines.push(
      `Improvement programme: ${payload.name} for ${program.strand_slug}, status ${payload.status}, ${payload.progress.completed}/${payload.progress.total} activities complete.`
    );
    const next = payload.activities.find((a) => a.status !== 'completed');
    if (next) lines.push(`Next activity: ${next.title} (${next.targetCategoryLabel}, about ${next.minutes} minutes).`);
  }

  if (grounding.strands !== false) {
    const strands = activeStrands(db);
    const mentioned = strands.filter((s) => question.toLowerCase().includes(s.code.toLowerCase()) || question.toLowerCase().includes(s.name.toLowerCase()));
    const top = result?.ranked?.slice(0, 3).map((r) => r.slug) ?? [];
    const chosen = strands.filter((s) => mentioned.includes(s) || top.includes(s.slug) || s.slug === latest?.selected_strand);
    const relevant = (chosen.length ? chosen : strands).slice(0, 4);
    for (const s of relevant) {
      lines.push(
        `Strand ${s.code} — ${s.name} (${s.track}): ${s.summary} Subjects: ${s.learn.join('; ')}. College fields: ${s.collegeFields.join(', ')}. Careers: ${s.careerAreas.join(', ')}. Considerations: ${s.considerations.join('; ')}.`
      );
    }
  }

  if (grounding.activities !== false && program) {
    const payload = programPayload(db, program);
    lines.push(
      'Programme activity sequence: ' +
        payload.activities.map((a) => `#${a.sequence} ${a.title} [${a.status}]`).join('; ')
    );
  }

  lines.push(
    'Limits: you cannot verify school-specific offerings, admission requirements or deadlines. Suggest checking with the school guidance office.'
  );
  return lines.join('\n');
}

/* --------------------------------------------------------------- app setup */

export function createApp({ db, distDir = resolve('dist'), serveClient = true, mailer = createMailer() } = {}) {
  const router = createRouter();
  const limit = createRateLimiter();
  const ai = aiConfig();

  router.get('/api/health', () => ({
    body: {
      ok: true,
      version: ALGORITHM_VERSION,
      questionnaire: get(db, "SELECT version FROM questionnaires WHERE status='active'")?.version ?? null,
      email: mailer.config.configured ? 'smtp' : 'unconfigured',
      google: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
    }
  }));

  /* ---------------------------------------------------------------- auth */

  registerAuthRoutes(router, { db, mailer, limit, publicUser, getProfile });

  /* ------------------------------------------------------------- profile */

  router.get('/api/profile', async ({ user }) => ({
    body: { user: publicUser(user), profile: getProfile(db, user.id), selectedStrand: getProfile(db, user.id)?.selectedStrand ?? null }
  }), { auth: true });

  router.put('/api/profile', async ({ user, body }) => {
    const name = body.name !== undefined ? str(body.name, { min: 2, max: 80, field: 'Name' }) : user.name;
    run(db, 'UPDATE users SET name = ? WHERE id = ?', name, user.id);
    run(
      db,
      `INSERT INTO profiles (user_id, grade_level, school, city, interests, strengths, goals, learning_preference, career_interest, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET
         grade_level = excluded.grade_level, school = excluded.school, city = excluded.city,
         interests = excluded.interests, strengths = excluded.strengths, goals = excluded.goals,
         learning_preference = excluded.learning_preference, career_interest = excluded.career_interest,
         updated_at = excluded.updated_at`,
      user.id,
      optionalStr(body.gradeLevel, 20),
      optionalStr(body.school, 120),
      optionalStr(body.city, 120),
      optionalStr(body.interests, 500),
      optionalStr(body.strengths, 500),
      optionalStr(body.goals, 500),
      optionalStr(body.learningPreference, 120),
      optionalStr(body.careerInterest, 200),
      now()
    );
    const updated = get(db, 'SELECT * FROM users WHERE id = ?', user.id);
    const nextProfile = getProfile(db, user.id);
    return { body: { user: publicUser(updated, nextProfile?.theme), profile: nextProfile } };
  }, { auth: true });

  router.get('/api/profile/export', async ({ user }) => {
    const assessments = all(db, 'SELECT id, type, status, started_at, submitted_at, result, selected_strand FROM assessments WHERE user_id = ? ORDER BY started_at', user.id);
    return {
      body: {
        exportedAt: now(),
        account: publicUser(user),
        profile: getProfile(db, user.id),
        assessments: assessments.map((a) => ({
          id: Number(a.id),
          type: a.type,
          status: a.status,
          startedAt: a.started_at,
          submittedAt: a.submitted_at,
          selectedStrand: a.selected_strand,
          result: parseJson(a.result, null)
        })),
        note: 'This export contains your own STRANDPATH records. It does not include sessions or password data.'
      }
    };
  }, { auth: true });

  /* -------------------------------------------------------- public content */

  router.get('/api/strands', async () => ({ body: { strands: activeStrands(db), algorithmVersion: ALGORITHM_VERSION } }));

  router.get('/api/strands/:slug', async ({ params }) => {
    const strand = strandFromRow(get(db, 'SELECT * FROM strands WHERE slug = ?', params.slug));
    if (!strand) throw new HttpError(404, 'Strand not found');
    return { body: { strand } };
  });

  router.get('/api/careers', async () => {
    const strands = activeStrands(db);
    const fields = [];
    for (const strand of strands) {
      for (const field of strand.collegeFields) {
        fields.push({ strandSlug: strand.slug, strandCode: strand.code, field, careers: strand.careerAreas });
      }
    }
    return { body: { fields, strands } };
  });

  router.get('/api/questionnaire/active', async () => {
    const questionnaire = activeQuestionnaire(db);
    return {
      body: {
        version: questionnaire.version,
        title: questionnaire.title,
        notes: questionnaire.notes,
        algorithmVersion: ALGORITHM_VERSION,
        validationNotice: VALIDATION_NOTICE,
        categories: CATEGORY_KEYS.map((key) => ({ key, ...CATEGORIES[key] })),
        sections: [...new Set(questionnaire.questions.map((q) => q.section))],
        questions: questionnaire.questions.filter((q) => q.enabled)
      }
    };
  });

  /* --------------------------------------------------------- assessments */

  router.post('/api/assessments', async ({ user, body }) => {
    const type = body.type === 'post' ? 'post' : 'pre';
    const pre = latestSubmitted(db, user.id, 'pre');
    if (type === 'post' && !pre) throw new HttpError(409, 'Complete a pre-assessment before starting a follow-up assessment.');
    const existing = get(
      db,
      "SELECT * FROM assessments WHERE user_id = ? AND type = ? AND status = 'in_progress' ORDER BY started_at DESC LIMIT 1",
      user.id,
      type
    );
    if (existing) {
      return { body: { assessment: assessmentPayload(db, existing, { includeComparison: false }) } };
    }
    const questionnaire = activeQuestionnaire(db);
    const { id } = run(
      db,
      `INSERT INTO assessments (user_id, type, questionnaire_id, algorithm_version, status, answers, started_at)
       VALUES (?, ?, ?, ?, 'in_progress', '{}', ?)`,
      user.id,
      type,
      questionnaire.id,
      ALGORITHM_VERSION,
      now()
    );
    const row = assessmentRow(db, id, user.id);
    return { status: 201, body: { assessment: assessmentPayload(db, row, { includeComparison: false }) } };
  }, { auth: true });

  router.get('/api/assessments', async ({ user }) => {
    const rows = all(db, 'SELECT * FROM assessments WHERE user_id = ? ORDER BY started_at DESC, id DESC', user.id);
    return { body: { assessments: rows.map((row) => assessmentSummary(db, row)) } };
  }, { auth: true });

  router.get('/api/assessments/:id', async ({ user, params }) => {
    const row = assessmentRow(db, Number(params.id), user.id);
    return { body: { assessment: assessmentPayload(db, row) } };
  }, { auth: true });

  router.get('/api/assessments/:id/questions', async ({ user, params }) => {
    const row = assessmentRow(db, Number(params.id), user.id);
    return {
      body: {
        questionnaireVersion: get(db, 'SELECT version FROM questionnaires WHERE id = ?', row.questionnaire_id)?.version ?? null,
        questions: questionnaireQuestions(db, row.questionnaire_id).filter((q) => q.enabled)
      }
    };
  }, { auth: true });

  router.patch('/api/assessments/:id/answers', async ({ user, params, body }) => {
    const row = assessmentRow(db, Number(params.id), user.id);
    if (row.status !== 'in_progress') throw new HttpError(409, 'This assessment has already been submitted.');
    if (!body.answers || typeof body.answers !== 'object') throw new HttpError(400, 'Answers are required');
    const questions = questionnaireQuestions(db, row.questionnaire_id);
    // Validate shape but allow incomplete progress saves.
    const codes = new Set(questions.filter((q) => q.enabled).flatMap((q) => q.options.map((o) => o.code)));
    const cleaned = {};
    for (const [code, selected] of Object.entries(body.answers)) {
      if (!Array.isArray(selected)) throw new HttpError(400, 'Each answer must be a list of option codes');
      const valid = selected.filter((v) => typeof v === 'string' && codes.has(v));
      if (valid.length !== selected.length) throw new HttpError(400, 'An answer contains an unknown option');
      if (valid.length) cleaned[code] = [...new Set(valid)];
    }
    run(db, 'UPDATE assessments SET answers = ? WHERE id = ?', JSON.stringify(cleaned), row.id);
    return { body: { ok: true, answers: cleaned } };
  }, { auth: true });

  router.post('/api/assessments/:id/submit', async ({ user, params, body }) => {
    const row = assessmentRow(db, Number(params.id), user.id);
    if (row.status !== 'in_progress') throw new HttpError(409, 'This assessment has already been submitted.');
    const answers = body.answers && typeof body.answers === 'object' ? body.answers : parseJson(row.answers, {});
    const questions = questionnaireQuestions(db, row.questionnaire_id).filter((q) => q.enabled);
    const strands = activeStrands(db);
    if (!strands.length) throw new HttpError(503, 'No strands are configured.');

    let result;
    try {
      result = scoreAssessment({ questions, strands, answers });
    } catch (error) {
      if (error.missing) throw new HttpError(400, `Answer every question before submitting. Missing: ${error.missing.join(', ')}`, { missing: error.missing });
      throw error;
    }

    const baseline = row.type === 'post' ? latestSubmitted(db, user.id, 'pre') : null;
    tx(db, () => {
      run(
        db,
        `UPDATE assessments SET status = 'submitted', answers = ?, result = ?, submitted_at = ?, baseline_assessment_id = ?
         WHERE id = ?`,
        JSON.stringify(result.answers),
        JSON.stringify(result),
        now(),
        baseline?.id ?? null,
        row.id
      );
      run(db, 'DELETE FROM assessment_scores WHERE assessment_id = ?', row.id);
      run(db, 'DELETE FROM recommendations WHERE assessment_id = ?', row.id);
      for (const category of result.categoryScores) {
        run(
          db,
          'INSERT INTO assessment_scores (assessment_id, category, raw, maximum, normalized) VALUES (?, ?, ?, ?, ?)',
          row.id,
          category.key,
          category.raw,
          category.maximum,
          category.normalized
        );
      }
      for (const rec of result.ranked) {
        run(
          db,
          `INSERT INTO recommendations (assessment_id, strand_slug, rank, score, match_level, explanation, evidence)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          row.id,
          rec.slug,
          rec.rank,
          rec.score,
          rec.level,
          rec.explanation,
          JSON.stringify(rec.evidence)
        );
      }
      // A new baseline supersedes programmes built on an older attempt. A post-assessment
      // measures the programme, so it must not archive it.
      if (row.type === 'pre') {
        run(
          db,
          "UPDATE programs SET status = 'archived', updated_at = ? WHERE user_id = ? AND status = 'active' AND assessment_id != ?",
          now(),
          user.id,
          row.id
        );
      }
    });

    return { body: { assessment: assessmentPayload(db, assessmentRow(db, row.id, user.id)) } };
  }, { auth: true });

  router.post('/api/assessments/:id/selection', async ({ user, params, body }) => {
    const row = assessmentRow(db, Number(params.id), user.id);
    if (row.status !== 'submitted') throw new HttpError(409, 'Submit the assessment before choosing a strand.');
    const slug = str(body.strandSlug, { min: 1, max: 60, field: 'Strand' });
    const strand = get(db, 'SELECT * FROM strands WHERE slug = ? AND active = 1', slug);
    if (!strand) throw new HttpError(404, 'Strand not found');
    const rationale = optionalStr(body.rationale, 1000);
    run(db, 'UPDATE assessments SET selected_strand = ?, selected_at = ? WHERE id = ?', slug, now(), row.id);
    run(db, 'UPDATE profiles SET selected_strand = ?, updated_at = ? WHERE user_id = ?', slug, now(), user.id);
    return {
      body: {
        ok: true,
        selectedStrand: slug,
        strand: strandFromRow(strand),
        rationale,
        note: 'Your selection is yours to make. STRANDPATH will use it to build a preparation programme, not to override your choice.'
      }
    };
  }, { auth: true });

  /* ----------------------------------------------------------- dashboard */

  router.get('/api/dashboard', async ({ user }) => {
    const profile = getProfile(db, user.id);
    const submitted = all(db, "SELECT * FROM assessments WHERE user_id = ? AND status = 'submitted' ORDER BY submitted_at DESC, id DESC", user.id);
    const inProgress = get(
      db,
      "SELECT * FROM assessments WHERE user_id = ? AND status = 'in_progress' ORDER BY started_at DESC LIMIT 1",
      user.id
    );
    const latestPre = submitted.find((a) => a.type === 'pre') ?? null;
    const latestPost = submitted.find((a) => a.type === 'post') ?? null;
    const program = currentProgram(db, user.id);
    const openTickets = get(db, "SELECT COUNT(*) AS n FROM support_tickets WHERE user_id = ? AND status IN ('open','in_review')", user.id);
    const selectedStrand = latestPre?.selected_strand ?? profile?.selectedStrand ?? null;

    let reassessment = null;
    if (program) {
      const due = new Date(program.created_at);
      due.setDate(due.getDate() + Number(program.reassessment_after_days));
      const hasPostAfter = latestPost && new Date(latestPost.submitted_at) > new Date(program.created_at);
      reassessment = {
        recommendedAt: due.toISOString(),
        due: !hasPostAfter && Date.now() > due.getTime(),
        completed: Boolean(hasPostAfter)
      };
    }

    return {
      body: {
        user: publicUser(user),
        profile,
        assessment: {
          preSubmitted: submitted.filter((a) => a.type === 'pre').length,
          postSubmitted: submitted.filter((a) => a.type === 'post').length,
          latestPre: latestPre ? assessmentSummary(db, latestPre) : null,
          latestPost: latestPost ? assessmentSummary(db, latestPost) : null,
          inProgress: inProgress ? assessmentSummary(db, inProgress) : null
        },
        selectedStrand,
        program: program ? programPayload(db, program) : null,
        reassessment,
        openTickets: Number(openTickets?.n ?? 0),
        ai: { ...aiStatus(), enabled: Boolean(getSetting(db, 'ai.enabled', true)) }
      }
    };
  }, { auth: true });

  /* ----------------------------------------------------------- programmes */

  const STRAND_CATEGORY_MIN = 0.06;

  function pickActivitiesFor(category, percent, exclude = []) {
    const candidates = all(
      db,
      'SELECT * FROM activities WHERE active = 1 AND target_category = ? ORDER BY difficulty, id',
      category
    ).filter((a) => !exclude.includes(Number(a.id)));
    if (!candidates.length) return [];
    const preferredTier = percent < 35 ? 'foundation' : 'core';
    const first = candidates.find((a) => a.tier === preferredTier) ?? candidates[0];
    const rest = candidates.filter((a) => a.id !== first.id);
    const second = rest.find((a) => a.tier !== first.tier) ?? rest[0];
    return [first, second].filter(Boolean);
  }

  router.post('/api/programs/generate', async ({ user, body }) => {
    const requested = body.assessmentId ? assessmentRow(db, Number(body.assessmentId), user.id) : latestSubmitted(db, user.id, 'pre');
    if (!requested || requested.status !== 'submitted') {
      throw new HttpError(409, 'Complete a pre-assessment before generating a programme.');
    }
    const result = parseJson(requested.result, null);
    if (!result) throw new HttpError(409, 'This assessment has no stored result.');
    const selected = requested.selected_strand ?? getProfile(db, user.id)?.selectedStrand;
    if (!selected) throw new HttpError(409, 'Choose a strand on your results page first.');
    const strand = strandFromRow(get(db, 'SELECT * FROM strands WHERE slug = ?', selected));
    if (!strand) throw new HttpError(409, 'The selected strand is no longer available. Choose another strand.');

    const existing = get(
      db,
      "SELECT * FROM programs WHERE user_id = ? AND assessment_id = ? AND status = 'active' ORDER BY created_at DESC LIMIT 1",
      user.id,
      requested.id
    );
    if (existing) return { body: { program: programPayload(db, existing), reused: true } };

    const byKey = new Map(result.categoryScores.map((c) => [c.key, c]));
    const targets = [];
    for (const area of result.development ?? []) {
      if (!targets.includes(area.key)) targets.push(area.key);
      if (targets.length >= 2) break;
    }
    const strandCategories = Object.entries(strand.weights ?? {})
      .filter(([, w]) => w >= STRAND_CATEGORY_MIN)
      .sort((a, b) => b[1] - a[1]);
    for (const [key] of strandCategories) {
      if (targets.length >= 3) break;
      const percent = byKey.get(key)?.percent ?? 0;
      if (percent < 65 && !targets.includes(key)) targets.push(key);
    }
    if (!targets.length) targets.push(...strandCategories.slice(0, 2).map(([k]) => k));

    const chosenActivities = [];
    for (const category of targets) {
      const percent = byKey.get(category)?.percent ?? 0;
      const picks = pickActivitiesFor(category, percent, chosenActivities.map((a) => Number(a.id)));
      for (const pick of picks) {
        if (!chosenActivities.some((a) => a.id === pick.id)) chosenActivities.push(pick);
      }
    }
    if (!chosenActivities.length) {
      throw new HttpError(409, 'No improvement activities are configured yet. Ask an administrator to add activities.');
    }

    const goal =
      `Build the foundations for ${strand.code} (${strand.name}) in ${targets.map(labelFor).join(', ')}, ` +
      `starting from your ${new Date(requested.submitted_at).toLocaleDateString('en-PH', { day: 'numeric', month: 'long', year: 'numeric' })} assessment.`;

    const programId = tx(db, () => {
      run(
        db,
        "UPDATE programs SET status = 'archived', updated_at = ? WHERE user_id = ? AND status = 'active'",
        now(),
        user.id
      );
      const { id } = run(
        db,
        `INSERT INTO programs (user_id, assessment_id, name, goal, strand_slug, target_categories, status, reassessment_after_days, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 'active', 28, ?, ?)`,
        user.id,
        requested.id,
        `${strand.code} Preparation Programme`,
        goal,
        strand.slug,
        JSON.stringify(targets),
        now(),
        now()
      );
      chosenActivities.forEach((activity, index) => {
        run(
          db,
          'INSERT INTO program_activities (program_id, activity_id, sequence, status) VALUES (?, ?, ?, ?)',
          id,
          activity.id,
          index + 1,
          'not_started'
        );
      });
      return id;
    });

    return { status: 201, body: { program: programPayload(db, getProgram(db, programId, user.id)) } };
  }, { auth: true });

  router.get('/api/programs/current', async ({ user }) => {
    const program = currentProgram(db, user.id);
    return { body: { program: program ? programPayload(db, program) : null } };
  }, { auth: true });

  router.get('/api/programs/:id', async ({ user, params }) => {
    return { body: { program: programPayload(db, getProgram(db, Number(params.id), user.id)) } };
  }, { auth: true });

  router.patch('/api/programs/:id', async ({ user, params, body }) => {
    const program = getProgram(db, Number(params.id), user.id);
    const status = body.status;
    if (!['active', 'completed', 'archived'].includes(status)) throw new HttpError(400, 'Unknown programme status');
    run(db, 'UPDATE programs SET status = ?, updated_at = ? WHERE id = ?', status, now(), program.id);
    return { body: { program: programPayload(db, getProgram(db, program.id, user.id)) } };
  }, { auth: true });

  router.get('/api/program-activities/:id', async ({ user, params }) => {
    const row = get(
      db,
      `SELECT pa.*, p.user_id, p.id AS program_id FROM program_activities pa
       JOIN programs p ON p.id = pa.program_id WHERE pa.id = ?`,
      Number(params.id)
    );
    if (!row || Number(row.user_id) !== user.id) throw new HttpError(404, 'Activity not found');
    const program = programPayload(db, getProgram(db, row.program_id, user.id));
    const activity = program.activities.find((a) => a.id === Number(row.id));
    return { body: { activity, program: { id: program.id, name: program.name, progress: program.progress } } };
  }, { auth: true });

  router.post('/api/program-activities/:id/start', async ({ user, params }) => {
    const row = get(
      db,
      `SELECT pa.*, p.user_id FROM program_activities pa JOIN programs p ON p.id = pa.program_id WHERE pa.id = ?`,
      Number(params.id)
    );
    if (!row || Number(row.user_id) !== user.id) throw new HttpError(404, 'Activity not found');
    if (row.status === 'completed') return { body: { ok: true, status: 'completed' } };
    if (row.status !== 'in_progress') {
      run(db, "UPDATE program_activities SET status = 'in_progress', started_at = ? WHERE id = ?", now(), row.id);
    }
    return { body: { ok: true, status: 'in_progress' } };
  }, { auth: true });

  router.post('/api/program-activities/:id/complete', async ({ user, params, body }) => {
    const row = get(
      db,
      `SELECT pa.*, p.user_id, p.status AS program_status FROM program_activities pa
       JOIN programs p ON p.id = pa.program_id WHERE pa.id = ?`,
      Number(params.id)
    );
    if (!row || Number(row.user_id) !== user.id) throw new HttpError(404, 'Activity not found');
    const reflection = str(body.reflection, { min: 20, max: 4000, field: 'Reflection' });
    const activity = get(db, 'SELECT * FROM activities WHERE id = ?', row.activity_id);
    const check = parseJson(activity.check_questions, null);

    let checkScore = null;
    let checkFeedback = null;
    if (Array.isArray(check) && check.length) {
      const responses = Array.isArray(body.responses) ? body.responses : [];
      if (responses.length !== check.length) {
        throw new HttpError(400, `This activity has ${check.length} knowledge-check questions. Answer all of them.`);
      }
      const correct = check.reduce((sum, q, i) => sum + (Number(responses[i]) === q.answer ? 1 : 0), 0);
      checkScore = Math.round((correct / check.length) * 100);
      checkFeedback =
        checkScore >= 60
          ? `Knowledge check: ${correct} of ${check.length} correct. The idea looks secure — the next activity builds on it.`
          : `Knowledge check: ${correct} of ${check.length} correct. That is fine — review the explanations and try an alternative activity for the same skill.`;
    }

    tx(db, () => {
      run(
        db,
        `UPDATE program_activities SET status = 'completed', completed_at = ?, reflection = ?, check_score = ?, response = ?
         WHERE id = ?`,
        now(),
        reflection,
        checkScore,
        JSON.stringify(body.responses ?? null),
        row.id
      );
      const remaining = get(
        db,
        "SELECT COUNT(*) AS n FROM program_activities WHERE program_id = ? AND status != 'completed'",
        row.program_id
      );
      if (Number(remaining.n) === 0) {
        run(db, "UPDATE programs SET status = 'completed', updated_at = ? WHERE id = ?", now(), row.program_id);
      } else {
        run(db, 'UPDATE programs SET updated_at = ? WHERE id = ?', now(), row.program_id);
      }
    });

    const alternatives =
      checkScore !== null && checkScore < 60
        ? all(
            db,
            `SELECT a.id, a.slug, a.title, a.tier, a.minutes FROM activities a
             WHERE a.active = 1 AND a.target_category = ? AND a.id != ?
               AND a.id NOT IN (SELECT activity_id FROM program_activities WHERE program_id = ?)
             ORDER BY a.difficulty, a.id LIMIT 3`,
            activity.target_category,
            activity.id,
            row.program_id
          ).map((a) => ({ id: Number(a.id), slug: a.slug, title: a.title, tier: a.tier, minutes: Number(a.minutes) }))
        : [];

    return {
      body: {
        ok: true,
        checkScore,
        checkFeedback,
        alternatives,
        note: 'Completion is recorded from your own reflection. The knowledge check is feedback, not a grade.'
      }
    };
  }, { auth: true });

  router.get('/api/program-activities/:id/alternatives', async ({ user, params }) => {
    const row = get(
      db,
      `SELECT pa.*, p.user_id, a.target_category FROM program_activities pa
       JOIN programs p ON p.id = pa.program_id JOIN activities a ON a.id = pa.activity_id
       WHERE pa.id = ?`,
      Number(params.id)
    );
    if (!row || Number(row.user_id) !== user.id) throw new HttpError(404, 'Activity not found');
    const alternatives = all(
      db,
      `SELECT id, slug, title, tier, minutes, difficulty FROM activities
       WHERE active = 1 AND target_category = ? AND id != ?
         AND id NOT IN (SELECT activity_id FROM program_activities WHERE program_id = ?)
       ORDER BY difficulty, id LIMIT 6`,
      row.target_category,
      row.activity_id,
      row.program_id
    ).map((a) => ({ id: Number(a.id), slug: a.slug, title: a.title, tier: a.tier, minutes: Number(a.minutes) }));
    return { body: { alternatives, category: row.target_category } };
  }, { auth: true });

  /* ------------------------------------------------------------- progress */

  router.get('/api/progress', async ({ user }) => {
    const rows = all(
      db,
      "SELECT * FROM assessments WHERE user_id = ? AND status = 'submitted' ORDER BY submitted_at",
      user.id
    );
    const series = rows.map((row) => {
      const result = parseJson(row.result, {});
      return {
        id: Number(row.id),
        type: row.type,
        submittedAt: row.submitted_at,
        categories: (result.categoryScores ?? []).map((c) => ({ key: c.key, label: c.label, percent: c.percent })),
        topStrand: result.ranked?.[0] ? { code: result.ranked[0].code, score: result.ranked[0].score } : null,
        selectedStrand: row.selected_strand
      };
    });

    const comparisons = [];
    for (const row of rows.filter((r) => r.type === 'post' && r.baseline_assessment_id)) {
      const baseline = rows.find((r) => Number(r.id) === Number(row.baseline_assessment_id));
      if (!baseline) continue;
      comparisons.push({
        currentAssessmentId: Number(row.id),
        comparison: compareResults(
          { assessmentId: Number(baseline.id), ...parseJson(baseline.result, {}), submittedAt: baseline.submitted_at },
          { assessmentId: Number(row.id), ...parseJson(row.result, {}), submittedAt: row.submitted_at }
        )
      });
    }

    const programs = all(db, 'SELECT * FROM programs WHERE user_id = ? ORDER BY created_at DESC', user.id).map((p) =>
      programPayload(db, p)
    );
    const completedActivities = programs.flatMap((p) =>
      p.activities
        .filter((a) => a.status === 'completed')
        .map((a) => ({
          programId: p.id,
          programName: p.name,
          title: a.title,
          category: a.targetCategoryLabel,
          completedAt: a.completedAt,
          checkScore: a.checkScore
        }))
    );

    return {
      body: {
        series,
        comparisons,
        programs,
        completedActivities,
        summary: {
          assessments: rows.length,
          preAssessments: rows.filter((r) => r.type === 'pre').length,
          postAssessments: rows.filter((r) => r.type === 'post').length,
          activitiesCompleted: completedActivities.length,
          programsCompleted: programs.filter((p) => p.status === 'completed').length
        }
      }
    };
  }, { auth: true });

  router.get('/api/progress/compare', async ({ user, query }) => {
    const fromId = Number(query.get('from'));
    const toId = Number(query.get('to'));
    if (!fromId || !toId) throw new HttpError(400, 'Provide two assessment ids');
    const from = assessmentRow(db, fromId, user.id);
    const to = assessmentRow(db, toId, user.id);
    if (from.status !== 'submitted' || to.status !== 'submitted') throw new HttpError(409, 'Both assessments must be submitted');
    return {
      body: {
        comparison: compareResults(
          { assessmentId: Number(from.id), ...parseJson(from.result, {}), submittedAt: from.submitted_at },
          { assessmentId: Number(to.id), ...parseJson(to.result, {}), submittedAt: to.submitted_at }
        )
      }
    };
  }, { auth: true });

  /* ------------------------------------------------------------------ AI */

  router.get('/api/ai/status', async ({ user }) => {
    const enabled = Boolean(getSetting(db, 'ai.enabled', true));
    const status = aiStatus();
    return {
      body: {
        ...status,
        enabled,
        available: status.configured && enabled,
        grounding: getSetting(db, 'ai.grounding', {}),
        remainingNote: 'AI is optional. Scores, recommendations, explanations and programmes are computed without it.',
        user: user ? { id: user.id } : null
      }
    };
  });

  async function aiUnavailableReason() {
    if (!ai.configured) return 'No AI model is configured on this server. Ask an administrator to set AI_API_KEY or OPENAI_API_KEY.';
    if (!getSetting(db, 'ai.enabled', true)) return 'AI features are currently turned off by the administrator.';
    return null;
  }

  for (const agent of ['coach', 'support']) {
    router.get(`/api/${agent}/messages`, async ({ user }) => {
      const rows = all(
        db,
        'SELECT id, role, content, created_at FROM ai_messages WHERE user_id = ? AND agent = ? ORDER BY created_at, id LIMIT 200',
        user.id,
        agent
      );
      return {
        body: {
          messages: rows.map((m) => ({ id: Number(m.id), role: m.role, content: m.content, createdAt: m.created_at })),
          ai: { ...aiStatus(), available: ai.configured && Boolean(getSetting(db, 'ai.enabled', true)) }
        }
      };
    }, { auth: true });

    router.delete(`/api/${agent}/messages`, async ({ user }) => {
      run(db, 'DELETE FROM ai_messages WHERE user_id = ? AND agent = ?', user.id, agent);
      return { body: { ok: true } };
    }, { auth: true });

    router.post(`/api/${agent}/messages`, async ({ user, body, ip }) => {
      const unavailable = await aiUnavailableReason();
      if (unavailable) {
        throw new HttpError(503, unavailable, { code: ai.configured ? 'AI_DISABLED' : 'AI_UNAVAILABLE' });
      }
      if (!limit(`ai:${user.id}:${ip}`, 30, 60 * 60 * 1000)) throw new HttpError(429, 'AI message limit reached. Try again later.');
      const question = str(body.message, { min: 2, max: MAX_AI_MESSAGE, field: 'Message' });
      const history = all(
        db,
        'SELECT role, content FROM ai_messages WHERE user_id = ? AND agent = ? ORDER BY created_at DESC, id DESC LIMIT 10',
        user.id,
        agent
      ).reverse();
      const context = buildStudentContext(db, user, agent, question);
      const messages = buildMessages({ agent, question, context, history });
      const reply = await complete(messages);
      run(db, 'INSERT INTO ai_messages (user_id, agent, role, content, created_at) VALUES (?, ?, ?, ?, ?)', user.id, agent, 'user', question, now());
      const { id } = run(
        db,
        'INSERT INTO ai_messages (user_id, agent, role, content, meta, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        user.id,
        agent,
        'assistant',
        reply.content,
        JSON.stringify({ model: reply.model }),
        now()
      );
      return {
        body: {
          message: { id, role: 'assistant', content: reply.content, createdAt: now() },
          model: reply.model,
          note: 'Generated by the configured AI model from your STRANDPATH context. Verify school-specific details with your guidance office.'
        }
      };
    }, { auth: true });
  }

  /* -------------------------------------------------------------- support */

  router.get('/api/support/tickets', async ({ user }) => {
    const rows = all(db, 'SELECT * FROM support_tickets WHERE user_id = ? ORDER BY updated_at DESC', user.id);
    return { body: { tickets: rows.map((t) => supportTicketPayload(db, t)) } };
  }, { auth: true });

  router.post('/api/support/tickets', async ({ user, body }) => {
    const subject = str(body.subject, { min: 4, max: 160, field: 'Subject' });
    const category = str(body.category, { min: 2, max: 60, field: 'Category' });
    const message = str(body.message, { min: 10, max: 4000, field: 'Message' });
    const priority = ['low', 'normal', 'high'].includes(body.priority) ? body.priority : 'normal';
    const ticketId = tx(db, () => {
      const { id } = run(
        db,
        `INSERT INTO support_tickets (user_id, subject, category, status, priority, created_at, updated_at)
         VALUES (?, ?, ?, 'open', ?, ?, ?)`,
        user.id,
        subject,
        category,
        priority,
        now(),
        now()
      );
      addTicketMessage(db, id, user.id, 'student', message);
      return id;
    });
    const ticket = get(db, 'SELECT * FROM support_tickets WHERE id = ?', ticketId);
    return { status: 201, body: { ticket: supportTicketPayload(db, ticket) } };
  }, { auth: true });

  router.post('/api/support/tickets/:id/messages', async ({ user, params, body }) => {
    const ticket = get(db, 'SELECT * FROM support_tickets WHERE id = ?', Number(params.id));
    if (!ticket) throw new HttpError(404, 'Ticket not found');
    const isOwner = Number(ticket.user_id) === user.id;
    if (!isOwner) throw new HttpError(404, 'Ticket not found');
    const message = str(body.body, { min: 2, max: 4000, field: 'Message' });
    addTicketMessage(db, ticket.id, user.id, user.role === 'student' ? 'student' : user.role, message);
    if (ticket.status === 'resolved') {
      run(db, "UPDATE support_tickets SET status = 'open', updated_at = ? WHERE id = ?", now(), ticket.id);
    }
    return { body: { ticket: supportTicketPayload(db, get(db, 'SELECT * FROM support_tickets WHERE id = ?', ticket.id)) } };
  }, { auth: true });

  /* ---------------------------------------------------------------- admin */

  registerAdminRoutes(router, { db, audit, getSetting, setSetting, programPayload, assessmentSummary, supportTicketPayload, aiStatus });

  /* ------------------------------------------------------------- dispatch */

  return async function handler(req, res) {
    securityHeaders(res);
    let pathname = '/';
    try {
      pathname = new URL(req.url, 'http://localhost').pathname;
    } catch {
      sendJson(res, 400, { error: 'BAD_REQUEST', message: 'Malformed request URL' });
      return;
    }

    if (!pathname.startsWith('/api')) {
      if (serveClient) {
        serveStatic(req, res, distDir);
      } else {
        sendJson(res, 404, { error: 'NOT_FOUND', message: 'Not found' });
      }
      return;
    }

    const match = router.match(req.method, pathname);
    if (!match) {
      sendJson(res, 404, { error: 'NOT_FOUND', message: 'Unknown API route' });
      return;
    }

    try {
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
        const origin = req.headers.origin;
        if (origin) {
          let originHost = '';
          try {
            originHost = new URL(origin).host.toLowerCase();
          } catch {
            originHost = '';
          }

          // Behind a TLS proxy the browser's Host may be rewritten, so accept the
          // proxy-observed host and the configured public origin as well. Browsers
          // cannot set X-Forwarded-Host, so this does not weaken CSRF protection.
          const allowedHosts = new Set();
          const addHost = (value) => {
            const first = String(value || '').split(',')[0].trim().toLowerCase();
            if (first) allowedHosts.add(first);
          };
          addHost(req.headers.host);
          addHost(req.headers['x-forwarded-host']);
          if (process.env.APP_BASE_URL) {
            try {
              addHost(new URL(process.env.APP_BASE_URL).host);
            } catch {
              /* ignore malformed configuration */
            }
          }
          // Modern browsers also assert same-origin via a header a page cannot set;
          // this keeps protection correct when a reverse proxy rewrites Host.
          const browserSameOrigin = req.headers['sec-fetch-site'] === 'same-origin';
          if (!browserSameOrigin && (!originHost || !allowedHosts.has(originHost))) {
            console.warn('[csrf] refused origin=%s host=%s forwarded=%s', originHost, req.headers.host, req.headers['x-forwarded-host'] ?? '');
            throw new HttpError(403, 'Cross-origin request refused');
          }
        }
      }

      const token = readCookies(req.headers.cookie).sp_session;
      const user = sessionUser(db, token);
      const { route, params } = match;
      if (route.options.auth && !user) throw new HttpError(401, 'Sign in to continue');
      if (route.options.roles && !route.options.roles.includes(user?.role)) {
        throw new HttpError(403, 'You do not have access to this area');
      }

      // Accounts provisioned with an initial password must replace it first.
      if (user?.mustChangePassword) {
        const allowedWhileForced = new Set([
          '/api/auth/me',
          '/api/auth/logout',
          '/api/auth/password',
          '/api/auth/theme',
          '/api/auth/verify-email',
          '/api/auth/resend-verification',
          '/api/auth/config',
          '/api/notifications',
          '/api/notifications/read'
        ]);
        if (!allowedWhileForced.has(pathname)) {
          throw new HttpError(403, 'Change your initial password before continuing.', {
            code: 'PASSWORD_CHANGE_REQUIRED'
          });
        }
      }

      const body = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) ? await readJson(req) : {};
      const url = new URL(req.url, 'http://localhost');
      const result =
        (await route.handler({
          req,
          res,
          body,
          params,
          query: url.searchParams,
          user,
          token,
          db,
          ip: req.socket.remoteAddress ?? 'unknown'
        })) ?? {};
      sendJson(res, result.status ?? 200, result.body ?? { ok: true }, result.headers ?? {});
    } catch (error) {
      sendError(res, error);
    }
  };
}

export function startServer({ port = Number(process.env.PORT || 8787), db, distDir } = {}) {
  const app = createApp({ db, distDir });
  const server = createServer(app);
  pruneSessions(db);
  setInterval(() => pruneSessions(db), 1000 * 60 * 60).unref();
  return new Promise((resolvePromise) => {
    server.listen(port, '0.0.0.0', () => resolvePromise(server));
  });
}

export { seed };
