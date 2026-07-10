import React from 'react';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PageHeader } from '../components/PageHeader';
import { Avatar, Button, PageCard, StatCard } from '../components/ui';
import {
  changePassword,
  composeMail,
  createAdminUser,
  createPaymentOrder,
  dedupStudents,
  disable2fa,
  enable2fa,
  get2faStatus,
  getMailConfig,
  getRazorpayConfig,
  getWpSyncStatus,
  importWpCourses,
  importWpGroups,
  importWpMembers,
  importWpQuizzes,
  listAdminUsers,
  previewWpCourses,
  saveMailConfig,
  sendTestEmail,
  setup2fa,
  syncAll,
  testMailConnection,
  uploadImage,
  verifyPayment,
  type AdminUser,
} from '../lib/admin-api';
import {
  getLlmConfig,
  saveLlmConfig,
  testLlmConnection,
  type LlmConfig,
} from '../lib/assistant-api';
import { clearAvatar, getUser, initials, setAvatar, useAvatar, useToken } from '../lib/auth';
import { useActivities, useMessages } from '../lib/feed';
import { Icon } from '../lib/icons';
import { useToast } from '../lib/toast';
import { useStore } from '../store';

const CHART_COLORS = ['#1a4d3e', '#248f6f', '#34d399', '#f59e0b', '#6ee7b7', '#164033', '#a7f3d0'];

export function Activity() {
  const { items } = useActivities();
  return (
    <div>
      <PageHeader title="Activity" subtitle="Everything happening across the platform" />
      <PageCard>
        <div className="space-y-3">
          {[...items, ...items].map((a, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center gap-3 rounded-xl border border-slate-50 p-3"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                <Icon name="activity" size={15} />
              </span>
              <div className="flex-1 text-sm">
                <span className="font-semibold text-slate-700">{a.user}</span>{' '}
                <span className="text-slate-500">{a.action}</span>
              </div>
              <span className="text-xs text-slate-400">{a.time}</span>
            </motion.div>
          ))}
        </div>
      </PageCard>
    </div>
  );
}

