import { randomBytes, randomInt, scryptSync, timingSafeEqual, createHash } from 'node:crypto';

const KEYLEN = 64;
const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours
const SESSION_REMEMBER_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days
const OTP_TTL_MINUTES = Number(process.env.OTP_TTL_MINUTES || 10);

export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, KEYLEN).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password, stored) {
  try {
    const [scheme, salt, hash] = String(stored).split('$');
    if (scheme !== 'scrypt' || !salt || !hash) return false;
    const candidate = scryptSync(password, salt, KEYLEN);
    const expected = Buffer.from(hash, 'hex');
    if (candidate.length !== expected.length) return false;
    return timingSafeEqual(candidate, expected);
  } catch {
    return false;
  }
}

/** Password rules used by registration, reset and password change. */
export function passwordProblems(password) {
  const problems = [];
  if (typeof password !== 'string' || password.length < 8) problems.push('at least 8 characters');
  if (typeof password === 'string' && password.length > 200) problems.push('at most 200 characters');
  if (!/[A-Za-z]/.test(password ?? '')) problems.push('a letter');
  if (!/[0-9]/.test(password ?? '')) problems.push('a number');
  return problems;
}

export const hashToken = (token) => createHash('sha256').update(String(token)).digest('hex');

export function createSession(db, userId, { remember = false } = {}) {
  const token = randomBytes(32).toString('base64url');
  const createdAt = new Date();
  const ttl = remember ? SESSION_REMEMBER_TTL_MS : SESSION_TTL_MS;
  const expiresAt = new Date(createdAt.getTime() + ttl);
  db.prepare('INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)').run(
    hashToken(token),
    userId,
    createdAt.toISOString(),
    expiresAt.toISOString()
  );
  return { token, expiresAt, maxAge: Math.floor(ttl / 1000) };
}

export function destroySession(db, token) {
  if (!token) return;
  db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(hashToken(token));
}

export function destroyUserSessions(db, userId, exceptToken = null) {
  if (exceptToken) {
    db.prepare('DELETE FROM sessions WHERE user_id = ? AND token_hash != ?').run(userId, hashToken(exceptToken));
    return;
  }
  db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
}

export function sessionUser(db, token) {
  if (!token) return null;
  const row = db
    .prepare(
      `SELECT s.token_hash, s.expires_at, u.id, u.name, u.email, u.role, u.status,
              u.email_verified_at, u.must_change_password, p.theme
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       LEFT JOIN profiles p ON p.user_id = u.id
       WHERE s.token_hash = ?`
    )
    .get(hashToken(token));
  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(row.token_hash);
    return null;
  }
  if (row.status !== 'active') return null;
  return {
    id: Number(row.id),
    name: row.name,
    email: row.email,
    role: row.role,
    status: row.status,
    emailVerified: Boolean(row.email_verified_at),
    emailVerifiedAt: row.email_verified_at,
    mustChangePassword: Boolean(row.must_change_password),
    theme: row.theme || 'green'
  };
}

export function pruneSessions(db) {
  db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(new Date().toISOString());
}

export function sessionCookie(token, maxAgeSeconds) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `sp_session=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${maxAgeSeconds}${secure}`;
}

export function clearCookie() {
  return 'sp_session=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0';
}

export function readCookies(header = '') {
  const out = {};
  for (const part of String(header).split(';')) {
    const index = part.indexOf('=');
    if (index === -1) continue;
    out[part.slice(0, index).trim()] = decodeURIComponent(part.slice(index + 1).trim());
  }
  return out;
}

/* ------------------------------------------------------- email tokens / OTP */

/**
 * Issues a single-use link token and a six-digit OTP for one purpose.
 * Only hashes are stored: the token as SHA-256, the OTP through scrypt.
 * Any previous unused token for that purpose is invalidated.
 */
export function issueEmailToken(db, userId, purpose, { ttlMinutes = OTP_TTL_MINUTES } = {}) {
  const token = randomBytes(32).toString('base64url');
  const otp = String(randomInt(100000, 1000000));
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + ttlMinutes * 60 * 1000);
  db.prepare(
    "UPDATE email_tokens SET used_at = ? WHERE user_id = ? AND purpose = ? AND used_at IS NULL"
  ).run(createdAt.toISOString(), userId, purpose);
  db.prepare(
    `INSERT INTO email_tokens (user_id, purpose, token_hash, otp_hash, expires_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(userId, purpose, hashToken(token), hashPassword(otp), expiresAt.toISOString(), createdAt.toISOString());
  return { token, otp, expiresAt: expiresAt.toISOString(), ttlMinutes };
}

export function tokenRecord(db, token, purpose) {
  if (!token || typeof token !== 'string') return null;
  const row = db.prepare('SELECT * FROM email_tokens WHERE token_hash = ? AND purpose = ?').get(hashToken(token), purpose);
  if (!row) return null;
  if (row.used_at) return { ...row, invalid: 'used' };
  if (new Date(row.expires_at).getTime() < Date.now()) return { ...row, invalid: 'expired' };
  return row;
}

export function latestTokenRecord(db, userId, purpose) {
  const row = db
    .prepare('SELECT * FROM email_tokens WHERE user_id = ? AND purpose = ? ORDER BY id DESC LIMIT 1')
    .get(userId, purpose);
  if (!row) return null;
  if (row.used_at) return { ...row, invalid: 'used' };
  if (new Date(row.expires_at).getTime() < Date.now()) return { ...row, invalid: 'expired' };
  return row;
}

/** Verifies an OTP against the latest token, recording failed attempts. */
export function verifyOtp(db, userId, purpose, otp) {
  const row = latestTokenRecord(db, userId, purpose);
  if (!row) return null;
  if (row.invalid) return { invalid: row.invalid };
  if (Number(row.attempts) >= 5) return { invalid: 'attempts' };
  if (!verifyPassword(String(otp ?? ''), row.otp_hash)) {
    db.prepare('UPDATE email_tokens SET attempts = attempts + 1 WHERE id = ?').run(row.id);
    return { invalid: 'code' };
  }
  return row;
}

export function markTokenUsed(db, id) {
  db.prepare('UPDATE email_tokens SET used_at = ? WHERE id = ?').run(new Date().toISOString(), id);
}

/** Simple fixed-window limiter, per process. */
export function createRateLimiter() {
  const buckets = new Map();
  return function limit(key, max, windowMs) {
    const nowMs = Date.now();
    const bucket = buckets.get(key);
    if (!bucket || bucket.resetAt < nowMs) {
      buckets.set(key, { count: 1, resetAt: nowMs + windowMs });
      return true;
    }
    if (bucket.count >= max) return false;
    bucket.count += 1;
    return true;
  };
}
