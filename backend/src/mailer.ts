import nodemailer, { Transporter } from 'nodemailer';

/**
 * Outbound email.
 *
 * SMTP is optional on purpose: with no SMTP_HOST configured the transport is
 * skipped and the message is logged instead, so local development keeps working
 * exactly as it did when magic links were printed to the console. Anything that
 * needs the link to actually arrive (a real deployment) sets the env vars.
 */

export interface MailerConfig {
  host?: string;
  port: number;
  secure: boolean;
  user?: string;
  pass?: string;
  from: string;
  appUrl: string;
}

/** Reads and normalises the SMTP settings. Pure, so the selfcheck can drive it. */
export function readMailerConfig(env: NodeJS.ProcessEnv = process.env): MailerConfig {
  const port = Number(env.SMTP_PORT) || 587;
  const pass = env.SMTP_PASS ? env.SMTP_PASS.replace(/\s+/g, '') : undefined;
  return {
    host: env.SMTP_HOST || undefined,
    port,
    secure: env.SMTP_SECURE ? env.SMTP_SECURE === 'true' : port === 465,
    user: env.SMTP_USER || undefined,
    pass,
    from: env.MAIL_FROM || 'ForenSecure <no-reply@forensecure.edu.in>',
    appUrl: (env.APP_URL || 'http://localhost:5173').replace(/\/+$/, '')
  };
}

export const isMailerConfigured = (config: MailerConfig): boolean => !!config.host;

/** Password-reset link the recipient clicks. Token goes in the query string, so
 *  it must be encoded — a raw token with a `&` in it would truncate the link. */
export const resetPasswordUrl = (config: MailerConfig, token: string): string =>
  `${config.appUrl}/reset-password?token=${encodeURIComponent(token)}`;

export interface MailTemplate {
  subject: string;
  text: string;
  html: string;
}

const layout = (heading: string, body: string, url: string, cta: string): string => `
<div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#0a0e1c">
  <h1 style="font-size:20px;margin:0 0 16px">${heading}</h1>
  <p style="font-size:14px;line-height:1.6;color:#4c5468;margin:0 0 24px">${body}</p>
  <a href="${url}" style="display:inline-block;background:#049a92;color:#fff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 24px;border-radius:999px">${cta}</a>
  <p style="font-size:12px;line-height:1.6;color:#8891a3;margin:24px 0 0">
    This link expires in 24 hours. If you weren't expecting it you can ignore this email.
  </p>
  <p style="font-size:12px;color:#8891a3;margin:8px 0 0;word-break:break-all">${url}</p>
</div>`;

export function inviteTemplate(name: string, url: string): MailTemplate {
  return {
    subject: 'Your ForenSecure account is ready',
    text: `Hi ${name},\n\nAn account has been created for you on ForenSecure. Set your password here:\n${url}\n\nThis link expires in 24 hours.`,
    html: layout(
      `Welcome to ForenSecure, ${name}`,
      'An administrator created an account for you. Set a password to activate it.',
      url,
      'Set your password'
    )
  };
}

export function resetTemplate(name: string, url: string): MailTemplate {
  return {
    subject: 'Reset your ForenSecure password',
    text: `Hi ${name},\n\nUse this link to choose a new password:\n${url}\n\nThis link expires in 24 hours. If you didn't request it, ignore this email.`,
    html: layout(
      'Reset your password',
      `Hi ${name}, we received a request to reset your ForenSecure password.`,
      url,
      'Choose a new password'
    )
  };
}

let transporter: Transporter | null = null;

function getTransporter(config: MailerConfig): Transporter | null {
  if (!isMailerConfigured(config)) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.user ? { user: config.user, pass: config.pass } : undefined,
      tls: {
        rejectUnauthorized: false
      }
    });
  }
  return transporter;
}

/**
 * Sends a message, or logs it when SMTP is unconfigured.
 *
 * Never throws: a failed notification must not fail the request that triggered
 * it, or a flaky mail server turns "reset your password" into a 500. The return
 * value says whether it actually went out.
 */
export async function sendMail(to: string, template: MailTemplate, url?: string): Promise<boolean> {
  const config = readMailerConfig();
  const transport = getTransporter(config);

  if (!transport) {
    console.log(
      `\n=== EMAIL (SMTP not configured — logged instead) ===\n` +
      `To:      ${to}\n` +
      `Subject: ${template.subject}\n` +
      (url ? `Link:    ${url}\n` : '') +
      `====================================================\n`
    );
    return false;
  }

  try {
    await transport.sendMail({
      from: config.from,
      to,
      subject: template.subject,
      text: template.text,
      html: template.html
    });
    return true;
  } catch (error: any) {
    console.error(`[MAIL] Failed to send "${template.subject}" to ${to}:`, error.message);
    return false;
  }
}
