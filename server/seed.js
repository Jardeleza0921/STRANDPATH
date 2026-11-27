import { QUESTIONNAIRE_V1, STRANDS, ACTIVITIES } from '../shared/content.js';
import { openDb, now, get, run, tx } from './db.js';
import { hashPassword, passwordProblems } from './auth.js';

/** Accounts requested for first secure initialization. */
const INITIAL_ADMIN_EMAIL = 'jjardeleza@paterostechnologicalcollege.edu.ph';
const INITIAL_ADMIN_NAME = 'J. Jardeleza';
const INITIAL_STUDENT_NAME = 'Klight';
const INITIAL_STUDENT_EMAIL = 'jaruiorijardeleza@gmail.com';

function seedQuestionnaire(db) {
  if (get(db, 'SELECT id FROM questionnaires WHERE version = ?', QUESTIONNAIRE_V1.version)) return;
  tx(db, () => {
    const { id } = run(
      db,
      'INSERT INTO questionnaires (version, title, status, notes, created_at, activated_at) VALUES (?, ?, ?, ?, ?, ?)',
      QUESTIONNAIRE_V1.version,
      QUESTIONNAIRE_V1.title,
      'active',
      QUESTIONNAIRE_V1.notes,
      now(),
      now()
    );
    QUESTIONNAIRE_V1.questions.forEach((q, index) => {
      const question = run(
        db,
        `INSERT INTO questions (questionnaire_id, code, section, dimension, prompt, helper, kind, max_choices, weight, enabled, order_index, validation_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
        id,
        q.code,
        q.section,
        q.dimension ?? null,
        q.prompt,
        q.helper ?? '',
        q.kind,
        q.maxChoices ?? null,
        q.weight ?? 1,
        index + 1,
        q.validationStatus ?? 'technical-draft'
      );
      q.options.forEach((option, optionIndex) => {
        run(
          db,
          'INSERT INTO question_options (question_id, code, label, hint, scores, order_index) VALUES (?, ?, ?, ?, ?, ?)',
          question.id,
          option.code,
          option.label,
          option.hint ?? null,
          JSON.stringify(option.scores ?? {}),
          optionIndex + 1
        );
      });
    });
  });
}

function seedStrands(db) {
  for (const strand of STRANDS) {
    if (get(db, 'SELECT slug FROM strands WHERE slug = ?', strand.slug)) continue;
    run(
      db,
      `INSERT INTO strands (slug, code, name, track, tagline, summary, interests, skills, learn, suited, college, careers, considerations, weights, active, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
      strand.slug,
      strand.code,
      strand.name,
      strand.track,
      strand.tagline,
      strand.summary,
      JSON.stringify(strand.interests),
      JSON.stringify(strand.skills),
      JSON.stringify(strand.learn),
      JSON.stringify(strand.suited),
      JSON.stringify(strand.college),
      JSON.stringify(strand.careers),
      JSON.stringify(strand.considerations),
      JSON.stringify(strand.weights),
      now()
    );
  }
}

function seedActivities(db) {
  for (const activity of ACTIVITIES) {
    if (get(db, 'SELECT id FROM activities WHERE slug = ?', activity.slug)) continue;
    run(
      db,
      `INSERT INTO activities (slug, title, type, target_category, tier, difficulty, minutes, objectives, instructions, completion_criteria, check_questions, active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      activity.slug,
      activity.title,
      activity.type,
      activity.targetCategory,
      activity.tier,
      activity.difficulty,
      activity.minutes,
      JSON.stringify(activity.objectives),
      activity.instructions,
      activity.completionCriteria,
      activity.check ? JSON.stringify(activity.check) : null,
      now(),
      now()
    );
  }
}

function seedSettings(db) {
  const defaults = {
    'privacy.retentionMonths': 24,
    'support.email': 'guidance@strandpath.local',
    'system.notice': ''
  };
  for (const [key, value] of Object.entries(defaults)) {
    if (!get(db, 'SELECT key FROM settings WHERE key = ?', key)) {
      run(db, 'INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)', key, JSON.stringify(value), now());
    }
  }
}

function provisionAccount(db, { name, email, password, role }) {
  const existing = get(db, 'SELECT * FROM users WHERE email = ?', email);
  if (existing) {
    // Never reset an existing password or duplicate the account.
    return { email, role, created: false, id: Number(existing.id), mustChangePassword: Boolean(existing.must_change_password) };
  }
  const id = tx(db, () => {
    const { id: userId } = run(
      db,
      `INSERT INTO users (name, email, password_hash, role, status, email_verified_at, must_change_password, created_at)
       VALUES (?, ?, ?, ?, 'active', ?, 1, ?)`,
      name,
      email,
      hashPassword(password),
      role,
      now(),
      now()
    );
    run(
      db,
      "INSERT INTO profiles (user_id, consent_at, theme, updated_at) VALUES (?, ?, 'green', ?)",
      userId,
      now(),
      now()
    );
    return userId;
  });
  return { email, role, created: true, id, mustChangePassword: true };
}

/**
 * Idempotent content and account provisioning.
 * Passwords must be supplied through environment/options; none are stored in source.
 */
export function seed(db, options = {}) {
  seedQuestionnaire(db);
  seedStrands(db);
  seedActivities(db);
  seedSettings(db);

  const adminEmail = (
    options.adminEmail ||
    process.env.INITIAL_ADMIN_EMAIL ||
    process.env.ADMIN_EMAIL ||
    INITIAL_ADMIN_EMAIL
  ).toLowerCase();
  const adminPassword =
    options.adminPassword || process.env.INITIAL_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || '';
  const adminName = options.adminName || process.env.INITIAL_ADMIN_NAME || INITIAL_ADMIN_NAME;

  const studentEmail = (
    options.studentEmail ||
    process.env.INITIAL_STUDENT_EMAIL ||
    process.env.STUDENT_EMAIL ||
    INITIAL_STUDENT_EMAIL
  ).toLowerCase();
  const studentPassword =
    options.studentPassword || process.env.INITIAL_STUDENT_PASSWORD || process.env.STUDENT_PASSWORD || '';
  const studentName = options.studentName || process.env.INITIAL_STUDENT_NAME || INITIAL_STUDENT_NAME;

  const accounts = [];
  const warnings = [];

  if (adminPassword) {
    const problems = passwordProblems(adminPassword);
    if (problems.length) throw new Error(`Administrator password needs ${problems.join(', ')}.`);
    accounts.push(provisionAccount(db, { name: adminName, email: adminEmail, password: adminPassword, role: 'admin' }));
  } else if (!get(db, 'SELECT id FROM users WHERE email = ?', adminEmail)) {
    warnings.push(
      `Administrator account not provisioned. Set INITIAL_ADMIN_PASSWORD (or ADMIN_PASSWORD) and run "npm run seed" again.`
    );
  }

  if (studentPassword) {
    const problems = passwordProblems(studentPassword);
    if (problems.length) throw new Error(`Student password needs ${problems.join(', ')}.`);
    accounts.push(
      provisionAccount(db, {
        name: studentName,
        email: studentEmail,
        password: studentPassword,
        role: 'student'
      })
    );
  } else if (!get(db, 'SELECT id FROM users WHERE email = ?', studentEmail)) {
    warnings.push(
      `Initial student account not provisioned. Set INITIAL_STUDENT_PASSWORD (or STUDENT_PASSWORD) and run "npm run seed" again.`
    );
  }

  return { accounts, warnings };
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const db = openDb();
  const result = seed(db);
  console.log('Database seeded at', process.env.DB_PATH || 'server/data/strandpath.db');
  for (const account of result.accounts) {
    console.log(`  ${account.created ? 'Created' : 'Already exists'}: ${account.role} <${account.email}>`);
  }
  for (const warning of result.warnings) console.log(`\nNOTE: ${warning}`);
  if (result.accounts.some((a) => a.created)) {
    console.log('\nBoth provisioned accounts must change their initial password at first sign-in.');
    console.log('Passwords are read from environment variables and are never printed or stored in plain text.');
  }
  db.close();
}
