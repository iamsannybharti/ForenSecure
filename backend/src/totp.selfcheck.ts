// Self-check for TOTP against the official RFC 6238 (Appendix B) test vectors.
// Run: npx ts-node src/totp.selfcheck.ts   (from backend/)
import assert from 'assert';
import { base32Encode, base32Decode, totp, verifyTotp, generateSecret } from './totp';

// RFC 6238 SHA1 seed = ASCII "12345678901234567890".
const SECRET = base32Encode(Buffer.from('12345678901234567890'));

// base32 round-trips.
assert.strictEqual(base32Decode(SECRET).toString(), '12345678901234567890', 'base32 round-trip');

// RFC 6238 Appendix B, SHA1 column (8-digit).
const vectors: Array<[number, string]> = [
  [59, '94287082'],
  [1111111109, '07081804'],
  [1111111111, '14050471'],
  [1234567890, '89005924'],
  [2000000000, '69279037'],
  [20000000000, '65353130']
];
for (const [t, expected8] of vectors) {
  assert.strictEqual(totp(SECRET, t * 1000, 30, 8), expected8, `RFC vector 8-digit @T=${t}`);
  // 6-digit authenticator codes are the low 6 digits of the same value.
  assert.strictEqual(totp(SECRET, t * 1000, 30, 6), expected8.slice(-6), `RFC vector 6-digit @T=${t}`);
}

// verifyTotp: correct code passes, wrong fails, drift within window tolerated.
const t59 = 59 * 1000;
assert.ok(verifyTotp(SECRET, '287082', t59), 'verify correct 6-digit');
assert.ok(!verifyTotp(SECRET, '000000', t59), 'verify wrong code fails');
assert.ok(!verifyTotp(SECRET, 'abc', t59), 'non-numeric rejected');
// code generated for the previous 30s step is accepted within window=1.
const prevStepCode = totp(SECRET, t59 - 30000);
assert.ok(verifyTotp(SECRET, prevStepCode, t59, 1), 'previous-step code accepted within drift window');
assert.ok(!verifyTotp(SECRET, prevStepCode, t59, 0), 'previous-step code rejected with window 0');

// generateSecret: 20 bytes -> 32 base32 chars, decodes back to 20 bytes.
const s = generateSecret();
assert.strictEqual(s.length, 32, 'generated secret length');
assert.strictEqual(base32Decode(s).length, 20, 'generated secret decodes to 20 bytes');

console.log('totp.selfcheck: all RFC 6238 vectors + verify cases passed ✓');
