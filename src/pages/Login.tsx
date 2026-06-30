import { motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../lib/icons';
import { login } from '../lib/auth';

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = login(email, password);
    if (user) {
      navigate('/dashboard');
    } else {
      setError('Invalid email or password. Please try again.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-950 via-brand-900 to-brand-700 p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="grid w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl md:grid-cols-2"
      >
        <div className="relative hidden flex-col justify-between bg-gradient-to-br from-brand-900 to-brand-600 p-10 text-white md:flex">
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-xl">🎓</span>
            <span className="text-lg font-extrabold tracking-wide">SG PRO GROWTH</span>
          </div>
          <div>
            <h2 className="text-3xl font-extrabold leading-tight">
              Empowering education through management.
            </h2>
            <p className="mt-3 text-sm text-brand-100">
              Oversee courses, learners and growth — all from one professional, clean admin portal.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-brand-200">
            <Icon name="check" size={14} /> Built with React, Tailwind & Framer Motion
          </div>
        </div>

        <div className="p-8 sm:p-10">
          <h1 className="text-2xl font-extrabold text-slate-800">Welcome back</h1>
          <p className="mt-1 text-sm text-slate-500">Log in to the admin portal.</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-500">
                Email Address
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-500">Password</label>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 pr-10 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-600"
                  title={show ? 'Hide password' : 'Show password'}
                >
                  <Icon name={show ? 'eye-off' : 'eye'} size={16} />
                </button>
              </div>
            </div>

            {error && (
              <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600">
                {error}
              </p>
            )}

            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-brand-600 to-accent-600 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-600/30 transition hover:shadow-md hover:shadow-brand-600/40 hover:brightness-105"
            >
              <Icon name="logout" size={16} className="rotate-180" />
              Log In
            </motion.button>
          </form>

          <p className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
            <Icon name="lock" size={12} />
            Secure admin access · authorized personnel only
          </p>
        </div>
      </motion.div>
    </div>
  );
}
