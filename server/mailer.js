import { mkdirSync, appendFileSync } from 'node:fs';
import { resolve } from 'node:path';
import nodemailer from 'nodemailer';

/**
 * Transactional email.
 *
 * Real delivery uses SMTP. Two development transports exist and are opt-in only:
 *   EMAIL_TRANSPORT=json  writes each message to EMAIL_OUTBOX_DIR (default server/data/outbox)
 *   EMAIL_TRANSPORT=none  disables sending and reports `delivery: 'disabled'`
 *
 * There is no simulated delivery in the default configuration: without SMTP
 * credentials the app reports EMAIL_NOT_CONFIGURED and the UI says so.
 */

export function emailConfig(env = process.env) {
  const host = env.SMTP_HOST?.trim() || '';
  const port = Number(env.SMTP_PORT || 587);
  const user = env.SMTP_USER?.trim() || '';
  const pass = env.SMTP_PASSWORD || '';
  const from = env.EMAIL_FROM?.trim() || '';
  const transport = (env.EMAIL_TRANSPORT || '').toLowerCase();
  return {
    host,
    port,
    secure: port === 465,
    user,
    pass,
    from,
    transport,
    configured: Boolean(host && from && transport !== 'none'),
    appBaseUrl: (env.APP_BASE_URL || '').replace(/\/+$/, '')
  };
}

export function emailStatus(env = process.env) {
  const config = emailConfig(env);
  return {
    configured: config.configured && config.transport !== 'json',
    transport: config.transport === 'json' ? 'json-outbox' : config.configured ? 'smtp' : 'unconfigured',
    from: config.configured ? config.from : null,
    host: config.configured ? config.host : null,
    note:
      config.transport === 'json'
        ? 'Development outbox: messages are written to files, not delivered.'
        : config.configured
          ? 'Verification and password-reset email is sent over SMTP.'
          : 'Email is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD and EMAIL_FROM.'
  };
}

const BRAND = '#1f5f45';
const INK = '#16202a';
const MUTED = '#5b6675';

function layout({ title, intro, body, footer = '' }) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:#f2f1ec;font-family:Segoe UI,Helvetica,Arial,sans-serif;color:${INK}">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f1ec;padding:32px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;border:1px solid #e2e0d8;overflow:hidden">
        <tr><td style="padding:26px 32px 8px">
          <div style="font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:${BRAND};font-weight:700">StrandPath</div>
          <h1 style="margin:14px 0 0;font-size:22px;line-height:1.3;color:${INK}">${escapeHtml(title)}</h1>
        </td></tr>
        <tr><td style="padding:12px 32px 8px;font-size:15px;line-height:1.65;color:${MUTED}">
          <p style="margin:0 0 16px">${escapeHtml(intro)}</p>
          ${body}
        </td></tr>
        <tr><td style="padding:20px 32px 28px;border-top:1px solid #eeece5;font-size:12px;line-height:1.6;color:#7a8492">
          <p style="margin:0">${footer || 'StrandPath is a school guidance platform. If you did not request this email, you can ignore it or contact your guidance office.'}</p>
          <p style="margin:10px 0 0">For privacy and security, never share this code or link with anyone.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

const button = (url, label) =>
  `<p style="margin:22px 0"><a href="${escapeHtml(url)}" style="display:inline-block;background:${BRAND};color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:13px 22px;border-radius:10px">${escapeHtml(label)}</a></p>`;

const codeBox = (code) =>
  `<p style="margin:18px 0;font-size:30px;letter-spacing:.34em;font-weight:700;color:${INK};background:#f4f6f2;border:1px solid #e2e0d8;border-radius:12px;padding:14px 18px;text-align:center">${escapeHtml(code)}</p>`;

function linkFor(appBaseUrl, path) {
  if (!appBaseUrl) return path;
  return `${appBaseUrl}${path}`;
}

