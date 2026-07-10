import { Html, OrbitControls } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { motion } from 'framer-motion';
import { Suspense, useMemo, useRef, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Group } from 'three';
import { PageHeader } from '../components/PageHeader';
import { PageCard } from '../components/ui';
import { Icon } from '../lib/icons';
import {
  contributions,
  DEFAULT_TWIN,
  gradeLetter,
  predictGrade,
  projectWeeks,
  REAL_INSTRUCTORS,
  REAL_STUDENTS,
  recommendations,
  riskLevel,
  type TwinInputs,
} from '../lib/insights';

/** Merged real names — real students first, then instructors, then extras */
const SEAT_NAMES = [
  ...REAL_STUDENTS.filter((n) => !n.includes('@')),
  ...REAL_INSTRUCTORS,
  'Neha Sharma', 'Riya Patel', 'Ankit Verma', 'Arjun Mehta', 'Priya Nair',
  'Rohan Gupta', 'Sneha Reddy', 'Vikram Singh', 'Aditi Rao', 'Karan Malhotra',
  'Pooja Iyer', 'Sahil Khan', 'Divya Menon', 'Manish Joshi',
];

/* Map a 0–100 grade to a colour for the 3D seats + charts. */
function gradeColor(score: number): string {
  if (score >= 80) return '#10b981';
  if (score >= 70) return '#248f6f';
  if (score >= 60) return '#f59e0b';
  return '#f43f5e';
}

interface Seat {
  key: string;
  idx: number;
  x: number;
  z: number;
  grade: number;
  name: string;
}

const SKIN_TONES = ['#f1c9a5', '#e0ac86', '#c68642', '#a56c43', '#8d5524', '#ffdbac'];
const HAIR_TONES = ['#2b2b2b', '#1a1a1a', '#4b3621', '#6b4226', '#0f0f0f', '#5a3a22'];

function buildSeats(inputs: TwinInputs): Seat[] {
  const rows = 4;
  const cols = 6;
  const seats: Seat[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      // Each student deviates from the cohort inputs deterministically.
      const dev = Math.sin(i * 12.9898) * 0.5;
      const dev2 = Math.cos(i * 78.233) * 0.5;
      const grade = predictGrade({
        ...inputs,
        studyHours: Math.max(0, inputs.studyHours + dev * 8),
        practice: Math.max(0, inputs.practice + dev2 * 5),
        attendance: Math.max(0, Math.min(100, inputs.attendance + dev * 18)),
        priorGrade: Math.max(0, Math.min(100, inputs.priorGrade + dev2 * 14)),
      });
      seats.push({
        key: `${r}-${c}`,
        idx: i,
        x: (c - (cols - 1) / 2) * 1.5,
        z: (r - (rows - 1) / 2) * 1.5 + 1.5,
        grade,
        name: SEAT_NAMES[i % SEAT_NAMES.length],
      });
    }
  }
  return seats;
}

