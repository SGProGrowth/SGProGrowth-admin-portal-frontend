import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import nodemailer from 'nodemailer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const configPath = path.join(__dirname, '..', '..', 'data', 'mail-config.json');

export interface MailSettings {
  host: string;
  port: number;
  /** true = implicit TLS (port 465), false = STARTTLS on 587 */
  secure: boolean;
  username: string;
  password: string;
  fromEmail: string;
  fromName: string;
}

export interface MailSettingsPublic {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  fromEmail: string;
  fromName: string;
  passwordSet: boolean;
}

const DEFAULTS: MailSettings = {
  host: 'smtpout.secureserver.net',
  port: 587,
  secure: false,
  username: 'contact@sgprogrowth.com',
  password: '',
  fromEmail: 'contact@sgprogrowth.com',
  fromName: 'SG Pro Growth',
};

function readStored(): Partial<MailSettings> | null {
  try {
    if (!fs.existsSync(configPath)) return null;
    return JSON.parse(fs.readFileSync(configPath, 'utf-8')) as Partial<MailSettings>;
  } catch {
    return null;
  }
}

function writeStored(data: MailSettings) {
  const dir = path.dirname(configPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(data, null, 2));
}

export function getMailSettings(): MailSettings {
  const stored = readStored();
  return {
    host: stored?.host?.trim() || process.env.SMTP_HOST || DEFAULTS.host,
    port: stored?.port ?? Number(process.env.SMTP_PORT || DEFAULTS.port),
    secure: stored?.secure ?? DEFAULTS.secure,
    username: stored?.username?.trim() || process.env.SMTP_USER || DEFAULTS.username,
    password: stored?.password || process.env.SMTP_PASS || '',
    fromEmail: stored?.fromEmail?.trim() || process.env.SMTP_FROM || DEFAULTS.fromEmail,
    fromName: stored?.fromName?.trim() || DEFAULTS.fromName,
  };
}

export function getMailSettingsPublic(): MailSettingsPublic {
  const s = getMailSettings();
  return {
    host: s.host,
    port: s.port,
    secure: s.secure,
    username: s.username,
    fromEmail: s.fromEmail,
    fromName: s.fromName,
    passwordSet: Boolean(s.password),
  };
}

export function isMailConfigured(): boolean {
  const s = getMailSettings();
  return Boolean(s.host && s.username && s.password);
}

export function saveMailSettings(input: Partial<MailSettings>): MailSettingsPublic {
  const current = getMailSettings();
  const next: MailSettings = {
    host: input.host?.trim() || current.host,
    port: input.port ? Number(input.port) : current.port,
    secure: input.secure ?? current.secure,
    username: input.username?.trim() || current.username,
    // Empty password in the request means "keep the saved one"
    password: input.password?.trim() ? input.password.trim() : current.password,
    fromEmail: input.fromEmail?.trim() || current.fromEmail,
    fromName: input.fromName?.trim() || current.fromName,
  };
  writeStored(next);
  return getMailSettingsPublic();
}

function createTransport(s: MailSettings) {
  return nodemailer.createTransport({
    host: s.host,
    port: s.port,
    secure: s.secure, // false on 587 → nodemailer upgrades via STARTTLS
    requireTLS: !s.secure,
    auth: { user: s.username, pass: s.password },
  });
}

export async function testMailConnection(): Promise<{ ok: boolean; message: string }> {
  if (!isMailConfigured()) {
    return { ok: false, message: 'SMTP password not set. Save your password first.' };
  }
  const s = getMailSettings();
  try {
    await createTransport(s).verify();
    return { ok: true, message: `Connected to ${s.host}:${s.port} as ${s.username}` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, message: `SMTP connection failed: ${msg.slice(0, 200)}` };
  }
}

export async function sendMail(input: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}): Promise<{ ok: boolean; message: string }> {
  if (!isMailConfigured()) {
    return { ok: false, message: 'SMTP is not configured. Set the password in Settings → Email / SMTP.' };
  }
  const s = getMailSettings();
  try {
    const info = await createTransport(s).sendMail({
      from: `"${s.fromName}" <${s.fromEmail}>`,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });
    return { ok: true, message: `Email sent to ${input.to} (id: ${info.messageId})` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, message: `Send failed: ${msg.slice(0, 200)}` };
  }
}
