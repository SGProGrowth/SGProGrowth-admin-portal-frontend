import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { apiFetch, isApiEnabled } from './api';
import { hasValidToken } from './auth';

export interface PortalSettings {
  general: {
    siteTitle: string;
    tagline: string;
    supportEmail: string;
    supportPhone: string;
    adminEmail: string;
    siteUrl: string;
    description: string;
    copyright: string;
  };
  branding: {
    primary: string;
    accent: string;
    logo: string;
    siteName: string;
    tagline: string;
    certTemplate: string;
    certTemplateName: string;
  };
  localization: {
    currency: string;
    language: string;
    timezone: string;
    dateFormat: string;
  };
  roles: {
    allowInstructorSelfSignup: boolean;
    openStudentRegistration: boolean;
  };
  security: {
    require2faForAdmins: boolean;
    forceStrongPasswords: boolean;
    autoSignOut: boolean;
    sessionTimeoutMinutes: number;
  };
  notifications: {
    enroll: boolean;
    complete: boolean;
    reviews: boolean;
    weekly: boolean;
    payments: boolean;
  };
  profileNotifications: {
    updates: boolean;
    messages: boolean;
    marketing: boolean;
  };
}

const DEFAULTS: PortalSettings = {
  general: {
    siteTitle: 'SG Pro Growth',
    tagline: 'Training minds. Transforming businesses.',
    supportEmail: 'contact@sgprogrowth.com',
    supportPhone: '+91 98765 43210',
    adminEmail: 'maheshmd@sharvagroup.com',
    siteUrl: 'https://sharvaconsulting.com',
    description:
      'SGProGrowth gives you personally synergised career guidance before you enrol in any training — so you learn with purpose and grow with confidence.',
    copyright: '© sharvagroup. All rights reserved.',
  },
  branding: {
    primary: '#1a4d3e',
    accent: '#248f6f',
    logo: 'https://sharvaconsulting.com/wp-content/uploads/2025/08/cropped-1000325607-1.jpeg',
    siteName: 'SG Pro Growth',
    tagline: 'Training minds. Transforming businesses.',
    certTemplate: '',
    certTemplateName: '',
  },
  localization: {
    currency: 'INR (₹)',
    language: 'English (India)',
    timezone: 'Asia/Kolkata (GMT+5:30)',
    dateFormat: 'DD/MM/YYYY',
  },
  roles: {
    allowInstructorSelfSignup: false,
    openStudentRegistration: true,
  },
  security: {
    require2faForAdmins: false,
    forceStrongPasswords: true,
    autoSignOut: false,
    sessionTimeoutMinutes: 30,
  },
  notifications: {
    enroll: true,
    complete: true,
    reviews: true,
    weekly: false,
    payments: true,
  },
  profileNotifications: {
    updates: true,
    messages: true,
    marketing: false,
  },
};

const STORAGE_PREFIX = 'sgpro_setting_';

function lsKey(path: string) {
  return STORAGE_PREFIX + path.replace(/\./g, '_');
}

function readLocalBool(path: string, fallback: boolean): boolean {
  const raw = localStorage.getItem(lsKey(path));
  if (raw === null) return fallback;
  return raw === 'true';
}

function writeLocalBool(path: string, value: boolean) {
  localStorage.setItem(lsKey(path), String(value));
  window.dispatchEvent(new Event('sgpro-settings'));
}

function applyBrandingCss(branding: PortalSettings['branding']) {
  document.documentElement.style.setProperty('--color-brand-600', branding.primary);
  document.documentElement.style.setProperty('--color-brand-700', branding.accent);
  localStorage.setItem('brand_logo', branding.logo);
  localStorage.setItem('brand_name', branding.siteName);
  localStorage.setItem('brand_primary', branding.primary);
  localStorage.setItem('brand_accent', branding.accent);
  localStorage.setItem('brand_tagline', branding.tagline);
  if (branding.certTemplate) {
    localStorage.setItem('cert_template', branding.certTemplate);
    localStorage.setItem('cert_template_name', branding.certTemplateName);
  }
}

interface SettingsContextValue {
  settings: PortalSettings;
  ready: boolean;
  refresh: () => Promise<void>;
  saveSection: <K extends keyof PortalSettings>(section: K, data: PortalSettings[K]) => Promise<void>;
  getBool: (path: string, fallback?: boolean) => boolean;
  setBool: (path: string, value: boolean) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<PortalSettings>(DEFAULTS);
  const [ready, setReady] = useState(!isApiEnabled());

