/**
 * Lightweight, explainable "digital-twin" model + derived analytics helpers.
 * Everything here is deterministic so the UI stays stable between renders.
 */

export interface TwinInputs {
  studyHours: number; // self-study hours / week (0–40)
  practice: number; // practice assignments completed / week (0–20)
  attendance: number; // live-session attendance % (0–100)
  sleep: number; // avg sleep hours / night (4–10)
  priorGrade: number; // current baseline grade % (0–100)
}

export const DEFAULT_TWIN: TwinInputs = {
  studyHours: 10,
  practice: 4,
  attendance: 75,
  sleep: 7,
  priorGrade: 62,
};

export const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

/** Per-factor contributions (in grade points) — used for the "why" breakdown. */
export function contributions(i: TwinInputs) {
  const base = i.priorGrade * 0.35; // momentum from current standing
  const study = 22 * Math.sqrt(Math.min(i.studyHours, 25) / 25); // diminishing returns
  const practice = 16 * Math.sqrt(Math.min(i.practice, 15) / 15);
  const attendance = (i.attendance / 100) * 18;
  // sleep: bell curve peaking ~7.5h, penalised when too little/much
  const sleep = 9 * Math.exp(-Math.pow(i.sleep - 7.5, 2) / 4);
  return { base, study, practice, attendance, sleep };
}

export function predictGrade(i: TwinInputs): number {
  const c = contributions(i);
  return Math.round(clamp(c.base + c.study + c.practice + c.attendance + c.sleep));
}

export function gradeLetter(score: number): { letter: string; tone: string } {
  if (score >= 90) return { letter: 'A+', tone: 'emerald' };
  if (score >= 80) return { letter: 'A', tone: 'emerald' };
  if (score >= 70) return { letter: 'B', tone: 'brand' };
  if (score >= 60) return { letter: 'C', tone: 'amber' };
  if (score >= 50) return { letter: 'D', tone: 'amber' };
  return { letter: 'F', tone: 'rose' };
}

export function riskLevel(score: number): { label: string; tone: string } {
  if (score >= 75) return { label: 'On track', tone: 'emerald' };
  if (score >= 60) return { label: 'Needs attention', tone: 'amber' };
  return { label: 'At risk', tone: 'rose' };
}

/**
 * Project the grade forward over N weeks. If `improving`, the student gradually
 * adopts the recommended habits (study/practice/attendance ramp up), showing the
 * "what-if the inputs increase" future outlook the digital twin is built for.
 */
export function projectWeeks(i: TwinInputs, weeks = 12, improving = false) {
  const out: { week: string; current: number; potential: number }[] = [];
  for (let w = 0; w <= weeks; w++) {
    const t = w / weeks;
    const current = predictGrade(i);
    const ramped: TwinInputs = improving
      ? {
          ...i,
          studyHours: i.studyHours + (25 - i.studyHours) * t * 0.9,
          practice: i.practice + (15 - i.practice) * t * 0.9,
          attendance: i.attendance + (100 - i.attendance) * t * 0.8,
          sleep: i.sleep + (7.5 - i.sleep) * t,
          priorGrade: i.priorGrade,
        }
      : i;
    const potential = predictGrade(ramped);
    out.push({
      week: `W${w}`,
      current,
      potential: Math.max(potential, current),
    });
  }
  return out;
}

export function recommendations(i: TwinInputs): string[] {
  const tips: string[] = [];
  if (i.studyHours < 12) tips.push(`Increase self-study to ~15 hrs/week (currently ${i.studyHours}).`);
  if (i.practice < 6) tips.push(`Aim for 6+ practice assignments weekly (currently ${i.practice}).`);
  if (i.attendance < 80) tips.push(`Push live-session attendance above 80% (currently ${i.attendance}%).`);
  if (i.sleep < 6.5) tips.push('Sleep is low — target 7–8 hrs for better retention.');
  if (i.sleep > 9) tips.push('Very long sleep can signal disengagement — keep it near 7.5 hrs.');
  if (tips.length === 0) tips.push('Great balance! Maintain current habits to sustain top grades.');
  return tips;
}

/* ----------------------- Geo data for the live map ----------------------- */

export interface GeoUser {
  id: number;
  name: string;
  city: string;
  lat: number;
  lng: number;
  active: boolean;
  role: 'student' | 'instructor';
  course: string;
  progress: number;
}

const CITIES: { city: string; lat: number; lng: number }[] = [
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
  { city: 'Indore', lat: 22.7196, lng: 75.8577 },
  { city: 'Dubai', lat: 25.2048, lng: 55.2708 },
  { city: 'Singapore', lat: 1.3521, lng: 103.8198 },
  { city: 'London', lat: 51.5074, lng: -0.1278 },
];

/** Real students + instructors imported from sharvaconsulting.com via BuddyPress */
export const REAL_STUDENTS = [
  'mayuri powar', 'Vijay', 'Sonie Thakkar', 'Himannshu Jain', 'Jatan Atara',
  'Bhasha World', 'Kanchi Shah', 'Shah Kanchi', 'maheshmd@sharvagroup.com',
  'shweta yadav', 'mdeosthale@gmail.com',
];

export const REAL_INSTRUCTORS = [
  'Kanchi shah', 'Ninad Subhashchandra Kulkarni', 'Vartika Mehta', 'TATA', 'AshishInstructor',
];

/** Combined real member names for the map — filter out pure email addresses */
const NAMES = [...REAL_INSTRUCTORS, ...REAL_STUDENTS]
  .filter((n) => !n.includes('@'))
  .concat(['Neha Sharma', 'Riya Patel', 'Ankit Verma', 'Arjun Mehta', 'Priya Nair',
           'Rohan Gupta', 'Sneha Reddy', 'Vikram Singh', 'Aditi Rao']);

/** Real course titles from sharvaconsulting.com */
const FIRST = [
  'Microsoft Excel Advanced Excel Formulas & Functions',
  'Power BI Masterclass - DAX, Excel And More',
  'Unconscious Bias Training',
  'Color Therapy 1',
  'IT Project Management',
  'BNI-Trainers and Coaches Power Team',
];

/** Deterministic pseudo-random so markers don't jump every render. */
function seeded(n: number) {
  const x = Math.sin(n * 99.7) * 10000;
  return x - Math.floor(x);
}

export function geoUsers(): GeoUser[] {
  return NAMES.map((name, idx) => {
    const c = CITIES[idx % CITIES.length];
    const jitter = (seeded(idx) - 0.5) * 0.5;
    const jitter2 = (seeded(idx + 50) - 0.5) * 0.5;
    return {
      id: idx + 1,
      name,
      city: c.city,
      lat: c.lat + jitter,
      lng: c.lng + jitter2,
      active: seeded(idx + 7) > 0.45,
      role: seeded(idx + 3) > 0.85 ? 'instructor' : 'student',
      course: FIRST[idx % FIRST.length],
      progress: Math.round(seeded(idx + 11) * 100),
    };
  });
}
