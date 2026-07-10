import { Router } from 'express';
import { config } from '../config.js';
import { createRecord, deleteRecord, getEntity } from '../db.js';
import { requireAdmin } from '../middleware/admin.js';
import { requireAuth } from '../middleware/auth.js';
import type { EntityRecord } from '../types.js';

const router = Router();
router.use(requireAuth, requireAdmin);

// ── helpers ──────────────────────────────────────────────────────────────────

function wpAuthHeader(): string | null {
  const user = config.wpAdminUser;
  const pass = config.wpAppPass;
  if (!user || !pass) return null;
  return 'Basic ' + Buffer.from(`${user}:${pass}`).toString('base64');
}

async function fetchJson<T>(url: string, auth = false): Promise<T | null> {
  try {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'User-Agent': 'SGProGrowth-Admin/1.0',
    };
    if (auth) {
      const h = wpAuthHeader();
      if (h) headers['Authorization'] = h;
    }
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#8211;/g, '–').replace(/&#038;/g, '&').trim();
}

function titleOf(t: unknown): string {
  if (typeof t === 'string') return stripHtml(t);
  if (t && typeof t === 'object' && 'rendered' in t) return stripHtml(String((t as { rendered: string }).rendered));
  return '';
}

// ── WP types ─────────────────────────────────────────────────────────────────

interface WpCourse {
  id: number;
  title?: string | { rendered?: string };
  status?: string;
  link?: string;
  featured_image?: string;
  instructor?: string;
  excerpt?: { rendered?: string };
  meta?: Record<string, unknown>;
}

interface WpQuiz {
  id: number;
  title?: { rendered?: string };
  status?: string;
  link?: string;
  parent?: number;
}

interface BpMember {
  id: number;
  name: string;
  link?: string;
  member_types?: string[];
  date_modified?: string;
  avatar_urls?: Record<string, string>;
}

interface BpGroup {
  id: number;
  name: string;
  description?: { raw?: string; rendered?: string };
  status?: string;
  total_member_count?: number;
  date_created?: string;
}

interface VibecalEvent {
  id: number;
  title?: string | { rendered?: string };
  content?: { rendered?: string };
  start_date?: string;
  end_date?: string;
  date?: string;
  location?: string;
  link?: string;
  status?: string;
  meta?: Record<string, unknown>;
}

interface WplmsCertificate {
  id: number;
  title?: string | { rendered?: string };
  link?: string;
  status?: string;
  user_id?: number;
  user_login?: string;
  user_name?: string;
  course_id?: number;
  course_title?: string;
  date_issued?: string;
  certificate_code?: string;
  meta?: Record<string, unknown>;
}

// ── status ───────────────────────────────────────────────────────────────────

router.get('/status', async (_req, res) => {
  const base = config.wpBaseUrl.replace(/\/$/, '');
  const hasAuth = !!(config.wpAdminUser && config.wpAppPass);
  const authHeader = hasAuth ? wpAuthHeader() : null;

  const checks = [
    { name: 'WordPress REST', url: `${base}/wp-json/`, auth: false },
    { name: 'Courses', url: `${base}/wp-json/wp/v2/course?per_page=1`, auth: false },
    { name: 'Quizzes', url: `${base}/wp-json/wp/v2/quiz?per_page=1`, auth: false },
    { name: 'BuddyPress Members', url: `${base}/wp-json/buddypress/v1/members?per_page=1`, auth: false },
    { name: 'BuddyPress Groups', url: `${base}/wp-json/buddypress/v1/groups?per_page=1`, auth: false },
    { name: 'VibeCal Events', url: `${base}/wp-json/vibecal/v1/events?per_page=1`, auth: true },
    { name: 'WPLMS Certificates', url: `${base}/wp-json/wplms/v2/certificates?per_page=1`, auth: true },
  ];

  const results = await Promise.all(
    checks.map(async (c) => {
      try {
        const headers: Record<string, string> = { Accept: 'application/json' };
        if (c.auth && authHeader) headers['Authorization'] = authHeader;
        const r = await fetch(c.url, { headers, signal: AbortSignal.timeout(10000) });
        return { ...c, ok: r.ok, status: r.status, requiresAuth: c.auth };
      } catch {
        return { ...c, ok: false, status: 0, requiresAuth: c.auth };
      }
    }),
  );

  res.json({
    baseUrl: base,
    connected: results.some((r) => r.ok),
    authConfigured: hasAuth,
    authNote: hasAuth ? 'Using WP_ADMIN_USER + WP_APP_PASS for authenticated sync' : 'Set WP_ADMIN_USER and WP_APP_PASS in .env for full sync (events, certificates)',
    endpoints: results,
  });
});

