import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

/**
 * Neon free-tier databases auto-suspend after ~5 min of inactivity.
 * This helper retries once after a short delay when the DB is waking up.
 */
export async function withRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 2000): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      const isConnErr =
        err instanceof Error &&
        (err.message.includes("Can't reach database") ||
          err.message.includes('connect ECONNREFUSED') ||
          err.message.includes('Connection refused'));
      if (isConnErr && attempt < retries) {
        console.warn(`[DB] Connection error (attempt ${attempt}/${retries}), retrying in ${delayMs}ms…`);
        await new Promise((r) => setTimeout(r, delayMs));
      } else {
        throw err;
      }
    }
  }
  throw new Error('unreachable');
}
