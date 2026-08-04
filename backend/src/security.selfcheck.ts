// Self-check for the auth helpers. Run: npx ts-node src/security.selfcheck.ts
import assert from 'assert';
import { publicUser, hashToken, issueToken, validatePassword, MIN_PASSWORD_LENGTH } from './security';

// --- publicUser strips every secret, keeps everything else ---
const row = {
  id: 'u1',
  name: 'Student Candidate',
  email: 'student@forensecure.edu.in',
  role: 'student',
  passwordHash: '$2a$10$abcdefghijklmnopqrstuv',
  mfaSecret: 'JBSWY3DPEHPK3PXP',
  magicToken: 'deadbeef',
  magicTokenExpires: new Date(),
  mfaEnabled: true,
  enrolledCourses: ['c1']
};
const safe = publicUser(row) as Record<string, unknown>;
assert.strictEqual('passwordHash' in safe, false, 'password hash removed');
assert.strictEqual('mfaSecret' in safe, false, 'TOTP secret removed');
assert.strictEqual('magicToken' in safe, false, 'reset token removed');
assert.strictEqual('magicTokenExpires' in safe, false, 'reset expiry removed');
assert.strictEqual(safe.email, 'student@forensecure.edu.in', 'ordinary fields survive');
assert.strictEqual(safe.mfaEnabled, true, 'mfaEnabled is a flag, not a secret — kept');
assert.deepStrictEqual(safe.enrolledCourses, ['c1'], 'arrays survive');
// The caller's row must not be mutated — routes go on using it after responding.
assert.strictEqual(row.passwordHash, '$2a$10$abcdefghijklmnopqrstuv', 'input row untouched');

// --- token hashing ---
assert.strictEqual(hashToken('abc'), hashToken('abc'), 'hashing is deterministic');
assert.notStrictEqual(hashToken('abc'), hashToken('abd'), 'different tokens differ');
assert.strictEqual(hashToken('abc').length, 64, 'sha-256 hex is 64 chars');

const issued = issueToken();
assert.strictEqual(issued.token.length, 64, '32 random bytes as hex');
assert.strictEqual(issued.tokenHash, hashToken(issued.token), 'stored hash matches the raw token');
assert.notStrictEqual(issued.tokenHash, issued.token, 'the raw token is never what gets stored');
assert.ok(issued.expires.getTime() > Date.now() + 23 * 60 * 60 * 1000, 'expires ~24h out');
assert.notStrictEqual(issueToken().token, issued.token, 'tokens are unique per call');

// --- password policy ---
assert.strictEqual(validatePassword('a'.repeat(MIN_PASSWORD_LENGTH)), null, 'minimum length accepted');
assert.ok(validatePassword('a'.repeat(MIN_PASSWORD_LENGTH - 1)), 'one char short rejected');
assert.ok(validatePassword(''), 'empty rejected');
assert.ok(validatePassword(undefined), 'missing rejected');
assert.ok(validatePassword(12345678 as unknown), 'non-string rejected');
assert.ok(validatePassword('PASSWORD'), 'common password rejected case-insensitively');
assert.ok(validatePassword('a'.repeat(201)), 'absurd length rejected');
assert.strictEqual(validatePassword('ForenSecure2026!'), null, 'the seeded demo password passes');

console.log('security.selfcheck: all assertions passed ✓');
