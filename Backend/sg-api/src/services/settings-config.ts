import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const configPath = path.join(__dirname, '..', '..', 'data', 'settings.json');

export interface GeneralSettings {
  siteTitle: string;
  tagline: string;
  supportEmail: string;
  supportPhone: string;
  adminEmail: string;
  siteUrl: string;
  description: string;
  copyright: string;
}

export interface BrandingSettings {
  primary: string;
  accent: string;
  logo: string;
  siteName: string;
  tagline: string;
  certTemplate: string;
  certTemplateName: string;
}

export interface LocalizationSettings {
  currency: string;
  language: string;
  timezone: string;
  dateFormat: string;
}

export interface RolesSettings {
  allowInstructorSelfSignup: boolean;
  openStudentRegistration: boolean;
}

export interface SecuritySettings {
  require2faForAdmins: boolean;
  forceStrongPasswords: boolean;
  autoSignOut: boolean;
  sessionTimeoutMinutes: number;
}

export interface NotificationSettings {
  enroll: boolean;
  complete: boolean;
  reviews: boolean;
  weekly: boolean;
  payments: boolean;
}

export interface ProfileNotificationSettings {
  updates: boolean;
  messages: boolean;
  marketing: boolean;
}

export interface PortalSettings {
  general: GeneralSettings;
  branding: BrandingSettings;
  localization: LocalizationSettings;
  roles: RolesSettings;
  security: SecuritySettings;
  notifications: NotificationSettings;
  profileNotifications: ProfileNotificationSettings;
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

function readStored(): Partial<PortalSettings> | null {
  try {
    if (!fs.existsSync(configPath)) return null;
    return JSON.parse(fs.readFileSync(configPath, 'utf-8')) as Partial<PortalSettings>;
  } catch {
    return null;
  }
}

function writeStored(data: PortalSettings) {
  const dir = path.dirname(configPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(data, null, 2));
}

function mergeSection<T extends object>(defaults: T, patch?: Partial<T>): T {
  return { ...defaults, ...(patch ?? {}) };
}

export function getSettings(): PortalSettings {
  const stored = readStored();
  return {
    general: mergeSection(DEFAULTS.general, stored?.general),
    branding: mergeSection(DEFAULTS.branding, stored?.branding),
    localization: mergeSection(DEFAULTS.localization, stored?.localization),
    roles: mergeSection(DEFAULTS.roles, stored?.roles),
    security: mergeSection(DEFAULTS.security, stored?.security),
    notifications: mergeSection(DEFAULTS.notifications, stored?.notifications),
    profileNotifications: mergeSection(DEFAULTS.profileNotifications, stored?.profileNotifications),
  };
}

export function saveSettings(patch: Partial<PortalSettings>): PortalSettings {
  const current = getSettings();
  const next: PortalSettings = {
    general: mergeSection(current.general, patch.general),
    branding: mergeSection(current.branding, patch.branding),
    localization: mergeSection(current.localization, patch.localization),
    roles: mergeSection(current.roles, patch.roles),
    security: mergeSection(current.security, patch.security),
    notifications: mergeSection(current.notifications, patch.notifications),
    profileNotifications: mergeSection(current.profileNotifications, patch.profileNotifications),
  };
  writeStored(next);
  return next;
}

export function validatePassword(password: string, forceStrong = true): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!forceStrong) return null;
  if (password.length < 10) return 'Password must be at least 10 characters';
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) {
    return 'Password must include both uppercase and lowercase letters';
  }
  return null;
}
