import crypto from 'crypto';

/**
 * Small, pure security helpers shared by the auth routes. Kept out of server.ts
 * so they can be asserted on directly — see security.selfcheck.ts.
 */

/** Columns that must never reach a client, on any route, for any caller. */
const SECRET_FIELDS = ['passwordHash', 'mfaSecret', 'magicToken', 'magicTokenExpires'] as const;

/**
 * Strips the secret columns off a user row before it is serialised.
 *
 * Allow-listing the safe fields instead would silently drop new columns as the
 * schema grows; deny-listing the four secrets keeps profile responses complete
 * and fails loudly (in review) if a fifth secret is ever added.
 */
export function publicUser<T extends Record<string, any>>(user: T): Partial<T> {
  const safe: Record<string, any> = { ...user };
  for (const field of SECRET_FIELDS) delete safe[field];
  return safe as Partial<T>;
}

/**
 * Hashes a password-reset token for storage.
 *
 * The raw token only ever exists in the email; the database holds its SHA-256,
 * so a leaked table dump cannot be replayed to take over accounts. Plain SHA-256
 * (not bcrypt) is right here: the token is 256 bits of CSPRNG output, so there
 * is no dictionary to slow down, and lookups stay a single indexed comparison.
 */
export const hashToken = (token: string): string =>
  crypto.createHash('sha256').update(token).digest('hex');

/** A fresh reset token and the value to store alongside it. */
export function issueToken(): { token: string; tokenHash: string; expires: Date } {
  const token = crypto.randomBytes(32).toString('hex');
  return {
    token,
    tokenHash: hashToken(token),
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000)
  };
}

export const MIN_PASSWORD_LENGTH = 8;

/**
 * Returns an error message, or null when the password is acceptable.
 *
 * Length is the requirement that actually correlates with strength, so it is the
 * only hard rule; composition rules mostly push people toward `Passw0rd!`. The
 * top handful of universally-guessed passwords are rejected outright.
 */
export function validatePassword(password: unknown): string | null {
  if (typeof password !== 'string' || password.length === 0) {
    return 'Password is required';
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }
  if (password.length > 200) {
    // bcrypt truncates past 72 bytes anyway; the cap just stops absurd payloads.
    return 'Password must be at most 200 characters';
  }
  const common = ['password', '12345678', 'qwertyui', 'password1', 'password123', 'iloveyou'];
  if (common.includes(password.toLowerCase())) {
    return 'That password is too common, please choose another';
  }
  return null;
}
