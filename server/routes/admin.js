import { all, get, run, tx, now, parseJson, audit, getSetting, setSetting } from '../db.js';
import { HttpError } from '../http.js';
import { CATEGORY_KEYS, CATEGORIES } from '../content.js';
import { labelFor } from '../engine.js';

const ADMIN = { auth: true, roles: ['admin'] };
const STAFF = { auth: true, roles: ['admin', 'guidance'] };

const text = (value, field, { min = 0, max = 2000 } = {}) => {
  if (typeof value !== 'string') throw new HttpError(400, `${field} must be text`);
  const trimmed = value.trim();
  if (trimmed.length < min) throw new HttpError(400, `${field} must be at least ${min} characters`);
  if (trimmed.length > max) throw new HttpError(400, `${field} must be at most ${max} characters`);
  return trimmed;
};

const slugify = (value) =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

function validateOptions(options) {
  if (!Array.isArray(options) || options.length < 2) throw new HttpError(400, 'A question needs at least two options');
  const seen = new Set();
  return options.map((option, index) => {
    const code = text(option.code, 'Option code', { min: 1, max: 40 });
    if (seen.has(code)) throw new HttpError(400, `Duplicate option code "${code}"`);
    seen.add(code);
    const scores = option.scores ?? {};
    if (typeof scores !== 'object' || Array.isArray(scores)) throw new HttpError(400, 'Option scores must be an object');
    for (const [key, value] of Object.entries(scores)) {
      if (!CATEGORY_KEYS.includes(key)) throw new HttpError(400, `Unknown dimension "${key}" in option scores`);
      if (typeof value !== 'number' || value < 0 || value > 5) {
        throw new HttpError(400, `Score for "${key}" must be a number between 0 and 5`);
      }
    }
    return {
      code,
      label: text(option.label, 'Option label', { min: 1, max: 300 }),
      hint: option.hint ? text(option.hint, 'Option hint', { max: 300 }) : null,
      scores,
      orderIndex: index + 1
    };
  });
}

function questionnaireRow(db, id) {
  const row = get(db, 'SELECT * FROM questionnaires WHERE id = ?', Number(id));
  if (!row) throw new HttpError(404, 'Questionnaire version not found');
  return row;
}

function assertDraft(row) {
  if (row.status === 'active') {
    throw new HttpError(409, 'The active questionnaire is read-only. Create a new version to change questions.');
  }
  if (row.status === 'archived') {
    throw new HttpError(409, 'Archived questionnaire versions are read-only.');
  }
}