// ── courses ───────────────────────────────────────────────────────────────────

router.get('/courses/preview', async (_req, res) => {
  const base = config.wpBaseUrl.replace(/\/$/, '');
  const data = await fetchJson<WpCourse[]>(`${base}/wp-json/wp/v2/course?per_page=50`);
  const list = Array.isArray(data) ? data : [];
  res.json({
    source: `${base}/wp-json/wp/v2/course`,
    count: list.length,
    courses: list.map((c) => ({
      wpId: c.id,
      title: titleOf(c.title),
      status: c.status ?? 'published',
      link: c.link,
    })),
  });
});

router.post('/courses/import', async (_req, res) => {
  const base = config.wpBaseUrl.replace(/\/$/, '');
  const data = await fetchJson<WpCourse[]>(`${base}/wp-json/wp/v2/course?per_page=50`);
  const list = Array.isArray(data) ? data : [];

  const existing = await getEntity('courses');
  let imported = 0;

  for (const c of list) {
    const title = titleOf(c.title);
    if (!title) continue;
    if (existing.some((e) => String(e.wpId) === String(c.id))) continue;
    if (existing.some((e) => String(e.title).toLowerCase() === title.toLowerCase())) continue;

    await createRecord('courses', {
      title,
      instructor: String(c.instructor ?? 'Mahesh MD'),
      category: 'Imported',
      status: c.status ?? 'published',
      students: 0,
      duration: '0 hrs',
      completion: 0,
      rating: 0,
      reviews: 0,
      price: 0,
      image: String(c.featured_image ?? ''),
      wpId: c.id,
      excerpt: c.excerpt?.rendered ? stripHtml(c.excerpt.rendered) : '',
    } as Omit<EntityRecord, 'id'>);
    imported++;
  }

  res.json({ imported, message: imported ? `Imported ${imported} course(s)` : 'All courses already up to date' });
});

// ── quizzes ───────────────────────────────────────────────────────────────────

router.get('/quizzes/preview', async (_req, res) => {
  const base = config.wpBaseUrl.replace(/\/$/, '');
  const data = await fetchJson<WpQuiz[]>(`${base}/wp-json/wp/v2/quiz?per_page=50`);
  const list = Array.isArray(data) ? data : [];
  res.json({ count: list.length, quizzes: list.map((q) => ({ wpId: q.id, title: titleOf(q.title), status: q.status })) });
});

router.post('/quizzes/import', async (_req, res) => {
  const base = config.wpBaseUrl.replace(/\/$/, '');
  const data = await fetchJson<WpQuiz[]>(`${base}/wp-json/wp/v2/quiz?per_page=50`);
  const list = Array.isArray(data) ? data : [];

  const existing = await getEntity('quizzes');
  const courses = await getEntity('courses');
  let imported = 0;

  for (const q of list) {
    const title = titleOf(q.title);
    if (!title) continue;
    if (existing.some((e) => String(e.wpId) === String(q.id))) continue;
    if (existing.some((e) => String(e.title).toLowerCase() === title.toLowerCase())) continue;

    // Try to match quiz to a course by parent id
    const matchedCourse = courses.find((c) => String(c.wpId) === String(q.parent)) ?? null;

    await createRecord('quizzes', {
      title,
      course: matchedCourse ? String(matchedCourse.title) : 'General',
      questions: 0,
      attempts: 0,
      avgScore: 0,
      passmark: 60,
      status: q.status ?? 'published',
      wpId: q.id,
    } as Omit<EntityRecord, 'id'>);
    imported++;
  }

  res.json({ imported, message: imported ? `Imported ${imported} quiz(zes)` : 'All quizzes already up to date' });
});

