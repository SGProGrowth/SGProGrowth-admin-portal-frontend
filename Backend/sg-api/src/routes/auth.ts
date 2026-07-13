import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as OTPAuth from 'otpauth';
import { randomBytes } from 'node:crypto';

/** Generate a 32-char Base32 secret using only A-Z and 2-7 (RFC 4648) */
function generateBase32Secret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const bytes = randomBytes(20);
  let secret = '';
  for (let i = 0; i < 32; i++) secret += chars[bytes[i] % 32];
  return secret;
}
import QRCode from 'qrcode';
import { Router } from 'express';
import { findUserByEmail, findUserById, update2fa, updateUser } from '../db.js';
import { config } from '../config.js';
import { requireAuth, signToken } from '../middleware/auth.js';
import type { AuthedRequest } from '../middleware/auth.js';
import { getSettings, validatePassword } from '../services/settings-config.js';

const router = Router();

// ── Login ─────────────────────────────────────────────────────────────────────

router.post('/login', async (req, res) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  const password = String(req.body?.password ?? '');

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const account = await findUserByEmail(email);
  if (!account?.passwordHash || !bcrypt.compareSync(password, account.passwordHash)) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const settings = getSettings();
  const isAdmin = account.role === 'admin' || account.role === 'Administrator';
  if (settings.security.require2faForAdmins && isAdmin && !account.twoFactorEnabled) {
    res.status(403).json({
      error: 'Two-factor authentication is required for admin accounts. Enable 2FA in Profile → Security first.',
    });
    return;
  }

  // If 2FA is enabled, issue a short-lived temp token and ask for OTP
  if (account.twoFactorEnabled && account.twoFactorSecret) {
    const tempToken = jwt.sign(
      { sub: String(account.id), step: '2fa' },
      config.jwtSecret,
      { expiresIn: '5m', issuer: config.jwtIssuer },
    );
    res.json({ requires2fa: true, tempToken });
    return;
  }

  const user = { email: account.email, name: account.name, role: account.role as 'admin' | 'instructor' | 'student' };
  res.json({ user: { ...user, loggedIn: true }, token: signToken(user) });
});

// ── 2FA login verify ──────────────────────────────────────────────────────────

router.post('/2fa/login', async (req, res) => {
  const tempToken = String(req.body?.tempToken ?? '');
  const code = String(req.body?.code ?? '').replace(/\s/g, '');

  let payload: { sub?: string; step?: string };
  try {
    payload = jwt.verify(tempToken, config.jwtSecret, { issuer: config.jwtIssuer }) as typeof payload;
  } catch {
    res.status(401).json({ error: 'Temp token expired or invalid — please log in again' });
    return;
  }

  if (payload.step !== '2fa' || !payload.sub) {
    res.status(401).json({ error: 'Invalid token type' });
    return;
  }

  const account = await findUserById(Number(payload.sub));
  if (!account?.twoFactorSecret) {
    res.status(401).json({ error: 'User not found or 2FA not configured' });
    return;
  }

  const totp = new OTPAuth.TOTP({
    issuer: 'SG Pro Growth',
    label: account.email,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(account.twoFactorSecret),
  });
  const delta = totp.validate({ token: code, window: 4 });
  if (delta === null) {
    res.status(401).json({ error: 'Incorrect code — try again' });
    return;
  }

  const user = { email: account.email, name: account.name, role: account.role as 'admin' | 'instructor' | 'student' };
  res.json({ user: { ...user, loggedIn: true }, token: signToken(user) });
});

router.get('/time', (_req, res) => {
  const now = new Date();
  res.json({
    serverTime: now.toISOString(),
    epochSeconds: Math.floor(now.getTime() / 1000),
    period: Math.floor(now.getTime() / 1000 / 30),
  });
});

// ── /me ───────────────────────────────────────────────────────────────────────

router.get('/me', requireAuth, (req: AuthedRequest, res) => {
  const claims = req.user!;
  res.json({
    user: { loggedIn: true, email: claims.email ?? claims.sub, name: claims.name, role: claims.role },
    claims,
  });
});

// ── Change password ───────────────────────────────────────────────────────────

router.post('/change-password', requireAuth, async (req: AuthedRequest, res) => {
  const { currentPassword, newPassword } = req.body as { currentPassword?: string; newPassword?: string };

  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: 'currentPassword and newPassword are required' });
    return;
  }

  const settings = getSettings();
  const pwdError = validatePassword(newPassword, settings.security.forceStrongPasswords);
  if (pwdError) {
    res.status(400).json({ error: pwdError });
    return;
  }

  const email = req.user!.email ?? req.user!.sub;
  const account = await findUserByEmail(String(email));
  if (!account?.passwordHash || !bcrypt.compareSync(currentPassword, account.passwordHash)) {
    res.status(401).json({ error: 'Current password is incorrect' });
    return;
  }

  await updateUser(account.id, { password: newPassword });
  res.json({ ok: true, message: 'Password updated successfully' });
});

