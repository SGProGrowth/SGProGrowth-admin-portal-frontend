import { Router } from 'express';
import type { AuthedRequest } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';
import { requireAuth } from '../middleware/auth.js';
import {
  getAssistantConfig,
  getAssistantStatus,
  runAssistantChat,
  saveAssistantConfig,
  testLlmConnection,
} from '../services/assistant-agent.js';

const router = Router();

router.use(requireAuth);

router.get('/status', (_req, res) => {
  res.json(getAssistantStatus());
});

router.get('/config', requireAdmin, (_req, res) => {
  res.json(getAssistantConfig());
});

router.patch('/config', requireAdmin, async (req, res) => {
  const body = req.body as {
    provider?: 'openai' | 'groq' | 'ollama' | 'custom';
    apiKey?: string;
    baseUrl?: string;
    model?: string;
  };
  const saved = await saveAssistantConfig(body);
  res.json(saved);
});

router.post('/test', requireAdmin, async (_req, res) => {
  const result = await testLlmConnection();
  res.json(result);
});

router.post('/chat', async (req: AuthedRequest, res) => {
  const body = req.body as {
    messages?: { role: 'user' | 'assistant'; content: string }[];
  };

  if (!body.messages?.length) {
    res.status(400).json({ error: 'messages array is required' });
    return;
  }

  const result = await runAssistantChat({
    messages: body.messages,
    userName: req.user?.name,
    userRole: req.user?.role,
  });

  res.json(result);
});

export default router;