// ── students & instructors (BuddyPress members) ───────────────────────────────

router.get('/members/preview', async (_req, res) => {
  const base = config.wpBaseUrl.replace(/\/$/, '');
  const data = await fetchJson<BpMember[]>(`${base}/wp-json/buddypress/v1/members?per_page=100`);
  const list = Array.isArray(data) ? data : [];
  res.json({
    count: list.length,
    members: list.map((m) => ({
      wpId: m.id,
      name: m.name,
      role: m.member_types?.includes('instructors') ? 'instructor' : 'student',
    })),
  });
});

router.post('/members/import', async (_req, res) => {
  const base = config.wpBaseUrl.replace(/\/$/, '');
  const data = await fetchJson<BpMember[]>(`${base}/wp-json/buddypress/v1/members?per_page=100`);
  const list = Array.isArray(data) ? data : [];

  const existingStudents = await getEntity('students');
  const existingInstructors = await getEntity('instructors');
  let studentsImported = 0;
  let instructorsImported = 0;

  for (const m of list) {
    if (!m.name?.trim() || m.name.includes('@')) continue; // skip email-as-name accounts

    const isInstructor = m.member_types?.includes('instructors') ?? false;
    const avatar = m.avatar_urls?.['thumb'] ?? m.avatar_urls?.['full'] ?? '';
    const joined = m.date_modified ? m.date_modified.split('T')[0] : new Date().toISOString().split('T')[0];

    if (isInstructor) {
      if (existingInstructors.some((e) => String(e.wpId) === String(m.id))) continue;
      if (existingInstructors.some((e) => String(e.name).toLowerCase() === m.name.toLowerCase())) continue;
      await createRecord('instructors', {
        name: m.name,
        email: '',
        role: 'Instructor',
        courses: 0,
        students: 0,
        commission: 70,
        avatar,
        wpId: m.id,
        profileUrl: m.link ?? '',
      } as Omit<EntityRecord, 'id'>);
      instructorsImported++;
    } else {
      if (existingStudents.some((e) => String(e.wpId) === String(m.id))) continue;
      if (existingStudents.some((e) => String(e.name).toLowerCase() === m.name.toLowerCase())) continue;
      await createRecord('students', {
        name: m.name,
        email: '',
        courses: 0,
        progress: 0,
        joined,
        avatar,
        wpId: m.id,
        profileUrl: m.link ?? '',
      } as Omit<EntityRecord, 'id'>);
      studentsImported++;
    }
  }

  res.json({
    studentsImported,
    instructorsImported,
    message: `Imported ${studentsImported} student(s) and ${instructorsImported} instructor(s) from WordPress`,
  });
});

// ── groups (BuddyPress) ───────────────────────────────────────────────────────

router.post('/groups/import', async (_req, res) => {
  const base = config.wpBaseUrl.replace(/\/$/, '');
  const data = await fetchJson<BpGroup[]>(`${base}/wp-json/buddypress/v1/groups?per_page=50`);
  const list = Array.isArray(data) ? data : [];

  const existing = await getEntity('groups');
  let imported = 0;

  for (const g of list) {
    const name = stripHtml(g.name ?? '');
    if (!name) continue;
    if (existing.some((e) => String(e.wpId) === String(g.id))) continue;
    if (existing.some((e) => String(e.name).toLowerCase() === name.toLowerCase())) continue;

    await createRecord('groups', {
      name,
      members: g.total_member_count ?? 0,
      privacy: g.status === 'private' ? 'Private' : g.status === 'hidden' ? 'Hidden' : 'Public',
      description: g.description?.raw ? stripHtml(g.description.raw) : '',
      wpId: g.id,
    } as Omit<EntityRecord, 'id'>);
    imported++;
  }

  res.json({ imported, message: imported ? `Imported ${imported} group(s)` : 'All groups already up to date' });
});

