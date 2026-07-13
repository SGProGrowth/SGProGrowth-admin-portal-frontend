import { getSettings } from './settings-config.js';
import { sendMail } from './mail-config.js';

export type NotifyEvent = 'enrollment' | 'completion' | 'review' | 'payment' | 'message';

const EVENT_TOGGLES: Record<NotifyEvent, keyof ReturnType<typeof getSettings>['notifications'] | keyof ReturnType<typeof getSettings>['profileNotifications'] | null> = {
  enrollment: 'enroll',
  completion: 'complete',
  review: 'reviews',
  payment: 'payments',
  message: null,
};

export async function notifyAdminIfEnabled(
  event: NotifyEvent,
  subject: string,
  body: string,
): Promise<void> {
  const settings = getSettings();
  if (event === 'message') {
    if (!settings.profileNotifications.messages) return;
  } else {
    const toggleKey = EVENT_TOGGLES[event];
    if (!toggleKey || !settings.notifications[toggleKey as keyof typeof settings.notifications]) return;
  }

  const to = settings.general.adminEmail?.trim();
  if (!to || !to.includes('@')) return;

  await sendMail({
    to,
    subject: `[SG Pro Growth] ${subject}`,
    text: body,
    html: `<div style="font-family:sans-serif;font-size:14px;line-height:1.6">${body.replace(/\n/g, '<br/>')}</div>`,
  });
}
