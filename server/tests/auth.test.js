import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openDb, now } from '../db.js';
import { seed } from '../seed.js';
import { createApp } from '../app.js';

const dir = mkdtempSync(join(tmpdir(), 'strandpath-auth-'));
const db = openDb(join(dir, 'test.db'));
const ADMIN = { adminName: 'J. Jardeleza', adminEmail: 'jjardeleza@example.edu.ph', adminPassword: 'Admin#2026aa' };
const STUDENT = { studentName: 'Klight', studentEmail: 'klight@example.com', studentPassword: 'Klight#2026aa' };
seed(db, { ...ADMIN, ...STUDENT });

const outbox = [];
const mailer = {
  config: { configured: false, appBaseUrl: '' },
  async send(message) {
    outbox.push(message);
    return { delivered: true, delivery: 'test', messageId: `test:${outbox.length}` };
  }
};

const app = createApp({ db, serveClient: false, mailer });
const server = createServer(app);
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;

test.after(() => {
  server.close();
  db.close();
});

function client() {
  let cookie = '';
  let rawCookie = '';
  return {
    get cookie() {
      return cookie;
    },
    get rawCookie() {
      return rawCookie;
    },
    async request(method, path, body) {
      const response = await fetch(`${base}${path}`, {
        method,
        redirect: 'manual',
        headers: {
          'Content-Type': 'application/json',
          Origin: base,
          ...(cookie ? { Cookie: cookie } : {})
        },
        body: body === undefined ? undefined : JSON.stringify(body)
      });
      const setCookie = response.headers.get('set-cookie');
      if (setCookie) {
        rawCookie = setCookie;
        cookie = setCookie.split(';')[0];
      }
      let payload = null;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }
      return { status: response.status, body: payload, headers: response.headers };
    }
  };
}

const countUsers = (email) => Number(db.prepare('SELECT COUNT(*) AS n FROM users WHERE email = ?').get(email).n);
const latestMail = () => outbox[outbox.length - 1];
const tokenFrom = (mail, path) => mail.text.match(new RegExp(`${path}\\?token=([A-Za-z0-9_-]+)`))?.[1];
const codeFromVerify = (mail) => mail.text.match(/code in the app: (\d{6})/)?.[1];
const codeFromReset = (mail) => mail.text.match(/password: (\d{6})/)?.[1];

test('provisioning creates the requested accounts once and never stores plaintext passwords', () => {
  const admin = db.prepare('SELECT * FROM users WHERE email = ?').get(ADMIN.adminEmail);
  const student = db.prepare('SELECT * FROM users WHERE email = ?').get(STUDENT.studentEmail);
  assert.ok(admin, 'administrator exists');
  assert.ok(student, 'student exists');
  assert.equal(admin.role, 'admin');
  assert.equal(student.role, 'student');
  assert.equal(student.name, 'Klight');
  assert.match(admin.password_hash, /^scrypt\$/);
  assert.ok(!admin.password_hash.includes(ADMIN.adminPassword));
  assert.ok(admin.email_verified_at);
  assert.equal(admin.must_change_password, 1);
  assert.equal(student.must_change_password, 1);

  const again = seed(db, { ...ADMIN, ...STUDENT });
  assert.equal(again.accounts.every((a) => a.created === false), true);
  assert.equal(countUsers(ADMIN.adminEmail), 1);
  assert.equal(countUsers(STUDENT.studentEmail), 1);
});

test('provisioned accounts must replace their initial password and keep their role boundaries', async () => {
  const c = client();
  const login = await c.request('POST', '/api/auth/login', {
    email: STUDENT.studentEmail,
    password: STUDENT.studentPassword
  });
  assert.equal(login.status, 200);
  assert.equal(login.body.user.mustChangePassword, true);

  const blocked = await c.request('GET', '/api/dashboard');
  assert.equal(blocked.status, 403);
  assert.equal(blocked.body.error, 'PASSWORD_CHANGE_REQUIRED');

  const wrong = await c.request('POST', '/api/auth/password', {
    currentPassword: 'not-the-password',
    newPassword: 'Klight#2026bb'
  });
  assert.equal(wrong.status, 400);

  const changed = await c.request('POST', '/api/auth/password', {
    currentPassword: STUDENT.studentPassword,
    newPassword: 'Klight#2026bb'
  });
  assert.equal(changed.status, 200);
  assert.equal(changed.body.user.mustChangePassword, false);

  const dashboard = await c.request('GET', '/api/dashboard');
  assert.equal(dashboard.status, 200);

  const adminArea = await c.request('GET', '/api/admin/overview');
  assert.equal(adminArea.status, 403);
});