export function registerAdminRoutes(router, deps) {
  const { db, aiStatus, supportTicketPayload, assessmentSummary, programPayload } = deps;

  /* ------------------------------------------------------------- overview */

  router.get('/api/admin/overview', async () => {
    const count = (sql, ...params) => Number(get(db, sql, ...params)?.n ?? 0);
    const students = count("SELECT COUNT(*) AS n FROM users WHERE role = 'student'");
    const activeStudents = count("SELECT COUNT(*) AS n FROM users WHERE role = 'student' AND status = 'active'");
    const verifiedStudents = count(
      "SELECT COUNT(*) AS n FROM users WHERE role = 'student' AND email_verified_at IS NOT NULL"
    );
    const suspendedStudents = count("SELECT COUNT(*) AS n FROM users WHERE role = 'student' AND status = 'suspended'");
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const newStudents7d = count("SELECT COUNT(*) AS n FROM users WHERE role = 'student' AND created_at >= ?", weekAgo);
    const newStudents30d = count("SELECT COUNT(*) AS n FROM users WHERE role = 'student' AND created_at >= ?", monthAgo);
    const postParticipants = count(
      "SELECT COUNT(DISTINCT user_id) AS n FROM assessments WHERE status = 'submitted' AND type = 'post'"
    );
    const studentsWithPrograms = count("SELECT COUNT(DISTINCT user_id) AS n FROM programs");
    const highPriorityTickets = count(
      "SELECT COUNT(*) AS n FROM support_tickets WHERE priority = 'high' AND status IN ('open','in_review')"
    );
    const submitted = count("SELECT COUNT(*) AS n FROM assessments WHERE status = 'submitted'");
    const pre = count("SELECT COUNT(*) AS n FROM assessments WHERE status = 'submitted' AND type = 'pre'");
    const post = count("SELECT COUNT(*) AS n FROM assessments WHERE status = 'submitted' AND type = 'post'");
    const activePrograms = count("SELECT COUNT(*) AS n FROM programs WHERE status = 'active'");
    const completedPrograms = count("SELECT COUNT(*) AS n FROM programs WHERE status = 'completed'");
    const completedActivities = count("SELECT COUNT(*) AS n FROM program_activities WHERE status = 'completed'");
    const openTickets = count("SELECT COUNT(*) AS n FROM support_tickets WHERE status IN ('open','in_review')");
    const studentsWithPre = count(
      "SELECT COUNT(DISTINCT user_id) AS n FROM assessments WHERE status = 'submitted' AND type = 'pre'"
    );
    const selected = count(
      "SELECT COUNT(DISTINCT user_id) AS n FROM assessments WHERE selected_strand IS NOT NULL AND status = 'submitted'"
    );

    return {
      body: {
        counts: {
          students,
          activeStudents,
          verifiedStudents,
          unverifiedStudents: students - verifiedStudents,
          suspendedStudents,
          newStudents7d,
          newStudents30d,
          postParticipants,
          studentsWithPrograms,
          highPriorityTickets,
          submitted,
          pre,
          post,
          activePrograms,
          completedPrograms,
          completedActivities,
          openTickets,
          assessmentCompletionRate: students ? Math.round((studentsWithPre / students) * 100) : 0,
          selectionRate: studentsWithPre ? Math.round((selected / studentsWithPre) * 100) : 0
        },
        ai: aiStatus(),
        recentLogs: all(
          db,
          `SELECT l.id, l.action, l.target, l.created_at, u.name AS actor FROM admin_logs l
           LEFT JOIN users u ON u.id = l.actor_id ORDER BY l.id DESC LIMIT 8`
        ).map((l) => ({ id: Number(l.id), action: l.action, target: l.target, createdAt: l.created_at, actor: l.actor ?? 'system' })),
        recentAssessments: all(
          db,
          `SELECT a.id, a.type, a.submitted_at, u.name AS student FROM assessments a JOIN users u ON u.id = a.user_id
           WHERE a.status = 'submitted' ORDER BY a.submitted_at DESC LIMIT 6`
        ).map((a) => ({ id: Number(a.id), type: a.type, submittedAt: a.submitted_at, student: a.student })),
        recentRegistrations: all(
          db,
          `SELECT id, name, email, email_verified_at, created_at FROM users
           WHERE role = 'student' ORDER BY created_at DESC, id DESC LIMIT 6`
        ).map((u) => ({
          id: Number(u.id),
          name: u.name,
          email: u.email,
          verified: Boolean(u.email_verified_at),
          createdAt: u.created_at
        }))
      }
    };
  }, STAFF);

  router.get('/api/admin/analytics', async () => {
    const latest = all(
      db,
      `SELECT a.* FROM assessments a
       JOIN (SELECT user_id, MAX(submitted_at) AS latest FROM assessments WHERE status='submitted' AND type='pre' GROUP BY user_id) m
         ON m.user_id = a.user_id AND m.latest = a.submitted_at
       WHERE a.type = 'pre'`
    );
    const recommendationDistribution = {};
    const selectionDistribution = {};
    for (const row of latest) {
      const result = parseJson(row.result, {});
      const top = result.ranked?.[0]?.code;
      if (top) recommendationDistribution[top] = (recommendationDistribution[top] ?? 0) + 1;
      if (row.selected_strand) selectionDistribution[row.selected_strand] = (selectionDistribution[row.selected_strand] ?? 0) + 1;
    }
    const programs = all(db, 'SELECT status, COUNT(*) AS n FROM programs GROUP BY status');
    const activities = all(
      db,
      `SELECT pa.status, COUNT(*) AS n FROM program_activities pa GROUP BY pa.status`
    );
    const students = Number(get(db, "SELECT COUNT(*) AS n FROM users WHERE role = 'student'")?.n ?? 0);
    const preCount = Number(get(db, "SELECT COUNT(*) AS n FROM assessments WHERE status='submitted' AND type='pre'")?.n ?? 0);
    const postCount = Number(get(db, "SELECT COUNT(*) AS n FROM assessments WHERE status='submitted' AND type='post'")?.n ?? 0);
    const tasks = Number(get(db, 'SELECT COUNT(*) AS n FROM program_activities')?.n ?? 0);
    const tasksDone = Number(get(db, 'SELECT COUNT(*) AS n FROM program_activities WHERE status = \'completed\'')?.n ?? 0);

    return {
      body: {
        students,
        assessments: { pre: preCount, post: postCount },
        completionRate: students ? Math.round((preCount / students) * 100) : 0,
        recommendationDistribution,
        selectionDistribution,
        programs,
        activities,
        activityCompletionRate: tasks ? Math.round((tasksDone / tasks) * 100) : 0,
        reassessmentRate: preCount ? Math.round((postCount / preCount) * 100) : 0
      }
    };
  }, ADMIN);

  /* -------------------------------------------------------------- students */

  router.get('/api/admin/students', async ({ query }) => {
    const search = (query.get('search') ?? '').trim();
    const status = query.get('status') ?? '';
    const page = Math.max(1, Number(query.get('page') ?? 1) || 1);
    const pageSize = Math.min(100, Math.max(5, Number(query.get('pageSize') ?? 25) || 25));
    const where = ["u.role = 'student'"];
    const params = [];
    if (status === 'active' || status === 'suspended') {
      where.push('u.status = ?');
      params.push(status);
    }
    if (search) {
      where.push('(u.name LIKE ? OR u.email LIKE ? OR p.school LIKE ?)');
      const like = `%${search}%`;
      params.push(like, like, like);
    }
    const whereSql = where.join(' AND ');
    const total = Number(get(db, `SELECT COUNT(*) AS n FROM users u LEFT JOIN profiles p ON p.user_id = u.id WHERE ${whereSql}`, ...params)?.n ?? 0);
    const rows = all(
      db,
      `SELECT u.id, u.name, u.email, u.status, u.email_verified_at, u.created_at, u.last_login_at, p.grade_level, p.school,
              (SELECT COUNT(*) FROM assessments a WHERE a.user_id = u.id AND a.status='submitted') AS assessments,
              (SELECT COUNT(*) FROM assessments a WHERE a.user_id = u.id AND a.selected_strand IS NOT NULL) AS selections,
              (SELECT COUNT(*) FROM programs pr WHERE pr.user_id = u.id AND pr.status='active') AS programs
       FROM users u LEFT JOIN profiles p ON p.user_id = u.id
       WHERE ${whereSql}
       ORDER BY u.created_at DESC, u.id DESC
       LIMIT ? OFFSET ?`,
      ...params,
      pageSize,
      (page - 1) * pageSize
    );
    return {
      body: {
        pagination: { page, pageSize, total, pages: Math.max(1, Math.ceil(total / pageSize)) },
        students: rows.map((row) => ({
          id: Number(row.id),
          name: row.name,
          email: row.email,
          status: row.status,
          emailVerified: Boolean(row.email_verified_at),
          gradeLevel: row.grade_level,
          school: row.school,
          createdAt: row.created_at,
          lastLoginAt: row.last_login_at,
          assessments: Number(row.assessments),
          selections: Number(row.selections),
          activePrograms: Number(row.programs)
        }))
      }
    };
  }, STAFF);

  router.get('/api/admin/students/:id', async ({ params, user }) => {
    const student = get(db, "SELECT id, name, email, role, status, created_at, last_login_at FROM users WHERE id = ? AND role = 'student'", Number(params.id));
    if (!student) throw new HttpError(404, 'Student not found');
    audit(db, user.id, 'student.record.view', `user:${student.id}`, { by: user.role });
    const profile = get(db, 'SELECT * FROM profiles WHERE user_id = ?', student.id);
    const assessments = all(db, 'SELECT * FROM assessments WHERE user_id = ? ORDER BY started_at DESC', student.id).map((a) =>
      assessmentSummary(db, a)
    );
    const programs = all(db, 'SELECT * FROM programs WHERE user_id = ? ORDER BY created_at DESC', student.id).map((p) => ({
      id: Number(p.id),
      name: p.name,
      status: p.status,
      strand: p.strand_slug,
      createdAt: p.created_at,
      progress: programPayload(db, p).progress
    }));
    const tickets = all(db, 'SELECT * FROM support_tickets WHERE user_id = ? ORDER BY updated_at DESC', student.id).map((t) =>
      supportTicketPayload(db, t)
    );
    return {
      body: {
        student: {
          id: Number(student.id),
          name: student.name,
          email: student.email,
          status: student.status,
          createdAt: student.created_at,
          lastLoginAt: student.last_login_at
        },
        profile: profile
          ? {
              gradeLevel: profile.grade_level,
              school: profile.school,
              city: profile.city,
              interests: profile.interests,
              strengths: profile.strengths,
              goals: profile.goals,
              learningPreference: profile.learning_preference,
              careerInterest: profile.career_interest,
              selectedStrand: profile.selected_strand,
              consentAt: profile.consent_at
            }
          : null,
        assessments,
        programs,
        tickets
      }
    };
  }, STAFF);

  router.patch('/api/admin/students/:id', async ({ params, body, user }) => {
    const status = body.status;
    if (!['active', 'suspended'].includes(status)) throw new HttpError(400, 'Status must be active or suspended');
    const student = get(db, "SELECT * FROM users WHERE id = ? AND role = 'student'", Number(params.id));
    if (!student) throw new HttpError(404, 'Student not found');
    run(db, 'UPDATE users SET status = ? WHERE id = ?', status, student.id);
    if (status === 'suspended') run(db, 'DELETE FROM sessions WHERE user_id = ?', student.id);
    audit(db, user.id, 'student.status.change', `user:${student.id}`, { from: student.status, to: status });
    return { body: { ok: true, status } };
  }, ADMIN);

  /* --------------------------------------------------------- questionnaires */

  router.get('/api/admin/questionnaires', async () => {
    const versions = all(db, 'SELECT * FROM questionnaires ORDER BY created_at DESC').map((q) => ({
      id: Number(q.id),
      version: q.version,
      title: q.title,
      status: q.status,
      notes: q.notes,
      createdAt: q.created_at,
      activatedAt: q.activated_at,
      questionCount: Number(get(db, 'SELECT COUNT(*) AS n FROM questions WHERE questionnaire_id = ?', q.id)?.n ?? 0),
      enabledCount: Number(
        get(db, 'SELECT COUNT(*) AS n FROM questions WHERE questionnaire_id = ? AND enabled = 1', q.id)?.n ?? 0
      ),
      submissionCount: Number(
        get(db, 'SELECT COUNT(*) AS n FROM assessments WHERE questionnaire_id = ? AND status = ?', q.id, 'submitted')?.n ?? 0
      )
    }));
    const active = versions.find((v) => v.status === 'active') ?? null;
    const detail = active
      ? all(db, 'SELECT * FROM questions WHERE questionnaire_id = ? ORDER BY order_index', active.id).map((q) => ({
          id: Number(q.id),
          code: q.code,
          section: q.section,
          dimension: q.dimension,
          prompt: q.prompt,
          helper: q.helper,
          kind: q.kind,
          maxChoices: q.max_choices,
          weight: Number(q.weight),
          enabled: Boolean(q.enabled),
          validationStatus: q.validation_status,
          options: all(db, 'SELECT * FROM question_options WHERE question_id = ? ORDER BY order_index', q.id).map((o) => ({
            id: Number(o.id),
            code: o.code,
            label: o.label,
            hint: o.hint,
            scores: parseJson(o.scores, {})
          }))
        }))
      : [];
    return { body: { versions, activeQuestions: detail, categories: CATEGORY_KEYS.map((k) => ({ key: k, ...CATEGORIES[k] })) } };
  }, ADMIN);

  router.get('/api/admin/questionnaires/:id', async ({ params }) => {
    const q = questionnaireRow(db, params.id);
    const questions = all(db, 'SELECT * FROM questions WHERE questionnaire_id = ? ORDER BY order_index', q.id).map((row) => ({
      id: Number(row.id),
      code: row.code,
      section: row.section,
      dimension: row.dimension,
      prompt: row.prompt,
      helper: row.helper,
      kind: row.kind,
      maxChoices: row.max_choices,
      weight: Number(row.weight),
      enabled: Boolean(row.enabled),
      validationStatus: row.validation_status,
      options: all(db, 'SELECT * FROM question_options WHERE question_id = ? ORDER BY order_index', row.id).map((o) => ({
        id: Number(o.id),
        code: o.code,
        label: o.label,
        hint: o.hint,
        scores: parseJson(o.scores, {})
      }))
    }));
    return {
      body: {
        questionnaire: {
          id: Number(q.id),
          version: q.version,
          title: q.title,
          status: q.status,
          notes: q.notes,
          createdAt: q.created_at,
          activatedAt: q.activated_at
        },
        questions
      }
    };
  }, ADMIN);

  router.post('/api/admin/questionnaires', async ({ body, user }) => {
    const version = text(body.version, 'Version', { min: 1, max: 20 });
    const title = text(body.title, 'Title', { min: 3, max: 160 });
    if (get(db, 'SELECT id FROM questionnaires WHERE version = ?', version)) throw new HttpError(409, 'That version already exists');
    const source = body.cloneFrom ? questionnaireRow(db, body.cloneFrom) : null;
    const id = tx(db, () => {
      const { id: newId } = run(
        db,
        "INSERT INTO questionnaires (version, title, status, notes, created_at) VALUES (?, ?, 'draft', ?, ?)",
        version,
        title,
        body.notes ? text(body.notes, 'Notes', { max: 4000 }) : source?.notes ?? '',
        now()
      );
      if (source) {
        const questions = all(db, 'SELECT * FROM questions WHERE questionnaire_id = ? ORDER BY order_index', source.id);
        for (const q of questions) {
          const { id: qid } = run(
            db,
            `INSERT INTO questions (questionnaire_id, code, section, dimension, prompt, helper, kind, max_choices, weight, enabled, order_index, validation_status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            newId,
            q.code,
            q.section,
            q.dimension,
            q.prompt,
            q.helper,
            q.kind,
            q.max_choices,
            q.weight,
            q.enabled,
            q.order_index,
            'draft'
          );
          const options = all(db, 'SELECT * FROM question_options WHERE question_id = ? ORDER BY order_index', q.id);
          for (const o of options) {
            run(
              db,
              'INSERT INTO question_options (question_id, code, label, hint, scores, order_index) VALUES (?, ?, ?, ?, ?, ?)',
              qid,
              o.code,
              o.label,
              o.hint,
              o.scores,
              o.order_index
            );
          }
        }
      }
      return newId;
    });
    audit(db, user.id, 'questionnaire.create', `questionnaire:${id}`, { version, clonedFrom: source?.version ?? null });
    return { status: 201, body: { id, version, status: 'draft' } };
  }, ADMIN);

  router.post('/api/admin/questionnaires/:id/activate', async ({ params, user }) => {
    const q = questionnaireRow(db, params.id);
    if (q.status === 'active') throw new HttpError(409, 'This version is already active');
    const enabled = Number(get(db, 'SELECT COUNT(*) AS n FROM questions WHERE questionnaire_id = ? AND enabled = 1', q.id)?.n ?? 0);
    if (!enabled) throw new HttpError(409, 'Add at least one enabled question before activating this version');
    tx(db, () => {
      run(db, "UPDATE questionnaires SET status = 'archived' WHERE status = 'active'");
      run(db, "UPDATE questionnaires SET status = 'active', activated_at = ? WHERE id = ?", now(), q.id);
    });
    audit(db, user.id, 'questionnaire.activate', `questionnaire:${q.id}`, { version: q.version, enabled });
    return { body: { ok: true, version: q.version } };
  }, ADMIN);

  router.post('/api/admin/questionnaires/:id/questions', async ({ params, body, user }) => {
    const q = questionnaireRow(db, params.id);
    assertDraft(q);
    const code = text(body.code, 'Question code', { min: 1, max: 20 });
    if (get(db, 'SELECT id FROM questions WHERE questionnaire_id = ? AND code = ?', q.id, code)) {
      throw new HttpError(409, 'A question with that code already exists in this version');
    }
    const kind = body.kind;
    if (!['single', 'multi', 'scale'].includes(kind)) throw new HttpError(400, 'Kind must be single, multi or scale');
    const options = validateOptions(body.options);
    const maxChoices = kind === 'multi' ? (body.maxChoices ? Number(body.maxChoices) : null) : null;
    if (maxChoices && (maxChoices < 1 || maxChoices > options.length)) throw new HttpError(400, 'Max choices is out of range');
    const order = Number(get(db, 'SELECT COALESCE(MAX(order_index),0) AS n FROM questions WHERE questionnaire_id = ?', q.id)?.n ?? 0) + 1;
    const dimension = body.dimension ? text(body.dimension, 'Dimension', { max: 40 }) : null;
    if (dimension && !CATEGORY_KEYS.includes(dimension)) {
      // dimension labels the item's content; it does not have to be a scored category
      if (dimension.length < 2) throw new HttpError(400, 'Invalid dimension');
    }
    const id = tx(db, () => {
      const { id: qid } = run(
        db,
        `INSERT INTO questions (questionnaire_id, code, section, dimension, prompt, helper, kind, max_choices, weight, enabled, order_index, validation_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, 'draft')`,
        q.id,
        code,
        text(body.section, 'Section', { min: 2, max: 60 }),
        dimension,
        text(body.prompt, 'Prompt', { min: 5, max: 400 }),
        body.helper ? text(body.helper, 'Helper', { max: 400 }) : '',
        kind,
        maxChoices,
        Number(body.weight ?? 1),
        order
      );
      for (const option of options) {
        run(
          db,
          'INSERT INTO question_options (question_id, code, label, hint, scores, order_index) VALUES (?, ?, ?, ?, ?, ?)',
          qid,
          option.code,
          option.label,
          option.hint,
          JSON.stringify(option.scores),
          option.orderIndex
        );
      }
      return qid;
    });
    audit(db, user.id, 'question.create', `question:${id}`, { version: q.version, code });
    return { status: 201, body: { id, code } };
  }, ADMIN);

  router.patch('/api/admin/questions/:id', async ({ params, body, user }) => {
    const question = get(db, 'SELECT * FROM questions WHERE id = ?', Number(params.id));
    if (!question) throw new HttpError(404, 'Question not found');
    const q = questionnaireRow(db, question.questionnaire_id);
    assertDraft(q);
    const fields = [];
    const values = [];
    if (body.prompt !== undefined) {
      fields.push('prompt = ?');
      values.push(text(body.prompt, 'Prompt', { min: 5, max: 400 }));
    }
    if (body.helper !== undefined) {
      fields.push('helper = ?');
      values.push(text(body.helper ?? '', 'Helper', { max: 400 }));
    }
    if (body.section !== undefined) {
      fields.push('section = ?');
      values.push(text(body.section, 'Section', { min: 2, max: 60 }));
    }
    if (body.enabled !== undefined) {
      fields.push('enabled = ?');
      values.push(body.enabled ? 1 : 0);
    }
    if (body.options !== undefined) {
      const options = validateOptions(body.options);
      tx(db, () => {
        run(db, 'DELETE FROM question_options WHERE question_id = ?', question.id);
        for (const option of options) {
          run(
            db,
            'INSERT INTO question_options (question_id, code, label, hint, scores, order_index) VALUES (?, ?, ?, ?, ?, ?)',
            question.id,
            option.code,
            option.label,
            option.hint,
            JSON.stringify(option.scores),
            option.orderIndex
          );
        }
      });
    }
    if (!fields.length && body.options === undefined) throw new HttpError(400, 'Nothing to update');
    if (fields.length) {
      values.push(question.id);
      run(db, `UPDATE questions SET ${fields.join(', ')} WHERE id = ?`, ...values);
    }
    audit(db, user.id, 'question.update', `question:${question.id}`, { version: q.version, fields: Object.keys(body) });
    return { body: { ok: true } };
  }, ADMIN);

  router.delete('/api/admin/questions/:id', async ({ params, user }) => {
    const question = get(db, 'SELECT * FROM questions WHERE id = ?', Number(params.id));
    if (!question) throw new HttpError(404, 'Question not found');
    const q = questionnaireRow(db, question.questionnaire_id);
    assertDraft(q);
    if (Number(get(db, 'SELECT COUNT(*) AS n FROM questions WHERE questionnaire_id = ?', q.id)?.n ?? 0) <= 1) {
      throw new HttpError(409, 'A questionnaire version must keep at least one question');
    }
    run(db, 'DELETE FROM questions WHERE id = ?', question.id);
    audit(db, user.id, 'question.delete', `question:${question.id}`, { version: q.version });
    return { body: { ok: true } };
  }, ADMIN);

  /* --------------------------------------------------------------- strands */

  router.get('/api/admin/strands', async () => ({
    body: {
      strands: all(db, 'SELECT * FROM strands ORDER BY code').map((row) => ({
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
      })),
      categories: CATEGORY_KEYS.map((key) => ({ key, label: CATEGORIES[key].label }))
    }
  }), ADMIN);

  router.patch('/api/admin/strands/:slug', async ({ params, body, user }) => {
    const strand = get(db, 'SELECT * FROM strands WHERE slug = ?', params.slug);
    if (!strand) throw new HttpError(404, 'Strand not found');
    const fields = [];
    const values = [];
    const setText = (column, value, options) => {
      fields.push(`${column} = ?`);
      values.push(text(value, column, options));
    };
    const setJson = (column, value) => {
      if (!Array.isArray(value)) throw new HttpError(400, `${column} must be a list`);
      fields.push(`${column} = ?`);
      values.push(JSON.stringify(value.map((item) => text(String(item), column, { max: 400 }))));
    };
    if (body.code !== undefined) setText('code', body.code, { min: 1, max: 12 });
    if (body.name !== undefined) setText('name', body.name, { min: 3, max: 120 });
    if (body.track !== undefined) setText('track', body.track, { min: 1, max: 40 });
    if (body.tagline !== undefined) setText('tagline', body.tagline, { max: 300 });
    if (body.summary !== undefined) setText('summary', body.summary, { min: 10, max: 2000 });
    if (body.interests !== undefined) setJson('interests', body.interests);
    if (body.skills !== undefined) setJson('skills', body.skills);
    if (body.learn !== undefined) setJson('learn', body.learn);
    if (body.suitedFor !== undefined) setJson('suited', body.suitedFor);
    if (body.collegeFields !== undefined) setJson('college', body.collegeFields);
    if (body.careerAreas !== undefined) setJson('careers', body.careerAreas);
    if (body.considerations !== undefined) setJson('considerations', body.considerations);
    if (body.weights !== undefined) {
      if (typeof body.weights !== 'object' || Array.isArray(body.weights)) throw new HttpError(400, 'Weights must be an object');
      const entries = Object.entries(body.weights).filter(([, v]) => Number(v) > 0);
      for (const [key, value] of entries) {
        if (!CATEGORY_KEYS.includes(key)) throw new HttpError(400, `Unknown dimension "${key}"`);
        if (typeof value !== 'number' || value < 0 || value > 1) throw new HttpError(400, 'Each weight must be between 0 and 1');
      }
      const sum = entries.reduce((s, [, v]) => s + v, 0);
      if (Math.abs(sum - 1) > 0.02) throw new HttpError(400, `Strand weights must add up to 1.0 (currently ${sum.toFixed(2)})`);
      fields.push('weights = ?');
      values.push(JSON.stringify(Object.fromEntries(entries)));
    }
    if (body.active !== undefined) {
      fields.push('active = ?');
      values.push(body.active ? 1 : 0);
    }
    if (!fields.length) throw new HttpError(400, 'Nothing to update');
    fields.push('updated_at = ?');
    values.push(now(), strand.slug);
    run(db, `UPDATE strands SET ${fields.join(', ')} WHERE slug = ?`, ...values);
    audit(db, user.id, 'strand.update', `strand:${strand.slug}`, { fields: Object.keys(body) });
    return { body: { ok: true } };
  }, ADMIN);

  /* ------------------------------------------------------------ activities */

  function activityPayload(row) {
    return {
      id: Number(row.id),
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
      active: Boolean(row.active),
      attached: Number(row.attached ?? 0)
    };
  }

  router.get('/api/admin/activities', async () => ({
    body: {
      activities: all(
        db,
        `SELECT a.*, (SELECT COUNT(*) FROM program_activities pa WHERE pa.activity_id = a.id) AS attached
         FROM activities a ORDER BY a.target_category, a.difficulty, a.id`
      ).map(activityPayload),
      categories: CATEGORY_KEYS.map((key) => ({ key, label: CATEGORIES[key].label }))
    }
  }), ADMIN);

  router.post('/api/admin/activities', async ({ body, user }) => {
    const title = text(body.title, 'Title', { min: 4, max: 160 });
    const targetCategory = body.targetCategory;
    if (!CATEGORY_KEYS.includes(targetCategory)) throw new HttpError(400, 'Choose a valid target dimension');
    const tier = ['foundation', 'core', 'stretch'].includes(body.tier) ? body.tier : 'core';
    const slug = body.slug ? slugify(body.slug) : slugify(title);
    if (!slug) throw new HttpError(400, 'Could not derive a slug from the title');
    if (get(db, 'SELECT id FROM activities WHERE slug = ?', slug)) throw new HttpError(409, 'An activity with that slug exists');
    const check = Array.isArray(body.check) && body.check.length ? body.check : null;
    if (check) validateCheck(check);
    const { id } = run(
      db,
      `INSERT INTO activities (slug, title, type, target_category, tier, difficulty, minutes, objectives, instructions, completion_criteria, check_questions, active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      slug,
      title,
      text(body.type ?? 'practice', 'Type', { min: 2, max: 40 }),
      targetCategory,
      tier,
      Math.min(3, Math.max(1, Number(body.difficulty ?? 1))),
      Math.min(240, Math.max(5, Number(body.minutes ?? 20))),
      JSON.stringify(Array.isArray(body.objectives) ? body.objectives.map((o) => text(o, 'Objective', { max: 200 })) : []),
      text(body.instructions, 'Instructions', { min: 20, max: 6000 }),
      text(body.completionCriteria, 'Completion criteria', { min: 5, max: 500 }),
      check ? JSON.stringify(check) : null,
      now(),
      now()
    );
    audit(db, user.id, 'activity.create', `activity:${id}`, { slug, targetCategory });
    return { status: 201, body: { id, slug } };
  }, ADMIN);

  function validateCheck(check) {
    if (!Array.isArray(check) || check.length > 8) throw new HttpError(400, 'Knowledge check must be a list of up to 8 questions');
    for (const item of check) {
      if (!Array.isArray(item.options) || item.options.length < 2 || item.options.length > 5) {
        throw new HttpError(400, 'Each check question needs 2–5 options');
      }
      if (!Number.isInteger(item.answer) || item.answer < 0 || item.answer >= item.options.length) {
        throw new HttpError(400, 'Each check question needs a valid answer index');
      }
      text(item.prompt, 'Check prompt', { min: 5, max: 400 });
      item.options.forEach((option) => text(option, 'Check option', { min: 1, max: 200 }));
    }
  }

  router.patch('/api/admin/activities/:id', async ({ params, body, user }) => {
    const activity = get(db, 'SELECT * FROM activities WHERE id = ?', Number(params.id));
    if (!activity) throw new HttpError(404, 'Activity not found');
    const fields = [];
    const values = [];
    if (body.title !== undefined) {
      fields.push('title = ?');
      values.push(text(body.title, 'Title', { min: 4, max: 160 }));
    }
    if (body.type !== undefined) {
      fields.push('type = ?');
      values.push(text(body.type, 'Type', { min: 2, max: 40 }));
    }
    if (body.targetCategory !== undefined) {
      if (!CATEGORY_KEYS.includes(body.targetCategory)) throw new HttpError(400, 'Invalid target dimension');
      fields.push('target_category = ?');
      values.push(body.targetCategory);
    }
    if (body.tier !== undefined) {
      if (!['foundation', 'core', 'stretch'].includes(body.tier)) throw new HttpError(400, 'Invalid tier');
      fields.push('tier = ?');
      values.push(body.tier);
    }
    if (body.difficulty !== undefined) {
      fields.push('difficulty = ?');
      values.push(Math.min(3, Math.max(1, Number(body.difficulty))));
    }
    if (body.minutes !== undefined) {
      fields.push('minutes = ?');
      values.push(Math.min(240, Math.max(5, Number(body.minutes))));
    }
    if (body.objectives !== undefined) {
      fields.push('objectives = ?');
      values.push(JSON.stringify(Array.isArray(body.objectives) ? body.objectives.map((o) => text(o, 'Objective', { max: 200 })) : []));
    }
    if (body.instructions !== undefined) {
      fields.push('instructions = ?');
      values.push(text(body.instructions, 'Instructions', { min: 20, max: 6000 }));
    }
    if (body.completionCriteria !== undefined) {
      fields.push('completion_criteria = ?');
      values.push(text(body.completionCriteria, 'Completion criteria', { min: 5, max: 500 }));
    }
    if (body.check !== undefined) {
      if (body.check) validateCheck(body.check);
      fields.push('check_questions = ?');
      values.push(body.check ? JSON.stringify(body.check) : null);
    }
    if (body.active !== undefined) {
      fields.push('active = ?');
      values.push(body.active ? 1 : 0);
    }
    if (!fields.length) throw new HttpError(400, 'Nothing to update');
    fields.push('updated_at = ?');
    values.push(now(), activity.id);
    run(db, `UPDATE activities SET ${fields.join(', ')} WHERE id = ?`, ...values);
    audit(db, user.id, 'activity.update', `activity:${activity.id}`, { fields: Object.keys(body) });
    return { body: { ok: true } };
  }, ADMIN);

  /* --------------------------------------------------------------- tickets */

  router.get('/api/admin/tickets', async ({ query }) => {
    const status = query.get('status') ?? '';
    const rows = all(
      db,
      `SELECT t.*, u.name AS student_name, u.email AS student_email,
              (SELECT COUNT(*) FROM support_messages m WHERE m.ticket_id = t.id) AS message_count
       FROM support_tickets t JOIN users u ON u.id = t.user_id
       ${status ? 'WHERE t.status = ?' : ''}
       ORDER BY CASE t.priority WHEN 'high' THEN 0 WHEN 'normal' THEN 1 ELSE 2 END, t.updated_at DESC`,
      ...(status ? [status] : [])
    );
    return {
      body: {
        tickets: rows.map((t) => ({
          id: Number(t.id),
          subject: t.subject,
          category: t.category,
          status: t.status,
          priority: t.priority,
          studentName: t.student_name,
          studentEmail: t.student_email,
          messageCount: Number(t.message_count),
          createdAt: t.created_at,
          updatedAt: t.updated_at
        }))
      }
    };
  }, STAFF);

  router.get('/api/admin/tickets/:id', async ({ params, user }) => {
    const ticket = get(db, 'SELECT * FROM support_tickets WHERE id = ?', Number(params.id));
    if (!ticket) throw new HttpError(404, 'Ticket not found');
    const student = get(db, 'SELECT id, name, email FROM users WHERE id = ?', ticket.user_id);
    audit(db, user.id, 'ticket.view', `ticket:${ticket.id}`);
    return { body: { ticket: { ...supportTicketPayload(db, ticket), student } } };
  }, STAFF);

  router.patch('/api/admin/tickets/:id', async ({ params, body, user }) => {
    const ticket = get(db, 'SELECT * FROM support_tickets WHERE id = ?', Number(params.id));
    if (!ticket) throw new HttpError(404, 'Ticket not found');
    const fields = ['updated_at = ?'];
    const values = [now()];
    if (body.status !== undefined) {
      if (!['open', 'in_review', 'resolved', 'closed'].includes(body.status)) throw new HttpError(400, 'Invalid status');
      fields.push('status = ?');
      values.push(body.status);
    }
    if (body.priority !== undefined) {
      if (!['low', 'normal', 'high'].includes(body.priority)) throw new HttpError(400, 'Invalid priority');
      fields.push('priority = ?');
      values.push(body.priority);
    }
    if (body.assignedTo !== undefined) {
      const staff = get(db, "SELECT id FROM users WHERE id = ? AND role IN ('admin','guidance')", Number(body.assignedTo));
      if (!staff) throw new HttpError(400, 'Assignee must be an administrator or guidance user');
      fields.push('assigned_to = ?');
      values.push(staff.id);
    }
    values.push(ticket.id);
    run(db, `UPDATE support_tickets SET ${fields.join(', ')} WHERE id = ?`, ...values);
    audit(db, user.id, 'ticket.update', `ticket:${ticket.id}`, { fields: Object.keys(body) });
    return { body: { ticket: supportTicketPayload(db, get(db, 'SELECT * FROM support_tickets WHERE id = ?', ticket.id)) } };
  }, STAFF);

  router.post('/api/admin/tickets/:id/messages', async ({ params, body, user }) => {
    const ticket = get(db, 'SELECT * FROM support_tickets WHERE id = ?', Number(params.id));
    if (!ticket) throw new HttpError(404, 'Ticket not found');
    const message = text(body.body, 'Message', { min: 2, max: 4000 });
    run(
      db,
      'INSERT INTO support_messages (ticket_id, author_id, author_role, body, created_at) VALUES (?, ?, ?, ?, ?)',
      ticket.id,
      user.id,
      user.role,
      message,
      now()
    );
    run(db, "UPDATE support_tickets SET status = CASE WHEN status = 'open' THEN 'in_review' ELSE status END, updated_at = ? WHERE id = ?", now(), ticket.id);
    audit(db, user.id, 'ticket.reply', `ticket:${ticket.id}`);
    return { body: { ticket: supportTicketPayload(db, get(db, 'SELECT * FROM support_tickets WHERE id = ?', ticket.id)) } };
  }, STAFF);

  /* --------------------------------------------------------------- settings */

  router.get('/api/admin/settings', async () => ({
    body: {
      settings: {
        aiEnabled: Boolean(getSetting(db, 'ai.enabled', true)),
        aiGrounding: getSetting(db, 'ai.grounding', {}),
        retentionMonths: Number(getSetting(db, 'privacy.retentionMonths', 24)),
        supportEmail: getSetting(db, 'support.email', ''),
        notice: getSetting(db, 'system.notice', '')
      },
      ai: aiStatus(),
      questionnaire: get(db, "SELECT version, status, activated_at FROM questionnaires WHERE status='active'"),
      staff: all(db, "SELECT id, name, email, role FROM users WHERE role IN ('admin','guidance') ORDER BY role")
    }
  }), ADMIN);

  router.put('/api/admin/settings', async ({ body, user }) => {
    const changes = [];
    if (body.aiEnabled !== undefined) {
      setSetting(db, 'ai.enabled', Boolean(body.aiEnabled));
      changes.push('ai.enabled');
    }
    if (body.aiGrounding !== undefined) {
      if (typeof body.aiGrounding !== 'object' || Array.isArray(body.aiGrounding)) throw new HttpError(400, 'Grounding must be an object');
      const grounding = {
        strands: Boolean(body.aiGrounding.strands),
        activities: Boolean(body.aiGrounding.activities),
        assessment: Boolean(body.aiGrounding.assessment),
        careers: Boolean(body.aiGrounding.careers)
      };
      setSetting(db, 'ai.grounding', grounding);
      changes.push('ai.grounding');
    }
    if (body.retentionMonths !== undefined) {
      const months = Number(body.retentionMonths);
      if (!Number.isFinite(months) || months < 1 || months > 120) throw new HttpError(400, 'Retention must be between 1 and 120 months');
      setSetting(db, 'privacy.retentionMonths', Math.round(months));
      changes.push('privacy.retentionMonths');
    }
    if (body.supportEmail !== undefined) {
      setSetting(db, 'support.email', text(body.supportEmail, 'Support email', { max: 160 }));
      changes.push('support.email');
    }
    if (body.notice !== undefined) {
      setSetting(db, 'system.notice', text(body.notice ?? '', 'Notice', { max: 500 }));
      changes.push('system.notice');
    }
    if (!changes.length) throw new HttpError(400, 'Nothing to update');
    audit(db, user.id, 'settings.update', 'settings', { changes });
    return { body: { ok: true, changes } };
  }, ADMIN);

  router.get('/api/admin/logs', async ({ query }) => {
    const limit = Math.min(200, Math.max(1, Number(query.get('limit') ?? 100)));
    return {
      body: {
        logs: all(
          db,
          `SELECT l.id, l.action, l.target, l.details, l.created_at, u.name AS actor, u.role AS actor_role
           FROM admin_logs l LEFT JOIN users u ON u.id = l.actor_id ORDER BY l.id DESC LIMIT ?`,
          limit
        ).map((row) => ({
          id: Number(row.id),
          action: row.action,
          target: row.target,
          details: parseJson(row.details, null),
          createdAt: row.created_at,
          actor: row.actor ?? 'system',
          actorRole: row.actor_role ?? null
        }))
      }
    };
  }, ADMIN);

  /* -------------------------------------------------------------- guidance */

  router.get('/api/admin/guidance/queue', async () => {
    const rows = all(
      db,
      `SELECT a.id, a.user_id, a.type, a.submitted_at, a.selected_strand, u.name AS student_name
       FROM assessments a JOIN users u ON u.id = a.user_id
       WHERE a.status = 'submitted' ORDER BY a.submitted_at DESC LIMIT 50`
    );
    return {
      body: {
        recent: rows.map((r) => ({
          assessmentId: Number(r.id),
          studentId: Number(r.user_id),
          studentName: r.student_name,
          type: r.type,
          submittedAt: r.submitted_at,
          selectedStrand: r.selected_strand
        }))
      }
    };
  }, STAFF);
}
