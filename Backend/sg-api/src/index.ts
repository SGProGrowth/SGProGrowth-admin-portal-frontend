import cors from 'cors';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { config } from './config.js';
import { getDbMode, initDb } from './db.js';
import { getAssistantStatus } from './services/assistant-agent.js';
import authRouter from './routes/auth.js';
import assistantRouter from './routes/assistant.js';
import entitiesRouter, { feedRouter } from './routes/entities.js';
import mailRouter from './routes/mail.js';
import paymentsRouter from './routes/payments.js';
import settingsRouter from './routes/settings.js';
import syncRouter from './routes/sync.js';
import uploadsRouter from './routes/uploads.js';
import usersRouter from './routes/users.js';

const app = express();
app.set('trust proxy', 1);

app.use(
  cors({
    origin: config.corsOrigins,
    credentials: true,
  }),
);
app.use(express.json({ limit: '2mb' }));

const uploadsPath = path.resolve(config.uploadsDir);
if (!fs.existsSync(uploadsPath)) fs.mkdirSync(uploadsPath, { recursive: true });
app.use('/uploads', express.static(uploadsPath));

app.get('/api/health', async (_req, res) => {
  const assistant = getAssistantStatus();
  res.json({
    ok: true,
    service: 'sg-api',
    db: getDbMode(),
    llm: assistant.llm ? 'configured' : 'off',
    time: new Date().toISOString(),
  });
});

app.use('/api/auth', authRouter);
app.use('/api/assistant', assistantRouter);
app.use('/api/entities', entitiesRouter);
app.use('/api/feed', feedRouter);
app.use('/api/users', usersRouter);
app.use('/api/uploads', uploadsRouter);
app.use('/api/mail', mailRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/sync/wordpress', syncRouter);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

async function start() {
  await initDb();
  app.listen(config.port, () => {
    console.log(`SG Pro Growth API running on http://localhost:${config.port}`);
  });
}

start().catch((err) => {
  console.error('Failed to start API:', err);
  process.exit(1);
});
