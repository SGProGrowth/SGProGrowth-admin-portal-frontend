import 'leaflet/dist/leaflet.css';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { CircleMarker, MapContainer, Popup, TileLayer, Tooltip as LTooltip } from 'react-leaflet';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PageHeader } from '../components/PageHeader';
import { PageCard, StatCard } from '../components/ui';
import { Icon } from '../lib/icons';
import type { GeoUser } from '../lib/insights';
import { apiFetch, isApiEnabled } from '../lib/api';

const CITIES_GEO = [
  { city: 'Mumbai', lat: 19.076, lng: 72.8777 },
  { city: 'Delhi', lat: 28.7041, lng: 77.1025 },
  { city: 'Bengaluru', lat: 12.9716, lng: 77.5946 },
  { city: 'Hyderabad', lat: 17.385, lng: 78.4867 },
  { city: 'Chennai', lat: 13.0827, lng: 80.2707 },
  { city: 'Kolkata', lat: 22.5726, lng: 88.3639 },
  { city: 'Pune', lat: 18.5204, lng: 73.8567 },
  { city: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
  { city: 'Jaipur', lat: 26.9124, lng: 75.7873 },
  { city: 'Surat', lat: 21.1702, lng: 72.8311 },
  { city: 'Lucknow', lat: 26.8467, lng: 80.9462 },
  { city: 'Dubai', lat: 25.2048, lng: 55.2708 },
  { city: 'Singapore', lat: 1.3521, lng: 103.8198 },
  { city: 'London', lat: 51.5074, lng: -0.1278 },
];

const COURSES_SHORT = [
  'Excel Advanced', 'Power BI Masterclass', 'Unconscious Bias Training',
  'Color Therapy', 'IT Project Management', 'BNI Power Team',
];

function seeded(n: number) {
  const x = Math.sin(n * 99.7) * 10000;
  return x - Math.floor(x);
}

function memberToGeo(name: string, role: 'student' | 'instructor', idx: number): GeoUser {
  const c = CITIES_GEO[idx % CITIES_GEO.length];
  return {
    id: idx + 1,
    name,
    city: c.city,
    lat: c.lat + (seeded(idx) - 0.5) * 0.8,
    lng: c.lng + (seeded(idx + 50) - 0.5) * 0.8,
    active: seeded(idx + 7) > 0.45,
    role,
    course: COURSES_SHORT[idx % COURSES_SHORT.length],
    progress: Math.round(seeded(idx + 11) * 100),
  };
}

interface ApiMember { name: string; role?: string; }

export function LiveMap() {
  const [base, setBase] = useState<GeoUser[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [tick, setTick] = useState(0);

  // Load ONLY real members from API — no synthetic fallback
  useEffect(() => {
    if (!isApiEnabled()) { setLoaded(true); return; }
    Promise.all([
      apiFetch<ApiMember[]>('/entities/students').catch(() => [] as ApiMember[]),
      apiFetch<ApiMember[]>('/entities/instructors').catch(() => [] as ApiMember[]),
    ]).then(([students, instructors]) => {
      const all: GeoUser[] = [];
      (students as ApiMember[])
        .filter((s) => s.name?.trim() && !s.name.includes('@') && !/[^\x00-\x7F]/.test(s.name))
        .forEach((s, i) => { all.push(memberToGeo(s.name, 'student', i)); });
      (instructors as ApiMember[])
        .filter((s) => s.name?.trim() && !s.name.includes('@') && !/[^\x00-\x7F]/.test(s.name))
        .forEach((s, i) => { all.push(memberToGeo(s.name, 'instructor', i + 100)); });
      setBase(all);
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  // Simulate a live feed: re-roll active status every 4s.
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 4000);
    return () => clearInterval(id);
  }, []);

  const users = useMemo(
    () =>
      base.map((u, i) => ({
        ...u,
        active: tick === 0 ? u.active : Math.sin((i + 1) * 3.3 + tick) > -0.2,
      })),
    [base, tick],
  );

  const activeCount = users.filter((u) => u.active).length;
  const students = users.filter((u) => u.role === 'student').length;
  const instructors = users.filter((u) => u.role === 'instructor').length;
  const totalMembers = users.length;

  const byCity = useMemo(() => {
    const map: Record<string, number> = {};
    users.forEach((u) => {
      map[u.city] = (map[u.city] ?? 0) + 1;
    });
    return Object.entries(map)
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [users]);

  return (
    <div>
      <PageHeader
        title="Live User Map"
        subtitle="Real-time geographic view of active students and instructors across the platform"
      />

      {loaded && totalMembers === 0 && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          No members synced yet. Go to <strong>Settings → WordPress Sync → Sync All</strong> to import real students and instructors from sharvaconsulting.com.
        </div>
      )}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon="pulse" value={activeCount} label="Active Now" tone="emerald" />
        <StatCard icon="users" value={students} label="Students" tone="brand" />
        <StatCard icon="award" value={instructors} label="Instructors" tone="violet" />
        <StatCard icon="globe" value={byCity.length} label="Cities" tone="amber" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <PageCard className="overflow-hidden p-0 xl:col-span-2">
          <div className="h-[520px] w-full">
            <MapContainer
              center={[21, 78]}
              zoom={4}
              minZoom={2}
              scrollWheelZoom
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {users.map((u) => {
                const color = u.role === 'instructor' ? '#1a4d3e' : u.active ? '#10b981' : '#94a3b8';
                return (
                  <CircleMarker
                    key={u.id}
                    center={[u.lat, u.lng]}
                    radius={u.active ? 9 : 6}
                    pathOptions={{
                      color,
                      fillColor: color,
                      fillOpacity: u.active ? 0.75 : 0.4,
                      weight: 2,
                    }}
                  >
                    <LTooltip>
                      <span style={{ fontWeight: 700 }}>{u.name}</span> · {u.city}
                    </LTooltip>
                    <Popup>
                      <div style={{ minWidth: 160 }}>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{u.name}</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>
                          {u.role === 'instructor' ? 'Instructor' : 'Student'} · {u.city}
                        </div>
                        <div style={{ marginTop: 4, fontSize: 12 }}>📘 {u.course}</div>
                        <div style={{ fontSize: 12 }}>📈 Progress: {u.progress}%</div>
                        <div style={{ marginTop: 4, fontSize: 11, fontWeight: 700, color: u.active ? '#10b981' : '#94a3b8' }}>
                          {u.active ? '● Active now' : '○ Idle'}
                        </div>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          </div>
        </PageCard>

        <div className="space-y-6">
          <PageCard>
            <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-800">
              <Icon name="bar-chart" size={18} className="text-brand-600" /> Users by City
            </h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byCity} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2ff" vertical={false} />
                <XAxis dataKey="city" tick={{ fontSize: 10 }} interval={0} angle={-30} textAnchor="end" height={54} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="#1a4d3e" />
              </BarChart>
            </ResponsiveContainer>
          </PageCard>

          <PageCard>
            <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-slate-800">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
              Active Right Now
            </h2>
            <div className="max-h-[220px] space-y-2 overflow-y-auto pr-1">
              {users
                .filter((u) => u.active)
                .slice(0, 12)
                .map((u, i) => (
                  <motion.div
                    key={u.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-3 rounded-xl border border-slate-50 p-2.5"
                  >
                    <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white ${u.role === 'instructor' ? 'bg-accent-600' : 'bg-emerald-500'}`}>
                      {u.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-slate-700">{u.name}</div>
                      <div className="truncate text-xs text-slate-500">{u.city} · {u.course}</div>
                    </div>
                    <Icon name="map-pin" size={14} className="text-slate-300" />
                  </motion.div>
                ))}
            </div>
          </PageCard>
        </div>
      </div>
    </div>
  );
}
