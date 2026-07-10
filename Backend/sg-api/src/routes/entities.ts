import { Router } from 'express';
import { isEntityKey } from '../config.js';
import {
  createRecord,
  deleteRecord,
  getActivities,
  getAllEntities,
  getEntity,
  getMessages,
  markMessageRead,
  resetEntities,
  updateRecord,
} from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import type { EntityRecord } from '../types.js';

const router = Router();

router.use(requireAuth);

router.get('/', async (_req, res) => {
  res.json(await getAllEntities());
});

router.post('/reset', async (_req, res) => {
  res.json(await resetEntities());
});

router.get('/:entity', async (req, res) => {
  const entity = req.params.entity;
  if (!isEntityKey(entity)) {
    res.status(404).json({ error: 'Unknown entity' });
    return;
  }
  res.json(await getEntity(entity));
});

router.post('/:entity', async (req, res) => {
  const entity = req.params.entity;
  if (!isEntityKey(entity)) {
    res.status(404).json({ error: 'Unknown entity' });
    return;
  }

  const body = req.body as Omit<EntityRecord, 'id'>;
  const record = await createRecord(entity, body);
  res.status(201).json(record);
});

router.patch('/:entity/:id', async (req, res) => {
  const entity = req.params.entity;
  const id = Number(req.params.id);
  if (!isEntityKey(entity) || Number.isNaN(id)) {
    res.status(400).json({ error: 'Invalid entity or id' });
    return;
  }

  const updated = await updateRecord(entity, id, req.body);
  if (!updated) {
    res.status(404).json({ error: 'Record not found' });
    return;
  }
  res.json(updated);
});

router.delete('/:entity/:id', async (req, res) => {
  const entity = req.params.entity;
  const id = Number(req.params.id);
  if (!isEntityKey(entity) || Number.isNaN(id)) {
    res.status(400).json({ error: 'Invalid entity or id' });
    return;
  }

  const ok = await deleteRecord(entity, id);
  if (!ok) {
    res.status(404).json({ error: 'Record not found' });
    return;
  }
  res.status(204).send();
});

export default router;

export const feedRouter = Router();

feedRouter.use(requireAuth);

feedRouter.get('/activities', async (_req, res) => {
  res.json(await getActivities());
});

feedRouter.get('/messages', async (_req, res) => {
  res.json(await getMessages());
});

feedRouter.patch('/messages/:id/read', async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: 'Invalid id' });
    return;
  }
  const ok = await markMessageRead(id);
  if (!ok) {
    res.status(404).json({ error: 'Message not found' });
    return;
  }
  res.status(204).send();
});