// ── events (VibeCal) ─────────────────────────────────────────────────────────

router.get('/events/preview', async (_req, res) => {
  const base = config.wpBaseUrl.replace(/\/$/, '');
  const hasAuth = !!(config.wpAdminUser && config.wpAppPass);

  // Try vibecal REST endpoint (authenticated)
  const vibecal = await fetchJson<VibecalEvent[]>(
    `${base}/wp-json/vibecal/v1/events?per_page=50`, hasAuth,
  );
  if (Array.isArray(vibecal) && vibecal.length > 0) {
    res.json({
      source: 'vibecal/v1/events', count: vibecal.length,
      events: vibecal.map((e) => ({
        wpId: e.id, title: titleOf(e.title),
        startDate: e.start_date ?? e.date ?? '', endDate: e.end_date ?? '',
        location: e.location ?? '', link: e.link ?? '',
      })),
    });
    return;
  }

  // Fallback: wp/v2 custom post type 'event' or 'tribe_events'
  for (const cpt of ['event', 'tribe_events']) {
    const posts = await fetchJson<WpCourse[]>(`${base}/wp-json/wp/v2/${cpt}?per_page=50`);
    if (Array.isArray(posts) && posts.length > 0) {
      res.json({ source: `wp/v2/${cpt}`, count: posts.length, events: posts.map((p) => ({ wpId: p.id, title: titleOf(p.title), link: p.link })) });
      return;
    }
  }

  res.json({ source: 'none', count: 0, events: [], note: 'No events found. Add WP Application Password in .env for authenticated access.' });
});

router.post('/events/import', async (_req, res) => {
  const base = config.wpBaseUrl.replace(/\/$/, '');
  const hasAuth = !!(config.wpAdminUser && config.wpAppPass);

  const vibecal = await fetchJson<VibecalEvent[]>(
    `${base}/wp-json/vibecal/v1/events?per_page=50`, hasAuth,
  );
  const list = Array.isArray(vibecal) ? vibecal : [];

  const existing = await getEntity('events');
  let imported = 0;

  for (const e of list) {
    const title = titleOf(e.title);
    if (!title) continue;
    if (existing.some((x) => String(x.wpId) === String(e.id))) continue;
    if (existing.some((x) => String(x.title).toLowerCase() === title.toLowerCase())) continue;

    const startDate = e.start_date ?? e.date ?? new Date().toISOString().split('T')[0];
    await createRecord('events', {
      title,
      date: startDate,
      endDate: e.end_date ?? '',
      location: e.location ?? 'Online',
      description: e.content?.rendered ? stripHtml(e.content.rendered) : '',
      status: e.status ?? 'upcoming',
      link: e.link ?? '',
      wpId: e.id,
    } as Omit<EntityRecord, 'id'>);
    imported++;
  }

  res.json({ imported, message: imported ? `Imported ${imported} event(s) from VibeCal` : 'All events up to date (or no VibeCal events found)' });
});

// ── certificates (WPLMS) ─────────────────────────────────────────────────────

