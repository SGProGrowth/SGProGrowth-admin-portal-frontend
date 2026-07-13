import { ENTITY_KEYS } from '../config.js';
import { appendActivity, getActivities, getAllEntities } from '../db.js';
import type { ActivityItem, EntityRecord } from '../types.js';

function relTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${Math.max(1, mins)} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function parseDate(raw: unknown): Date | null {
  if (!raw) return null;
  const s = String(raw);
  const m = s.match(/\d{4}-\d{2}-\d{2}/);
  if (m) return new Date(m[0]);
  return null;
}

/** Build activity items from synced entity records when the feed is empty. */
export async function deriveActivitiesFromEntities(): Promise<ActivityItem[]> {
  const entities = await getAllEntities();
  const items: { at: Date; item: ActivityItem }[] = [];

  for (const cert of entities.certificates ?? []) {
    const student = String(cert.student ?? cert.name ?? 'Student');
    const course = String(cert.course ?? 'a course');
    const at = parseDate(cert.issued) ?? new Date();
    items.push({
      at,
      item: { user: student, action: `earned certificate for ${course}`, time: relTime(at) },
    });
  }

  for (const student of entities.students ?? []) {
    const name = String(student.name ?? 'Student');
    const at = parseDate(student.joined) ?? new Date();
    items.push({
      at,
      item: { user: name, action: 'joined the platform', time: relTime(at) },
    });
    const progress = Number(student.progress ?? 0);
    if (progress >= 100) {
      items.push({
        at,
        item: { user: name, action: 'completed all enrolled courses', time: relTime(at) },
      });
    }
  }

  for (const course of entities.courses ?? []) {
    const title = String(course.title ?? 'Course');
    const students = Number(course.students ?? 0);
    if (students > 0) {
      items.push({
        at: new Date(),
        item: { user: String(course.instructor ?? 'Instructor'), action: `${title} has ${students} enrolled students`, time: 'Recently' },
      });
    }
    const completion = Number(course.completion ?? 0);
    if (completion >= 100) {
      items.push({
        at: new Date(),
        item: { user: 'System', action: `${title} reached 100% completion rate`, time: 'Recently' },
      });
    }
    const reviews = Number(course.reviews ?? 0);
    if (reviews > 0) {
      items.push({
        at: new Date(),
        item: { user: 'System', action: `New review posted on ${title}`, time: 'Recently' },
      });
    }
  }

  for (const event of entities.events ?? []) {
    const at = parseDate(event.date) ?? new Date();
    items.push({
      at,
      item: {
        user: String(event.host ?? 'Host'),
        action: `scheduled ${String(event.title ?? 'an event')}`,
        time: relTime(at),
      },
    });
  }

  return items
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 50)
    .map((x) => x.item);
}

export async function getActivityFeed(): Promise<ActivityItem[]> {
  const stored = await getActivities();
  if (stored.length > 0) return stored;
  return deriveActivitiesFromEntities();
}

export async function logEntityActivity(
  entity: string,
  action: 'created' | 'updated' | 'deleted',
  record?: EntityRecord,
  prev?: EntityRecord,
) {
  const now = new Date();
  let user = 'Admin';
  let detail = `${action} ${entity} record`;

  if (entity === 'students' && record) {
    user = String(record.name ?? 'Student');
    if (action === 'created') detail = 'joined the platform';
    else if (action === 'updated' && prev && Number(record.progress ?? 0) >= 100 && Number(prev.progress ?? 0) < 100) {
      detail = 'completed all enrolled courses';
    }
  } else if (entity === 'certificates' && record) {
    user = String(record.student ?? record.name ?? 'Student');
    detail = `earned certificate for ${String(record.course ?? 'a course')}`;
  } else if (entity === 'courses' && record) {
    user = String(record.instructor ?? 'Instructor');
    if (action === 'created') detail = `published course "${String(record.title ?? '')}"`;
    else if (action === 'updated' && prev) {
      const newReviews = Number(record.reviews ?? 0);
      const oldReviews = Number(prev.reviews ?? 0);
      if (newReviews > oldReviews) detail = `received a new review on "${String(record.title ?? '')}"`;
      else detail = `updated course "${String(record.title ?? '')}"`;
    }
  } else if (entity === 'events' && record) {
    user = String(record.host ?? 'Host');
    detail = `scheduled ${String(record.title ?? 'an event')}`;
  }

  await appendActivity({ user, action: detail, time: relTime(now) });
}

export function emptyEntityMap() {
  const map: Record<string, EntityRecord[]> = {};
  for (const key of ENTITY_KEYS) map[key] = [];
  return map;
}