export const templates = {
  verify({ name, code, token, appBaseUrl = '', expiresMinutes = 60 }) {
    const url = linkFor(appBaseUrl, `/verify-email?token=${encodeURIComponent(token)}`);
    return {
      subject: 'Confirm your StrandPath email address',
      text:
        `Hi ${name},\n\nConfirm your email address to finish setting up your StrandPath account.\n\n` +
        `Open: ${url}\n\nOr enter this code in the app: ${code}\n\nThis code expires in ${expiresMinutes} minutes.`,
      html: layout({
        title: 'Confirm your email address',
        intro: `Hi ${name}, confirm your email to finish setting up your StrandPath account.`,
        body:
          button(url, 'Confirm email address') +
          `<p style="margin:0 0 6px;font-size:13px;color:${MUTED}">Or enter this code in the app:</p>` +
          codeBox(code) +
          `<p style="margin:0;font-size:13px;color:${MUTED}">The code expires in ${expiresMinutes} minutes.</p>`
      })
    };
  },
  reset({ name, code, token, appBaseUrl = '', expiresMinutes = 10 }) {
    const url = linkFor(appBaseUrl, `/reset-password?token=${encodeURIComponent(token)}`);
    return {
      subject: 'Your StrandPath password reset code',
      text:
        `Hi ${name},\n\nUse this code to reset your StrandPath password: ${code}\n\n` +
        `Or open: ${url}\n\nThe code expires in ${expiresMinutes} minutes and can be used once. ` +
        `If you did not ask to reset your password, no action is needed.`,
      html: layout({
        title: 'Reset your password',
        intro: `Hi ${name}, use the code below to choose a new password.`,
        body:
          codeBox(code) +
          button(url, 'Choose a new password') +
          `<p style="margin:0;font-size:13px;color:${MUTED}">This code expires in ${expiresMinutes} minutes and can be used once. If you did not ask to reset your password, no action is needed.</p>`
      })
    };
  },
  passwordChanged({ name, appBaseUrl = '' }) {
    return {
      subject: 'Your StrandPath password was changed',
      text:
        `Hi ${name},\n\nYour StrandPath password was changed and other sessions were signed out.\n\n` +
        `If this was not you, reset your password immediately: ${linkFor(appBaseUrl, '/forgot-password')}`,
      html: layout({
        title: 'Your password was changed',
        intro: `Hi ${name}, your password was changed and other signed-in devices were signed out.`,
        body: `<p style="margin:0">If you made this change, no action is needed. If you did not, reset your password now.</p>` +
          button(linkFor(appBaseUrl, '/forgot-password'), 'Reset my password')
      })
    };
  },
  verified({ name }) {
    return {
      subject: 'Your StrandPath email is confirmed',
      text: `Hi ${name},\n\nYour email address is now confirmed. You can sign in and continue with your assessment at any time.`,
      html: layout({
        title: 'Email confirmed',
        intro: `Hi ${name}, your email address is now confirmed.`,
        body: `<p style="margin:0">You can sign in and continue with your assessment at any time.</p>`
      })
    };
  }
};

export function createMailer(env = process.env) {
  const config = emailConfig(env);
  let transport = null;
  let initError = null;

  if (config.transport === 'json') {
    // Explicit development outbox — never used unless requested.
    const dir = resolve(env.EMAIL_OUTBOX_DIR || 'server/data/outbox');
    mkdirSync(dir, { recursive: true });
    transport = {
      async sendMail(message) {
        const file = resolve(dir, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.eml.json`);
        appendFileSync(file, JSON.stringify({ ...message, writtenAt: new Date().toISOString() }, null, 2));
        return { messageId: `outbox:${file}`, outboxFile: file };
      }
    };
  } else if (config.configured) {
    transport = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.user ? { user: config.user, pass: config.pass } : undefined,
      connectionTimeout: 12000,
      greetingTimeout: 12000,
      socketTimeout: 20000
    });
  }

  async function send({ to, subject, text, html }) {
    if (!config.from) {
      return { delivered: false, delivery: 'not_configured', error: 'EMAIL_FROM is not configured' };
    }
    if (!transport) {
      return { delivered: false, delivery: 'not_configured', error: 'SMTP is not configured' };
    }
    try {
      const info = await transport.sendMail({ from: config.from, to, subject, text, html });
      return {
        delivered: config.transport !== 'json',
        delivery: config.transport === 'json' ? 'outbox' : 'smtp',
        messageId: info.messageId ?? null
      };
    } catch (error) {
      initError = error;
      console.error('[email] delivery failed:', error.message);
      return { delivered: false, delivery: 'failed', error: 'The email provider rejected the message.' };
    }
  }

  return { config, send, get lastError() { return initError; } };
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