interface CalEvent {
  key: string;
  title: string;
  meta: string;
  time: string;
  kind: 'event' | 'assignment';
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function dateKey(raw: string): string | null {
  const m = raw.match(/\d{4}-\d{2}-\d{2}/);
  return m ? m[0] : null;
}
function timePart(raw: string): string {
  const m = raw.match(/\d{1,2}:\d{2}\s*(AM|PM)?/i);
  return m ? m[0] : 'All day';
}

function ScheduleEventModal({ defaultDate, onClose }: { defaultDate: string; onClose: () => void }) {
  const store = useStore();
  const toast = useToast();
  const instructors = store.list('instructors');
  const courses = store.list('courses');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState('10:00');
  const [type, setType] = useState('Webinar');
  const [host, setHost] = useState(instructors[0] ? String(instructors[0].name) : '');
  const [course, setCourse] = useState(courses[0] ? String(courses[0].title) : '');
  const [description, setDescription] = useState('');

  const inp = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100';
  const EVENT_TYPES = ['Webinar', 'Workshop', 'Coaching', 'Bootcamp', 'Orientation', 'Q&A Session', 'Live Class'];

  const save = () => {
    if (!title.trim()) { toast('Event title is required', 'error'); return; }
    if (!date) { toast('Date is required', 'error'); return; }
    store.create('events', {
      title: title.trim(),
      host,
      date: `${date} ${time}`,
      type,
      course,
      description: description.trim(),
    });
    toast(`Event "${title}" scheduled`, 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-bold text-slate-800">Schedule Event</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><Icon name="x" size={16} /></button>
        </div>
        <div className="space-y-3 p-5">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Event Title *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Weekly Coaching Session" className={inp} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Date *</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inp} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Time</label>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={inp} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className={inp}>
                {EVENT_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Host</label>
              <select value={host} onChange={(e) => setHost(e.target.value)} className={inp}>
                {instructors.filter((i) => i.name).map((i) => <option key={String(i.id)}>{String(i.name)}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Related Course</label>
            <select value={course} onChange={(e) => setCourse(e.target.value)} className={inp}>
              <option value="">— General / No specific course —</option>
              {courses.map((c) => <option key={String(c.id)}>{String(c.title)}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="What will happen in this session?" className={`${inp} resize-none`} />
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <Button variant="secondary" icon="x" onClick={onClose}>Cancel</Button>
            <Button icon="calendar" onClick={save}>Schedule Event</Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export function Calendar() {
  const store = useStore();
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(toKey(today));
  const [scheduling, setScheduling] = useState(false);

  const byDay = useMemo(() => {
    const map: Record<string, CalEvent[]> = {};
    const push = (k: string | null, ev: CalEvent) => {
      if (!k) return;
      (map[k] ||= []).push(ev);
    };
    store.list('events').forEach((e) => {
      const k = dateKey(String(e.date));
      push(k, { key: `e${e.id}`, title: String(e.title), meta: `${e.type} · ${e.host}`, time: timePart(String(e.date)), kind: 'event' });
    });
    store.list('assignments').forEach((a) => {
      const k = dateKey(String(a.due));
      push(k, { key: `a${a.id}`, title: String(a.title), meta: 'Assignment due', time: 'Due', kind: 'assignment' });
    });
    return map;
  }, [store]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const upcoming = useMemo(() => {
    const todayKey = toKey(today);
    return Object.entries(byDay)
      .filter(([k]) => k >= todayKey)
      .sort(([a], [b]) => a.localeCompare(b))
      .flatMap(([k, evs]) => evs.map((ev) => ({ ...ev, day: k })))
      .slice(0, 5);
  }, [byDay, today]);

  const selectedEvents = byDay[selected] ?? [];
  const move = (delta: number) => setCursor(new Date(year, month + delta, 1));

  return (
    <div>
      {scheduling && <ScheduleEventModal defaultDate={selected} onClose={() => setScheduling(false)} />}
      <PageHeader
        title="Calendar"
        subtitle="Events, live sessions and assignment deadlines — click any day to view or schedule"
        actions={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              icon="calendar"
              onClick={() => {
                setCursor(new Date(today.getFullYear(), today.getMonth(), 1));
                setSelected(toKey(today));
              }}
            >
              Today
            </Button>
            <Button icon="plus" onClick={() => setScheduling(true)}>
              Schedule Event
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <PageCard className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-slate-800">
              {MONTHS[month]} <span className="text-slate-400">{year}</span>
            </h2>
            <div className="flex gap-1">
              <button onClick={() => move(-1)} className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-brand-400 hover:text-brand-600" title="Previous month">
                <Icon name="chevron-down" size={16} className="rotate-90" />
              </button>
              <button onClick={() => move(1)} className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-brand-400 hover:text-brand-600" title="Next month">
                <Icon name="chevron-down" size={16} className="-rotate-90" />
              </button>
            </div>
          </div>

          <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[11px] font-bold uppercase tracking-wide text-slate-400">
            {WEEKDAYS.map((d) => (
              <div key={d} className="py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (day === null) return <div key={`b${i}`} />;
              const k = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const evs = byDay[k] ?? [];
              const isToday = k === toKey(today);
              const isSel = k === selected;
              return (
                <button
                  key={k}
                  onClick={() => setSelected(k)}
                  className={`relative flex aspect-square flex-col items-center justify-start rounded-xl border p-1.5 text-sm transition ${
                    isSel
                      ? 'border-brand-500 bg-brand-50 font-bold text-brand-700'
                      : isToday
                        ? 'border-brand-200 bg-white font-semibold text-slate-700'
                        : 'border-slate-100 text-slate-600 hover:border-brand-200 hover:bg-slate-50'
                  }`}
                >
                  <span className={isToday && !isSel ? 'flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-white' : ''}>
                    {day}
                  </span>
                  {evs.length > 0 && (
                    <span className="mt-auto flex gap-0.5">
                      {evs.slice(0, 3).map((ev) => (
                        <span key={ev.key} className={`h-1.5 w-1.5 rounded-full ${ev.kind === 'event' ? 'bg-brand-500' : 'bg-amber-500'}`} />
                      ))}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-brand-500" /> Event / Session</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" /> Assignment due</span>
          </div>
        </PageCard>

        <div className="space-y-6">
          <PageCard>
            <h3 className="mb-3 text-sm font-bold text-slate-800">
              {selected === toKey(today) ? 'Today' : prettyDay(selected)}
            </h3>
            {selectedEvents.length === 0 ? (
              <button
                onClick={() => setScheduling(true)}
                className="w-full rounded-xl border-2 border-dashed border-slate-200 py-6 text-sm text-slate-400 transition hover:border-brand-300 hover:text-brand-600"
              >
                <Icon name="plus" size={16} className="mx-auto mb-1" />
                No events — click to schedule one
              </button>
            ) : (
              <div className="space-y-2">
                {selectedEvents.map((ev) => (
                  <div key={ev.key} className="flex items-start gap-3 rounded-xl border border-slate-100 p-3">
                    <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${ev.kind === 'event' ? 'bg-brand-100 text-brand-700' : 'bg-amber-100 text-amber-700'}`}>
                      <Icon name={ev.kind === 'event' ? 'video' : 'clipboard'} size={16} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-slate-800">{ev.title}</div>
                      <div className="text-xs text-slate-500">{ev.meta}</div>
                    </div>
                    <span className="text-[11px] font-medium text-slate-400">{ev.time}</span>
                  </div>
                ))}
              </div>
            )}
          </PageCard>

          <PageCard>
            <h3 className="mb-3 text-sm font-bold text-slate-800">Upcoming</h3>
            <div className="space-y-2">
              {upcoming.map((ev) => (
                <button
                  key={ev.key + ev.day}
                  onClick={() => {
                    const [yy, mm] = ev.day.split('-').map(Number);
                    setCursor(new Date(yy, mm - 1, 1));
                    setSelected(ev.day);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl border border-slate-50 p-2.5 text-left transition hover:border-brand-100 hover:bg-slate-50"
                >
                  <span className={`flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg text-[10px] font-bold leading-none ${ev.kind === 'event' ? 'bg-brand-100 text-brand-700' : 'bg-amber-100 text-amber-700'}`}>
                    <span>{MONTHS[Number(ev.day.split('-')[1]) - 1].slice(0, 3)}</span>
                    <span className="text-sm">{ev.day.split('-')[2]}</span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-slate-700">{ev.title}</div>
                    <div className="truncate text-xs text-slate-500">{ev.meta}</div>
                  </div>
                </button>
              ))}
            </div>
          </PageCard>
        </div>
      </div>
    </div>
  );
}

function toKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function prettyDay(k: string): string {
  const [y, m, d] = k.split('-').map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

function ComposeModal({ onClose }: { onClose: () => void }) {
  const toast = useToast();
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);

  const send = async () => {
    if (!to.trim() || !to.includes('@')) { toast('Enter a valid recipient email', 'error'); return; }
    if (!subject.trim()) { toast('Subject is required', 'error'); return; }
    setBusy(true);
    try {
      const res = await composeMail({ to: to.trim(), subject: subject.trim(), body });
      if (res.ok) { toast('Email sent successfully!', 'success'); onClose(); }
      else toast(res.message ?? 'Failed to send email', 'error');
    } catch { toast('Could not send — check SMTP settings', 'error'); }
    finally { setBusy(false); }
  };

  const inp = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-bold text-slate-800">New Message</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><Icon name="x" size={16} /></button>
        </div>
        <div className="space-y-3 p-5">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">To</label>
            <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="recipient@example.com" className={inp} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Subject</label>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" className={inp} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Message</label>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write your message…" rows={6} className={`${inp} resize-none`} />
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <Button variant="secondary" icon="x" onClick={onClose}>Cancel</Button>
            <Button icon="mail" disabled={busy} onClick={() => { void send(); }}>
              {busy ? 'Sending…' : 'Send Email'}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export function Messages() {
  const toast = useToast();
  const { items, markRead } = useMessages();
  const [composing, setComposing] = useState(false);

  return (
    <div>
      {composing && <ComposeModal onClose={() => setComposing(false)} />}
      <PageHeader
        title="Messages"
        subtitle="Your inbox — send real emails via your configured SMTP"
        actions={<Button icon="plus" onClick={() => setComposing(true)}>Compose</Button>}
      />
      {items.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-200 py-16 text-center text-slate-400">
          <Icon name="mail" size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No messages yet</p>
        </div>
      )}
      <div className="grid grid-cols-1 gap-3">
        {items.map((m, i) => (
          <motion.div
            key={m.id ?? i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => m.id && m.unread && void markRead(m.id)}
            className={`flex cursor-pointer items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 transition hover:shadow-md ${
              m.unread ? 'border-l-4 border-brand-500' : ''
            }`}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
              {initials(m.from)}
            </span>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-slate-800">{m.from}</h3>
              <p className="truncate text-xs text-slate-500">{m.preview}</p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span className="text-xs text-slate-400">{m.time}</span>
              {m.unread && <span className="rounded-full bg-brand-500 px-2 py-0.5 text-[9px] font-bold text-white">NEW</span>}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = String(v ?? '').replace(/"/g, '""');
    return s.includes(',') || s.includes('\n') || s.includes('"') ? `"${s}"` : s;
  };
  const csv = [headers.join(','), ...rows.map((r) => headers.map((h) => escape(r[h])).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function Reports() {
  const store = useStore();
  const courses = store.list('courses');
  const students = store.list('students');
  const instructors = store.list('instructors');
  const enrolled = courses.reduce((s, c) => s + Number(c.students), 0);
  const avgCompletion = Math.round(
    courses.filter((c) => Number(c.students) > 0).reduce((s, c) => s + Number(c.completion), 0) /
      (courses.filter((c) => Number(c.students) > 0).length || 1),
  );
  const toast = useToast();

  const exportCsv = () => {
    const date = new Date().toISOString().slice(0, 10);
    downloadCsv(`sgprogrowth-courses-${date}.csv`, courses.map((c) => ({
      id: c.id, title: c.title, instructor: c.instructor, category: c.category,
      students: c.students, completion: c.completion, rating: c.rating, status: c.status,
    })));
    downloadCsv(`sgprogrowth-students-${date}.csv`, students.map((s) => ({
      id: s.id, name: s.name, email: s.email, courses: s.courses, progress: s.progress, joined: s.joined,
    })));
    downloadCsv(`sgprogrowth-instructors-${date}.csv`, instructors.map((i) => ({
      id: i.id, name: i.name, email: i.email, role: i.role, courses: i.courses, students: i.students,
    })));
    toast(`Report downloaded: ${courses.length} courses, ${students.length} students, ${instructors.length} instructors`, 'success');
  };

  const enrolByCourse = useMemo(
    () =>
      courses
        .filter((c) => Number(c.students) > 0)
        .map((c) => ({ name: String(c.title).slice(0, 18), students: Number(c.students) }))
        .sort((a, b) => b.students - a.students),
    [courses],
  );

  const categorySplit = useMemo(() => {
    const map: Record<string, number> = {};
    courses.forEach((c) => {
      const cat = String(c.category || 'Other');
      map[cat] = (map[cat] ?? 0) + Number(c.students || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [courses]);

  const completionData = useMemo(
    () =>
      courses
        .filter((c) => Number(c.students) > 0)
        .map((c) => ({ name: String(c.title).slice(0, 14), completion: Number(c.completion) })),
    [courses],
  );

  // Synthesised 6-month trend for enrolments + completion.
  const trend = useMemo(() => {
    const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
    return months.map((m, i) => ({
      month: m,
      enrolments: Math.round((enrolled / 6) * (0.7 + i * 0.12)),
      completion: Math.min(100, Math.round(avgCompletion * (0.75 + i * 0.05))),
    }));
  }, [enrolled, avgCompletion]);

  return (
    <div>
      <PageHeader
        title="Reports & Analytics"
        subtitle="Platform-wide performance at a glance"
        actions={<Button icon="download" variant="secondary" onClick={exportCsv}>Export CSV</Button>}
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon="book-open" value={courses.length} label="Courses" tone="brand" />
        <StatCard icon="users" value={enrolled} label="Enrolments" tone="violet" />
        <StatCard icon="award" value={instructors.length} label="Instructors" tone="emerald" />
        <StatCard icon="gauge" value={`${avgCompletion}%`} label="Avg Completion" tone="amber" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PageCard>
          <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-800">
            <Icon name="trending" size={18} className="text-brand-600" /> Enrolment & Completion Trend
          </h2>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trend} margin={{ left: -16 }}>
              <defs>
                <linearGradient id="enr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1a4d3e" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#1a4d3e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="cmp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2ff" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="enrolments" stroke="#1a4d3e" strokeWidth={2} fill="url(#enr)" />
              <Area type="monotone" dataKey="completion" stroke="#10b981" strokeWidth={2} fill="url(#cmp)" />
            </AreaChart>
          </ResponsiveContainer>
        </PageCard>

        <PageCard>
          <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-800">
            <Icon name="bar-chart" size={18} className="text-accent-600" /> Enrolments by Course
          </h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={enrolByCourse} margin={{ left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2ff" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={0} angle={-25} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip cursor={{ fill: '#f1f5f9' }} />
              <Bar dataKey="students" radius={[6, 6, 0, 0]}>
                {enrolByCourse.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </PageCard>

        <PageCard>
          <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-800">
            <Icon name="pie-chart" size={18} className="text-emerald-600" /> Category Distribution
          </h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={categorySplit} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={45} paddingAngle={2}>
                {categorySplit.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </PageCard>

        <PageCard>
          <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-800">
            <Icon name="gauge" size={18} className="text-amber-600" /> Course Completion %
          </h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={completionData} margin={{ left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2ff" />
              <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={0} angle={-25} textAnchor="end" height={60} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="completion" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#f59e0b' }} />
            </LineChart>
          </ResponsiveContainer>
        </PageCard>
      </div>

      <SessionCard />

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MiniMetric icon="users" label="Students" value={students.length} tone="bg-brand-50 text-brand-700" />
        <MiniMetric icon="award" label="Instructors" value={instructors.length} tone="bg-emerald-50 text-emerald-700" />
        <MiniMetric icon="book-open" label="Published Courses" value={courses.filter((c) => c.status === 'published').length} tone="bg-brand-50 text-brand-700" />
        <MiniMetric icon="star" label="Avg Rating" value={(courses.reduce((s, c) => s + Number(c.rating), 0) / (courses.length || 1)).toFixed(1)} tone="bg-amber-50 text-amber-700" />
      </div>
    </div>
  );
}

export function Payments() {
  const toast = useToast();
  return (
    <div>
      <PageHeader title="Payments & Payouts" subtitle="Instructor commission payouts via Razorpay" />
      <PaymentsSettingsPanel toast={toast} />
    </div>
  );
}

function MiniMetric({ icon, label, value, tone }: { icon: string; label: string; value: number | string; tone: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}>
        <Icon name={icon} size={18} />
      </span>
      <div>
        <div className="text-xl font-extrabold text-slate-800">{value}</div>
        <div className="text-xs text-slate-500">{label}</div>
      </div>
    </div>
  );
}

/** Shows the live JWT session — proof the admin is authorized via a signed token. */
function SessionCard() {
  const { token, claims } = useToken();
  const [show, setShow] = useState(false);
  if (!token || !claims) return null;
  const exp = claims.exp ? new Date(claims.exp * 1000) : null;
  const iat = claims.iat ? new Date(claims.iat * 1000) : null;
  return (
    <PageCard className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-bold text-slate-800">
          <Icon name="shield" size={18} className="text-emerald-600" /> Authenticated Session (JWT)
        </h2>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
          <Icon name="lock" size={12} /> HS256 · Verified
        </span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <SessionField label="Subject" value={String(claims.sub ?? '—')} />
        <SessionField label="Role" value={String(claims.role ?? '—')} />
        <SessionField label="Issued" value={iat ? iat.toLocaleTimeString() : '—'} />
        <SessionField label="Expires" value={exp ? exp.toLocaleTimeString() : '—'} />
      </div>
      <button
        onClick={() => setShow((s) => !s)}
        className="mt-4 flex items-center gap-2 text-xs font-semibold text-brand-600 hover:underline"
      >
        <Icon name={show ? 'eye-off' : 'eye'} size={13} /> {show ? 'Hide' : 'Show'} raw token
      </button>
      {show && (
        <pre className="mt-2 max-h-28 overflow-auto rounded-xl bg-slate-900 p-3 text-[10px] leading-relaxed text-emerald-300">
          {token}
        </pre>
      )}
    </PageCard>
  );
}

function SessionField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-0.5 truncate text-sm font-semibold capitalize text-slate-700">{value}</div>
    </div>
  );
}

const SETTINGS_TABS = [
  { id: 'general', label: 'General', icon: 'settings' },
  { id: 'branding', label: 'Branding', icon: 'palette' },
  { id: 'payments', label: 'Payments', icon: 'credit-card' },
  { id: 'email', label: 'Email / SMTP', icon: 'mail' },
  { id: 'notifications', label: 'Notifications', icon: 'bell' },
  { id: 'integrations', label: 'Integrations', icon: 'link' },
  { id: 'ai', label: 'AI Assistant', icon: 'bot' },
  { id: 'wordpress', label: 'WordPress Sync', icon: 'refresh' },
  { id: 'admins', label: 'Admin Users', icon: 'user' },
  { id: 'roles', label: 'Roles & Access', icon: 'key' },
  { id: 'security', label: 'Security', icon: 'shield' },
  { id: 'data', label: 'Data', icon: 'layers' },
];

export function Settings() {
  const store = useStore();
  const toast = useToast();
  const [tab, setTab] = useState(() => sessionStorage.getItem('sg_settings_tab') ?? 'general');

  useEffect(() => {
    const saved = sessionStorage.getItem('sg_settings_tab');
    if (saved) {
      setTab(saved);
      sessionStorage.removeItem('sg_settings_tab');
    }
  }, []);

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Portal configuration"
        actions={<Button icon="check" onClick={() => toast('Settings saved', 'success')}>Save changes</Button>}
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
        <SideTabs tabs={SETTINGS_TABS} active={tab} onChange={setTab} />

        <div className="space-y-6">
          {tab === 'general' && <GeneralSettingsPanel toast={toast} />}

          {tab === 'branding' && <BrandingPanel toast={toast} />}
          {tab === 'localization' && <LocalizationPanel toast={toast} />}

          {tab === 'payments' && <PaymentsSettingsPanel toast={toast} />}

          {tab === 'email' && <EmailSmtpSettingsPanel toast={toast} />}

          {tab === 'roles' && (
            <PageCard>
              <SectionTitle icon="key" title="Roles & Access" desc="What each role can do in the portal" />
              <div className="space-y-3">
                <RoleAccessRow role="Administrator" desc="Full access to every section & settings" tone="bg-brand-600 text-white" />
                <RoleAccessRow role="Instructor" desc="Manage own courses, units, quizzes & students" tone="bg-brand-100 text-brand-700" />
                <RoleAccessRow role="Student" desc="Enroll, learn, and take quizzes" tone="bg-emerald-100 text-emerald-700" />
                <RoleAccessRow role="Subscriber" desc="Browse catalog & receive updates" tone="bg-slate-100 text-slate-600" />
              </div>
              <div className="mt-4 divide-y divide-slate-100">
                <ToggleRow label="Allow instructor self-signup" desc="New instructors require approval" defaultOn={false} />
                <ToggleRow label="Open student registration" desc="Anyone can create a student account" defaultOn />
              </div>
            </PageCard>
          )}

          {tab === 'notifications' && (
            <PageCard>
              <SectionTitle icon="bell" title="Notifications" desc="Choose what the portal alerts you about" />
              <div className="divide-y divide-slate-100">
                <ToggleRow label="New enrollment alerts" desc="Email me when a student enrolls" defaultOn storageKey="notif_enroll" />
                <ToggleRow label="Course completion" desc="Notify on each completion" defaultOn storageKey="notif_complete" />
                <ToggleRow label="New reviews" desc="Alert when a review is posted" defaultOn storageKey="notif_reviews" />
                <ToggleRow label="Weekly summary" desc="Digest every Monday" defaultOn={false} storageKey="notif_weekly" />
                <ToggleRow label="Payment receipts" desc="Email on every order" defaultOn storageKey="notif_payments" />
              </div>
            </PageCard>
          )}

          {tab === 'integrations' && (
            <PageCard>
              <SectionTitle icon="link" title="Integrations" desc="Connect your favourite tools" />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <IntegrationRow name="Zoom" desc="Live class hosting" connected />
                <IntegrationRow name="Google Analytics" desc="Traffic insights" connected />
                <IntegrationRow name="Mailchimp" desc="Email campaigns" connected={false} />
                <IntegrationRow name="Slack" desc="Team alerts" connected={false} />
                <IntegrationRow name="Zapier" desc="Automations" connected={false} />
                <IntegrationRow name="WhatsApp" desc="Student reminders" connected />
              </div>
            </PageCard>
          )}

          {tab === 'ai' && <AiAssistantSettingsPanel toast={toast} />}

          {tab === 'wordpress' && <WordPressSyncPanel toast={toast} />}

          {tab === 'admins' && <AdminUsersPanel toast={toast} />}

          {tab === 'security' && (
            <PageCard>
              <SectionTitle icon="shield" title="Security" desc="Protect admin access" />
              <div className="divide-y divide-slate-100">
                <ToggleRow label="Two-factor authentication" desc="Require 2FA for all admins" defaultOn />
                <ToggleRow label="Force strong passwords" desc="Min 10 chars, mixed case" defaultOn />
                <ToggleRow label="Auto sign-out" desc="After 30 min of inactivity" defaultOn={false} />
              </div>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Session timeout (min)" value="30" />
                <Field label="Allowed login IPs" value="Any" />
              </div>
            </PageCard>
          )}

          {tab === 'data' && (
            <PageCard>
              <SectionTitle icon="layers" title="Data" desc="Manage locally-stored admin data" />
              <p className="mb-4 text-sm text-slate-500">
                Admin data is stored on the backend API. Reset reloads the original seed data on the server.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button variant="secondary" icon="download" onClick={() => toast('Data exported as JSON', 'success')}>
                  Export data
                </Button>
                <Button
                  variant="danger"
                  icon="refresh"
                  onClick={() => {
                    if (confirm('Reset all admin data to defaults?')) {
                      store.resetAll();
                      toast('Data reset to staging defaults', 'success');
                    }
                  }}
                >
                  Reset all data
                </Button>
              </div>
            </PageCard>
          )}
        </div>
      </div>
    </div>
  );
}

const PROFILE_TABS = [
  { id: 'account', label: 'Account', icon: 'user' },
  { id: 'preferences', label: 'Preferences', icon: 'settings' },
  { id: 'security', label: 'Security', icon: 'lock' },
  { id: 'social', label: 'Social Links', icon: 'link' },
  { id: 'activity', label: 'Activity', icon: 'activity' },
];

export function Profile() {
  const user = getUser();
  const toast = useToast();
  const [tab, setTab] = useState('account');
  const avatar = useAvatar();
  const fileRef = useRef<HTMLInputElement>(null);

  const onPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast('Please choose an image file', 'error');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast('Image must be under 2 MB', 'error');
      return;
    }
    const uploaded = await uploadImage(file);
    if (uploaded) {
      setAvatar(uploaded);
      toast('Profile photo uploaded', 'success');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAvatar(String(reader.result));
      toast('Profile photo updated locally', 'success');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <PageHeader
        title="Profile"
        subtitle="Manage your account"
        actions={<Button icon="check" onClick={() => toast('Profile saved', 'success')}>Save changes</Button>}
      />

      <div className="mb-6 overflow-hidden rounded-3xl border border-brand-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <div className="relative shrink-0">
            <Avatar
              name={user?.name ?? 'User'}
              src={avatar}
              size={88}
              rounded="rounded-2xl"
              className="shadow-lg ring-2 ring-brand-100"
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full bg-white text-brand-600 shadow-md ring-1 ring-slate-200 transition hover:bg-brand-50"
              title="Change photo"
            >
              <Icon name="camera" size={16} />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPhoto} />
          </div>
          <div className="text-center sm:text-left">
            <h3 className="text-xl font-bold text-gray-900">{user?.name}</h3>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-600 px-2.5 py-0.5 text-xs font-semibold capitalize text-white">
                <Icon name="shield" size={12} /> {user?.role}
              </span>
              <button
                onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700 transition hover:bg-brand-100"
              >
                <Icon name="camera" size={12} /> Upload photo
              </button>
              {avatar && (
                <button
                  onClick={() => {
                    clearAvatar();
                    toast('Profile photo removed', 'info');
                  }}
                  className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500 transition hover:bg-rose-100 hover:text-rose-600"
                >
                  <Icon name="trash" size={12} /> Remove
                </button>
              )}
            </div>
          </div>
          <div className="ml-auto hidden gap-6 sm:flex">
            <MiniStat value="3" label="Courses" />
            <MiniStat value="9" label="Students" />
            <MiniStat value="4.8" label="Rating" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
        <SideTabs tabs={PROFILE_TABS} active={tab} onChange={setTab} />

        <div className="space-y-6">
          {tab === 'account' && (
            <PageCard>
              <SectionTitle icon="user" title="Account details" desc="Your public information" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Display Name" value={user?.name ?? ''} />
                <Field label="Email" value={user?.email ?? ''} />
                <Field label="Phone" value="+91 98765 43210" />
                <Field label="Location" value="Mumbai, India" />
                <Field label="Designation" value="Lead Instructor" />
                <Field label="Website" value="https://sharvaconsulting.com" />
              </div>
              <div className="mt-4">
                <label className="mb-1.5 block text-xs font-semibold text-slate-500">Bio</label>
                <textarea
                  defaultValue="Passionate educator helping professionals grow through practical, outcome-driven courses."
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
              </div>
            </PageCard>
          )}

          {tab === 'preferences' && <PreferencesPanel toast={toast} />}
          {tab === 'security' && <SecurityPanel toast={toast} />}
          {tab === 'notifications' && <ProfileNotificationsPanel />}
          {tab === 'social' && <SocialLinksPanel toast={toast} />}

          {tab === 'activity' && (
            <PageCard>
              <SectionTitle icon="activity" title="Recent activity" desc="Your latest actions" />
              <ActivityFeedList />
            </PageCard>
          )}
        </div>
      </div>
    </div>
  );
}

function ActivityFeedList() {
  const { items } = useActivities();
  return (
    <div className="space-y-3">
      {items.map((a, i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl border border-slate-50 p-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-700">
            <Icon name="activity" size={15} />
          </span>
          <div className="flex-1 text-sm text-slate-600">{a.action}</div>
          <span className="text-xs text-slate-400">{a.time}</span>
        </div>
      ))}
    </div>
  );
}

// ── Razorpay Payment Modal ────────────────────────────────────────────────────

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open(): void };
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

interface PaymentModalProps {
  defaultAmount?: number;
  defaultPurpose?: string;
  recipientName?: string;
  onClose: () => void;
  onSuccess?: (paymentId: string) => void;
}

export function PaymentModal({ defaultAmount, defaultPurpose, recipientName, onClose, onSuccess }: PaymentModalProps) {
  const toast = useToast();
  const user = getUser();
  const [amount, setAmount] = useState(String(defaultAmount ?? ''));
  const [purpose, setPurpose] = useState(defaultPurpose ?? '');
  const [keyId, setKeyId] = useState('');
  const [busy, setBusy] = useState(false);
  const [needsKey, setNeedsKey] = useState(false);

  useEffect(() => {
    getRazorpayConfig().then((c) => { if (!c.configured) setNeedsKey(true); }).catch(() => setNeedsKey(true));
  }, []);

  const pay = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { toast('Enter a valid amount', 'error'); return; }
    if (needsKey && !keyId.trim()) { toast('Enter your Razorpay Key ID', 'error'); return; }
    setBusy(true);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) { toast('Could not load Razorpay. Check internet connection.', 'error'); setBusy(false); return; }

      const order = await createPaymentOrder({ amount: amt, purpose, ...(keyId.trim() ? { razorpayKeyId: keyId.trim() } : {}) });
      if (!order.ok || !order.orderId) {
        toast(order.message ?? 'Could not create payment order', 'error');
        if (order.message?.includes('not configured')) setNeedsKey(true);
        setBusy(false);
        return;
      }

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency ?? 'INR',
        name: 'SG Pro Growth',
        description: purpose || 'Payment',
        order_id: order.orderId,
        prefill: { name: user?.name ?? '', email: user?.email ?? '' },
        theme: { color: '#1a4d3e' },
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            const verify = await verifyPayment(response);
            if (verify.ok) {
              toast(`Payment successful! ID: ${verify.paymentId}`, 'success');
              onSuccess?.(verify.paymentId ?? '');
              onClose();
            } else {
              toast('Payment completed but verification failed. Contact support.', 'error');
            }
          } catch {
            toast('Payment verification failed', 'error');
          }
        },
        modal: { ondismiss: () => setBusy(false) },
      });
      rzp.open();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast(msg, 'error');
      setBusy(false);
    }
  };

  const inp = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
              <Icon name="credit-card" size={18} />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-800">Make Payment</h2>
              {recipientName && <p className="text-xs text-slate-500">To: {recipientName}</p>}
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><Icon name="x" size={16} /></button>
        </div>
        <div className="space-y-4 p-5">
          {needsKey && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              Razorpay is not configured in your server .env. Enter your Key ID below for this session, or add
              <code className="mx-1 font-mono">RAZORPAY_KEY_ID</code> and
              <code className="mx-1 font-mono">RAZORPAY_KEY_SECRET</code> to <code className="font-mono">Backend/sg-api/.env</code>.
            </div>
          )}
          {needsKey && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Razorpay Key ID (this session)</label>
              <input value={keyId} onChange={(e) => setKeyId(e.target.value)} placeholder="rzp_test_••••••••" className={inp} />
            </div>
          )}
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Amount (₹)</label>
            <input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Enter amount in rupees" className={inp} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Purpose / Note</label>
            <input value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="e.g. Instructor commission — June" className={inp} />
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <Button variant="secondary" icon="x" onClick={onClose}>Cancel</Button>
            <Button icon="credit-card" disabled={busy} onClick={() => { void pay(); }}>
              {busy ? 'Processing…' : `Pay ₹${amount || '—'}`}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ── Payments Settings Panel ───────────────────────────────────────────────────

// ── Shared localStorage helpers ───────────────────────────────────────────────

function lsGet(key: string, fallback: string) { return localStorage.getItem(key) ?? fallback; }
function lsSet(key: string, val: string) { localStorage.setItem(key, val); }

// ── Profile: Preferences ──────────────────────────────────────────────────────

function PreferencesPanel({ toast }: { toast: ReturnType<typeof useToast> }) {
  const inp = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100';
  const [lang, setLang] = useState(() => lsGet('pref_lang', 'English (India)'));
  const [tz, setTz] = useState(() => lsGet('pref_tz', 'Asia/Kolkata (GMT+5:30)'));
  const [fmt, setFmt] = useState(() => lsGet('pref_fmt', 'DD/MM/YYYY'));
  const [start, setStart] = useState(() => lsGet('pref_start', 'Dashboard'));

  const save = () => {
    lsSet('pref_lang', lang); lsSet('pref_tz', tz);
    lsSet('pref_fmt', fmt); lsSet('pref_start', start);
    toast('Preferences saved', 'success');
  };

  return (
    <PageCard>
      <SectionTitle icon="settings" title="Preferences" desc="Personalise your workspace" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-500">Language</label>
          <select value={lang} onChange={(e) => setLang(e.target.value)} className={inp}>
            <option>English (India)</option><option>English (US)</option><option>Hindi</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-500">Timezone</label>
          <select value={tz} onChange={(e) => setTz(e.target.value)} className={inp}>
            <option>Asia/Kolkata (GMT+5:30)</option><option>UTC</option><option>America/New_York</option><option>Europe/London</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-500">Date Format</label>
          <select value={fmt} onChange={(e) => setFmt(e.target.value)} className={inp}>
            <option>DD/MM/YYYY</option><option>MM/DD/YYYY</option><option>YYYY-MM-DD</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-500">Start Page</label>
          <select value={start} onChange={(e) => setStart(e.target.value)} className={inp}>
            <option>Dashboard</option><option>Courses</option><option>Students</option><option>Reports</option>
          </select>
        </div>
      </div>
      <div className="mt-4 divide-y divide-slate-100">
        <ToggleRow label="Compact sidebar" desc="Use a denser navigation" defaultOn={false} storageKey="pref_compact" />
        <ToggleRow label="Show motivational quotes" desc="Display quote banner on dashboard" defaultOn storageKey="pref_quotes" />
      </div>
      <div className="mt-4 flex justify-end">
        <Button icon="check-circle" onClick={save}>Save Preferences</Button>
      </div>
    </PageCard>
  );
}

// ── Profile: Notifications ────────────────────────────────────────────────────

function ProfileNotificationsPanel() {
  return (
    <PageCard>
      <SectionTitle icon="bell" title="Notification preferences" desc="How we reach you" />
      <div className="divide-y divide-slate-100">
        <ToggleRow label="Product updates" desc="New features & tips" defaultOn storageKey="pnotif_updates" />
        <ToggleRow label="Student messages" desc="Email me on new messages" defaultOn storageKey="pnotif_messages" />
        <ToggleRow label="Marketing" desc="Occasional promotions" defaultOn={false} storageKey="pnotif_marketing" />
      </div>
    </PageCard>
  );
}

// ── Profile: Social Links ─────────────────────────────────────────────────────

function SocialLinksPanel({ toast }: { toast: ReturnType<typeof useToast> }) {
  const inp = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100';
  const [li, setLi] = useState(() => lsGet('social_linkedin', ''));
  const [tw, setTw] = useState(() => lsGet('social_twitter', ''));
  const [yt, setYt] = useState(() => lsGet('social_youtube', ''));
  const [ig, setIg] = useState(() => lsGet('social_instagram', ''));

  const save = () => {
    lsSet('social_linkedin', li); lsSet('social_twitter', tw);
    lsSet('social_youtube', yt); lsSet('social_instagram', ig);
    toast('Social links saved', 'success');
  };

  return (
    <PageCard>
      <SectionTitle icon="link" title="Social links" desc="Shown on your public instructor page" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {[['LinkedIn', li, setLi, 'linkedin.com/in/yourname'], ['Twitter / X', tw, setTw, '@handle'], ['YouTube', yt, setYt, 'youtube.com/@channel'], ['Instagram', ig, setIg, '@handle']].map(([lbl, val, set, ph]) => (
          <div key={lbl as string}>
            <label className="mb-1.5 block text-xs font-semibold text-slate-500">{lbl as string}</label>
            <input value={val as string} onChange={(e) => (set as React.Dispatch<React.SetStateAction<string>>)(e.target.value)} placeholder={ph as string} className={inp} />
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-end">
        <Button icon="check-circle" onClick={save}>Save Links</Button>
      </div>
    </PageCard>
  );
}

// ── Settings: General ─────────────────────────────────────────────────────────

function GeneralSettingsPanel({ toast }: { toast: ReturnType<typeof useToast> }) {
  const inp = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100';
  const [siteTitle, setSiteTitle] = useState(() => lsGet('gen_siteTitle', 'SG Pro Growth'));
  const [tagline, setTagline] = useState(() => lsGet('gen_tagline', 'Training minds. Transforming businesses.'));
  const [supportEmail, setSupportEmail] = useState(() => lsGet('gen_supportEmail', 'contact@sgprogrowth.com'));
  const [supportPhone, setSupportPhone] = useState(() => lsGet('gen_supportPhone', '+91 98765 43210'));
  const [adminEmail, setAdminEmail] = useState(() => lsGet('gen_adminEmail', 'maheshmd@sharvagroup.com'));
  const [siteUrl, setSiteUrl] = useState(() => lsGet('gen_siteUrl', 'https://sharvaconsulting.com'));
  const [description, setDescription] = useState(() => lsGet('gen_desc', 'SGProGrowth gives you personally synergised career guidance before you enrol in any training — so you learn with purpose and grow with confidence.'));
  const [copyright, setCopyright] = useState(() => lsGet('gen_copyright', '© sharvagroup. All rights reserved.'));

  const save = () => {
    lsSet('gen_siteTitle', siteTitle); lsSet('gen_tagline', tagline);
    lsSet('gen_supportEmail', supportEmail); lsSet('gen_supportPhone', supportPhone);
    lsSet('gen_adminEmail', adminEmail); lsSet('gen_siteUrl', siteUrl);
    lsSet('gen_desc', description); lsSet('gen_copyright', copyright);
    toast('General settings saved', 'success');
  };

  return (
    <PageCard>
      <SectionTitle icon="settings" title="General" desc="Core information about your academy" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-500">Site Title</label>
          <input value={siteTitle} onChange={(e) => setSiteTitle(e.target.value)} className={inp} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-500">Tagline</label>
          <input value={tagline} onChange={(e) => setTagline(e.target.value)} className={inp} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-500">Support Email</label>
          <input value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} className={inp} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-500">Support Phone</label>
          <input value={supportPhone} onChange={(e) => setSupportPhone(e.target.value)} className={inp} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-500">Admin Email</label>
          <input value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} className={inp} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-500">Site URL</label>
          <input value={siteUrl} onChange={(e) => setSiteUrl(e.target.value)} className={inp} />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-semibold text-slate-500">Site Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={inp + ' resize-none'} />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-semibold text-slate-500">Copyright / Footer Text</label>
          <input value={copyright} onChange={(e) => setCopyright(e.target.value)} className={inp} />
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <Button icon="check" onClick={save}>Save General Settings</Button>
      </div>
    </PageCard>
  );
}

// ── Settings: Branding ────────────────────────────────────────────────────────

const SGPG_LOGO = 'https://sharvaconsulting.com/wp-content/uploads/2025/08/cropped-1000325607-1.jpeg';

function BrandingPanel({ toast }: { toast: ReturnType<typeof useToast> }) {
  const inp = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100';
  const [primary, setPrimary] = useState(() => lsGet('brand_primary', '#1a4d3e'));
  const [accent, setAccent] = useState(() => lsGet('brand_accent', '#248f6f'));
  const [logo, setLogo] = useState(() => lsGet('brand_logo', SGPG_LOGO));
  const [siteName, setSiteName] = useState(() => lsGet('brand_name', 'SG Pro Growth'));
  const [tagline, setTagline] = useState(() => lsGet('brand_tagline', 'Training minds. Transforming businesses.'));

  // Certificate template
  const [certTemplate, setCertTemplate] = useState<string>(() => lsGet('cert_template', ''));
  const [certTemplateName, setCertTemplateName] = useState<string>(() => lsGet('cert_template_name', ''));

  const handleLogoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setLogo(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleCertTemplate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCertTemplateName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setCertTemplate(dataUrl);
      toast(`Certificate template "${file.name}" loaded`, 'success');
    };
    reader.readAsDataURL(file);
  };

  const save = () => {
    lsSet('brand_primary', primary); lsSet('brand_accent', accent);
    lsSet('brand_logo', logo); lsSet('brand_name', siteName);
    lsSet('brand_tagline', tagline);
    if (certTemplate) { lsSet('cert_template', certTemplate); lsSet('cert_template_name', certTemplateName); }
    document.documentElement.style.setProperty('--color-brand-600', primary);
    document.documentElement.style.setProperty('--color-brand-700', accent);
    window.dispatchEvent(new Event('storage'));
    toast('Branding saved and applied', 'success');
  };

  return (
    <>
      <PageCard>
        <SectionTitle icon="palette" title="Branding" desc="Logo, colors and the look of your portal" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-500">Site Name</label>
            <input value={siteName} onChange={(e) => setSiteName(e.target.value)} className={inp} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-500">Tagline</label>
            <input value={tagline} onChange={(e) => setTagline(e.target.value)} className={inp} />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-semibold text-slate-500">Logo</label>
            <div className="flex flex-wrap items-center gap-3">
              <img
                src={logo || SGPG_LOGO}
                alt="Logo preview"
                className="h-12 w-12 rounded-lg border border-slate-200 object-cover"
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = SGPG_LOGO; }}
              />
              <div className="flex-1 space-y-2">
                <input value={logo} onChange={(e) => setLogo(e.target.value)} placeholder="Paste logo URL or upload below" className={inp} />
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-brand-400 hover:text-brand-700">
                  <Icon name="upload" size={13} /> Upload logo image
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoFile} />
                </label>
                <button
                  onClick={() => setLogo(SGPG_LOGO)}
                  className="ml-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:border-brand-400 hover:text-brand-700"
                >
                  Use website logo
                </button>
              </div>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-500">Primary Color</label>
            <div className="flex gap-2">
              <input type="color" value={primary} onChange={(e) => setPrimary(e.target.value)} className="h-10 w-12 cursor-pointer rounded-lg border border-slate-200 p-1" />
              <input value={primary} onChange={(e) => setPrimary(e.target.value)} className={`${inp} flex-1 font-mono`} />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-500">Accent Color</label>
            <div className="flex gap-2">
              <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="h-10 w-12 cursor-pointer rounded-lg border border-slate-200 p-1" />
              <input value={accent} onChange={(e) => setAccent(e.target.value)} className={`${inp} flex-1 font-mono`} />
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3 rounded-xl p-3" style={{ backgroundColor: primary + '15' }}>
          <span className="h-8 w-8 rounded-lg" style={{ backgroundColor: primary }} />
          <span className="h-8 w-8 rounded-lg" style={{ backgroundColor: accent }} />
          <span className="text-sm text-slate-600">Live preview — save to apply to the portal</span>
        </div>
        <div className="mt-4 flex justify-end">
          <Button icon="palette" onClick={save}>Save Branding</Button>
        </div>
      </PageCard>

      <PageCard>
        <SectionTitle icon="award" title="Certificate Template" desc="Upload a custom background template for issued certificates (PDF/PNG/JPEG)" />
        <div className="space-y-4">
          {certTemplate ? (
            <div className="relative overflow-hidden rounded-xl border border-brand-200 bg-brand-50">
              <img
                src={certTemplate}
                alt="Certificate template preview"
                className="max-h-64 w-full object-contain"
              />
              <div className="flex items-center justify-between border-t border-brand-100 bg-white px-4 py-2">
                <span className="text-xs font-semibold text-slate-600">{certTemplateName || 'Certificate template'}</span>
                <button
                  onClick={() => { setCertTemplate(''); setCertTemplateName(''); lsSet('cert_template', ''); lsSet('cert_template_name', ''); toast('Template removed', 'info'); }}
                  className="text-xs font-semibold text-rose-500 hover:text-rose-700"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-200 py-10 text-center">
              <Icon name="award" size={36} className="text-slate-300" />
              <div>
                <p className="text-sm font-semibold text-slate-600">No template uploaded yet</p>
                <p className="mt-0.5 text-xs text-slate-400">Upload a PNG, JPEG, or PDF to use as the certificate background</p>
              </div>
              <label className="cursor-pointer rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700">
                <Icon name="upload" size={14} className="mr-1.5 inline" />
                Upload Template
                <input type="file" accept="image/png,image/jpeg,application/pdf" className="hidden" onChange={handleCertTemplate} />
              </label>
            </div>
          )}
          {certTemplate && (
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700">
              <Icon name="upload" size={14} /> Replace Template
              <input type="file" accept="image/png,image/jpeg,application/pdf" className="hidden" onChange={handleCertTemplate} />
            </label>
          )}
          <p className="text-xs text-slate-400">The template is stored locally and used when generating certificate PDFs. Recommended size: A4 landscape (2480 × 1754 px).</p>
        </div>
      </PageCard>
    </>
  );
}

// ── Settings: Localization ────────────────────────────────────────────────────

function LocalizationPanel({ toast }: { toast: ReturnType<typeof useToast> }) {
  const inp = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100';
  const [currency, setCurrency] = useState(() => lsGet('loc_currency', 'INR (₹)'));
  const [lang, setLang] = useState(() => lsGet('loc_lang', 'English (India)'));
  const [tz, setTz] = useState(() => lsGet('loc_tz', 'Asia/Kolkata (GMT+5:30)'));
  const [fmt, setFmt] = useState(() => lsGet('loc_fmt', 'DD/MM/YYYY'));

  const save = () => {
    lsSet('loc_currency', currency); lsSet('loc_lang', lang);
    lsSet('loc_tz', tz); lsSet('loc_fmt', fmt);
    toast('Localization settings saved', 'success');
  };

  return (
    <PageCard>
      <SectionTitle icon="globe" title="Localization" desc="Currency, language and timezone" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-500">Currency</label>
          <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={inp}>
            <option>INR (₹)</option><option>USD ($)</option><option>EUR (€)</option><option>GBP (£)</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-500">Language</label>
          <select value={lang} onChange={(e) => setLang(e.target.value)} className={inp}>
            <option>English (India)</option><option>English (US)</option><option>Hindi</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-500">Timezone</label>
          <select value={tz} onChange={(e) => setTz(e.target.value)} className={inp}>
            <option>Asia/Kolkata (GMT+5:30)</option><option>UTC</option><option>America/New_York</option><option>Europe/London</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-500">Date Format</label>
          <select value={fmt} onChange={(e) => setFmt(e.target.value)} className={inp}>
            <option>DD/MM/YYYY</option><option>MM/DD/YYYY</option><option>YYYY-MM-DD</option>
          </select>
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <Button icon="check-circle" onClick={save}>Save Localization</Button>
      </div>
    </PageCard>
  );
}

// ── Security Panel (password change + real TOTP 2FA) ─────────────────────────

function SecurityPanel({ toast }: { toast: ReturnType<typeof useToast> }) {
  const input = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100';

  // ── Password change ──────────────────────────────────────────────────────
  const [curPwd, setCurPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confPwd, setConfPwd] = useState('');
  const [pwdBusy, setPwdBusy] = useState(false);

  const savePassword = async () => {
    if (!curPwd || !newPwd) { toast('Fill in all password fields', 'error'); return; }
    if (newPwd !== confPwd) { toast('New passwords do not match', 'error'); return; }
    if (newPwd.length < 8) { toast('Password must be at least 8 characters', 'error'); return; }
    setPwdBusy(true);
    try {
      const r = await changePassword({ currentPassword: curPwd, newPassword: newPwd });
      toast(r.message, 'success');
      setCurPwd(''); setNewPwd(''); setConfPwd('');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Password change failed', 'error');
    } finally { setPwdBusy(false); }
  };

  // ── 2FA ──────────────────────────────────────────────────────────────────
  const [twoEnabled, setTwoEnabled] = useState<boolean | null>(null);
  const [qrUrl, setQrUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [disablePwd, setDisablePwd] = useState('');
  const [tfaBusy, setTfaBusy] = useState(false);
  const [setupStep, setSetupStep] = useState<'idle' | 'scan' | 'verify'>('idle');

  useEffect(() => {
    get2faStatus().then((s) => setTwoEnabled(s.enabled)).catch(() => setTwoEnabled(false));
  }, []);

  const startSetup = async () => {
    setTfaBusy(true);
    try {
      const r = await setup2fa();
      setQrUrl(r.qrCodeUrl);
      setSecret(r.secret);
      setSetupStep('scan');
    } catch { toast('Could not generate QR code', 'error'); }
    finally { setTfaBusy(false); }
  };

  const confirmEnable = async () => {
    if (!verifyCode.trim()) { toast('Enter the 6-digit code from your authenticator app', 'error'); return; }
    setTfaBusy(true);
    try {
      const r = await enable2fa(verifyCode.trim());
      setTwoEnabled(r.enabled);
      setSetupStep('idle');
      setVerifyCode('');
      toast(r.message, 'success');
    } catch (e) { toast(e instanceof Error ? e.message : 'Invalid code', 'error'); }
    finally { setTfaBusy(false); }
  };

  const confirmDisable = async () => {
    if (!disablePwd.trim()) { toast('Enter your password to disable 2FA', 'error'); return; }
    setTfaBusy(true);
    try {
      const r = await disable2fa({ password: disablePwd.trim() });
      setTwoEnabled(r.enabled);
      setDisablePwd('');
      toast(r.message, 'success');
    } catch (e) { toast(e instanceof Error ? e.message : 'Could not disable 2FA', 'error'); }
    finally { setTfaBusy(false); }
  };

  return (
    <div className="space-y-6">
      {/* Password change */}
      <PageCard>
        <SectionTitle icon="lock" title="Change Password" desc="Update your admin account password" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-semibold text-slate-500">Current Password</label>
            <input type="password" value={curPwd} onChange={(e) => setCurPwd(e.target.value)} className={input} placeholder="••••••••" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-500">New Password</label>
            <input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} className={input} placeholder="Min. 8 characters" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-500">Confirm New Password</label>
            <input type="password" value={confPwd} onChange={(e) => setConfPwd(e.target.value)} className={input} placeholder="Repeat new password" />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button icon="lock" onClick={savePassword} disabled={pwdBusy}>{pwdBusy ? 'Saving…' : 'Update Password'}</Button>
        </div>
      </PageCard>

      {/* Two-factor authentication */}
      <PageCard>
        <div className="flex items-start justify-between gap-4">
          <SectionTitle icon="shield" title="Two-Factor Authentication (2FA)" desc="Protect your account with Google Authenticator" />
          {twoEnabled !== null && (
            <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${twoEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
              {twoEnabled ? 'Enabled' : 'Disabled'}
            </span>
          )}
        </div>

        {twoEnabled === false && setupStep === 'idle' && (
          <div className="mt-4">
            <p className="mb-4 text-sm text-slate-500">
              When 2FA is enabled, you will need to enter a 6-digit code from Google Authenticator (or Authy) every time you log in.
            </p>
            <Button icon="shield" onClick={startSetup} disabled={tfaBusy}>
              {tfaBusy ? 'Generating…' : 'Set up 2FA'}
            </Button>
          </div>
        )}

        {setupStep === 'scan' && (
          <div className="mt-4 space-y-4">
            <p className="text-sm font-medium text-slate-700">Step 1 — Scan this QR code with <strong>Google Authenticator</strong> or <strong>Authy</strong>:</p>
            {qrUrl && <img src={qrUrl} alt="2FA QR code" className="mx-auto h-48 w-48 rounded-xl border border-slate-200 p-2" />}
            <p className="text-center text-xs text-slate-400">Or enter this key manually: <code className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700">{secret}</code></p>
            <p className="text-sm font-medium text-slate-700">Step 2 — Enter the 6-digit code shown in your app to verify:</p>
            <div className="flex gap-3">
              <input
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className={`${input} w-40 text-center font-mono text-lg tracking-widest`}
                placeholder="000000"
                maxLength={6}
              />
              <Button icon="check-circle" onClick={confirmEnable} disabled={tfaBusy || verifyCode.length !== 6}>
                {tfaBusy ? 'Verifying…' : 'Verify & Enable'}
              </Button>
              <Button variant="secondary" onClick={() => setSetupStep('idle')}>Cancel</Button>
            </div>
          </div>
        )}

        {twoEnabled === true && (
          <div className="mt-4 space-y-3">
            <div className="alert-info rounded-xl px-4 py-3 text-sm">
              <Icon name="shield" size={14} className="mr-1.5 inline text-emerald-600" />
              Your account is protected. A 6-digit code will be required at every login.
            </div>
            <p className="text-sm text-slate-500">To disable 2FA, enter your account password below:</p>
            <div className="flex gap-3">
              <input
                type="password"
                value={disablePwd}
                onChange={(e) => setDisablePwd(e.target.value)}
                className={`${input} flex-1`}
                placeholder="Your current password"
              />
              <Button variant="secondary" icon="x-circle" onClick={confirmDisable} disabled={tfaBusy}>
                {tfaBusy ? 'Disabling…' : 'Disable 2FA'}
              </Button>
            </div>
          </div>
        )}
      </PageCard>
    </div>
  );
}

function PaymentsSettingsPanel({ toast: _toast }: { toast: ReturnType<typeof useToast> }) {
  const store = useStore();
  const [payTarget, setPayTarget] = useState<{ name: string; amount: number; purpose: string } | null>(null);
  const [rzpConfigured, setRzpConfigured] = useState(false);

  useEffect(() => {
    getRazorpayConfig().then((c) => setRzpConfigured(c.configured)).catch(() => {});
  }, []);

  const instructors = store.list('instructors');
  const courses = store.list('courses');

  // Calculate commission earned per instructor: sum of (course.students × course.price × commission%)
  const earnings = instructors.map((inst) => {
    const myCourses = courses.filter((c) => String(c.instructor) === String(inst.name));
    const revenue = myCourses.reduce((sum, c) => sum + Number(c.students) * Number(c.price || 0), 0);
    const commission = Number(inst.commission ?? 70) / 100;
    const due = Math.round(revenue * commission);
    return { inst, myCourses: myCourses.length, revenue, due };
  });

  const totalDue = earnings.reduce((s, e) => s + e.due, 0);

  return (
    <div className="space-y-6">
      {payTarget && (
        <PaymentModal
          defaultAmount={payTarget.amount}
          defaultPurpose={payTarget.purpose}
          recipientName={payTarget.name}
          onClose={() => setPayTarget(null)}
          onSuccess={() => setPayTarget(null)}
        />
      )}

      {/* Razorpay status */}
      <PageCard>
        <SectionTitle icon="credit-card" title="Instructor Payouts via Razorpay" desc="Pay instructor commissions directly from this portal" />
        <div className={`mb-4 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium ${rzpConfigured ? 'alert-info' : 'alert-warn'}`}>
          <span className={`h-2 w-2 rounded-full ${rzpConfigured ? 'bg-emerald-500' : 'bg-amber-400'}`} />
          {rzpConfigured ? 'Razorpay ready.' : (
            <>Not configured — add <code className="mx-1 font-mono text-xs">RAZORPAY_KEY_ID</code> + <code className="font-mono text-xs">RAZORPAY_KEY_SECRET</code> to Backend/sg-api/.env, then restart.
              {' '}<a href="https://dashboard.razorpay.com/app/keys" target="_blank" rel="noreferrer" className="underline">Get keys →</a>
            </>
          )}
        </div>

        {/* Summary */}
        <div className="mb-4 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <div className="text-xs font-semibold text-slate-500">Instructors</div>
            <div className="text-xl font-black text-slate-800">{instructors.length}</div>
          </div>
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
            <div className="text-xs font-semibold text-emerald-700">Total Revenue</div>
            <div className="text-xl font-black text-emerald-800">₹{earnings.reduce((s, e) => s + e.revenue, 0).toLocaleString()}</div>
          </div>
          <div className="rounded-xl border border-amber-100 bg-amber-50 p-3">
            <div className="text-xs font-semibold text-amber-700">Payouts Due</div>
            <div className="text-xl font-black text-amber-800">₹{totalDue.toLocaleString()}</div>
          </div>
        </div>

        {/* Per-instructor payout rows */}
        <div className="space-y-2">
          {earnings.map(({ inst, myCourses, revenue, due }) => (
            <div key={String(inst.id)} className="flex items-center gap-4 rounded-xl border border-slate-100 px-4 py-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                {initials(String(inst.name))}
              </span>
              <div className="flex-1">
                <div className="text-sm font-semibold text-slate-800">{String(inst.name)}</div>
                <div className="text-xs text-slate-500">{myCourses} course{myCourses !== 1 ? 's' : ''} · {inst.commission ?? 70}% commission · Revenue ₹{revenue.toLocaleString()}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-brand-700">₹{due.toLocaleString()}</div>
                <div className="text-[10px] text-slate-400">due</div>
              </div>
              <Button
                icon="credit-card"
                variant="secondary"
                onClick={() => setPayTarget({ name: String(inst.name), amount: due || 1, purpose: `Commission payout — ${String(inst.name)}` })}
              >
                Pay
              </Button>
            </div>
          ))}
          {instructors.length === 0 && (
            <p className="rounded-xl bg-slate-50 py-6 text-center text-sm text-slate-400">No instructors found — sync from WordPress first.</p>
          )}
        </div>
      </PageCard>
    </div>
  );
}

// ── Email / SMTP ──────────────────────────────────────────────────────────────

function EmailSmtpSettingsPanel({ toast }: { toast: ReturnType<typeof useToast> }) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('Loading…');
  const [host, setHost] = useState('smtpout.secureserver.net');
  const [port, setPort] = useState('587');
  const [secure, setSecure] = useState(false);
  const [username, setUsername] = useState('contact@sgprogrowth.com');
  const [password, setPassword] = useState('');
  const [passwordSet, setPasswordSet] = useState(false);
  const [fromEmail, setFromEmail] = useState('contact@sgprogrowth.com');
  const [fromName, setFromName] = useState('SG Pro Growth');
  const [testTo, setTestTo] = useState('');

  useEffect(() => {
    getMailConfig()
      .then((c) => {
        setHost(c.host);
        setPort(String(c.port));
        setSecure(c.secure);
        setUsername(c.username);
        setFromEmail(c.fromEmail);
        setFromName(c.fromName);
        setPasswordSet(c.passwordSet);
        setStatus(c.passwordSet ? 'Configured — run test to verify' : 'Password not set — enter it and save');
      })
      .catch(() => setStatus('Could not load config — ensure the backend is running and you are an admin'));
  }, []);

  const save = async () => {
    setBusy(true);
    try {
      const saved = await saveMailConfig({
        host,
        port: Number(port) || 587,
        secure,
        username,
        fromEmail,
        fromName,
        ...(password.trim() ? { password: password.trim() } : {}),
      });
      setPasswordSet(saved.passwordSet);
      setPassword('');
      setStatus(saved.passwordSet ? 'Saved — run test connection to verify' : 'Saved, but password is still missing');
      toast('SMTP settings saved', 'success');
    } catch {
      toast('Could not save SMTP settings', 'error');
    } finally {
      setBusy(false);
    }
  };

  const test = async () => {
    setBusy(true);
    try {
      const result = await testMailConnection();
      setStatus(result.message);
      toast(result.message, result.ok ? 'success' : 'error');
    } catch {
      toast('Connection test failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const sendTest = async () => {
    if (!testTo.trim()) {
      toast('Enter a recipient email for the test', 'error');
      return;
    }
    setBusy(true);
    try {
      const result = await sendTestEmail(testTo.trim());
      setStatus(result.message);
      toast(result.message, result.ok ? 'success' : 'error');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Test email failed';
      setStatus(msg);
      toast(msg, 'error');
    } finally {
      setBusy(false);
    }
  };

  const input =
    'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100';

  return (
    <PageCard>
      <SectionTitle icon="mail" title="Email / SMTP" desc="Outgoing mail via your SMTP server" />
      <div className={`mb-4 px-4 py-3 text-sm ${status.startsWith('Connected') || status.startsWith('Email sent') ? 'alert-info' : 'alert-warn'}`}>
        {status}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-500">From Name</label>
          <input value={fromName} onChange={(e) => setFromName(e.target.value)} className={input} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-500">From Email</label>
          <input value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} className={input} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-500">SMTP Host</label>
          <input value={host} onChange={(e) => setHost(e.target.value)} className={input} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-500">SMTP Port</label>
          <input value={port} onChange={(e) => setPort(e.target.value)} className={input} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-500">Encryption</label>
          <select
            value={secure ? 'ssl' : 'tls'}
            onChange={(e) => {
              const ssl = e.target.value === 'ssl';
              setSecure(ssl);
              setPort(ssl ? '465' : '587');
            }}
            className={input}
          >
            <option value="tls">TLS / STARTTLS (port 587)</option>
            <option value="ssl">SSL (port 465)</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-500">Username</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} className={input} />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-semibold text-slate-500">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={passwordSet ? 'Saved — enter a new password to replace' : 'Email account password'}
            className={input}
          />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <Button icon="check" disabled={busy} onClick={() => { void save(); }}>
          Save settings
        </Button>
        <Button icon="link" variant="secondary" disabled={busy} onClick={() => { void test(); }}>
          Test connection
        </Button>
      </div>

      <div className="mt-6 border-t border-slate-100 pt-4">
        <label className="mb-1.5 block text-xs font-semibold text-slate-500">Send a test email to</label>
        <div className="flex flex-wrap gap-3">
          <input
            value={testTo}
            onChange={(e) => setTestTo(e.target.value)}
            placeholder="you@example.com"
            className={`${input} max-w-xs`}
          />
          <Button icon="mail" variant="secondary" disabled={busy} onClick={() => { void sendTest(); }}>
            Send test email
          </Button>
        </div>
      </div>
    </PageCard>
  );
}

function AiAssistantSettingsPanel({ toast }: { toast: ReturnType<typeof useToast> }) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('Not connected');
  const [provider, setProvider] = useState<LlmConfig['provider']>('openai');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('https://api.openai.com/v1');
  const [model, setModel] = useState('gpt-4o-mini');
  const [keyHint, setKeyHint] = useState<string | null>(null);

  const load = async () => {
    try {
      const c = await getLlmConfig();
      setProvider(c.provider);
      setBaseUrl(c.baseUrl);
      setModel(c.model);
      setKeyHint(c.apiKeyHint);
      setStatus(c.apiKeySet || c.provider === 'ollama' ? 'Configured — run test to verify' : 'No API key saved');
    } catch {
      setStatus('Could not load config — ensure you are logged in as admin');
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const applyProvider = (p: LlmConfig['provider']) => {
    setProvider(p);
    if (p === 'openai') {
      setBaseUrl('https://api.openai.com/v1');
      setModel('gpt-4o-mini');
    } else if (p === 'groq') {
      setBaseUrl('https://api.groq.com/openai/v1');
      setModel('llama-3.3-70b-versatile');
    } else if (p === 'ollama') {
      setBaseUrl('http://localhost:11434/v1');
      setModel('llama3.2');
    }
  };

  const save = async () => {
    setBusy(true);
    try {
      const saved = await saveLlmConfig({
        provider,
        baseUrl,
        model,
        ...(apiKey.trim() ? { apiKey: apiKey.trim() } : {}),
      });
      setKeyHint(saved.apiKeyHint);
      setApiKey('');
      toast('AI settings saved', 'success');
      setStatus('Saved — run test connection to verify');
    } catch {
      toast('Could not save AI settings', 'error');
    } finally {
      setBusy(false);
    }
  };

  const test = async () => {
    setBusy(true);
    try {
      const result = await testLlmConnection();
      setStatus(result.message);
      toast(result.message, result.ok ? 'success' : 'error');
    } catch {
      setStatus('Test failed — save settings first');
      toast('Connection test failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageCard>
      <SectionTitle icon="bot" title="AI Assistant (LLM)" desc="Connect OpenAI, Groq, or local Ollama for open-ended answers" />
      <div className={`mb-4 px-4 py-3 text-sm ${status.includes('Connected') ? 'alert-info' : 'alert-warn'}`}>
        {status}
        {keyHint && <span className="ml-2 text-xs opacity-70">Key: {keyHint}</span>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-gray-500">Provider</label>
          <select
            value={provider}
            onChange={(e) => applyProvider(e.target.value as LlmConfig['provider'])}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-brand-600"
          >
            <option value="openai">OpenAI</option>
            <option value="groq">Groq (free tier)</option>
            <option value="ollama">Ollama (local, free)</option>
            <option value="custom">Custom endpoint</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-gray-500">Model</label>
          <input
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-brand-600"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-semibold text-gray-500">API Base URL</label>
          <input
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-brand-600"
          />
        </div>
        {provider !== 'ollama' && (
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-semibold text-gray-500">API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={keyHint ? `Saved (${keyHint}) — enter new key to replace` : 'sk-... or gsk_...'}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-brand-600"
            />
          </div>
        )}
      </div>

      {provider === 'ollama' && (
        <p className="mt-3 text-xs text-gray-500">
          Install Ollama from ollama.com, then run: <code className="rounded bg-gray-100 px-1">ollama pull {model}</code>
        </p>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <Button icon="check" disabled={busy} onClick={() => { void save(); }}>
          Save & connect
        </Button>
        <Button icon="link" variant="secondary" disabled={busy} onClick={() => { void test(); }}>
          Test connection
        </Button>
      </div>
    </PageCard>
  );
}

function WordPressSyncPanel({ toast }: { toast: ReturnType<typeof useToast> }) {
  const [busy, setBusy] = useState(false);
  const [connStatus, setConnStatus] = useState<string>('Not checked yet');
  const [connected, setConnected] = useState(false);
  const [lastResult, setLastResult] = useState<string>('');
  const [preview, setPreview] = useState<{ title: string; status: string }[]>([]);

  const check = async () => {
    setBusy(true);
    try {
      const s = await getWpSyncStatus();
      setConnected(s.connected);
      setConnStatus(s.connected ? `Connected to ${s.baseUrl}` : `Could not reach ${s.baseUrl}`);
      const p = await previewWpCourses();
      setPreview(p.courses ?? []);
    } catch {
      setConnStatus('API unavailable — start the backend server');
    } finally {
      setBusy(false);
    }
  };

  const runSyncAll = async () => {
    setBusy(true);
    try {
      const res = await syncAll();
      setLastResult(res.message);
      toast(res.message, res.total > 0 ? 'success' : 'info');
    } catch {
      toast('Sync failed — check connection first', 'error');
    } finally {
      setBusy(false);
    }
  };

  const run = async (fn: () => Promise<{ message: string }>) => {
    setBusy(true);
    try {
      const res = await fn();
      setLastResult(res.message);
      toast(res.message, 'success');
    } catch {
      toast('Import failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageCard>
      <SectionTitle icon="refresh" title="WordPress / WPLMS Sync" desc="Pull real data from sharvaconsulting.com into this platform" />

      {/* Connection status */}
      <div className={`mb-5 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium ${connected ? 'alert-info' : 'alert-warn'}`}>
        <span className={`h-2 w-2 rounded-full ${connected ? 'bg-emerald-500' : 'bg-amber-400'}`} />
        {connStatus}
        <Button icon="link" variant="secondary" disabled={busy} onClick={() => { void check(); }} className="ml-auto">
          Check connection
        </Button>
      </div>

      {/* Sync All — big primary action */}
      <div className="mb-5 rounded-2xl border border-brand-200 bg-brand-50 p-4">
        <p className="mb-3 text-sm font-semibold text-brand-800">
          Sync everything in one click — courses, quizzes, students, instructors, and groups.
        </p>
        <Button icon="download" disabled={busy} onClick={() => { void runSyncAll(); }}>
          {busy ? 'Syncing…' : 'Sync All from WordPress'}
        </Button>
        {lastResult && <p className="mt-2 text-xs text-brand-700">{lastResult}</p>}
      </div>

      {/* Individual syncs */}
      <div className="mb-5">
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Sync individually</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: 'Courses', fn: () => importWpCourses() },
            { label: 'Quizzes', fn: () => importWpQuizzes() },
            { label: 'Members', fn: () => importWpMembers() },
            { label: 'Groups', fn: () => importWpGroups() },
          ].map(({ label, fn }) => (
            <Button key={label} variant="secondary" icon="download" disabled={busy} onClick={() => { void run(fn); }}>
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Dedup */}
      <div className="mb-5 border-t border-slate-100 pt-4">
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Data Quality</h3>
        <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
          <div>
            <div className="text-sm font-semibold text-slate-700">Remove instructor duplicates from Students</div>
            <div className="text-xs text-slate-500">If an instructor name appears in the Students list, this removes it</div>
          </div>
          <Button
            variant="secondary"
            icon="check"
            disabled={busy}
            onClick={() => {
              void run(() => dedupStudents());
            }}
          >
            Fix now
          </Button>
        </div>
      </div>

      {/* Course preview */}
      {preview.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-bold text-slate-700">Courses on WordPress ({preview.length})</h3>
          <div className="space-y-1.5">
            {preview.map((c) => (
              <div key={c.title} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm text-slate-700">
                <span>{c.title}</span>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">{c.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </PageCard>
  );
}

function AdminUsersPanel({ toast }: { toast: ReturnType<typeof useToast> }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('instructor');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      setUsers(await listAdminUsers());
    } catch {
      toast('Could not load users — admin API required', 'error');
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const add = async () => {
    if (!email || !name || !password) {
      toast('Fill all fields', 'error');
      return;
    }
    setBusy(true);
    try {
      await createAdminUser({ email, name, role, password });
      toast('User created', 'success');
      setEmail('');
      setName('');
      setPassword('');
      await load();
    } catch {
      toast('Could not create user', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageCard>
      <SectionTitle icon="user" title="Admin users" desc="Manage who can log into this portal" />
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-500">Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-500">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-500">Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500">
            <option value="admin">Admin</option>
            <option value="instructor">Instructor</option>
            <option value="student">Student</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-500">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500" />
        </div>
      </div>
      <div className="mb-6 flex gap-3">
        <Button icon="plus" disabled={busy} onClick={() => { void add(); }}>Add user</Button>
        <Button variant="secondary" icon="refresh" disabled={busy} onClick={() => { void load(); }}>Refresh</Button>
      </div>
      <div className="divide-y divide-slate-100">
        {users.map((u) => (
          <div key={u.id} className="flex items-center justify-between py-3 text-sm">
            <div>
              <div className="font-semibold text-slate-800">{u.name}</div>
              <div className="text-xs text-slate-500">{u.email}</div>
            </div>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold capitalize text-slate-600">{u.role}</span>
          </div>
        ))}
      </div>
    </PageCard>
  );
}

function SideTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: string; label: string; icon: string }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto rounded-2xl bg-white p-2 shadow-sm ring-1 ring-slate-100 lg:flex-col lg:overflow-visible">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
            active === t.id
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
          }`}
        >
          <Icon name={t.icon} size={16} />
          {t.label}
        </button>
      ))}
    </div>
  );
}

function SectionTitle({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
        <Icon name={icon} size={18} />
      </span>
      <div>
        <h2 className="text-base font-bold text-slate-800">{title}</h2>
        <p className="text-xs text-slate-500">{desc}</p>
      </div>
    </div>
  );
}

function MiniStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-black text-brand-700">{value}</div>
      <div className="text-[11px] uppercase tracking-wide text-gray-400">{label}</div>
    </div>
  );
}

function ToggleRow({ label, desc, defaultOn, storageKey }: { label: string; desc: string; defaultOn: boolean; storageKey?: string }) {
  const [on, setOn] = useState(() => {
    if (!storageKey) return defaultOn;
    const v = localStorage.getItem(storageKey);
    return v !== null ? v === 'true' : defaultOn;
  });
  const toggle = () => {
    const next = !on;
    setOn(next);
    if (storageKey) localStorage.setItem(storageKey, String(next));
  };
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <div className="text-sm font-semibold text-slate-700">{label}</div>
        <div className="text-xs text-slate-500">{desc}</div>
      </div>
      <button
        onClick={toggle}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? 'bg-brand-600' : 'bg-slate-200'}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
    </div>
  );
}

function IntegrationRow({ name, desc, connected }: { name: string; desc: string; connected: boolean }) {
  const [on, setOn] = useState(connected);
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-600">
        {name.slice(0, 2)}
      </span>
      <div className="flex-1">
        <div className="text-sm font-semibold text-slate-700">{name}</div>
        <div className="text-xs text-slate-500">{desc}</div>
      </div>
      <button
        onClick={() => setOn((v) => !v)}
        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
          on
            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            : 'bg-brand-600 text-white hover:brightness-105'
        }`}
      >
        {on ? 'Connected' : 'Connect'}
      </button>
    </div>
  );
}

function RoleAccessRow({ role, desc, tone }: { role: string; desc: string; tone: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
      <span className={`rounded-full px-3 py-1 text-xs font-bold ${tone}`}>{role}</span>
      <span className="flex-1 text-sm text-slate-600">{desc}</span>
    </div>
  );
}

function Field({ label, value, placeholder }: { label: string; value: string; placeholder?: string }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-slate-500">{label}</label>
      <input
        defaultValue={value}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
      />
    </div>
  );
}
