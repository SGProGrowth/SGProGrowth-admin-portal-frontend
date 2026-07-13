import { Router } from 'express';
import { isEntityKey } from '../config.js';
import {
  createRecord,
  deleteRecord,
  getEntity,
  getAllEntities,
  resetEntities,
  updateRecord,
} from '../db.js';
import { getActivityFeed, logEntityActivity } from '../services/activity-feed.js';
import { notifyAdminIfEnabled } from '../services/notifications.js';
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

async function handleNotifications(
  entity: string,
  action: 'created' | 'updated',
  record: EntityRecord,
  prev?: EntityRecord,
) {
  if (entity === 'students' && action === 'created') {
    await notifyAdminIfEnabled(
      'enrollment',
      'New student enrollment',
      `${String(record.name ?? 'A student')} joined the platform.`,
    );
  }

  if (entity === 'certificates' && action === 'created') {
    await notifyAdminIfEnabled(
      'completion',
      'Course completion',
      `${String(record.student ?? record.name ?? 'A student')} earned a certificate for ${String(record.course ?? 'a course')}.`,
    );
  }

  if (entity === 'students' && action === 'updated' && prev) {
    const newProgress = Number(record.progress ?? 0);
    const oldProgress = Number(prev.progress ?? 0);
    if (newProgress >= 100 && oldProgress < 100) {
      await notifyAdminIfEnabled(
        'completion',
        'Course completion',
        `${String(record.name ?? 'A student')} completed all enrolled courses.`,
      );
    }
  }

  if (entity === 'courses' && action === 'updated' && prev) {
    const newReviews = Number(record.reviews ?? 0);
    const oldReviews = Number(prev.reviews ?? 0);
    if (newReviews > oldReviews) {
      await notifyAdminIfEnabled(
        'review',
        'New course review',
        `A new review was posted on "${String(record.title ?? 'a course')}".`,
      );
    }
  }
}

router.post('/:entity', async (req, res) => {
  const entity = req.params.entity;
  if (!isEntityKey(entity)) {
    res.status(404).json({ error: 'Unknown entity' });
    return;
  }

  const body = req.body as Omit<EntityRecord, 'id'>;
  const record = await createRecord(entity, body);
  await logEntityActivity(entity, 'created', record);
  void handleNotifications(entity, 'created', record);
  res.status(201).json(record);
});

router.patch('/:entity/:id', async (req, res) => {
  const entity = req.params.entity;
  const id = Number(req.params.id);
  if (!isEntityKey(entity) || Number.isNaN(id)) {
    res.status(400).json({ error: 'Invalid entity or id' });
    return;
  }

  const rows = await getEntity(entity);
  const prev = rows.find((r) => r.id === id);
  const updated = await updateRecord(entity, id, req.body);
  if (!updated) {
    res.status(404).json({ error: 'Record not found' });
    return;
  }
  await logEntityActivity(entity, 'updated', updated, prev);
  void handleNotifications(entity, 'updated', updated, prev);
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
  await logEntityActivity(entity, 'deleted');
  res.status(204).send();
});

export default router;

export const feedRouter = Router();

feedRouter.use(requireAuth);

feedRouter.get('/activities', async (_req, res) => {
  res.json(await getActivityFeed());
});

feedRouter.get('/messages', async (_req, res) => {
  const { getMessages } = await import('../db.js');
  res.json(await getMessages());
});

feedRouter.patch('/messages/:id/read', async (req, res) => {
  const { markMessageRead } = await import('../db.js');
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
