import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { getUser, logout, useAvatar } from '../lib/auth';
import { Icon } from '../lib/icons';
import { Avatar } from './ui';
import { Sidebar } from './Sidebar';

const REAL_LOGO = 'https://sharvaconsulting.com/wp-content/uploads/2025/08/cropped-1000325607-1.jpeg';

function BrandMark({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const box = size === 'sm' ? 'h-8 w-8' : 'h-9 w-9';
  const logoUrl = localStorage.getItem('brand_logo') || REAL_LOGO;
  return (
    <img
      src={logoUrl}
      alt="SG Pro Growth"
      className={`${box} shrink-0 rounded-md object-cover ring-2 ring-brand-100`}
      onError={(e) => { (e.currentTarget as HTMLImageElement).src = REAL_LOGO; }}
    />
  );
}

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const location = useLocation();

  useEffect(() => {
    fetch('/api/health')
      .then((r) => (r.ok ? setApiStatus('online') : setApiStatus('offline')))
      .catch(() => setApiStatus('offline'));
  }, []);

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:ml-60">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-7">
          <div className="flex items-center gap-3">
            <button
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Icon name="menu" size={20} />
            </button>
            <div className="flex items-center gap-2 lg:hidden">
              <BrandMark size="sm" />
              <span className="text-sm font-bold text-gray-900">{localStorage.getItem('brand_name') || 'SG Pro Growth'}</span>
            </div>
            <div className="hidden items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 sm:flex">
              <Icon name="search" size={16} className="text-gray-400" />
              <input
                placeholder="Search the portal…"
                className="w-48 bg-transparent text-sm outline-none placeholder:text-gray-400"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`hidden rounded-md px-3 py-1 text-xs font-semibold sm:inline ${
                apiStatus === 'online'
                  ? 'alert-info border-0 py-1'
                  : apiStatus === 'offline'
                    ? 'alert-warn border-0 py-1'
                    : 'bg-gray-100 text-gray-500'
              }`}
            >
              {apiStatus === 'online' ? 'API connected' : apiStatus === 'offline' ? 'API offline' : 'Checking…'}
            </span>
            <a
              href="https://sharvaconsulting.com"
              target="_blank"
              rel="noreferrer"
              className="hidden rounded-lg px-3 py-2 text-xs font-semibold text-brand-600 transition hover:text-brand-700 sm:inline-block"
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
        className="flex items-center gap-2 rounded-full p-1 pr-2 transition hover:bg-gray-100"
      >
        <Avatar name={user?.name ?? 'User'} src={avatar} size={34} />
        <span className="hidden text-left sm:block">
          <span className="block text-xs font-bold leading-tight text-gray-800">{user?.name}</span>
          <span className="block text-[10px] capitalize leading-tight text-gray-400">{user?.role}</span>
        </span>
        <Icon name="chevron-down" size={14} className="hidden text-gray-400 sm:block" />
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
              className="absolute right-0 z-40 mt-2 w-56 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg"
            >
              <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50 p-4">
                <Avatar name={user?.name ?? 'User'} src={avatar} size={40} />
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-gray-900">{user?.name}</div>
                  <div className="truncate text-xs text-gray-500">{user?.email}</div>
                </div>
              </div>
              <div className="p-1.5">
                <Link
                  to="/profile"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
                >
                  <Icon name="user" size={16} /> My Profile
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
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
