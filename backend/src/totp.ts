// RFC 6238 TOTP / RFC 4226 HOTP using only Node's stdlib crypto. No dependency.
// Base32 per RFC 4648 (A-Z, 2-7). Authenticator-app compatible (SHA1, 6 digits, 30s).
import crypto from 'crypto';

const B32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function base32Encode(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let out = '';
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += B32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32_ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

export function base32Decode(input: string): Buffer {
  const clean = input.toUpperCase().replace(/=+$/, '').replace(/\s/g, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const ch of clean) {
    const idx = B32_ALPHABET.indexOf(ch);
    if (idx === -1) continue; // skip non-alphabet chars defensively
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

// RFC 4226 HOTP: counter-based one-time password.
export function hotp(secret: Buffer, counter: number, digits = 6, algo = 'sha1'): string {
  const buf = Buffer.alloc(8);
  // 64-bit big-endian counter (safe for JS integers well beyond current epoch/30).
  buf.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  buf.writeUInt32BE(counter >>> 0, 4);
  const hmac = crypto.createHmac(algo, secret).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const bin =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return (bin % 10 ** digits).toString().padStart(digits, '0');
}

// RFC 6238 TOTP: time-based, derived from HOTP with counter = floor(time / step).
export function totp(secretBase32: string, atMs: number = Date.now(), step = 30, digits = 6): string {
  const counter = Math.floor(atMs / 1000 / step);
  return hotp(base32Decode(secretBase32), counter, digits);
}

// Verify a code, tolerating +/- `window` steps of clock drift.
export function verifyTotp(secretBase32: string, code: string, atMs: number = Date.now(), window = 1, step = 30, digits = 6): boolean {
  if (!code || !/^\d+$/.test(code)) return false;
  const secret = base32Decode(secretBase32);
  const counter = Math.floor(atMs / 1000 / step);
  for (let w = -window; w <= window; w++) {
    if (hotp(secret, counter + w, digits) === code) return true;
  }
  return false;
}

// 20 random bytes -> base32, the standard authenticator secret length.
export function generateSecret(): string {
  return base32Encode(crypto.randomBytes(20));
}

// otpauth:// URI that authenticator apps import (as text or QR).
export function otpauthURL(secretBase32: string, account: string, issuer = 'ForenSecure'): string {
  const label = encodeURIComponent(`${issuer}:${account}`);
  const params = new URLSearchParams({ secret: secretBase32, issuer, algorithm: 'SHA1', digits: '6', period: '30' });
  return `otpauth://totp/${label}?${params.toString()}`;
}
