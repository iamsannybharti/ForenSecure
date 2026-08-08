// Self-check for the email OTP store.
// Run: npx ts-node src/emailOtp.selfcheck.ts   (from backend/)
import assert from 'assert';
import { OtpStore, generateCode, OTP_TTL_MS, OTP_MAX_ATTEMPTS } from './emailOtp';

// Codes are always six digits, leading zeros kept.
for (let i = 0; i < 500; i++) {
  const code = generateCode();
  assert.match(code, /^\d{6}$/, `six digit code, got ${code}`);
}

const t0 = 1_000_000;

// Happy path: correct code returns the payload it was issued with.
{
  const store = new OtpStore();
  const { otpToken, code } = store.issue({ kind: 'login', userId: 'u1' }, t0);
  const result = store.verify<{ kind: string; userId: string }>(otpToken, code, t0 + 1000);
  assert.ok(result.ok, 'correct code verifies');
  assert.deepStrictEqual(result.data, { kind: 'login', userId: 'u1' }, 'payload round-trips');
  // Single use: the same code cannot mint a second session.
  assert.ok(!store.verify(otpToken, code, t0 + 2000).ok, 'code is single-use');
  assert.strictEqual(store.size, 0, 'challenge removed after use');
}

// Wrong code fails but leaves the challenge usable.
{
  const store = new OtpStore();
  const { otpToken, code } = store.issue({ kind: 'login' }, t0);
  const bad = store.verify(otpToken, code === '000000' ? '111111' : '000000', t0);
  assert.ok(!bad.ok && bad.reason === 'invalid', 'wrong code rejected');
  assert.ok(store.verify(otpToken, code, t0).ok, 'correct code still works after one miss');
}

// Expiry.
{
  const store = new OtpStore();
  const { otpToken, code } = store.issue({}, t0);
  const late = store.verify(otpToken, code, t0 + OTP_TTL_MS + 1);
  assert.ok(!late.ok && late.reason === 'expired', 'expired code rejected');
  assert.strictEqual(store.size, 0, 'expired challenge dropped');
}

// Brute force is capped.
{
  const store = new OtpStore();
  const { otpToken, code } = store.issue({}, t0);
  for (let i = 0; i < OTP_MAX_ATTEMPTS; i++) {
    assert.strictEqual(store.verify(otpToken, '999999', t0).reason, 'invalid', `attempt ${i + 1} rejected`);
  }
  assert.strictEqual(store.verify(otpToken, code, t0).reason, 'attempts', 'locked out past the attempt cap');
  assert.strictEqual(store.size, 0, 'burnt challenge dropped');
}

// Unknown / garbage tokens never throw.
{
  const store = new OtpStore();
  assert.strictEqual(store.verify('nope', '123456').reason, 'expired', 'unknown token rejected');
  const { otpToken } = store.issue({}, t0);
  assert.strictEqual(store.verify(otpToken, 'abcdef', t0).reason, 'invalid', 'non-numeric code rejected');
}

// Issuing sweeps expired challenges instead of leaking them.
{
  const store = new OtpStore();
  store.issue({}, t0);
  store.issue({}, t0);
  assert.strictEqual(store.size, 2, 'two live challenges');
  store.issue({}, t0 + OTP_TTL_MS + 1);
  assert.strictEqual(store.size, 1, 'expired challenges swept on issue');
}

// Reissue keeps the payload, retires the old code, and resets the attempt count.
{
  const store = new OtpStore();
  const first = store.issue({ kind: 'signin', userId: 'u9' }, t0);
  for (let i = 0; i < OTP_MAX_ATTEMPTS - 1; i++) store.verify(first.otpToken, '999999', t0);

  const again = store.reissue<{ kind: string; userId: string }>(first.otpToken, t0 + 1000)!;
  assert.deepStrictEqual(again.data, { kind: 'signin', userId: 'u9' }, 'payload carried over');
  assert.notStrictEqual(again.otpToken, first.otpToken, 'a new token is handed out');
  assert.strictEqual(store.verify(first.otpToken, first.code, t0 + 1000).reason, 'expired', 'old code retired');
  assert.strictEqual(store.size, 1, 'only the fresh challenge survives');

  // The near-exhausted attempt budget from the old challenge did not carry over.
  for (let i = 0; i < OTP_MAX_ATTEMPTS - 1; i++) {
    assert.strictEqual(store.verify(again.otpToken, '999999', t0 + 1000).reason, 'invalid', 'attempts reset');
  }
  assert.ok(store.verify(again.otpToken, again.code, t0 + 1000).ok, 'fresh code verifies');

  assert.strictEqual(store.reissue('gone'), null, 'reissue of an unknown token returns null');
}

console.log('emailOtp.selfcheck: all cases passed ✓');
