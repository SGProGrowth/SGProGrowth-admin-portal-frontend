import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { QuoteBanner } from '../components/QuoteBanner';
import { PageCard, StatCard } from '../components/ui';
import { activities } from '../data';
import { getUser } from '../lib/auth';
import { Icon } from '../lib/icons';
import { useStore } from '../store';

export function Dashboard() {
  const store = useStore();
  const user = getUser();
  const courses = store.list('courses');
  const students = store.list('students');
  const orders = store.list('orders');
  const revenue = orders.reduce((s, o) => s + Number(o.total), 0);
  const totalStudents = courses.reduce((s, c) => s + Number(c.students), 0);

  const quickLinks = [
    { to: '/courses', icon: 'book-open', label: 'Add Course', tone: 'bg-brand-50 text-brand-700' },
    { to: '/quizzes', icon: 'help-circle', label: 'New Quiz', tone: 'bg-violet-50 text-violet-700' },
    { to: '/students', icon: 'users', label: 'Students', tone: 'bg-emerald-50 text-emerald-700' },
    { to: '/orders', icon: 'shopping', label: 'Orders', tone: 'bg-amber-50 text-amber-700' },
  ];

  const courseProgress = courses
    .filter((c) => Number(c.students) > 0)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800">
          Welcome back, {user?.name?.split(' ')[0] ?? 'Admin'} 👋
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Here is what is happening across SG Pro Growth today.
        </p>
      </div>

      <QuoteBanner />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon="book-open" value={courses.length} label="Total Courses" tone="brand" delay={0} to="/courses" hint="Manage courses" />
        <StatCard icon="users" value={totalStudents} label="Enrolled Students" tone="violet" delay={0.05} to="/students" hint="View students" />
        <StatCard icon="badge" value={students.length} label="Active Members" tone="emerald" delay={0.1} to="/students" hint="View members" />
        <StatCard icon="shopping" value={`₹${revenue.toLocaleString('en-IN')}`} label="Revenue" tone="amber" delay={0.15} to="/orders" hint="View orders" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <PageCard className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-800">Course Performance</h2>
            <Link to="/reports" className="text-xs font-semibold text-brand-600 hover:underline">
              View reports →
            </Link>
          </div>
          <div className="space-y-1">
            {courseProgress.map((c, i) => (
              <Link
                key={c.id}
                to="/courses"
                className="block rounded-xl p-2 transition hover:bg-slate-50"
              >
                <div className="mb-1 flex justify-between text-sm">
                  <span className="line-clamp-1 font-medium text-slate-700">{c.title}</span>
                  <span className="font-semibold text-slate-500">{c.completion}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${c.completion}%` }}
                    transition={{ delay: i * 0.08, duration: 0.6 }}
                    className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500"
                  />
                </div>
              </Link>
            ))}
          </div>
        </PageCard>

        <PageCard>
          <h2 className="mb-4 text-base font-bold text-slate-800">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickLinks.map((q) => (
              <Link
                key={q.to}
                to={q.to}
                className="flex flex-col items-center gap-2 rounded-xl border border-slate-100 p-4 text-center transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${q.tone}`}>
                  <Icon name={q.icon} size={18} />
                </span>
                <span className="text-xs font-semibold text-slate-600">{q.label}</span>
              </Link>
            ))}
          </div>
        </PageCard>
      </div>

      <PageCard>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800">Recent Activity</h2>
          <Link to="/activity" className="text-xs font-semibold text-brand-600 hover:underline">
            View all →
          </Link>
        </div>
        <div className="space-y-2">
          {activities.map((a, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                to="/activity"
                className="flex items-center gap-3 rounded-xl border border-slate-50 p-3 transition hover:-translate-y-0.5 hover:border-brand-100 hover:bg-slate-50 hover:shadow-sm"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                  <Icon name="activity" size={15} />
                </span>
                <div className="flex-1 text-sm">
                  <span className="font-semibold text-slate-700">{a.user}</span>{' '}
                  <span className="text-slate-500">{a.action}</span>
                </div>
                <span className="text-xs text-slate-400">{a.time}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </PageCard>
    </div>
  );
}