router.get('/certificates/preview', async (_req, res) => {
  const base = config.wpBaseUrl.replace(/\/$/, '');
  const hasAuth = !!(config.wpAdminUser && config.wpAppPass);

  if (!hasAuth) {
    res.json({ count: 0, certificates: [], note: 'Certificates require WordPress authentication. Set WP_ADMIN_USER and WP_APP_PASS in .env' });
    return;
  }

  // Try WPLMS v2 certificates endpoint
  const certs = await fetchJson<WplmsCertificate[]>(
    `${base}/wp-json/wplms/v2/certificates?per_page=100`, true,
  );
  if (Array.isArray(certs)) {
    res.json({
      source: 'wplms/v2/certificates', count: certs.length,
      certificates: certs.map((c) => ({
        wpId: c.id, title: titleOf(c.title),
        student: c.user_name ?? c.user_login ?? '',
        course: c.course_title ?? '',
        issued: c.date_issued ?? '',
        code: c.certificate_code ?? '',
      })),
    });
    return;
  }

  // Fallback: wp/v2 custom post type 'wplms-certificate'
  const fallback = await fetchJson<WpCourse[]>(`${base}/wp-json/wp/v2/wplms-certificate?per_page=100`, true);
  if (Array.isArray(fallback)) {
    res.json({ source: 'wp/v2/wplms-certificate', count: fallback.length, certificates: fallback.map((c) => ({ wpId: c.id, title: titleOf(c.title) })) });
    return;
  }

  res.json({ count: 0, certificates: [], note: 'No certificates found via API. You may need a WordPress Application Password.' });
});

router.post('/certificates/import', async (_req, res) => {
  const base = config.wpBaseUrl.replace(/\/$/, '');
  const hasAuth = !!(config.wpAdminUser && config.wpAppPass);

  if (!hasAuth) {
    res.status(400).json({ ok: false, message: 'WordPress auth not configured. Set WP_ADMIN_USER and WP_APP_PASS in .env.' });
    return;
  }

  const certs = await fetchJson<WplmsCertificate[]>(
    `${base}/wp-json/wplms/v2/certificates?per_page=100`, true,
  );
  const list = Array.isArray(certs) ? certs : [];

  const existing = await getEntity('certificates');
  let imported = 0;

  for (const c of list) {
    const title = titleOf(c.title);
    if (!title) continue;
    if (existing.some((x) => String(x.wpId) === String(c.id))) continue;

    await createRecord('certificates', {
      title,
      student: c.user_name ?? c.user_login ?? 'Unknown',
      course: c.course_title ?? title,
      issued: c.date_issued ?? new Date().toISOString().split('T')[0],
      certificateId: c.certificate_code ?? `WP-${c.id}`,
      status: 'issued',
      link: '',
      wpId: c.id,
    } as Omit<EntityRecord, 'id'>);
    imported++;
  }

  res.json({ imported, message: imported ? `Imported ${imported} certificate(s) from WPLMS` : 'All certificates up to date' });
});

// ── full sync (all at once) ───────────────────────────────────────────────────

