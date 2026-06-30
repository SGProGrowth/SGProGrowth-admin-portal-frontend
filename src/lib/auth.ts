import { useEffect, useState } from 'react';
import type { AuthUser } from '../types';

const KEY = 'sgpro_user';
const AVATAR_KEY = 'sgpro_avatar';

interface Account {
  password: string;
  role: AuthUser['role'];
  name: string;
}

export const ACCOUNTS: Record<string, Account> = {
  'maheshmd@sharvagroup.com': { password: 'REDACTED', role: 'admin', name: 'Mahesh MD' },
};

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

export function login(email: string, password: string): AuthUser | null {
  const account = ACCOUNTS[email.trim().toLowerCase()];
  if (!account || account.password !== password) return null;
  const user: AuthUser = {
    loggedIn: true,
    email: email.trim().toLowerCase(),
    name: account.name,
    role: account.role,
  };
  localStorage.setItem(KEY, JSON.stringify(user));
  return user;
}

export function logout() {
  localStorage.removeItem(KEY);
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
