import { Router } from 'express';
import { requireAdmin } from '../middleware/admin.js';
import { requireAuth } from '../middleware/auth.js';
import { getSettings, saveSettings, type PortalSettings } from '../services/settings-config.js';

const router = Router();

router.use(requireAuth, requireAdmin);

router.get('/', (_req, res) => {
  res.json(getSettings());
});

router.patch('/', (req, res) => {
  const body = req.body as Partial<PortalSettings>;
  res.json(saveSettings(body));
});

export default router;