test('registration sends a real verification message and the token confirms the email once', async () => {
  const c = client();
  const before = outbox.length;
  const email = `verify-${Date.now()}@example.com`;
  const reg = await c.request('POST', '/api/auth/register', {
    name: 'Verification Student',
    email,
    password: 'Verify#2026',
    confirmPassword: 'Verify#2026',
    consent: true
  });
  assert.equal(reg.status, 201);
  assert.equal(reg.body.user.role, 'student');
  assert.equal(reg.body.user.emailVerified, false);
  assert.equal(reg.body.verification.emailSent, true);
  assert.equal(outbox.length, before + 1);
  const mail = latestMail();
  assert.match(mail.subject, /confirm/i);
  const token = tokenFrom(mail, '/verify-email');
  const code = codeFromVerify(mail);
  assert.ok(token);
  assert.match(code, /^\d{6}$/);

  const verified = await c.request('POST', '/api/auth/verify-email', { token });
  assert.equal(verified.status, 200);
  assert.equal(verified.body.user.emailVerified, true);

  const reused = await c.request('POST', '/api/auth/verify-email', { token });
  assert.equal(reused.status, 400);
});

test('remember me extends the session cookie and login reports verification state', async () => {
  const c = client();
  const login = await c.request('POST', '/api/auth/login', {
    email: STUDENT.studentEmail,
    password: 'Klight#2026bb',
    remember: true
  });
  assert.equal(login.status, 200);
  assert.match(c.rawCookie, /Max-Age=2592000/);

  const short = client();
  await short.request('POST', '/api/auth/login', {
    email: STUDENT.studentEmail,
    password: 'Klight#2026bb'
  });
  assert.match(short.rawCookie, /Max-Age=43200/);
});

test('forgot password does not reveal accounts, sends an expiring OTP and reset revokes sessions', async () => {
  const unknown = client();
  const before = outbox.length;
  const neutral = await unknown.request('POST', '/api/auth/forgot', { email: 'nobody@example.com' });
  assert.equal(neutral.status, 200);
  assert.match(neutral.body.message, /If an account exists/);
  assert.equal(outbox.length, before);

  const session = client();
  await session.request('POST', '/api/auth/login', {
    email: STUDENT.studentEmail,
    password: 'Klight#2026bb'
  });
  assert.equal((await session.request('GET', '/api/dashboard')).status, 200);

  const forgot = await session.request('POST', '/api/auth/forgot', { email: STUDENT.studentEmail });
  assert.equal(forgot.status, 200);
  const mail = latestMail();
  assert.match(mail.subject, /reset/i);
  const otp = codeFromReset(mail);
  const token = tokenFrom(mail, '/reset-password');
  assert.ok(otp);
  assert.ok(token);

  const wrong = await client().request('POST', '/api/auth/reset', {
    email: STUDENT.studentEmail,
    otp: '000000',
    password: 'Klight#2026cc',
    confirmPassword: 'Klight#2026cc'
  });
  assert.equal(wrong.status, 400);

  const reset = await client().request('POST', '/api/auth/reset', {
    email: STUDENT.studentEmail,
    otp,
    password: 'Klight#2026cc',
    confirmPassword: 'Klight#2026cc'
  });
  assert.equal(reset.status, 200);

  // Every earlier session is revoked.
  assert.equal((await session.request('GET', '/api/dashboard')).status, 401);

  const reuse = await client().request('POST', '/api/auth/reset', {
    email: STUDENT.studentEmail,
    otp,
    password: 'Klight#2026dd',
    confirmPassword: 'Klight#2026dd'
  });
  assert.equal(reuse.status, 400);

  const oldPassword = await client().request('POST', '/api/auth/login', {
    email: STUDENT.studentEmail,
    password: 'Klight#2026bb'
  });
  assert.equal(oldPassword.status, 401);

  const newPassword = await client().request('POST', '/api/auth/login', {
    email: STUDENT.studentEmail,
    password: 'Klight#2026cc'
  });
  assert.equal(newPassword.status, 200);
});

