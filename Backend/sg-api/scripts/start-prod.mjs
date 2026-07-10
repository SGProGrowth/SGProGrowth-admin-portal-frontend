import { execSync } from 'node:child_process';

if (process.env.DB_MODE !== 'json' && process.env.DATABASE_URL) {
  try {
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  } catch {
    console.warn('migrate deploy failed — trying db push');
    execSync('npx prisma db push', { stdio: 'inherit' });
  }
}

await import('../dist/index.js');