router.post('/all', async (_req, res) => {
  const base = config.wpBaseUrl.replace(/\/$/, '');

  const results: Record<string, number | string> = {};

  // 1. Courses
  try {
    const courses = await fetchJson<WpCourse[]>(`${base}/wp-json/wp/v2/course?per_page=50`);
    const courseList = Array.isArray(courses) ? courses : [];
    const existing = await getEntity('courses');
    let n = 0;
    for (const c of courseList) {
      const title = titleOf(c.title);
      if (!title) continue;
      if (existing.some((e) => String(e.wpId) === String(c.id))) continue;
      if (existing.some((e) => String(e.title).toLowerCase() === title.toLowerCase())) continue;
      await createRecord('courses', {
        title, instructor: String(c.instructor ?? 'Mahesh MD'), category: 'Imported',
        status: c.status ?? 'published', students: 0, duration: '0 hrs',
        completion: 0, rating: 0, reviews: 0, price: 0,
        image: String(c.featured_image ?? ''), wpId: c.id,
        excerpt: c.excerpt?.rendered ? stripHtml(c.excerpt.rendered) : '',
      } as Omit<EntityRecord, 'id'>);
      n++;
    }
    results.courses = n;
  } catch { results.courses = 'error'; }

  // 2. Quizzes
  try {
    const quizzes = await fetchJson<WpQuiz[]>(`${base}/wp-json/wp/v2/quiz?per_page=50`);
    const quizList = Array.isArray(quizzes) ? quizzes : [];
    const existing = await getEntity('quizzes');
    const allCourses = await getEntity('courses');
    let n = 0;
    for (const q of quizList) {
      const title = titleOf(q.title);
      if (!title) continue;
      if (existing.some((e) => String(e.wpId) === String(q.id))) continue;
      if (existing.some((e) => String(e.title).toLowerCase() === title.toLowerCase())) continue;
      const matchedCourse = allCourses.find((c) => String(c.wpId) === String(q.parent)) ?? null;
      await createRecord('quizzes', {
        title, course: matchedCourse ? String(matchedCourse.title) : 'General',
        questions: 0, attempts: 0, avgScore: 0, passmark: 60,
        status: q.status ?? 'published', wpId: q.id,
      } as Omit<EntityRecord, 'id'>);
      n++;
    }
    results.quizzes = n;
  } catch { results.quizzes = 'error'; }

  // 3. Members (students + instructors)
  try {
    const members = await fetchJson<BpMember[]>(`${base}/wp-json/buddypress/v1/members?per_page=100`);
    const memberList = Array.isArray(members) ? members : [];
    const existingStudents = await getEntity('students');
    const existingInstructors = await getEntity('instructors');
    let s = 0; let i = 0;
    for (const m of memberList) {
      if (!m.name?.trim() || m.name.includes('@')) continue;
      const isInstructor = m.member_types?.includes('instructors') ?? false;
      const avatar = m.avatar_urls?.['thumb'] ?? m.avatar_urls?.['full'] ?? '';
      const joined = m.date_modified ? m.date_modified.split('T')[0] : new Date().toISOString().split('T')[0];
      if (isInstructor) {
        if (existingInstructors.some((e) => String(e.wpId) === String(m.id))) continue;
        if (existingInstructors.some((e) => String(e.name).toLowerCase() === m.name.toLowerCase())) continue;
        await createRecord('instructors', {
          name: m.name, email: '', role: 'Instructor', courses: 0,
          students: 0, commission: 70, avatar, wpId: m.id, profileUrl: m.link ?? '',
        } as Omit<EntityRecord, 'id'>);
        i++;
      } else {
        if (existingStudents.some((e) => String(e.wpId) === String(m.id))) continue;
        if (existingStudents.some((e) => String(e.name).toLowerCase() === m.name.toLowerCase())) continue;
        await createRecord('students', {
          name: m.name, email: '', courses: 0, progress: 0,
          joined, avatar, wpId: m.id, profileUrl: m.link ?? '',
        } as Omit<EntityRecord, 'id'>);
        s++;
      }
    }
    results.students = s;
    results.instructors = i;
  } catch { results.students = 'error'; results.instructors = 'error'; }

  // 4. Groups
  try {
    const groups = await fetchJson<BpGroup[]>(`${base}/wp-json/buddypress/v1/groups?per_page=50`);
    const groupList = Array.isArray(groups) ? groups : [];
    const existing = await getEntity('groups');
    let n = 0;
    for (const g of groupList) {
      const name = stripHtml(g.name ?? '');
      if (!name) continue;
      if (existing.some((e) => String(e.wpId) === String(g.id))) continue;
      if (existing.some((e) => String(e.name).toLowerCase() === name.toLowerCase())) continue;
      await createRecord('groups', {
        name, members: g.total_member_count ?? 0,
        privacy: g.status === 'private' ? 'Private' : g.status === 'hidden' ? 'Hidden' : 'Public',
        description: g.description?.raw ? stripHtml(g.description.raw) : '',
        wpId: g.id,
      } as Omit<EntityRecord, 'id'>);
      n++;
    }
    results.groups = n;
  } catch { results.groups = 'error'; }

  // 5. Events (VibeCal — works better with auth)
  const hasAuth = !!(config.wpAdminUser && config.wpAppPass);
  try {
    const vibecal = await fetchJson<VibecalEvent[]>(`${base}/wp-json/vibecal/v1/events?per_page=50`, hasAuth);
    const eventList = Array.isArray(vibecal) ? vibecal : [];
    const existing = await getEntity('events');
    let n = 0;
    for (const e of eventList) {
      const title = titleOf(e.title);
      if (!title) continue;
      if (existing.some((x) => String(x.wpId) === String(e.id))) continue;
      if (existing.some((x) => String(x.title).toLowerCase() === title.toLowerCase())) continue;
      await createRecord('events', {
        title,
        date: e.start_date ?? e.date ?? new Date().toISOString().split('T')[0],
        endDate: e.end_date ?? '',
        location: e.location ?? 'Online',
        description: e.content?.rendered ? stripHtml(e.content.rendered) : '',
        status: 'upcoming',
        link: e.link ?? '',
        wpId: e.id,
      } as Omit<EntityRecord, 'id'>);
      n++;
    }
    results.events = n;
  } catch { results.events = 'error'; }

  // 6. Certificates (WPLMS — requires auth)
  if (hasAuth) {
    try {
      const certs = await fetchJson<WplmsCertificate[]>(`${base}/wp-json/wplms/v2/certificates?per_page=100`, true);
      const certList = Array.isArray(certs) ? certs : [];
      const existing = await getEntity('certificates');
      let n = 0;
      for (const c of certList) {
        const title = titleOf(c.title);
        if (!title) continue;
        if (existing.some((x) => String(x.wpId) === String(c.id))) continue;
        await createRecord('certificates', {
          title,
          student: c.user_name ?? c.user_login ?? 'Unknown',
          course: c.course_title ?? title,
          issued: c.date_issued ?? new Date().toISOString().split('T')[0],
          certificateId: c.certificate_code ?? `WP-${c.id}`,
          status: 'issued',
          link: '', wpId: c.id,
        } as Omit<EntityRecord, 'id'>);
        n++;
      }
      results.certificates = n;
    } catch { results.certificates = 'error'; }
  }

  const total = Object.values(results).reduce<number>((s, v) => s + (typeof v === 'number' ? v : 0), 0);
  res.json({
    ...results,
    total,
    authEnabled: hasAuth,
    message: total > 0
      ? `Full sync complete: ${results.courses ?? 0} courses, ${results.quizzes ?? 0} quizzes, ${results.students ?? 0} students, ${results.instructors ?? 0} instructors, ${results.groups ?? 0} groups, ${results.events ?? 0} events${hasAuth ? `, ${results.certificates ?? 0} certificates` : ''}`
      : 'All data already up to date — nothing new to import',
  });
});

