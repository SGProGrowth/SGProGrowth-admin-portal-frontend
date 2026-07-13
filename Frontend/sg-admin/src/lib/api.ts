import { getToken } from './auth';

const API_BASE = import.meta.env.VITE_API_URL ?? '/api';

// New NestJS backend (real LMS data: Postgres-backed users, courses, etc.).
// Same login/JWT is used for both — see LEGACY_JWT_ISSUER/AUDIENCE bridge on
// the new backend's TokenService. Falls back to API_BASE so this is a no-op
// until VITE_NEW_API_URL is actually set in the environment.
const NEW_API_BASE = import.meta.env.VITE_NEW_API_URL ?? API_BASE;

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      /* ignore */
    }
    throw new ApiError(message, res.status);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export function isApiEnabled(): boolean {
  return import.meta.env.VITE_USE_API !== 'false';
}

/** Same shape as apiFetch, but targets the new (NestJS/Prisma) backend. */
export async function newApiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${NEW_API_BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = (await res.json()) as { message?: string };
      if (body.message) message = body.message;
    } catch {
      /* ignore */
    }
    throw new ApiError(message, res.status);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
