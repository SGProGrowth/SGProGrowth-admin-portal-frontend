import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { QuoteBanner } from '../components/QuoteBanner';
import { PageCard, StatCard } from '../components/ui';
import { getUser } from '../lib/auth';
import { useActivities } from '../lib/feed';
import { Icon } from '../lib/icons';
import { useStore } from '../store';

export function Dashboard() {
  const store = useStore();
  const user = getUser();
  const { items: activities } = useActivities();
  const courses = store.list('courses');
  const students = store.list('students');
  const totalStudents = courses.reduce((s, c) => s + Number(c.students), 0);
  const avgCompletion = Math.round(
    courses.filter((c) => Number(c.students) > 0).reduce((s, c) => s + Number(c.completion), 0) /
      (courses.filter((c) => Number(c.students) > 0).length || 1),
  );
  const atRisk = students.filter((s) => Number(s.progress) < 55).length;

  const quickLinks = [
    { to: '/courses', icon: 'book-open', label: 'Courses', tone: 'bg-brand-50 text-brand-700' },
    { to: '/students', icon: 'users', label: 'Students', tone: 'bg-emerald-50 text-emerald-800' },
    { to: '/payments', icon: 'credit-card', label: 'Payouts', tone: 'bg-brand-100 text-brand-800' },
    { to: '/assistant', icon: 'bot', label: 'AI Assistant', tone: 'bg-amber-50 text-amber-800' },
  ];

  const courseProgress = courses
    .filter((c) => Number(c.students) > 0)
    .slice(0, 5);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name?.split(' ')[0] ?? 'Admin'}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Here is what is happening across SG Pro Growth today.
        </p>
      </div>

      <div className="alert-info px-4 py-3.5 text-sm leading-relaxed">
        <span className="font-semibold text-brand-800">Portal overview — </span>
        You are managing <strong>{courses.length} courses</strong> with{' '}
        <strong>{totalStudents} enrolled students</strong> and an average completion rate of{' '}
        <strong>{avgCompletion}%</strong>.
        {atRisk > 0 && (
          <>
            {' '}
            <Link to="/students" className="font-semibold text-brand-600 hover:underline">
              {atRisk} student{atRisk > 1 ? 's' : ''} may need attention
            </Link>
            .
          </>
        )}
      </div>

      {avgCompletion < 50 && (
        <div className="alert-warn px-4 py-3.5 text-sm leading-relaxed">
          <span className="font-semibold">Engagement notice — </span>
          Average completion is below 50%. Consider reminders, shorter modules, or live coaching
          sessions to improve learner progress.
        </div>
      )}

      <QuoteBanner />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon="book-open" value={courses.length} label="Total Courses" tone="brand" delay={0} to="/courses" hint="Manage courses" />
        <StatCard icon="users" value={totalStudents} label="Enrolled Students" tone="forest" delay={0.05} to="/students" hint="View students" />
        <StatCard icon="badge" value={students.length} label="Active Members" tone="mint" delay={0.1} to="/students" hint="View members" />
        <StatCard icon="gauge" value={`${avgCompletion}%`} label="Avg Completion" tone="amber" delay={0.15} to="/reports" hint="View reports" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <PageCard className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">Course Performance</h2>
            <Link to="/reports" className="text-xs font-semibold text-brand-600 hover:underline">
              View reports →
            </Link>
          </div>
          <div className="space-y-1">
            {courseProgress.length === 0 ? (
              <p className="text-sm text-gray-500">No courses with enrolments yet.</p>
            ) : (
              courseProgress.map((c, i) => (
                <Link
                  key={c.id}
                  to="/courses"
                  className="block rounded-lg p-2 transition hover:bg-gray-50"
                >
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="line-clamp-1 font-medium text-gray-700">{c.title}</span>
                    <span className="font-semibold text-gray-500">{c.completion}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${c.completion}%` }}
                      transition={{ delay: i * 0.08, duration: 0.6 }}
                      className="h-full rounded-full bg-brand-600"
                    />
                  </div>
                </Link>
              ))
            )}
          </div>
        </PageCard>

        <PageCard>
          <h2 className="mb-4 text-base font-bold text-gray-900">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickLinks.map((q) => (
              <Link
                key={q.to}
                to={q.to}
                className="flex flex-col items-center gap-2 rounded-lg border border-gray-100 p-4 text-center transition hover:border-brand-200 hover:bg-brand-50/50 hover:shadow-sm"
              >
                <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${q.tone}`}>
                  <Icon name={q.icon} size={18} />
                </span>
                <span className="text-xs font-semibold text-gray-600">{q.label}</span>
              </Link>
            ))}
          </div>
        </PageCard>
      </div>

      <PageCard>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">Recent Activity</h2>
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
                className="flex items-center gap-3 rounded-lg border border-gray-50 p-3 transition hover:border-brand-100 hover:bg-brand-50/40"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                  <Icon name="activity" size={15} />
                </span>
                <div className="flex-1 text-sm">
                  <span className="font-semibold text-gray-800">{a.user}</span>{' '}
                  <span className="text-gray-500">{a.action}</span>
                </div>
                <span className="text-xs text-gray-400">{a.time}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </PageCard>
    </div>
  );
}
