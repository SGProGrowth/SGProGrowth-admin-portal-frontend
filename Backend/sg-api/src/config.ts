import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  jwtSecret: process.env.JWT_SECRET ?? 'sgpro-demo-secret-key-change-me-0xA1B2C3D4E5F6',
  jwtIssuer: process.env.JWT_ISSUER ?? 'sgprogrowth-admin',
  jwtAudience: process.env.JWT_AUDIENCE ?? 'sgprogrowth-portal',
  corsOrigins: (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  jsonDbPath: process.env.JSON_DB_PATH ?? 'data/sgpro.json',
  uploadsDir: process.env.UPLOADS_DIR ?? 'uploads',
  wpBaseUrl: process.env.WP_BASE_URL ?? 'https://sharvaconsulting.com',
  wpAdminUser: process.env.WP_ADMIN_USER ?? '',
  wpAppPass: process.env.WP_APP_PASS ?? process.env.WP_ADMIN_PASS ?? '',
  llmApiKey: process.env.LLM_API_KEY ?? '',
  llmBaseUrl: (process.env.LLM_BASE_URL ?? 'https://api.openai.com/v1').replace(/\/$/, ''),
  llmModel: process.env.LLM_MODEL ?? 'gpt-4o-mini',
};

export const ENTITY_KEYS = [
  'courses',
  'quizzes',
  'questions',
  'assignments',
  'students',
  'instructors',
  'groups',
  'discussions',
  'certificates',
  'events',
] as const;

export type EntityKey = (typeof ENTITY_KEYS)[number];

export function isEntityKey(key: string): key is EntityKey {
  return (ENTITY_KEYS as readonly string[]).includes(key);
}
