import { randomBytes } from 'node:crypto';
import { HttpError } from '../http.js';
import { all, get, run, tx, now } from '../db.js';
import {
  hashPassword,
  verifyPassword,
  passwordProblems,
  createSession,
  destroySession,
  destroyUserSessions,
  sessionCookie,
  clearCookie,
  readCookies,
  issueEmailToken,
  tokenRecord,
  verifyOtp
} from '../auth.js';
import { templates, emailStatus } from '../mailer.js';
import { googleConfig, googleStatus, authorizationUrl, exchangeCode, verifyIdToken } from '../google.js';

const OTP_TTL_MINUTES = Number(process.env.OTP_TTL_MINUTES || 10);
const OAUTH_COOKIE = 'sp_oauth';

const isEmail = (value) => typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
const text = (value, field, { min = 0, max = 2000 } = {}) => {
  if (typeof value !== 'string') throw new HttpError(400, `${field} must be text`);
  const trimmed = value.trim();
  if (trimmed.length < min) throw new HttpError(400, `${field} must be at least ${min} characters`);
  if (trimmed.length > max) throw new HttpError(400, `${field} must be at most ${max} characters`);
  return trimmed;
};
const optional = (value, max) => (value === undefined || value === null || value === '' ? null : text(value, 'Value', { max }));

const oauthCookie = (value, maxAge) =>
  `${OAUTH_COOKIE}=${encodeURIComponent(value)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${maxAge}` +
  (process.env.NODE_ENV === 'production' ? '; Secure' : '');

function requestBaseUrl(req) {
  if (process.env.APP_BASE_URL) return process.env.APP_BASE_URL.replace(/\/+$/, '');
  if (process.env.GOOGLE_REDIRECT_URI) return new URL(process.env.GOOGLE_REDIRECT_URI).origin;
  const proto = String(req.headers['x-forwarded-proto'] || 'http').split(',')[0].trim();
  return `${proto}://${req.headers.host}`;
}

function redirectUri(req) {
  return process.env.GOOGLE_REDIRECT_URI || `${requestBaseUrl(req)}/api/auth/google/callback`;
}

function appBaseUrl(req) {
  return requestBaseUrl(req);
}

