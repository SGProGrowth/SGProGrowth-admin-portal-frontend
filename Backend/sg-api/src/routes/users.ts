import { Router } from 'express';
import { createUser, deleteUser, listUsers, updateUser } from '../db.js';
import { requireAdmin } from '../middleware/admin.js';
import { requireAuth } from '../middleware/auth.js';
import { getSettings, validatePassword } from '../services/settings-config.js';

const router = Router();

router.use(requireAuth, requireAdmin);

router.get('/', async (_req, res) => {
  res.json(await listUsers());
});

router.post('/', async (req, res) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  const name = String(req.body?.name ?? '').trim();
  const role = String(req.body?.role ?? 'instructor');
  const password = String(req.body?.password ?? '');

  if (!email || !name || !password) {
    res.status(400).json({ error: 'Email, name and password are required' });
    return;
  }

  const settings = getSettings();
  if (role === 'instructor' && !settings.roles.allowInstructorSelfSignup) {
    res.status(403).json({ error: 'Instructor self-signup is disabled in portal settings' });
    return;
  }
  if (role === 'student' && !settings.roles.openStudentRegistration) {
    res.status(403).json({ error: 'Open student registration is disabled in portal settings' });
    return;
  }

  const pwdError = validatePassword(password, settings.security.forceStrongPasswords);
  if (pwdError) {
    res.status(400).json({ error: pwdError });
    return;
  }

  try {
    const user = await createUser({ email, name, role, password });
    res.status(201).json(user);
  } catch (e) {
    res.status(409).json({ error: e instanceof Error ? e.message : 'Could not create user' });
  }
});

router.patch('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: 'Invalid id' });
    return;
  }

  const patch: { name?: string; role?: string; password?: string } = {};
  if (req.body?.name) patch.name = String(req.body.name);
  if (req.body?.role) patch.role = String(req.body.role);
  if (req.body?.password) patch.password = String(req.body.password);

  if (patch.password) {
    const settings = getSettings();
    const pwdError = validatePassword(patch.password, settings.security.forceStrongPasswords);
    if (pwdError) {
      res.status(400).json({ error: pwdError });
      return;
    }
  }

  const updated = await updateUser(id, patch);
  if (!updated) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json(updated);
});

router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: 'Invalid id' });
    return;
  }

  const ok = await deleteUser(id);
  if (!ok) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.status(204).send();
});

export default router;
