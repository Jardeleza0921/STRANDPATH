import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const SCHEMA_VERSION = 2;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student' CHECK(role IN ('student','guidance','admin')),
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','suspended')),
  email_verified_at TEXT,
  must_change_password INTEGER NOT NULL DEFAULT 0,
  google_sub TEXT,
  created_at TEXT NOT NULL,
  last_login_at TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google ON users(google_sub) WHERE google_sub IS NOT NULL;

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS profiles (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  grade_level TEXT,
  school TEXT,
  city TEXT,
  interests TEXT,
  strengths TEXT,
  goals TEXT,
  learning_preference TEXT,
  career_interest TEXT,
  selected_strand TEXT,
  theme TEXT NOT NULL DEFAULT 'green',
  consent_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS questionnaires (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  version TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('draft','active','archived')),
  notes TEXT,
  created_at TEXT NOT NULL,
  activated_at TEXT
);

CREATE TABLE IF NOT EXISTS questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  questionnaire_id INTEGER NOT NULL REFERENCES questionnaires(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  section TEXT NOT NULL,
  dimension TEXT,
  prompt TEXT NOT NULL,
  helper TEXT,
  kind TEXT NOT NULL CHECK(kind IN ('single','multi','scale')),
  max_choices INTEGER,
  weight REAL NOT NULL DEFAULT 1,
  enabled INTEGER NOT NULL DEFAULT 1,
  order_index INTEGER NOT NULL,
  validation_status TEXT NOT NULL DEFAULT 'technical-draft',
  UNIQUE(questionnaire_id, code)
);

CREATE TABLE IF NOT EXISTS question_options (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  label TEXT NOT NULL,
  hint TEXT,
  scores TEXT NOT NULL DEFAULT '{}',
  order_index INTEGER NOT NULL,
  UNIQUE(question_id, code)
);

CREATE TABLE IF NOT EXISTS strands (
  slug TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  track TEXT NOT NULL,
  tagline TEXT,
  summary TEXT,
  interests TEXT,
  skills TEXT,
  learn TEXT,
  suited TEXT,
  college TEXT,
  careers TEXT,
  considerations TEXT,
  weights TEXT NOT NULL DEFAULT '{}',
  active INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS assessments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK(type IN ('pre','post')),
  questionnaire_id INTEGER NOT NULL REFERENCES questionnaires(id),
  algorithm_version TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('in_progress','submitted')),
  answers TEXT NOT NULL DEFAULT '{}',
  result TEXT,
  started_at TEXT NOT NULL,
  submitted_at TEXT,
  selected_strand TEXT,
  selected_at TEXT,
  baseline_assessment_id INTEGER REFERENCES assessments(id)
);
CREATE INDEX IF NOT EXISTS idx_assessments_user ON assessments(user_id, started_at DESC);

CREATE TABLE IF NOT EXISTS assessment_scores (
  assessment_id INTEGER NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  raw REAL NOT NULL,
  maximum REAL NOT NULL,
  normalized REAL NOT NULL,
  PRIMARY KEY(assessment_id, category)
);

CREATE TABLE IF NOT EXISTS recommendations (
  assessment_id INTEGER NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  strand_slug TEXT NOT NULL,
  rank INTEGER NOT NULL,
  score REAL NOT NULL,
  match_level TEXT NOT NULL,
  explanation TEXT NOT NULL,
  evidence TEXT NOT NULL,
  PRIMARY KEY(assessment_id, strand_slug)
);

CREATE TABLE IF NOT EXISTS activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  target_category TEXT NOT NULL,
  tier TEXT NOT NULL CHECK(tier IN ('foundation','core','stretch')),
  difficulty INTEGER NOT NULL,
  minutes INTEGER NOT NULL,
  objectives TEXT NOT NULL,
  instructions TEXT NOT NULL,
  completion_criteria TEXT NOT NULL,
  check_questions TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS programs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assessment_id INTEGER NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  goal TEXT NOT NULL,
  strand_slug TEXT NOT NULL,
  target_categories TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','completed','archived')),
  reassessment_after_days INTEGER NOT NULL DEFAULT 28,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS program_activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  program_id INTEGER NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  activity_id INTEGER NOT NULL REFERENCES activities(id),
  sequence INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK(status IN ('not_started','in_progress','completed')),
  started_at TEXT,
  completed_at TEXT,
  check_score REAL,
  reflection TEXT,
  response TEXT,
  UNIQUE(program_id, activity_id)
);

CREATE TABLE IF NOT EXISTS ai_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent TEXT NOT NULL CHECK(agent IN ('coach','support')),
  role TEXT NOT NULL CHECK(role IN ('user','assistant','system')),
  content TEXT NOT NULL,
  meta TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ai_user ON ai_messages(user_id, agent, created_at);

CREATE TABLE IF NOT EXISTS support_tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','in_review','resolved','closed')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK(priority IN ('low','normal','high')),
  assigned_to INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS support_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id INTEGER NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  author_id INTEGER REFERENCES users(id),
  author_role TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_id INTEGER REFERENCES users(id),
  action TEXT NOT NULL,
  target TEXT,
  details TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS email_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL CHECK(purpose IN ('verify','reset')),
  token_hash TEXT NOT NULL UNIQUE,
  otp_hash TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_email_tokens_user ON email_tokens(user_id, purpose);

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  read_at TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);
`;

export function openDb(path = process.env.DB_PATH || 'server/data/strandpath.db') {
  if (path !== ':memory:') mkdirSync(dirname(resolve(path)), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('PRAGMA journal_mode = WAL');
  migrate(db);
  return db;
}

export function migrate(db) {
  db.exec(SCHEMA);
  // Additive migrations for databases created by earlier versions.
  const additions = [
    ['users', 'email_verified_at', 'TEXT'],
    ['users', 'must_change_password', 'INTEGER NOT NULL DEFAULT 0'],
    ['users', 'google_sub', 'TEXT'],
    ['profiles', 'theme', "TEXT NOT NULL DEFAULT 'green'"]
  ];
  for (const [table, column, definition] of additions) {
    const columns = db.prepare(`PRAGMA table_info(${table})`).all();
    if (!columns.some((c) => c.name === column)) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    }
  }
  db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google ON users(google_sub) WHERE google_sub IS NOT NULL');
  db.prepare(
    `INSERT INTO meta (key, value) VALUES ('schema_version', ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  ).run(String(SCHEMA_VERSION));
}

export const now = () => new Date().toISOString();

export function all(db, sql, ...params) {
  return db.prepare(sql).all(...params);
}

export function get(db, sql, ...params) {
  return db.prepare(sql).get(...params) ?? null;
}

export function run(db, sql, ...params) {
  const info = db.prepare(sql).run(...params);
  return { changes: Number(info.changes), id: Number(info.lastInsertRowid) };
}

export function tx(db, fn) {
  db.exec('BEGIN');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

export const parseJson = (value, fallback) => {
  if (value === null || value === undefined || value === '') return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

export function audit(db, actorId, action, target = null, details = null) {
  run(
    db,
    'INSERT INTO admin_logs (actor_id, action, target, details, created_at) VALUES (?, ?, ?, ?, ?)',
    actorId,
    action,
    target,
    details ? JSON.stringify(details) : null,
    now()
  );
}

export function getSetting(db, key, fallback = null) {
  const row = get(db, 'SELECT value FROM settings WHERE key = ?', key);
  return row ? parseJson(row.value, row.value) : fallback;
}

export function setSetting(db, key, value) {
  run(
    db,
    `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    key,
    JSON.stringify(value),
    now()
  );
}