export function registerAuthRoutes(router, { db, mailer, limit, publicUser, getProfile }) {
  const privateNoStore = { 'Cache-Control': 'no-store' };

  async function sendTemplate(user, template) {
    if (!user?.email) return { sent: false, delivery: 'no_recipient' };
    const email = template ?? null;
    if (!email) return { sent: false, delivery: 'no_template' };
    const result = await mailer.send({ to: user.email, subject: email.subject, text: email.text, html: email.html });
    return {
      sent: Boolean(result.delivered),
      delivery: result.delivery,
      ...(result.delivered ? {} : { error: result.error ?? 'Email could not be sent.' })
    };
  }

  function verificationPayload(result) {
    return {
      emailSent: Boolean(result.sent),
      emailDelivery: result.delivery,
      ...(result.error ? { emailError: result.error } : {})
    };
  }

  /* ------------------------------------------------------------ public meta */

  router.get('/api/auth/config', () => ({
    body: {
      google: googleStatus(),
      email: emailStatus(),
      otpTtlMinutes: OTP_TTL_MINUTES,
      passwordRule: 'At least 8 characters, including a letter and a number.',
      registration: 'Students only. Staff accounts are provisioned by the school.'
    },
    headers: privateNoStore
  }));

  router.get('/api/notifications', async ({ user }) => ({
    body: {
      notifications: all(
        db,
        'SELECT id, title, body, read_at, created_at FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT 30',
        user.id
      ).map((n) => ({ id: Number(n.id), title: n.title, body: n.body, readAt: n.read_at, createdAt: n.created_at })),
      unread: Number(
        get(db, 'SELECT COUNT(*) AS n FROM notifications WHERE user_id = ? AND read_at IS NULL', user.id)?.n ?? 0
      )
    }
  }), { auth: true });

  router.post('/api/notifications/read', async ({ user }) => {
    run(db, 'UPDATE notifications SET read_at = ? WHERE user_id = ? AND read_at IS NULL', now(), user.id);
    return { body: { ok: true } };
  }, { auth: true });

  /* ----------------------------------------------------------- registration */

  router.post('/api/auth/register', async ({ body, ip, req }) => {
    if (!limit(`register:${ip}`, 10, 60 * 60 * 1000)) {
      throw new HttpError(429, 'Too many registration attempts. Try again later.');
    }
    const name = text(body.name, 'Name', { min: 2, max: 80 });
    const email = text(body.email, 'Email', { min: 5, max: 160 }).toLowerCase();
    if (!isEmail(email)) throw new HttpError(400, 'Enter a valid email address');
    const password = String(body.password ?? '');
    if (password !== String(body.confirmPassword ?? password)) {
      throw new HttpError(400, 'The two passwords do not match');
    }
    const problems = passwordProblems(password);
    if (problems.length) throw new HttpError(400, `Password needs ${problems.join(', ')}`);
    if (body.consent !== true) throw new HttpError(400, 'Privacy consent is required to create an account');
    if (get(db, 'SELECT id FROM users WHERE email = ?', email)) {
      throw new HttpError(409, 'An account with this email already exists. Try signing in instead.');
    }

    const created = tx(db, () => {
      const { id } = run(
        db,
        `INSERT INTO users (name, email, password_hash, role, status, must_change_password, created_at)
         VALUES (?, ?, ?, 'student', 'active', 0, ?)`,
        name,
        email,
        hashPassword(password),
        now()
      );
      run(
        db,
        'INSERT INTO profiles (user_id, grade_level, school, consent_at, updated_at) VALUES (?, ?, ?, ?, ?)',
        id,
        optional(body.gradeLevel, 20),
        optional(body.school, 120),
        now(),
        now()
      );
      return { id };
    });

    const user = get(db, 'SELECT * FROM users WHERE id = ?', created.id);
    const issued = issueEmailToken(db, user.id, 'verify', { ttlMinutes: 60 });
    const emailResult = await sendTemplate(
      user,
      templates.verify({
        name: user.name,
        code: issued.otp,
        token: issued.token,
        appBaseUrl: appBaseUrl(req),
        expiresMinutes: 60
      })
    );
    run(
      db,
      'INSERT INTO notifications (user_id, title, body, created_at) VALUES (?, ?, ?, ?)',
      user.id,
      'Welcome to STRANDPATH',
      'Confirm your email address, then start your first assessment when you are ready.',
      now()
    );

    const session = createSession(db, user.id);
    const profile = getProfile(db, user.id);
    return {
      status: 201,
      body: {
        user: publicUser(get(db, 'SELECT * FROM users WHERE id = ?', user.id), profile?.theme),
        profile,
        verification: {
          ...verificationPayload(emailResult),
          expiresAt: issued.expiresAt,
          note: emailResult.sent
            ? 'Check your inbox for a confirmation link and six-digit code.'
            : 'Email delivery is not configured on this server. Ask your administrator to configure SMTP, or use "Resend confirmation" later.'
        }
      },
      headers: { 'Set-Cookie': sessionCookie(session.token, session.maxAge) }
    };
  });

  /* ----------------------------------------------------------------- login */

  router.post('/api/auth/login', async ({ body, ip }) => {
    const email = text(body.email, 'Email', { max: 160 }).toLowerCase();
    const password = String(body.password ?? '');
    const remember = body.remember === true;
    if (!limit(`login:${ip}:${email}`, 15, 15 * 60 * 1000)) {
      throw new HttpError(429, 'Too many sign-in attempts. Wait a few minutes and try again.');
    }
    const user = get(db, 'SELECT * FROM users WHERE email = ?', email);
    if (!user || !verifyPassword(password, user.password_hash)) {
      throw new HttpError(401, 'Email or password is incorrect');
    }
    if (user.status !== 'active') {
      throw new HttpError(403, 'This account is suspended. Contact the guidance office.');
    }
    run(db, 'UPDATE users SET last_login_at = ? WHERE id = ?', now(), user.id);
    destroyUserSessions(db, user.id);
    const session = createSession(db, user.id, { remember });
    const profile = getProfile(db, user.id);
    return {
      body: {
        user: publicUser(get(db, 'SELECT * FROM users WHERE id = ?', user.id), profile?.theme),
        profile
      },
      headers: { 'Set-Cookie': sessionCookie(session.token, session.maxAge) }
    };
  });

  router.post('/api/auth/logout', async ({ req }) => {
    const token = readCookies(req.headers.cookie).sp_session;
    destroySession(db, token);
    return { body: { ok: true }, headers: { 'Set-Cookie': clearCookie() } };
  }, { auth: true });

  router.get('/api/auth/me', async ({ user }) => {
    if (!user) return { body: { user: null, profile: null } };
    const profile = getProfile(db, user.id);
    return { body: { user: publicUser(get(db, 'SELECT * FROM users WHERE id = ?', user.id), profile?.theme), profile } };
  });

  /* -------------------------------------------------------- password change */

  router.post('/api/auth/password', async ({ user, body, req, ip }) => {
    if (!limit(`pw:${user.id}:${ip}`, 6, 15 * 60 * 1000)) throw new HttpError(429, 'Too many attempts. Try again later.');
    const current = String(body.currentPassword ?? '');
    const next = String(body.newPassword ?? '');
    const row = get(db, 'SELECT email, name, password_hash FROM users WHERE id = ?', user.id);
    if (!verifyPassword(current, row.password_hash)) throw new HttpError(400, 'Current password is incorrect');
    const problems = passwordProblems(next);
    if (problems.length) throw new HttpError(400, `New password needs ${problems.join(', ')}`);
    if (current === next) throw new HttpError(400, 'New password must be different from the current one');
    run(db, 'UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?', hashPassword(next), user.id);
    const currentToken = readCookies(req.headers.cookie).sp_session;
    destroyUserSessions(db, user.id, currentToken);
    const emailResult = await sendTemplate(row, templates.passwordChanged({ name: row.name, appBaseUrl: appBaseUrl(req) }));
    return {
      body: {
        ok: true,
        user: publicUser(get(db, 'SELECT * FROM users WHERE id = ?', user.id), user.theme),
        securityEmail: verificationPayload(emailResult)
      }
    };
  }, { auth: true });

  /* --------------------------------------------------------- forgot / reset */

  router.post('/api/auth/forgot', async ({ body, ip, req }) => {
    if (!limit(`forgot:${ip}`, 8, 60 * 60 * 1000)) {
      throw new HttpError(429, 'Too many reset requests. Wait a while and try again.');
    }
    const email = text(body.email, 'Email', { max: 160 }).toLowerCase();
    if (!isEmail(email)) throw new HttpError(400, 'Enter a valid email address');

    const user = get(db, 'SELECT * FROM users WHERE email = ?', email);
    let emailDelivery = 'not_requested';
    if (user && user.status === 'active') {
      if (!limit(`forgot:user:${user.id}`, 4, 60 * 60 * 1000)) {
        // Still answer neutrally; do not disclose the account exists.
        emailDelivery = 'rate_limited';
      } else {
        const issued = issueEmailToken(db, user.id, 'reset', { ttlMinutes: OTP_TTL_MINUTES });
        const result = await sendTemplate(
          user,
          templates.reset({
            name: user.name,
            code: issued.otp,
            token: issued.token,
            appBaseUrl: appBaseUrl(req),
            expiresMinutes: OTP_TTL_MINUTES
          })
        );
        emailDelivery = result.delivery;
      }
    }

    return {
      status: 200,
      body: {
        ok: true,
        message: 'If an account exists for that email, a single-use reset code is on its way. It expires shortly.',
        delivery: emailDelivery,
        email: emailStatus()
      },
      headers: privateNoStore
    };
  });

  router.post('/api/auth/reset', async ({ body, ip }) => {
    if (!limit(`reset:${ip}`, 12, 15 * 60 * 1000)) throw new HttpError(429, 'Too many attempts. Wait a few minutes.');
    const password = String(body.password ?? '');
    if (password !== String(body.confirmPassword ?? password)) throw new HttpError(400, 'The two passwords do not match');
    const problems = passwordProblems(password);
    if (problems.length) throw new HttpError(400, `Password needs ${problems.join(', ')}`);

    let user = null;
    let record = null;
    if (body.token) {
      record = tokenRecord(db, String(body.token), 'reset');
      if (!record || record.invalid) {
        const reason = record?.invalid === 'expired' ? 'This reset link has expired.' : 'This reset link is not valid or has already been used.';
        throw new HttpError(400, reason);
      }
      user = get(db, 'SELECT * FROM users WHERE id = ?', record.user_id);
    } else {
      const email = text(body.email, 'Email', { max: 160 }).toLowerCase();
      user = get(db, 'SELECT * FROM users WHERE email = ?', email);
      if (!user) throw new HttpError(400, 'That code is not valid or has expired.');
      record = verifyOtp(db, user.id, 'reset', body.otp);
      if (!record || record.invalid) {
        throw new HttpError(400, 'That code is not valid or has expired. Request a new one if needed.');
      }
    }
    if (!user || user.status !== 'active') throw new HttpError(400, 'This account cannot reset a password right now.');

    tx(db, () => {
      run(
        db,
        'UPDATE users SET password_hash = ?, must_change_password = 0, email_verified_at = COALESCE(email_verified_at, ?) WHERE id = ?',
        hashPassword(password),
        now(),
        user.id
      );
      run(db, 'UPDATE email_tokens SET used_at = ? WHERE user_id = ? AND purpose = ? AND used_at IS NULL', now(), user.id, 'reset');
      destroyUserSessions(db, user.id);
      run(
        db,
        'INSERT INTO notifications (user_id, title, body, created_at) VALUES (?, ?, ?, ?)',
        user.id,
        'Password reset',
        'Your password was reset and all other sessions were signed out.',
        now()
      );
    });
    const result = await sendTemplate(user, templates.passwordChanged({ name: user.name, appBaseUrl: requestBaseUrl({ headers: { host: 'localhost' } }) }));
    return { body: { ok: true, securityEmail: verificationPayload(result) }, headers: { 'Set-Cookie': clearCookie() } };
  });

  /* -------------------------------------------------------- email verification */

  router.post('/api/auth/verify-email', async ({ body, ip }) => {
    if (!limit(`verify:${ip}`, 20, 15 * 60 * 1000)) throw new HttpError(429, 'Too many attempts. Try again later.');
    let user = null;
    let record = null;
    if (body.token) {
      record = tokenRecord(db, String(body.token), 'verify');
      if (!record || record.invalid) {
        throw new HttpError(400, 'This confirmation link is invalid, expired or already used.');
      }
      user = get(db, 'SELECT * FROM users WHERE id = ?', record.user_id);
    } else {
      const email = text(body.email, 'Email', { max: 160 }).toLowerCase();
      user = get(db, 'SELECT * FROM users WHERE email = ?', email);
      if (!user) throw new HttpError(400, 'That code is not valid or has expired.');
      record = verifyOtp(db, user.id, 'verify', body.otp);
      if (!record || record.invalid) throw new HttpError(400, 'That code is not valid or has expired.');
    }
    if (!user) throw new HttpError(400, 'That code is not valid or has expired.');
    if (!user.email_verified_at) {
      tx(db, () => {
        run(db, 'UPDATE users SET email_verified_at = ? WHERE id = ?', now(), user.id);
        run(db, 'UPDATE email_tokens SET used_at = ? WHERE id = ?', now(), record.id);
        run(
          db,
          'INSERT INTO notifications (user_id, title, body, created_at) VALUES (?, ?, ?, ?)',
          user.id,
          'Email confirmed',
          'Your email address is confirmed. Your account is fully verified.',
          now()
        );
      });
    }
    await sendTemplate(user, templates.verified({ name: user.name }));
    return { body: { ok: true, user: publicUser(get(db, 'SELECT * FROM users WHERE id = ?', user.id), getProfile(db, user.id)?.theme) } };
  });

  router.post('/api/auth/resend-verification', async ({ user, req }) => {
    const row = get(db, 'SELECT * FROM users WHERE id = ?', user.id);
    if (row.email_verified_at) throw new HttpError(409, 'This email address is already confirmed.');
    if (!limit(`verify:resend:${user.id}`, 3, 60 * 60 * 1000)) {
      throw new HttpError(429, 'Please wait before requesting another confirmation email.');
    }
    const issued = issueEmailToken(db, user.id, 'verify', { ttlMinutes: 60 });
    const result = await sendTemplate(
      row,
      templates.verify({
        name: row.name,
        code: issued.otp,
        token: issued.token,
        appBaseUrl: appBaseUrl(req),
        expiresMinutes: 60
      })
    );
    return { body: { ok: true, verification: { ...verificationPayload(result), expiresAt: issued.expiresAt } } };
  }, { auth: true });

  /* ------------------------------------------------------------ preferences */

  router.put('/api/auth/theme', async ({ user, body }) => {
    const theme = ['green', 'blue', 'red', 'violet'].includes(body.theme) ? body.theme : null;
    if (!theme) throw new HttpError(400, 'Unknown theme');
    run(db, 'UPDATE profiles SET theme = ?, updated_at = ? WHERE user_id = ?', theme, now(), user.id);
    return { body: { ok: true, theme } };
  }, { auth: true });

  /* ----------------------------------------------------------- Google OAuth */

  router.get('/api/auth/google/status', () => ({ body: googleStatus(), headers: privateNoStore }));

  router.get('/api/auth/google/start', async ({ req, query }) => {
    const config = googleConfig();
    if (!config.configured) {
      throw new HttpError(503, 'Google sign-in is not configured on this server.', { code: 'GOOGLE_NOT_CONFIGURED' });
    }
    const intent = query.get('intent') === 'signup' ? 'signup' : 'login';
    const consent = query.get('consent') === '1';
    if (intent === 'signup' && !consent) {
      throw new HttpError(400, 'Please accept the privacy notice before continuing with Google.');
    }
    const state = randomBytes(24).toString('base64url');
    const payload = JSON.stringify({ state, intent, consent, createdAt: now() });
    return {
      status: 302,
      body: {},
      headers: {
        Location: authorizationUrl({ clientId: config.clientId, redirectUri: redirectUri(req), state }),
        'Set-Cookie': oauthCookie(payload, 600),
        'Cache-Control': 'no-store'
      }
    };
  });

  router.get('/api/auth/google/callback', async ({ req }) => {
    const config = googleConfig();
    const cookies = readCookies(req.headers.cookie);
    let stateData = null;
    try {
      stateData = JSON.parse(cookies[OAUTH_COOKIE] || 'null');
    } catch {
      stateData = null;
    }
    const url = new URL(req.url, requestBaseUrl(req));
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const oauthError = url.searchParams.get('error');
    const clearOauth = oauthCookie('', 0);
    const fail = (reason, intent = 'login') => ({
      status: 302,
      body: {},
      headers: {
        Location: intent === 'signup' ? `/register?error=${encodeURIComponent(reason)}` : `/login?error=${encodeURIComponent(reason)}`,
        'Set-Cookie': clearOauth,
        'Cache-Control': 'no-store'
      }
    });

    if (oauthError) return fail('google_cancelled');
    if (!config.configured) return fail('google_not_configured');
    if (!stateData || !state || stateData.state !== state) return fail('google_state');
    if (Date.now() - new Date(stateData.createdAt).getTime() > 10 * 60 * 1000) return fail('google_expired');
    if (!code) return fail('google_code');

    try {
      const tokens = await exchangeCode({
        code,
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        redirectUri: redirectUri(req)
      });
      const identity = await verifyIdToken(tokens.id_token, config.clientId);

      let user = get(db, 'SELECT * FROM users WHERE google_sub = ?', identity.sub);
      if (!user) {
        const byEmail = get(db, 'SELECT * FROM users WHERE email = ?', identity.email);
        if (byEmail) {
          if (!byEmail.email_verified_at) {
            return fail('google_email_unverified', stateData.intent);
          }
          run(db, 'UPDATE users SET google_sub = ? WHERE id = ?', identity.sub, byEmail.id);
          user = get(db, 'SELECT * FROM users WHERE id = ?', byEmail.id);
        } else {
          if (!stateData.consent) return fail('consent_required', 'signup');
          const created = tx(db, () => {
            const { id } = run(
              db,
              `INSERT INTO users (name, email, password_hash, role, status, email_verified_at, must_change_password, google_sub, created_at)
               VALUES (?, ?, ?, 'student', 'active', ?, 0, ?, ?)`,
              identity.name.slice(0, 80),
              identity.email,
              hashPassword(randomBytes(32).toString('hex')),
              now(),
              identity.sub,
              now()
            );
            run(
              db,
              "INSERT INTO profiles (user_id, consent_at, theme, updated_at) VALUES (?, ?, 'green', ?)",
              id,
              now(),
              now()
            );
            run(
              db,
              'INSERT INTO notifications (user_id, title, body, created_at) VALUES (?, ?, ?, ?)',
              id,
              'Welcome to STRANDPATH',
              'Your Google account is connected. You can set a password any time from Settings.',
              now()
            );
            return { id };
          });
          user = get(db, 'SELECT * FROM users WHERE id = ?', created.id);
        }
      }

      if (user.status !== 'active') return fail('google_suspended', stateData.intent);
      run(db, 'UPDATE users SET last_login_at = ? WHERE id = ?', now(), user.id);
      const session = createSession(db, user.id, { remember: true });
      const destination = user.must_change_password
        ? '/change-password'
        : user.role === 'admin' || user.role === 'guidance'
          ? '/admin'
          : '/app';
      return {
        status: 302,
        body: {},
        headers: {
          Location: destination,
          'Set-Cookie': [sessionCookie(session.token, session.maxAge), clearOauth],
          'Cache-Control': 'no-store'
        }
      };
    } catch (error) {
      console.error('[google] sign-in failed:', error.message);
      return fail('google_failed', stateData?.intent);
    }
  });

  /* --------------------------------------------------------------- account */

  router.delete('/api/account', async ({ user, body }) => {
    const row = get(db, 'SELECT password_hash FROM users WHERE id = ?', user.id);
    if (!verifyPassword(String(body.password ?? ''), row.password_hash)) {
      throw new HttpError(400, 'Password is incorrect');
    }
    run(db, 'DELETE FROM users WHERE id = ?', user.id);
    return { body: { ok: true }, headers: { 'Set-Cookie': clearCookie() } };
  }, { auth: true });
}
