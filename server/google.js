import { createPublicKey, verify as verifySignature } from 'node:crypto';

/**
 * Google Sign-In (OAuth 2.0 authorization-code flow with OpenID Connect).
 *
 * Only activated when GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set.
 * The ID token is verified locally against Google's published JWKS, including
 * signature, issuer, audience, expiry and verified-email claims.
 */

const AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs';

export function googleConfig(env = process.env) {
  const clientId = env.GOOGLE_CLIENT_ID?.trim() || '';
  const clientSecret = env.GOOGLE_CLIENT_SECRET?.trim() || '';
  return {
    clientId,
    clientSecret,
    configured: Boolean(clientId && clientSecret),
    redirectUri: (env.GOOGLE_REDIRECT_URI || '').trim()
  };
}

export function googleStatus(env = process.env) {
  const config = googleConfig(env);
  return {
    configured: config.configured,
    clientId: config.configured ? config.clientId : null,
    note: config.configured
      ? 'Google sign-in is enabled.'
      : 'Google sign-in is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and GOOGLE_REDIRECT_URI.'
  };
}

export function authorizationUrl({ clientId, redirectUri, state }) {
  const url = new URL(AUTH_ENDPOINT);
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'openid email profile');
  url.searchParams.set('state', state);
  url.searchParams.set('prompt', 'select_account');
  url.searchParams.set('access_type', 'online');
  return url.toString();
}

export async function exchangeCode({ code, clientId, clientSecret, redirectUri }) {
  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    })
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Google token exchange failed (${response.status}) ${detail.slice(0, 200)}`);
  }
  return response.json();
}

let jwksCache = { fetchedAt: 0, keys: [] };

async function googleKeys() {
  if (Date.now() - jwksCache.fetchedAt < 60 * 60 * 1000 && jwksCache.keys.length) return jwksCache.keys;
  const response = await fetch(JWKS_URL);
  if (!response.ok) throw new Error('Could not fetch Google signing keys');
  const data = await response.json();
  jwksCache = { fetchedAt: Date.now(), keys: Array.isArray(data.keys) ? data.keys : [] };
  return jwksCache.keys;
}

const decodeSegment = (segment) => JSON.parse(Buffer.from(segment, 'base64url').toString('utf8'));

export async function verifyIdToken(idToken, clientId) {
  const parts = String(idToken || '').split('.');
  if (parts.length !== 3) throw new Error('Malformed Google identity token');
  const header = decodeSegment(parts[0]);
  const payload = decodeSegment(parts[1]);
  if (header.alg !== 'RS256') throw new Error('Unexpected Google token algorithm');

  const keys = await googleKeys();
  const jwk = keys.find((key) => key.kid === header.kid);
  if (!jwk) throw new Error('Google signing key not found');

  const publicKey = createPublicKey({ key: jwk, format: 'jwk' });
  const valid = verifySignature(
    'RSA-SHA256',
    Buffer.from(`${parts[0]}.${parts[1]}`),
    publicKey,
    Buffer.from(parts[2], 'base64url')
  );
  if (!valid) throw new Error('Invalid Google token signature');

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (!['https://accounts.google.com', 'accounts.google.com'].includes(payload.iss)) {
    throw new Error('Unexpected Google token issuer');
  }
  if (payload.aud !== clientId) throw new Error('Google token was issued for another application');
  if (Number(payload.exp) < nowSeconds) throw new Error('Google token has expired');
  if (payload.email_verified !== true && payload.email_verified !== 'true') {
    throw new Error('Google account email is not verified');
  }
  if (!payload.sub || !payload.email) throw new Error('Google token is missing required claims');

  return {
    sub: String(payload.sub),
    email: String(payload.email).toLowerCase(),
    emailVerified: true,
    name: String(payload.name || payload.email.split('@')[0]).slice(0, 80),
    picture: payload.picture ?? null
  };
}
