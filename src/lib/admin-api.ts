import { apiFetch, isApiEnabled } from './api';

export async function uploadImage(file: File): Promise<string | null> {
  if (!isApiEnabled()) return null;

  const form = new FormData();
  form.append('file', file);

  const token = localStorage.getItem('sgpro_jwt');
  const res = await fetch('/api/uploads/image', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });

  if (!res.ok) return null;
  const data = (await res.json()) as { url: string };
  return data.url;
}

export interface AdminUser {
  id: number;
  email: string;
  name: string;
  role: string;
}

export async function listAdminUsers(): Promise<AdminUser[]> {
  return apiFetch<AdminUser[]>('/users');
}

export async function createAdminUser(input: {
  email: string;
  name: string;
  role: string;
  password: string;
}): Promise<AdminUser> {
  return apiFetch<AdminUser>('/users', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export interface WpSyncStatus {
  baseUrl: string;
  connected: boolean;
  endpoints: { name: string; url: string; ok: boolean; status: number }[];
}

export async function getWpSyncStatus(): Promise<WpSyncStatus> {
  return apiFetch<WpSyncStatus>('/sync/wordpress/status');
}

export async function previewWpCourses(): Promise<{
  count: number;
  courses: { wpId: number; title: string; status: string }[];
  message?: string;
}> {
  return apiFetch('/sync/wordpress/courses/preview');
}

export async function importWpCourses(): Promise<{ imported: number; message: string }> {
  return apiFetch('/sync/wordpress/courses/import', { method: 'POST' });
}

export async function importWpQuizzes(): Promise<{ imported: number; message: string }> {
  return apiFetch('/sync/wordpress/quizzes/import', { method: 'POST' });
}

export async function importWpMembers(): Promise<{
  studentsImported: number;
  instructorsImported: number;
  message: string;
}> {
  return apiFetch('/sync/wordpress/members/import', { method: 'POST' });
}

export async function importWpGroups(): Promise<{ imported: number; message: string }> {
  return apiFetch('/sync/wordpress/groups/import', { method: 'POST' });
}

// ── Payments (Razorpay) ──────────────────────────────────────────────────────

export async function getRazorpayConfig(): Promise<{ configured: boolean; keyId: string | null }> {
  return apiFetch('/payments/config');
}

export async function createPaymentOrder(input: {
  amount: number;
  currency?: string;
  purpose?: string;
  razorpayKeyId?: string;
}): Promise<{ ok: boolean; orderId?: string; amount?: number; currency?: string; keyId?: string; message?: string }> {
  return apiFetch('/payments/order', { method: 'POST', body: JSON.stringify(input) });
}

export async function verifyPayment(input: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): Promise<{ ok: boolean; message: string; paymentId?: string }> {
  return apiFetch('/payments/verify', { method: 'POST', body: JSON.stringify(input) });
}

// ── Compose email ─────────────────────────────────────────────────────────────

export async function composeMail(input: {
  to: string;
  subject: string;
  body?: string;
}): Promise<{ ok: boolean; message: string }> {
  return apiFetch('/mail/compose', { method: 'POST', body: JSON.stringify(input) });
}

export async function dedupStudents(): Promise<{ removed: number; message: string }> {
  return apiFetch('/sync/wordpress/dedup', { method: 'POST' });
}

export async function syncAll(): Promise<{
  courses: number;
  quizzes: number;
  students: number;
  instructors: number;
  groups: number;
  total: number;
  message: string;
}> {
  return apiFetch('/sync/wordpress/all', { method: 'POST' });
}

export interface MailConfig {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  fromEmail: string;
  fromName: string;
  passwordSet: boolean;
}

export async function getMailConfig(): Promise<MailConfig> {
  return apiFetch<MailConfig>('/mail/config');
}

export async function saveMailConfig(input: {
  host?: string;
  port?: number;
  secure?: boolean;
  username?: string;
  password?: string;
  fromEmail?: string;
  fromName?: string;
}): Promise<MailConfig> {
  return apiFetch<MailConfig>('/mail/config', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function testMailConnection(): Promise<{ ok: boolean; message: string }> {
  return apiFetch('/mail/test', { method: 'POST' });
}

export async function sendTestEmail(to: string): Promise<{ ok: boolean; message: string }> {
  return apiFetch('/mail/send-test', {
    method: 'POST',
    body: JSON.stringify({ to }),
  });
}

// ── Password & 2FA ────────────────────────────────────────────────────────────

export async function changePassword(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ ok: boolean; message: string }> {
  return apiFetch('/auth/change-password', { method: 'POST', body: JSON.stringify(input) });
}

export async function get2faStatus(): Promise<{ enabled: boolean }> {
  return apiFetch('/auth/2fa/status');
}

export async function setup2fa(): Promise<{ secret: string; qrCodeUrl: string; enabled: boolean; message: string }> {
  return apiFetch('/auth/2fa/setup');
}

export async function enable2fa(code: string): Promise<{ ok: boolean; enabled: boolean; message: string }> {
  return apiFetch('/auth/2fa/enable', { method: 'POST', body: JSON.stringify({ code }) });
}

export async function disable2fa(input: {
  password?: string;
  code?: string;
}): Promise<{ ok: boolean; enabled: boolean; message: string }> {
  return apiFetch('/auth/2fa/disable', { method: 'POST', body: JSON.stringify(input) });
}

export async function verify2faLogin(input: {
  tempToken: string;
  code: string;
}): Promise<{ user: { email: string; name: string; role: string; loggedIn: boolean }; token: string }> {
  return apiFetch('/auth/2fa/login', { method: 'POST', body: JSON.stringify(input) });
}