/** A small low-poly seated student avatar; shirt colour encodes predicted grade. */
function StudentAvatar({ seat }: { seat: Seat }) {
  const [hover, setHover] = useState(false);
  const color = gradeColor(seat.grade);
  const skin = SKIN_TONES[seat.idx % SKIN_TONES.length];
  const hair = HAIR_TONES[seat.idx % HAIR_TONES.length];
  // Top performers sit a touch taller (subtle posture cue).
  const lift = (seat.grade / 100) * 0.18;
  const emissive = hover ? 0.55 : 0.12;

  return (
    <group
      position={[0, 0, -0.35]}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHover(true);
      }}
      onPointerOut={() => setHover(false)}
    >
      {/* glowing performance ring on the seat */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.32, 0.42, 24]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} />
      </mesh>

      {/* torso (shirt) */}
      <mesh position={[0, 0.62 + lift, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.32, 0.62, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={emissive} roughness={0.5} />
      </mesh>
      {/* shoulders */}
      <mesh position={[0, 0.92 + lift, 0]} castShadow>
        <sphereGeometry args={[0.22, 16, 12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={emissive} roughness={0.5} />
      </mesh>
      {/* arms resting toward the desk */}
      <mesh position={[-0.24, 0.74 + lift, 0.12]} rotation={[0.5, 0, 0.3]} castShadow>
        <capsuleGeometry args={[0.07, 0.34, 4, 8]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
      <mesh position={[0.24, 0.74 + lift, 0.12]} rotation={[0.5, 0, -0.3]} castShadow>
        <capsuleGeometry args={[0.07, 0.34, 4, 8]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
      {/* neck */}
      <mesh position={[0, 1.06 + lift, 0]}>
        <cylinderGeometry args={[0.08, 0.1, 0.12, 10]} />
        <meshStandardMaterial color={skin} roughness={0.6} />
      </mesh>
      {/* head */}
      <mesh position={[0, 1.26 + lift, 0]} castShadow>
        <sphereGeometry args={[0.19, 20, 18]} />
        <meshStandardMaterial color={skin} roughness={0.6} />
      </mesh>
      {/* hair cap */}
      <mesh position={[0, 1.33 + lift, -0.02]} rotation={[0.35, 0, 0]}>
        <sphereGeometry args={[0.205, 20, 16, 0, Math.PI * 2, 0, Math.PI / 1.7]} />
        <meshStandardMaterial color={hair} roughness={0.8} />
      </mesh>

      {hover && (
        <Html distanceFactor={10} position={[0, 1.75 + lift, 0]} center>
          <div className="whitespace-nowrap rounded-lg bg-slate-900/90 px-2 py-1 text-[11px] font-bold text-white shadow-lg">
            {seat.name} · {seat.grade}%
          </div>
        </Html>
      )}
    </group>
  );
}

function SeatMesh({ seat }: { seat: Seat }) {
  return (
    <group position={[seat.x, 0, seat.z]}>
      {/* desk */}
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[1, 0.08, 0.7]} />
        <meshStandardMaterial color="#c7d2fe" />
      </mesh>
      <mesh position={[0, 0.12, 0]}>
        <boxGeometry args={[0.9, 0.25, 0.6]} />
        <meshStandardMaterial color="#a5b4fc" />
      </mesh>
      {/* seated student avatar */}
      <StudentAvatar seat={seat} />
    </group>
  );
}

function Classroom({ inputs, avg }: { inputs: TwinInputs; avg: number }) {
  const seats = useMemo(() => buildSeats(inputs), [inputs]);
  const rig = useRef<Group>(null);
  useFrame((state) => {
    if (rig.current) {
      // gentle auto-orbit breathing
      rig.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.15) * 0.18;
    }
  });

  return (
    <group ref={rig}>
      {/* floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[16, 14]} />
        <meshStandardMaterial color="#eef2ff" />
      </mesh>
      {/* back wall */}
      <mesh position={[0, 2.4, -5.2]} receiveShadow>
        <boxGeometry args={[16, 5, 0.2]} />
        <meshStandardMaterial color="#e0e7ff" />
      </mesh>
      {/* smart board showing cohort average */}
      <mesh position={[0, 2.6, -5.05]}>
        <boxGeometry args={[6, 2.6, 0.1]} />
        <meshStandardMaterial color="#0a1f18" emissive="#123528" emissiveIntensity={0.4} />
        <Html transform position={[0, 0, 0.08]} distanceFactor={6} center>
          <div className="select-none text-center">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-brand-300">
              Predicted Class Average
            </div>
            <div
              className="text-6xl font-black leading-none"
              style={{ color: gradeColor(avg) }}
            >
              {avg}
              <span className="text-2xl">%</span>
            </div>
            <div className="mt-1 text-[11px] font-medium text-brand-200">
              {gradeLetter(avg).letter} grade · {riskLevel(avg).label}
            </div>
          </div>
        </Html>
      </mesh>
      {/* teacher podium */}
      <mesh position={[-5, 0.6, -3.5]} castShadow>
        <boxGeometry args={[1, 1.2, 0.8]} />
        <meshStandardMaterial color="#1a4d3e" />
      </mesh>
      {seats.map((s) => (
        <SeatMesh key={s.key} seat={s} />
      ))}
    </group>
  );
}

function Slider({
  label,
  icon,
  value,
  min,
  max,
  step = 1,
  suffix = '',
  onChange,
}: {
  label: string;
  icon: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-600">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <Icon name={icon} size={14} />
          </span>
          {label}
        </span>
        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">
          {value}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-gradient-to-r from-brand-500 to-accent-500 accent-brand-600"
      />
    </div>
  );
}

export function DigitalTwin() {
  const [inputs, setInputs] = useState<TwinInputs>(DEFAULT_TWIN);
  const set = (patch: Partial<TwinInputs>) => setInputs((p) => ({ ...p, ...patch }));

  const grade = predictGrade(inputs);
  const { letter, tone } = gradeLetter(grade);
  const risk = riskLevel(grade);
  const c = contributions(inputs);

  const factorData = [
    { name: 'Momentum', value: Math.round(c.base) },
    { name: 'Study', value: Math.round(c.study) },
    { name: 'Practice', value: Math.round(c.practice) },
    { name: 'Attendance', value: Math.round(c.attendance) },
    { name: 'Sleep', value: Math.round(c.sleep) },
  ];

  const radarData = [
    { factor: 'Study', value: Math.min(100, (inputs.studyHours / 25) * 100) },
    { factor: 'Practice', value: Math.min(100, (inputs.practice / 15) * 100) },
    { factor: 'Attendance', value: inputs.attendance },
    { factor: 'Sleep', value: Math.min(100, (inputs.sleep / 9) * 100) },
    { factor: 'Baseline', value: inputs.priorGrade },
  ];

  const projection = useMemo(() => projectWeeks(inputs, 12, true), [inputs]);
  const tips = recommendations(inputs);
  const toneClasses: Record<string, string> = {
    emerald: 'from-emerald-500 to-emerald-600',
    brand: 'from-brand-500 to-brand-600',
    amber: 'from-amber-500 to-amber-600',
    rose: 'from-rose-500 to-rose-600',
  };

  return (
    <div>
      <PageHeader
        title="Course Digital Twin"
        subtitle="A live 3D simulation of the classroom — tune study habits and watch predicted grades change in real time"
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* 3D scene */}
        <PageCard className="overflow-hidden xl:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-bold text-slate-800">
              <Icon name="cube" size={18} className="text-brand-600" /> Virtual Classroom
            </h2>
            <span className="hidden items-center gap-3 text-[11px] font-medium text-slate-500 sm:flex">
              <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> 80+</span>
              <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-brand-500" /> 70+</span>
              <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> 60+</span>
              <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> &lt;60</span>
            </span>
          </div>
          <div className="h-[420px] w-full overflow-hidden rounded-2xl bg-gradient-to-b from-brand-50 to-white ring-1 ring-slate-100">
            <Canvas shadows camera={{ position: [0, 6, 11], fov: 45 }} dpr={[1, 2]}>
              <Suspense fallback={null}>
                <ambientLight intensity={0.7} />
                <directionalLight position={[6, 10, 6]} intensity={1.1} castShadow />
                <directionalLight position={[-6, 6, -4]} intensity={0.4} color="#6ee7b7" />
                <Classroom inputs={inputs} avg={grade} />
                <OrbitControls
                  enablePan={false}
                  minDistance={7}
                  maxDistance={18}
                  maxPolarAngle={Math.PI / 2.1}
                />
              </Suspense>
            </Canvas>
          </div>
          <p className="mt-2 text-center text-xs text-slate-400">
            Drag to orbit · scroll to zoom · hover a student to inspect their predicted grade
          </p>
        </PageCard>

        {/* Prediction + controls */}
        <div className="space-y-6">
          <PageCard className={`bg-gradient-to-br ${toneClasses[tone]} text-white`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-white/80">
                  Predicted Grade
                </div>
                <div className="mt-1 flex items-end gap-2">
                  <span className="text-6xl font-black leading-none">{grade}</span>
                  <span className="mb-1 text-2xl font-bold">%</span>
                </div>
                <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-bold">
                  <Icon name="target" size={13} /> {risk.label}
                </div>
              </div>
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/15 text-4xl font-black backdrop-blur">
                {letter}
              </div>
            </div>
          </PageCard>

          <PageCard>
            <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-800">
              <Icon name="gauge" size={18} className="text-brand-600" /> What-if Controls
            </h2>
            <div className="space-y-4">
              <Slider label="Self-study / week" icon="book-open" value={inputs.studyHours} min={0} max={40} suffix=" hrs" onChange={(v) => set({ studyHours: v })} />
              <Slider label="Practice assignments" icon="clipboard" value={inputs.practice} min={0} max={20} onChange={(v) => set({ practice: v })} />
              <Slider label="Attendance" icon="users" value={inputs.attendance} min={0} max={100} suffix="%" onChange={(v) => set({ attendance: v })} />
              <Slider label="Sleep / night" icon="clock" value={inputs.sleep} min={4} max={10} step={0.5} suffix=" hrs" onChange={(v) => set({ sleep: v })} />
              <Slider label="Current baseline" icon="star" value={inputs.priorGrade} min={0} max={100} suffix="%" onChange={(v) => set({ priorGrade: v })} />
            </div>
            <button
              onClick={() => setInputs(DEFAULT_TWIN)}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 py-2 text-sm font-semibold text-slate-500 transition hover:border-brand-400 hover:text-brand-600"
            >
              <Icon name="refresh" size={14} /> Reset to baseline
            </button>
          </PageCard>
        </div>
      </div>

      {/* Analytics row */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <PageCard>
          <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-800">
            <Icon name="bar-chart" size={18} className="text-brand-600" /> Grade Contribution
          </h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={factorData} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eef2ff" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={78} />
              <Tooltip cursor={{ fill: '#f1f5f9' }} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                {factorData.map((_, i) => (
                  <Cell key={i} fill={['#248f6f', '#1a4d3e', '#34d399', '#10b981', '#f59e0b'][i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </PageCard>

        <PageCard>
          <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-800">
            <Icon name="target" size={18} className="text-accent-600" /> Habit Balance
          </h2>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={radarData} outerRadius={90}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="factor" tick={{ fontSize: 11 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
              <Radar dataKey="value" stroke="#1a4d3e" fill="#34d399" fillOpacity={0.45} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </PageCard>

        <PageCard>
          <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-800">
            <Icon name="trending" size={18} className="text-emerald-600" /> 12-Week Outlook
          </h2>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={projection} margin={{ left: -18 }}>
              <defs>
                <linearGradient id="pot" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="cur" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1a4d3e" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#1a4d3e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2ff" />
              <XAxis dataKey="week" tick={{ fontSize: 10 }} interval={2} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Area type="monotone" dataKey="potential" name="If habits improve" stroke="#10b981" strokeWidth={2} fill="url(#pot)" />
              <Area type="monotone" dataKey="current" name="Current path" stroke="#1a4d3e" strokeWidth={2} fill="url(#cur)" />
            </AreaChart>
          </ResponsiveContainer>
        </PageCard>
      </div>

      {/* Recommendations */}
      <PageCard className="mt-6">
        <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-800">
          <Icon name="sparkle" size={18} className="text-amber-500" /> Twin Recommendations
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {tips.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3"
            >
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white">
                <Icon name="check" size={13} />
              </span>
              <span className="text-sm text-slate-600">{t}</span>
            </motion.div>
          ))}
        </div>
      </PageCard>
    </div>
  );
}
