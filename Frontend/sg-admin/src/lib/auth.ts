import { decodeJwt } from 'jose';
import type { JWTPayload } from 'jose';
import { useEffect, useState } from 'react';
import type { AuthUser } from '../types';
import { apiFetch, isApiEnabled } from './api';

const KEY = 'sgpro_user';
const AVATAR_KEY = 'sgpro_avatar';
const TOKEN_KEY = 'sgpro_jwt';

/*
 * NOTE: This client never signs or verifies JWTs with a shared secret.
 * Tokens are issued exclusively by the backend (/auth/login) and are only
 * decoded here (not verified) for reading claims to drive the UI. Trust in
 * a token's validity always comes from the backend rejecting bad/expired
 * tokens on each API call - never from a client-side signature check.
 */

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

  return {
    type: 'error',
    message: 'API is disabled (VITE_USE_API=false). Offline demo login has been removed for security reasons — connect a backend to sign in.',
  };
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

  return null;
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
