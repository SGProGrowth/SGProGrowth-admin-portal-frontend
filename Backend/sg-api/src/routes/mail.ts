import { Router } from 'express';
import { requireAdmin } from '../middleware/admin.js';
import { requireAuth } from '../middleware/auth.js';
import {
  getMailSettingsPublic,
  saveMailSettings,
  sendMail,
  testMailConnection,
} from '../services/mail-config.js';

const router = Router();

router.use(requireAuth, requireAdmin);

router.get('/config', (_req, res) => {
  res.json(getMailSettingsPublic());
});

router.patch('/config', (req, res) => {
  const body = req.body as {
    host?: string;
    port?: number;
    secure?: boolean;
    username?: string;
    password?: string;
    fromEmail?: string;
    fromName?: string;
  };
  res.json(saveMailSettings(body));
});

router.post('/test', async (_req, res) => {
  res.json(await testMailConnection());
});

router.post('/send-test', async (req, res) => {
  const { to } = req.body as { to?: string };
  if (!to?.trim() || !to.includes('@')) {
    res.status(400).json({ ok: false, message: 'A valid "to" email address is required' });
    return;
  }
  const result = await sendMail({
    to: to.trim(),
    subject: 'SG Pro Growth — SMTP test email',
    text: 'Your SMTP settings are working. This test email was sent from the SG Pro Growth admin portal.',
    html: '<p>Your SMTP settings are working.</p><p>This test email was sent from the <strong>SG Pro Growth</strong> admin portal.</p>',
  });
  res.status(result.ok ? 200 : 502).json(result);
});

/** Real compose endpoint — admin sends any email from the portal */
router.post('/compose', async (req, res) => {
  const { to, subject, body: text } = req.body as {
    to?: string;
    subject?: string;
    body?: string;
  };
  if (!to?.trim() || !to.includes('@')) {
    res.status(400).json({ ok: false, message: 'A valid recipient email is required' });
    return;
  }
  if (!subject?.trim()) {
    res.status(400).json({ ok: false, message: 'Subject is required' });
    return;
  }
  const html = text
    ? `<div style="font-family:sans-serif;font-size:14px;line-height:1.6">${text.replace(/\n/g, '<br/>')}</div>`
    : undefined;
  const result = await sendMail({ to: to.trim(), subject: subject.trim(), text: text ?? '', html });
  res.status(result.ok ? 200 : 502).json(result);
});

export default router;
