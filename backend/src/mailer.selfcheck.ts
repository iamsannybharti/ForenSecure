// Self-check for SMTP config parsing and link building. Run: npx ts-node src/mailer.selfcheck.ts
import assert from 'assert';
import { readMailerConfig, isMailerConfigured, resetPasswordUrl } from './mailer';

// No SMTP_HOST means the transport is skipped and mail is logged instead.
const bare = readMailerConfig({} as NodeJS.ProcessEnv);
assert.strictEqual(isMailerConfigured(bare), false, 'unconfigured without SMTP_HOST');
assert.strictEqual(bare.port, 587, 'defaults to the submission port');
assert.strictEqual(bare.secure, false, 'port 587 negotiates STARTTLS, not implicit TLS');
assert.strictEqual(bare.appUrl, 'http://localhost:5173', 'falls back to the dev frontend');

// Port 465 is implicit TLS, so `secure` flips without anyone setting SMTP_SECURE.
const tls = readMailerConfig({ SMTP_HOST: 'smtp.example.com', SMTP_PORT: '465' } as NodeJS.ProcessEnv);
assert.strictEqual(isMailerConfigured(tls), true, 'configured once SMTP_HOST is set');
assert.strictEqual(tls.secure, true, 'port 465 implies implicit TLS');

// An explicit SMTP_SECURE wins over the port-based guess.
const forced = readMailerConfig({ SMTP_HOST: 'h', SMTP_PORT: '465', SMTP_SECURE: 'false' } as NodeJS.ProcessEnv);
assert.strictEqual(forced.secure, false, 'SMTP_SECURE overrides the port default');

// Auth is optional — relays on a trusted network take no credentials.
assert.strictEqual(tls.user, undefined, 'no user when SMTP_USER is unset');

// A trailing slash on APP_URL must not produce a double slash in the link.
const slashed = readMailerConfig({ APP_URL: 'https://forensecure.edu.in/' } as NodeJS.ProcessEnv);
assert.strictEqual(
  resetPasswordUrl(slashed, 'abc123'),
  'https://forensecure.edu.in/reset-password?token=abc123',
  'trailing slash trimmed'
);

// Tokens are hex today, but encoding keeps the link intact if that ever changes.
assert.strictEqual(
  resetPasswordUrl(bare, 'a+b/c=d&e'),
  'http://localhost:5173/reset-password?token=a%2Bb%2Fc%3Dd%26e',
  'token is percent-encoded'
);

console.log('mailer.selfcheck: all assertions passed ✓');