// ── dedup: remove instructor names from student list ─────────────────────────

router.post('/dedup', async (_req, res) => {
  const students = await getEntity('students');
  const instructors = await getEntity('instructors');
  const instructorNames = new Set(instructors.map((i) => String(i.name ?? '').toLowerCase().trim()));

  let removed = 0;
  for (const s of students) {
    const name = String(s.name ?? '').toLowerCase().trim();
    if (name && instructorNames.has(name)) {
      await deleteRecord('students', s.id);
      removed++;
    }
  }

  res.json({ removed, message: removed > 0 ? `Removed ${removed} student record(s) that are actually instructors` : 'No duplicates found' });
});

// ── posts preview (unchanged) ─────────────────────────────────────────────────

router.get('/posts/preview', async (_req, res) => {
  const base = config.wpBaseUrl.replace(/\/$/, '');
  interface WpPost { id: number; title?: { rendered?: string }; link?: string; status?: string }
  const posts = await fetchJson<WpPost[]>(`${base}/wp-json/wp/v2/posts?per_page=10&status=publish`);
  if (!posts) { res.json({ count: 0, posts: [], message: 'Could not fetch posts' }); return; }
  res.json({
    count: posts.length,
    posts: posts.map((p) => ({
      wpId: p.id,
      title: p.title?.rendered ? stripHtml(p.title.rendered) : `Post ${p.id}`,
      link: p.link,
      status: p.status ?? 'published',
    })),
  });
});

export default router;