  const refresh = useCallback(async () => {
    if (!isApiEnabled() || !hasValidToken()) {
      setReady(true);
      return;
    }
    try {
      const data = await apiFetch<PortalSettings>('/settings');
      setSettings(data);
      applyBrandingCss(data.branding);
    } catch {
      /* keep defaults */
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const onAuth = () => void refresh();
    window.addEventListener('sgpro-auth', onAuth);
    return () => window.removeEventListener('sgpro-auth', onAuth);
  }, [refresh]);

  const saveSection = useCallback(async <K extends keyof PortalSettings>(section: K, data: PortalSettings[K]) => {
    if (isApiEnabled() && hasValidToken()) {
      const updated = await apiFetch<PortalSettings>('/settings', {
        method: 'PATCH',
        body: JSON.stringify({ [section]: data }),
      });
      setSettings(updated);
      if (section === 'branding') applyBrandingCss(updated.branding);
      window.dispatchEvent(new Event('sgpro-settings'));
      return;
    }
    setSettings((prev) => {
      const next = { ...prev, [section]: data };
      if (section === 'branding') applyBrandingCss(next.branding);
      return next;
    });
    window.dispatchEvent(new Event('sgpro-settings'));
  }, []);

  const getBool = useCallback(
    (path: string, fallback = true) => {
      const parts = path.split('.');
      let cur: unknown = settings;
      for (const p of parts) {
        if (!cur || typeof cur !== 'object') return readLocalBool(path, fallback);
        cur = (cur as Record<string, unknown>)[p];
      }
      if (typeof cur === 'boolean') return cur;
      return readLocalBool(path, fallback);
    },
    [settings],
  );

  const setBool = useCallback((path: string, value: boolean) => {
    writeLocalBool(path, value);
    const parts = path.split('.');
    if (parts.length === 2) {
      const [section, key] = parts as [keyof PortalSettings, string];
      setSettings((prev) => ({
        ...prev,
        [section]: { ...(prev[section] as object), [key]: value },
      }));
    }
  }, []);

  const value = useMemo(
    () => ({ settings, ready, refresh, saveSection, getBool, setBool }),
    [settings, ready, refresh, saveSection, getBool, setBool],
  );

  return createElement(SettingsContext.Provider, { value }, children);
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}

/** @deprecated use useSettings().getBool */
export function readStoredBoolean(storageKey: string, fallback: boolean): boolean {
  const map: Record<string, string> = {
    notif_enroll: 'notifications.enroll',
    notif_complete: 'notifications.complete',
    notif_reviews: 'notifications.reviews',
    notif_weekly: 'notifications.weekly',
    notif_payments: 'notifications.payments',
    notif_messages: 'profileNotifications.messages',
    pnotif_updates: 'profileNotifications.updates',
    pnotif_messages: 'profileNotifications.messages',
    pnotif_marketing: 'profileNotifications.marketing',
  };
  return readLocalBool(map[storageKey] ?? storageKey, fallback);
}

/** @deprecated use useSettings */
export function writeStoredBoolean(storageKey: string, value: boolean) {
  const map: Record<string, string> = {
    notif_enroll: 'notifications.enroll',
    notif_complete: 'notifications.complete',
    notif_reviews: 'notifications.reviews',
    notif_weekly: 'notifications.weekly',
    notif_payments: 'notifications.payments',
    notif_messages: 'profileNotifications.messages',
    pnotif_updates: 'profileNotifications.updates',
    pnotif_messages: 'profileNotifications.messages',
    pnotif_marketing: 'profileNotifications.marketing',
  };
  writeLocalBool(map[storageKey] ?? storageKey, value);
}

export function getNotificationPreference(storageKey: string, fallback = true): boolean {
  return readStoredBoolean(storageKey, fallback);
}

export function getCertTemplate(): string {
  return localStorage.getItem('cert_template') ?? '';
}

export async function fetchSettings(): Promise<PortalSettings> {
  if (!isApiEnabled() || !hasValidToken()) return DEFAULTS;
  return apiFetch<PortalSettings>('/settings');
}

export async function patchSettings(patch: Partial<PortalSettings>): Promise<PortalSettings> {
  if (!isApiEnabled() || !hasValidToken()) return { ...DEFAULTS, ...patch } as PortalSettings;
  return apiFetch<PortalSettings>('/settings', { method: 'PATCH', body: JSON.stringify(patch) });
}
