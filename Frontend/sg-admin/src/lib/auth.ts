import { SignJWT, decodeJwt, jwtVerify } from 'jose';
import type { JWTPayload } from 'jose';
import { useEffect, useState } from 'react';
import type { AuthUser } from '../types';
import { apiFetch, isApiEnabled } from './api';

const KEY = 'sgpro_user';
const AVATAR_KEY = 'sgpro_avatar';
const TOKEN_KEY = 'sgpro_jwt';

/* Must match Backend/sg-api JWT_SECRET for token verification. */
const JWT_SECRET = new TextEncoder().encode(
  import.meta.env.VITE_JWT_SECRET ?? 'sgpro-demo-secret-key-change-me-0xA1B2C3D4E5F6',
);
const JWT_ISSUER = import.meta.env.VITE_JWT_ISSUER ?? 'sgprogrowth-admin';
const JWT_AUDIENCE = import.meta.env.VITE_JWT_AUDIENCE ?? 'sgprogrowth-portal';

interface Account {
  password: string;
  role: AuthUser['role'];
  name: string;
}

/** Offline fallback when VITE_USE_API=false */
export const ACCOUNTS: Record<string, Account> = {
  'maheshmd@sharvagroup.com': { password: 'Growth$108@1610', role: 'admin', name: 'Mahesh MD' },
};

/* ----------------------------- JWT helpers ----------------------------- */

export async function issueToken(user: AuthUser): Promise<string> {
  return await new SignJWT({ name: user.name, role: user.role, email: user.email })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(user.email)
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(JWT_SECRET);
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function saveSession(user: AuthUser, token: string) {
  localStorage.setItem(KEY, JSON.stringify(user));
  setToken(token);
  window.dispatchEvent(new Event('sgpro-auth'));
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

/** Cryptographically verify the token signature + claims (async). */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
    return payload;
  } catch {
    return null;
  }
}

/** Decode without verifying — for displaying claims in the UI. */
export function decodeToken(token: string): JWTPayload | null {
  try {
    return decodeJwt(token);
  } catch {
    return null;
  }
}

/** Fast, synchronous guard: a token exists and has not expired. */
export function hasValidToken(): boolean {
  const token = getToken();
  if (!token) return false;
  const claims = decodeToken(token);
  if (!claims?.exp) return false;
  return claims.exp * 1000 > Date.now();
}

/** React hook that exposes the decoded JWT claims, refreshing on change. */
export function useToken(): { token: string | null; claims: JWTPayload | null } {
  const [token, setTok] = useState<string | null>(getToken());
  useEffect(() => {
    const handler = () => setTok(getToken());
    window.addEventListener('storage', handler);
    window.addEventListener('sgpro-auth', handler);
    return () => {
      window.removeEventListener('storage', handler);
      window.removeEventListener('sgpro-auth', handler);
    };
  }, []);
  return { token, claims: token ? decodeToken(token) : null };
}

export function getUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const u = JSON.parse(raw) as AuthUser;
    return u.loggedIn ? u : null;
  } catch {
    return null;
  }
}

/** Email + password login. Uses API when enabled, otherwise local demo auth. */
export type LoginResult =
  | { type: 'success'; user: AuthUser }
  | { type: '2fa_required'; tempToken: string }
  | { type: 'error'; message: string };

export async function loginWithResult(email: string, password: string): Promise<LoginResult> {
  const normalized = email.trim().toLowerCase();

  if (isApiEnabled()) {
    try {
      const res = await apiFetch<
        { user: AuthUser; token: string } | { requires2fa: boolean; tempToken: string }
      >('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: normalized, password }),
      });

      if ('requires2fa' in res && res.requires2fa) {
        return { type: '2fa_required', tempToken: res.tempToken };
      }

      const full = res as { user: AuthUser; token: string };
      localStorage.setItem(KEY, JSON.stringify(full.user));
      setToken(full.token);
      window.dispatchEvent(new Event('sgpro-auth'));
      return { type: 'success', user: full.user };
    } catch (e) {
      return { type: 'error', message: e instanceof Error ? e.message : 'Login failed' };
    }
  }

  const account = ACCOUNTS[normalized];
  if (!account || account.password !== password) return { type: 'error', message: 'Invalid email or password' };
  const user: AuthUser = { loggedIn: true, email: normalized, name: account.name, role: account.role };
  localStorage.setItem(KEY, JSON.stringify(user));
  setToken(await issueToken(user));
  window.dispatchEvent(new Event('sgpro-auth'));
  return { type: 'success', user };
}

export async function login(email: string, password: string): Promise<AuthUser | null> {
  const normalized = email.trim().toLowerCase();

  if (isApiEnabled()) {
    try {
      const res = await apiFetch<{ user: AuthUser; token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: normalized, password }),
      });
      localStorage.setItem(KEY, JSON.stringify(res.user));
      setToken(res.token);
      window.dispatchEvent(new Event('sgpro-auth'));
      return res.user;
    } catch {
      return null;
    }
  }

  const account = ACCOUNTS[normalized];
  if (!account || account.password !== password) return null;
  const user: AuthUser = {
    loggedIn: true,
    email: normalized,
    name: account.name,
    role: account.role,
  };
  localStorage.setItem(KEY, JSON.stringify(user));
  setToken(await issueToken(user));
  window.dispatchEvent(new Event('sgpro-auth'));
  return user;
}

export function logout() {
  localStorage.removeItem(KEY);
  clearToken();
  window.dispatchEvent(new Event('sgpro-auth'));
}

export function getAvatar(): string | null {
  try {
    return localStorage.getItem(AVATAR_KEY);
  } catch {
    return null;
  }
}

export function setAvatar(dataUrl: string) {
  localStorage.setItem(AVATAR_KEY, dataUrl);
  window.dispatchEvent(new Event('sgpro-avatar'));
}

export function clearAvatar() {
  localStorage.removeItem(AVATAR_KEY);
  window.dispatchEvent(new Event('sgpro-avatar'));
}

/** Reactive avatar hook — updates everywhere when the photo changes. */
export function useAvatar(): string | null {
  const [src, setSrc] = useState<string | null>(getAvatar());
  useEffect(() => {
    const handler = () => setSrc(getAvatar());
    window.addEventListener('sgpro-avatar', handler);
    return () => window.removeEventListener('sgpro-avatar', handler);
  }, []);
  return src;
}

export function initials(name: string): string {
  return name
    .split(/[@\s.]+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}