test('reset links work, expire, and clear the forced password change flag', async () => {
  const c = client();
  const forgot = await c.request('POST', '/api/auth/forgot', { email: ADMIN.adminEmail });
  assert.equal(forgot.status, 200);
  const linkToken = tokenFrom(latestMail(), '/reset-password');
  assert.ok(linkToken);

  const reset = await client().request('POST', '/api/auth/reset', {
    token: linkToken,
    password: 'Admin#2026zz',
    confirmPassword: 'Admin#2026zz'
  });
  assert.equal(reset.status, 200);

  const admin = client();
  const login = await admin.request('POST', '/api/auth/login', {
    email: ADMIN.adminEmail,
    password: 'Admin#2026zz'
  });
  assert.equal(login.status, 200);
  assert.equal(login.body.user.mustChangePassword, false);
  assert.equal((await admin.request('GET', '/api/admin/overview')).status, 200);

  const second = client();
  await second.request('POST', '/api/auth/register', {
    name: 'Expiry Student',
    email: `expiry-${Date.now()}@example.com`,
    password: 'Expiry#2026',
    confirmPassword: 'Expiry#2026',
    consent: true
  });
  const expiredToken = tokenFrom(latestMail(), '/verify-email');
  const email = latestMail().to;
  db.prepare('UPDATE email_tokens SET expires_at = ? WHERE user_id = (SELECT id FROM users WHERE email = ?)').run(
    '2000-01-01T00:00:00.000Z',
    email
  );
  const expired = await client().request('POST', '/api/auth/verify-email', { token: expiredToken });
  assert.equal(expired.status, 400);
  assert.match(expired.body.message, /expired|invalid/i);
});

test('theme preference is stored on the account', async () => {
  const c = client();
  await c.request('POST', '/api/auth/login', {
    email: STUDENT.studentEmail,
    password: 'Klight#2026cc'
  });
  const updated = await c.request('PUT', '/api/auth/theme', { theme: 'violet' });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.theme, 'violet');
  const me = await c.request('GET', '/api/auth/me');
  assert.equal(me.body.user.theme, 'violet');
  const invalid = await c.request('PUT', '/api/auth/theme', { theme: 'orange' });
  assert.equal(invalid.status, 400);
});

test('same-origin browser requests are accepted when a proxy rewrites Host', async () => {
  // Simulates a TLS tunnel that forwards an internal Host but preserves Origin.
  const response = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'https://preview.example.test',
      'Sec-Fetch-Site': 'same-origin'
    },
    body: JSON.stringify({ email: STUDENT.studentEmail, password: 'Klight#2026cc' })
  });
  assert.equal(response.status, 200);

  const crossSite = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'https://evil.example.test',
      'Sec-Fetch-Site': 'cross-site'
    },
    body: JSON.stringify({ email: STUDENT.studentEmail, password: 'Klight#2026cc' })
  });
  assert.equal(crossSite.status, 403);
});

test('Google sign-in reports its real configuration state instead of simulating it', async () => {
  const c = client();
  const status = await c.request('GET', '/api/auth/google/status');
  assert.equal(status.status, 200);
  assert.equal(status.body.configured, false);
  const start = await c.request('GET', '/api/auth/google/start');
  assert.equal(start.status, 503);
  assert.equal(start.body.error, 'GOOGLE_NOT_CONFIGURED');
});

test('verification codes stop working after too many failed attempts', async () => {
  const c = client();
  await c.request('POST', '/api/auth/register', {
    name: 'Attempt Student',
    email: `attempt-${Date.now()}@example.com`,
    password: 'Attempt#2026',
    confirmPassword: 'Attempt#2026',
    consent: true
  });
  const email = latestMail().to;
  const otp = codeFromVerify(latestMail());
  for (let i = 0; i < 5; i += 1) {
    const failed = await client().request('POST', '/api/auth/verify-email', { email, otp: '000001' });
    assert.equal(failed.status, 400);
  }
  const blocked = await client().request('POST', '/api/auth/verify-email', { email, otp });
  assert.equal(blocked.status, 400);
  assert.match(blocked.body.message, /not valid or has expired/i);
  assert.ok(db.prepare('SELECT attempts FROM email_tokens WHERE user_id = (SELECT id FROM users WHERE email = ?)').get(email).attempts >= 5);
  assert.ok(now());
});
