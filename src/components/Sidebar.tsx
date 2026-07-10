import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { nav } from '../data';
import { getUser, logout, useAvatar } from '../lib/auth';
import { useMessages } from '../lib/feed';
import { Icon } from '../lib/icons';
import { useSettings } from '../lib/settings';
import { Avatar } from './ui';

const REAL_LOGO = 'https://sharvaconsulting.com/wp-content/uploads/2025/08/cropped-1000325607-1.jpeg';

function SiteLogo() {
  const [logoUrl, setLogoUrl] = useState<string>(() => localStorage.getItem('brand_logo') || REAL_LOGO);
  const siteName = localStorage.getItem('brand_name') || 'SG Pro Growth';

  useEffect(() => {
    const onStorage = () => {
      setLogoUrl(localStorage.getItem('brand_logo') || REAL_LOGO);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return (
    <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
      <img
        src={logoUrl}
        alt={siteName}
        className="h-9 w-9 shrink-0 rounded-md object-cover ring-2 ring-brand-100"
        onError={(e) => { (e.currentTarget as HTMLImageElement).src = REAL_LOGO; }}
      />
      <div className="leading-tight">
        <div className="text-sm font-bold text-gray-900">{siteName}</div>
        <div className="text-[10px] font-medium text-gray-400">Admin Portal</div>
      </div>
    </div>
  );
}

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const user = getUser();
  const avatar = useAvatar();
  const { unreadCount } = useMessages();
  const { settings } = useSettings();
  const notificationsEnabled = settings.profileNotifications.messages;

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-30 bg-brand-950/50 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-gray-200 bg-white text-slate-700 transition-transform duration-300 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SiteLogo />

        <nav className="flex-1 overflow-y-auto px-3 py-3">
          {nav.map((group) => (
            <div key={group.title} className="mb-1">
              <div className="px-3 pb-1.5 pt-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                {group.title}
              </div>
              {group.items.map((item) => (
                <NavLink
                  key={item.id}
                  to={`/${item.id}`}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition ${
                      isActive
                        ? 'bg-brand-600 text-white'
                        : 'text-slate-600 hover:bg-brand-50 hover:text-brand-700'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <motion.span
                          layoutId="nav-active"
                          className="absolute inset-0 -z-10 rounded-lg bg-brand-600"
                          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                        />
                      )}
                      <Icon name={item.icon} size={16} />
                      <span className="flex-1">{item.label}</span>
                      {(item.id === 'messages' && notificationsEnabled && unreadCount > 0) && (
                        <span
                          className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                            isActive ? 'bg-white/20 text-white' : 'bg-brand-100 text-brand-700'
                          }`}
                        >
                          {String(unreadCount)}
                        </span>
                      )}
                      {item.id !== 'messages' && item.badge && (
                        <span
                          className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                            isActive ? 'bg-white/20 text-white' : 'bg-brand-100 text-brand-700'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="border-t border-gray-100 p-3">
          <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
            <Avatar name={user?.name ?? 'User'} src={avatar} size={36} className="ring-2 ring-gray-200" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-semibold text-slate-700">{user?.name}</div>
              <div className="text-[11px] capitalize text-slate-400">{user?.role}</div>
            </div>
            <button
              onClick={() => {
                logout();
                window.location.href = '/login';
              }}
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-gray-100 hover:text-brand-700"
              title="Log out"
            >
              <Icon name="logout" size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
