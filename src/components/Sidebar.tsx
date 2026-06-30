import { motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { nav } from '../data';
import { getUser, logout, useAvatar } from '../lib/auth';
import { Icon } from '../lib/icons';
import { Avatar } from './ui';

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const user = getUser();
  const avatar = useAvatar();

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-60 flex-col bg-brand-950 text-white transition-transform duration-300 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-lg">
            🎓
          </div>
          <div className="leading-tight">
            <div className="text-sm font-extrabold tracking-wide">SG PRO GROWTH</div>
            <div className="text-[10px] font-medium text-white/40">Admin Portal</div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3">
          {nav.map((group) => (
            <div key={group.title} className="mb-1">
              <div className="px-3 pb-1.5 pt-3 text-[10px] font-bold uppercase tracking-wider text-white/35">
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
                        : 'text-white/60 hover:bg-white/10 hover:text-white'
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
                      {item.badge && (
                        <span className="rounded bg-white/15 px-1.5 py-0.5 text-[9px] font-bold uppercase">
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

        <div className="border-t border-white/10 p-3">
          <div className="flex items-center gap-3 rounded-lg bg-white/5 p-3">
            <Avatar name={user?.name ?? 'User'} src={avatar} size={36} className="ring-2 ring-white/15" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-semibold">{user?.name}</div>
              <div className="text-[11px] capitalize text-white/40">{user?.role}</div>
            </div>
            <button
              onClick={() => {
                logout();
                window.location.href = '/login';
              }}
              className="rounded-lg p-1.5 text-white/50 transition hover:bg-white/10 hover:text-white"
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
