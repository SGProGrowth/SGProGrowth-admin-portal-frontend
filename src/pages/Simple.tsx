import { motion } from 'framer-motion';
import { useMemo, useRef, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { Avatar, Button, PageCard, StatCard } from '../components/ui';
import { activities, messages } from '../data';
import { clearAvatar, getUser, initials, setAvatar, useAvatar } from '../lib/auth';
import { Icon } from '../lib/icons';
import { useToast } from '../lib/toast';
import { useStore } from '../store';

export function Activity() {
  return (
    <div>
      <PageHeader title="Activity" subtitle="Everything happening across the platform" />
      <PageCard>
        <div className="space-y-3">
          {[...activities, ...activities].map((a, i) => (
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

export function Calendar() {
  const store = useStore();
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(toKey(today));

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
      <PageHeader
        title="Calendar"
        subtitle="Events, live sessions and assignment deadlines"
        actions={
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
              <p className="rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-400">No events on this day.</p>
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

export function Messages() {
  const toast = useToast();
  return (
    <div>
      <PageHeader
        title="Messages"
        subtitle="Your inbox"
        actions={<Button icon="plus" onClick={() => toast('Compose window opening…', 'info')}>Compose</Button>}
      />
      <div className="grid grid-cols-1 gap-3">
        {messages.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 ${
              m.unread ? 'border-l-4 border-brand-500' : ''
            }`}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
              {initials(m.from)}
            </span>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-slate-800">{m.from}</h3>
              <p className="text-xs text-slate-500">{m.preview}</p>
            </div>
            <span className="text-xs text-slate-400">{m.time}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function Reports() {
  const store = useStore();
  const courses = store.list('courses');
  const students = store.list('students');
  const orders = store.list('orders');
  const revenue = orders.reduce((s, o) => s + Number(o.total), 0);
  const toast = useToast();

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Platform-wide analytics"
        actions={<Button icon="download" variant="secondary" onClick={() => toast('Report exported as CSV', 'success')}>Export</Button>}
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon="book-open" value={courses.length} label="Courses" tone="brand" />
        <StatCard icon="users" value={students.length} label="Students" tone="violet" />
        <StatCard icon="shopping" value={orders.length} label="Orders" tone="emerald" />
        <StatCard icon="bar-chart" value={`₹${revenue.toLocaleString('en-IN')}`} label="Revenue" tone="amber" />
      </div>
    </div>
  );
}

const SETTINGS_TABS = [
  { id: 'general', label: 'General', icon: 'settings' },
  { id: 'branding', label: 'Branding', icon: 'palette' },
  { id: 'localization', label: 'Localization', icon: 'globe' },
  { id: 'payments', label: 'Payments', icon: 'credit-card' },
  { id: 'email', label: 'Email / SMTP', icon: 'mail' },
  { id: 'notifications', label: 'Notifications', icon: 'bell' },
  { id: 'integrations', label: 'Integrations', icon: 'link' },
  { id: 'roles', label: 'Roles & Access', icon: 'key' },
  { id: 'security', label: 'Security', icon: 'shield' },
  { id: 'data', label: 'Data', icon: 'layers' },
];

export function Settings() {
  const store = useStore();
  const toast = useToast();
  const [tab, setTab] = useState('general');

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
          {tab === 'general' && (
            <PageCard>
              <SectionTitle icon="settings" title="General" desc="Core information about your academy" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Site Title" value="SG Pro Growth" />
                <Field label="Tagline" value="Grow professionally with expert-led courses" />
                <Field label="Support Email" value="contact@sgprogrowth.com" />
                <Field label="Support Phone" value="+91 98765 43210" />
                <Field label="Admin Email" value="maheshmd@sharvagroup.com" />
                <Field label="Site URL" value="https://sharvaconsulting.com" />
              </div>
            </PageCard>
          )}

          {tab === 'branding' && (
            <PageCard>
              <SectionTitle icon="palette" title="Branding" desc="Logo, colors and the look of your portal" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Primary Color" value="#4f46e5" />
                <Field label="Accent Color" value="#9333ea" />
                <Field label="Logo URL" value="/logo.svg" />
                <Field label="Favicon URL" value="/favicon.ico" />
              </div>
              <div className="mt-4 flex items-center gap-3 rounded-xl bg-slate-50 p-4">
                <span className="h-10 w-10 rounded-lg bg-gradient-to-br from-brand-600 to-accent-600" />
                <div className="text-sm text-slate-600">Theme preview — gradient applied across buttons & highlights.</div>
              </div>
            </PageCard>
          )}

          {tab === 'localization' && (
            <PageCard>
              <SectionTitle icon="globe" title="Localization" desc="Currency, language and timezone" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Currency" value="INR (₹)" />
                <Field label="Language" value="English (India)" />
                <Field label="Timezone" value="Asia/Kolkata (GMT+5:30)" />
                <Field label="Date Format" value="DD/MM/YYYY" />
              </div>
            </PageCard>
          )}

          {tab === 'payments' && (
            <PageCard>
              <SectionTitle icon="credit-card" title="Payments" desc="Connect gateways and set payout rules" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Razorpay Key ID" value="rzp_live_••••••••" />
                <Field label="Stripe Public Key" value="pk_live_••••••••" />
                <Field label="Default Tax (GST %)" value="18" />
                <Field label="Instructor Payout %" value="70" />
              </div>
              <ToggleRow label="Enable test mode" desc="Process payments in sandbox" defaultOn={false} />
            </PageCard>
          )}

          {tab === 'email' && (
            <PageCard>
              <SectionTitle icon="mail" title="Email / SMTP" desc="Outgoing mail configuration (WP Mail SMTP)" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="From Name" value="SG Pro Growth" />
                <Field label="From Email" value="contact@sgprogrowth.com" />
                <Field label="SMTP Host" value="smtp.sgprogrowth.com" />
                <Field label="SMTP Port" value="587" />
                <Field label="Encryption" value="TLS" />
                <Field label="Username" value="smtp-user" />
              </div>
              <ToggleRow label="Enable SMTP authentication" desc="Use credentials above" defaultOn />
              <ToggleRow label="Send test email on save" desc="Verify the connection" defaultOn={false} />
            </PageCard>
          )}

          {tab === 'roles' && (
            <PageCard>
              <SectionTitle icon="key" title="Roles & Access" desc="What each role can do in the portal" />
              <div className="space-y-3">
                <RoleAccessRow role="Administrator" desc="Full access to every section & settings" tone="bg-gradient-to-r from-brand-600 to-accent-600 text-white" />
                <RoleAccessRow role="Instructor" desc="Manage own courses, units, quizzes & students" tone="bg-violet-100 text-violet-700" />
                <RoleAccessRow role="Student" desc="Enroll, learn, take quizzes & earn achievements" tone="bg-emerald-100 text-emerald-700" />
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
                <ToggleRow label="New enrollment alerts" desc="Email me when a student enrolls" defaultOn />
                <ToggleRow label="Course completion" desc="Notify on each completion" defaultOn />
                <ToggleRow label="New reviews" desc="Alert when a review is posted" defaultOn />
                <ToggleRow label="Weekly summary" desc="Digest every Monday" defaultOn={false} />
                <ToggleRow label="Payment receipts" desc="Email on every order" defaultOn />
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
                All admin data is saved locally in your browser. Reset to reload the original staging seed data.
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
  { id: 'payout', label: 'Payout', icon: 'credit-card' },
  { id: 'security', label: 'Security', icon: 'lock' },
  { id: 'notifications', label: 'Notifications', icon: 'bell' },
  { id: 'social', label: 'Social Links', icon: 'link' },
  { id: 'activity', label: 'Activity', icon: 'activity' },
];

export function Profile() {
  const user = getUser();
  const toast = useToast();
  const [tab, setTab] = useState('account');
  const avatar = useAvatar();
  const fileRef = useRef<HTMLInputElement>(null);

  const onPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    const reader = new FileReader();
    reader.onload = () => {
      setAvatar(String(reader.result));
      toast('Profile photo updated', 'success');
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

      <div className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 p-6 ring-1 ring-white/10">
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <div className="relative shrink-0">
            <Avatar
              name={user?.name ?? 'User'}
              src={avatar}
              size={88}
              rounded="rounded-2xl"
              className="shadow-lg ring-2 ring-white/20"
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
            <h3 className="text-xl font-bold text-white">{user?.name}</h3>
            <p className="text-sm text-white/70">{user?.email}</p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-semibold capitalize text-white">
                <Icon name="shield" size={12} /> {user?.role}
              </span>
              <button
                onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-white transition hover:bg-white/20"
              >
                <Icon name="camera" size={12} /> Upload photo
              </button>
              {avatar && (
                <button
                  onClick={() => {
                    clearAvatar();
                    toast('Profile photo removed', 'info');
                  }}
                  className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-white/80 transition hover:bg-rose-500/30"
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

          {tab === 'preferences' && (
            <PageCard>
              <SectionTitle icon="settings" title="Preferences" desc="Personalise your workspace" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Language" value="English (India)" />
                <Field label="Timezone" value="Asia/Kolkata (GMT+5:30)" />
                <Field label="Date Format" value="DD/MM/YYYY" />
                <Field label="Start Page" value="Dashboard" />
              </div>
              <div className="mt-4 divide-y divide-slate-100">
                <ToggleRow label="Compact sidebar" desc="Use a denser navigation" defaultOn={false} />
                <ToggleRow label="Show motivational quotes" desc="Display quote banner on dashboard" defaultOn />
              </div>
            </PageCard>
          )}

          {tab === 'payout' && (
            <PageCard>
              <SectionTitle icon="credit-card" title="Payout details" desc="Where your instructor earnings are sent" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Payout Method" value="Bank Transfer (NEFT)" />
                <Field label="Account Holder" value="Mahesh MD" />
                <Field label="Bank Name" value="HDFC Bank" />
                <Field label="Account Number" value="•••• •••• 4821" />
                <Field label="IFSC Code" value="HDFC0001234" />
                <Field label="PAN" value="ABCDE1234F" />
                <Field label="Commission Rate" value="70%" />
                <Field label="Pending Balance" value="₹12,480" />
              </div>
            </PageCard>
          )}

          {tab === 'security' && (
            <PageCard>
              <SectionTitle icon="lock" title="Password & security" desc="Keep your account safe" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Current Password" value="" placeholder="••••••••" />
                <div className="hidden sm:block" />
                <Field label="New Password" value="" placeholder="New password" />
                <Field label="Confirm Password" value="" placeholder="Confirm password" />
              </div>
              <div className="mt-4 divide-y divide-slate-100">
                <ToggleRow label="Two-factor authentication" desc="Add an extra layer of security" defaultOn />
                <ToggleRow label="Login alerts" desc="Email me on new device sign-in" defaultOn />
              </div>
            </PageCard>
          )}

          {tab === 'notifications' && (
            <PageCard>
              <SectionTitle icon="bell" title="Notification preferences" desc="How we reach you" />
              <div className="divide-y divide-slate-100">
                <ToggleRow label="Product updates" desc="New features & tips" defaultOn />
                <ToggleRow label="Student messages" desc="Email me on new messages" defaultOn />
                <ToggleRow label="Marketing" desc="Occasional promotions" defaultOn={false} />
              </div>
            </PageCard>
          )}

          {tab === 'social' && (
            <PageCard>
              <SectionTitle icon="link" title="Social links" desc="Shown on your public instructor page" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="LinkedIn" value="linkedin.com/in/mahesh" />
                <Field label="Twitter / X" value="@sgprogrowth" />
                <Field label="YouTube" value="youtube.com/@sgprogrowth" />
                <Field label="Instagram" value="@sgprogrowth" />
              </div>
            </PageCard>
          )}

          {tab === 'activity' && (
            <PageCard>
              <SectionTitle icon="activity" title="Recent activity" desc="Your latest actions" />
              <div className="space-y-3">
                {activities.map((a, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl border border-slate-50 p-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                      <Icon name="activity" size={15} />
                    </span>
                    <div className="flex-1 text-sm text-slate-600">{a.action}</div>
                    <span className="text-xs text-slate-400">{a.time}</span>
                  </div>
                ))}
              </div>
            </PageCard>
          )}
        </div>
      </div>
    </div>
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
              ? 'bg-gradient-to-r from-brand-600 to-accent-600 text-white shadow-sm'
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
      <div className="text-2xl font-black text-white">{value}</div>
      <div className="text-[11px] uppercase tracking-wide text-white/60">{label}</div>
    </div>
  );
}

function ToggleRow({ label, desc, defaultOn }: { label: string; desc: string; defaultOn: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <div className="text-sm font-semibold text-slate-700">{label}</div>
        <div className="text-xs text-slate-500">{desc}</div>
      </div>
      <button
        onClick={() => setOn((v) => !v)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          on ? 'bg-gradient-to-r from-brand-600 to-accent-600' : 'bg-slate-200'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
            on ? 'left-[22px]' : 'left-0.5'
          }`}
        />
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
            : 'bg-gradient-to-r from-brand-600 to-accent-600 text-white hover:brightness-105'
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
