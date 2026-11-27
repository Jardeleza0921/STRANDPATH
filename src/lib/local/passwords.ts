/**
 * Local account password hashing with Web Crypto.
 *
 * The static build cannot keep secrets from the person using the device, and
 * it does not claim to. Hashing still matters: a password must never be stored
 * as plain text in localStorage or in a backup of it. PBKDF2-SHA256 with a
 * random per-account salt is used here for that reason, not as proof of a
 * secure multi-user authentication system.
 */

const ITERATIONS = 150_000;
const KEY_LENGTH = 256;

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return window.btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  const binary = window.atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function subtle(): SubtleCrypto {
  if (!window.crypto?.subtle) {
    throw new Error(
      'This browser cannot hash passwords securely. Open STRANDPATH over HTTPS or on localhost, or use a current browser.'
    );
  }
  return window.crypto.subtle;
}

async function derive(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await subtle().importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await subtle().deriveBits(
    { name: 'PBKDF2', salt: salt as unknown as BufferSource, iterations, hash: 'SHA-256' },
    key,
    KEY_LENGTH
  );
  return new Uint8Array(bits);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const derived = await derive(password, salt, ITERATIONS);
  return `pbkdf2$${ITERATIONS}$${toBase64(salt)}$${toBase64(derived)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false;
  const iterations = Number(parts[1]);
  if (!Number.isFinite(iterations) || iterations < 1) return false;
  try {
    const salt = fromBase64(parts[2]);
    const expected = parts[3];
    const derived = await derive(password, salt, iterations);
    return toBase64(derived) === expected;
  } catch {
    return false;
  }
}

/** Mirrors the optional server's rule so messages stay consistent. */
export function passwordProblems(password: string): string[] {
  const problems: string[] = [];
  if (typeof password !== 'string' || password.length < 8) problems.push('at least 8 characters');
  if (typeof password === 'string' && password.length > 200) problems.push('at most 200 characters');
  if (!/[A-Za-z]/.test(password ?? '')) problems.push('a letter');
  if (!/[0-9]/.test(password ?? '')) problems.push('a number');
  return problems;
}
