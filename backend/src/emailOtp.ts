import crypto from 'crypto';

/**
 * Email one-time codes for sign-in and sign-up.
 *
 * The pending code lives in memory, not in the users table: it is valid for ten
 * minutes and nothing outside that window ever needs it, so a column (and a
 * migration, and a cleanup job) would be storage for data that is always stale.
 * The payload rides along with the challenge, which is what lets registration
 * hold the new account entirely in the challenge until the code is confirmed —
 * an unverified row is never written.
 *
 * ponytail: single-process store. Codes do not survive a restart and are not
 * shared between instances; move to Redis if the API is ever run multi-instance.
 */

export const OTP_TTL_MS = 10 * 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;

export interface OtpChallenge<T = any> {
  codeHash: string;
  expiresAt: number;
  attempts: number;
  data: T;
}

export type OtpFailure = 'expired' | 'attempts' | 'invalid';

export interface OtpResult<T> {
  ok: boolean;
  data?: T;
  reason?: OtpFailure;
}

/** Codes are compared by hash so a heap dump does not hand out live codes. */
export const hashCode = (code: string): string =>
  crypto.createHash('sha256').update(code).digest('hex');

/** Six digits, uniformly distributed, leading zeros preserved. */
export function generateCode(): string {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
}

export class OtpStore {
  private challenges = new Map<string, OtpChallenge>();

  /** Creates a challenge and returns the id to hand the client and the code to email. */
  issue<T>(data: T, now: number = Date.now()): { otpToken: string; code: string } {
    this.sweep(now);
    const otpToken = crypto.randomBytes(24).toString('hex');
    const code = generateCode();
    this.challenges.set(otpToken, { codeHash: hashCode(code), expiresAt: now + OTP_TTL_MS, attempts: 0, data });
    return { otpToken, code };
  }

  /**
   * Consumes a challenge. A correct code always deletes it, so a code cannot be
   * replayed into a second session; a wrong code burns one of the five attempts.
   */
  verify<T>(otpToken: string, code: string, now: number = Date.now()): OtpResult<T> {
    const challenge = this.challenges.get(otpToken);
    if (!challenge) return { ok: false, reason: 'expired' };

    if (challenge.expiresAt <= now) {
      this.challenges.delete(otpToken);
      return { ok: false, reason: 'expired' };
    }

    challenge.attempts += 1;
    if (challenge.attempts > OTP_MAX_ATTEMPTS) {
      this.challenges.delete(otpToken);
      return { ok: false, reason: 'attempts' };
    }

    const given = hashCode(String(code).trim());
    // Fixed-length hex on both sides, so timingSafeEqual never throws on length.
    const match = crypto.timingSafeEqual(Buffer.from(given, 'hex'), Buffer.from(challenge.codeHash, 'hex'));
    if (!match) return { ok: false, reason: 'invalid' };

    this.challenges.delete(otpToken);
    return { ok: true, data: challenge.data as T };
  }

  /**
   * Replaces a live challenge with a fresh code, keeping the payload.
   *
   * "Resend" has to work without the client re-sending a password, and reissuing
   * rather than re-mailing the old code means the attempt counter resets and the
   * previous code stops working the moment a new one is asked for.
   */
  reissue<T>(otpToken: string, now: number = Date.now()): { otpToken: string; code: string; data: T } | null {
    const challenge = this.challenges.get(otpToken);
    if (!challenge || challenge.expiresAt <= now) {
      this.challenges.delete(otpToken);
      return null;
    }
    this.challenges.delete(otpToken);
    const next = this.issue(challenge.data, now);
    return { ...next, data: challenge.data as T };
  }

  /** Drops expired challenges. Called on issue, so the map cannot grow unbounded. */
  sweep(now: number = Date.now()): void {
    for (const [token, challenge] of this.challenges) {
      if (challenge.expiresAt <= now) this.challenges.delete(token);
    }
  }

  get size(): number {
    return this.challenges.size;
  }
}

export const otpStore = new OtpStore();

/** Message shown for each failure. Kept here so both auth routes word it identically. */
export const otpFailureMessage = (reason: OtpFailure | undefined): string => {
  if (reason === 'expired') return 'That code has expired. Request a new one.';
  if (reason === 'attempts') return 'Too many incorrect codes. Request a new one.';
  return 'Incorrect code. Please try again.';
};