// ── 2FA setup — generate secret & QR code ────────────────────────────────────

router.get('/2fa/setup', requireAuth, async (req: AuthedRequest, res) => {
  const email = String(req.user!.email ?? req.user!.sub);
  const account = await findUserByEmail(email);
  if (!account) { res.status(404).json({ error: 'User not found' }); return; }

  // Generate a fresh clean Base32 secret
  const secret = generateBase32Secret();
  const totp = new OTPAuth.TOTP({
    issuer: 'SG Pro Growth',
    label: account.email,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });
  const otpauthUrl = totp.toString();
  const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);

  // Store secret temporarily (not enabled yet — user must verify first)
  await update2fa(account.id, { twoFactorSecret: secret, twoFactorEnabled: false });

  res.json({
    secret,
    qrCodeUrl,
    enabled: false,
    message: 'Scan the QR code in Google Authenticator, then call /api/auth/2fa/enable with a valid code',
  });
});

// ── 2FA enable — verify first TOTP code ──────────────────────────────────────

router.post('/2fa/enable', requireAuth, async (req: AuthedRequest, res) => {
  const code = String(req.body?.code ?? '').replace(/\s/g, '');
  if (!code) { res.status(400).json({ error: 'code is required' }); return; }

  const email = String(req.user!.email ?? req.user!.sub);
  const account = await findUserByEmail(email);
  if (!account?.twoFactorSecret) {
    res.status(400).json({ error: 'No 2FA secret found — call /api/auth/2fa/setup first' });
    return;
  }

  const totp = new OTPAuth.TOTP({
    issuer: 'SG Pro Growth',
    label: account.email,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(account.twoFactorSecret),
  });
  const delta = totp.validate({ token: code, window: 4 });
  if (delta === null) {
    res.status(401).json({ error: 'Invalid code — make sure the time on your device is correct' });
    return;
  }

  await update2fa(account.id, { twoFactorEnabled: true });
  res.json({ ok: true, enabled: true, message: '2FA enabled successfully' });
});

// ── 2FA disable ───────────────────────────────────────────────────────────────

router.post('/2fa/disable', requireAuth, async (req: AuthedRequest, res) => {
  const { password, code } = req.body as { password?: string; code?: string };
  if (!password && !code) {
    res.status(400).json({ error: 'Provide your current password or a valid TOTP code to disable 2FA' });
    return;
  }

  const email = String(req.user!.email ?? req.user!.sub);
  const account = await findUserByEmail(email);
  if (!account) { res.status(404).json({ error: 'User not found' }); return; }

  const passwordOk = password ? bcrypt.compareSync(password, account.passwordHash) : false;
  const codeOk = (code && account.twoFactorSecret)
    ? (() => {
        const totp = new OTPAuth.TOTP({
          issuer: 'SG Pro Growth',
          label: account.email,
          algorithm: 'SHA1',
          digits: 6,
          period: 30,
          secret: OTPAuth.Secret.fromBase32(account.twoFactorSecret!),
        });
        return totp.validate({ token: code.replace(/\s/g, ''), window: 4 }) !== null;
      })()
    : false;

  if (!passwordOk && !codeOk) {
    res.status(401).json({ error: 'Invalid password or TOTP code' });
    return;
  }

  await update2fa(account.id, { twoFactorSecret: null, twoFactorEnabled: false });
  res.json({ ok: true, enabled: false, message: '2FA disabled' });
});

// ── 2FA status ────────────────────────────────────────────────────────────────

router.get('/2fa/status', requireAuth, async (req: AuthedRequest, res) => {
  const email = String(req.user!.email ?? req.user!.sub);
  const account = await findUserByEmail(email);
  res.json({ enabled: account?.twoFactorEnabled ?? false });
});

// ── 2FA debug (dev only) — shows current expected code ───────────────────────

router.get('/2fa/debug', requireAuth, async (req: AuthedRequest, res) => {
  const email = String(req.user!.email ?? req.user!.sub);
  const account = await findUserByEmail(email);
  if (!account?.twoFactorSecret) {
    res.json({ error: 'No 2FA secret stored' }); return;
  }
  const totp = new OTPAuth.TOTP({
    issuer: 'SG Pro Growth', label: account.email,
    algorithm: 'SHA1', digits: 6, period: 30,
    secret: OTPAuth.Secret.fromBase32(account.twoFactorSecret),
  });
  const currentCode = totp.generate();
  const serverTime = new Date().toISOString();
  const epoch = Math.floor(Date.now() / 1000);
  res.json({ currentCode, serverTime, epochSeconds: epoch, period: Math.floor(epoch / 30), secret: account.twoFactorSecret });
});

export default router;
