import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { getUser, logout, useAvatar } from '../lib/auth';
import { Icon } from '../lib/icons';
import { Avatar } from './ui';
import { Sidebar } from './Sidebar';

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:ml-60">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur-md sm:px-7">
          <div className="flex items-center gap-3">
            <button
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Icon name="menu" size={20} />
            </button>
            <div className="hidden items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 sm:flex">
              <Icon name="search" size={16} className="text-slate-400" />
              <input
                placeholder="Search the portal…"
                className="w-48 bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 sm:inline">
              ● Staging connected
            </span>
            <a
              href="https://sharvaconsulting.com"
              target="_blank"
              rel="noreferrer"
              className="hidden rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-brand-400 hover:text-brand-600 sm:inline-block"
            >
              View Site
            </a>
            <UserMenu />
          </div>
        </header>

        <main className="px-4 py-6 sm:px-7">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

function UserMenu() {
  const [open, setOpen] = useState(false);
  const user = getUser();
  const avatar = useAvatar();
  const navigate = useNavigate();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full p-1 pr-2 transition hover:bg-slate-100"
      >
        <Avatar name={user?.name ?? 'User'} src={avatar} size={34} />
        <span className="hidden text-left sm:block">
          <span className="block text-xs font-bold leading-tight text-slate-700">{user?.name}</span>
          <span className="block text-[10px] capitalize leading-tight text-slate-400">{user?.role}</span>
        </span>
        <Icon name="chevron-down" size={14} className="hidden text-slate-400 sm:block" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 z-40 mt-2 w-56 overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-100"
            >
              <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/70 p-4">
                <Avatar name={user?.name ?? 'User'} src={avatar} size={40} />
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-slate-800">{user?.name}</div>
                  <div className="truncate text-xs text-slate-500">{user?.email}</div>
                </div>
              </div>
              <div className="p-1.5">
                <Link
                  to="/profile"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                >
                  <Icon name="user" size={16} /> My Profile
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                >
                  <Icon name="settings" size={16} /> Settings
                </Link>
                <button
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                >
                  <Icon name="logout" size={16} /> Log Out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
