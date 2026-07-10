import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { initials } from '../lib/auth';
import { Icon } from '../lib/icons';

export function Avatar({
  name,
  src,
  size = 36,
  rounded = 'rounded-full',
  className = '',
}: {
  name: string;
  src?: string | null;
  size?: number;
  rounded?: string;
  className?: string;
}) {
  const dim = { width: size, height: size };
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        style={dim}
        className={`${rounded} object-cover ${className}`}
      />
    );
  }
  return (
    <div
      style={{ ...dim, fontSize: Math.round(size * 0.4) }}
      className={`flex items-center justify-center ${rounded} bg-brand-600 font-bold text-white ${className}`}
    >
      {initials(name)}
    </div>
  );
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  type = 'button',
  form,
  icon,
  className = '',
  disabled = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  type?: 'button' | 'submit';
  form?: string;
  icon?: string;
  className?: string;
  disabled?: boolean;
}) {
  const styles: Record<string, string> = {
    primary:
      'bg-brand-600 text-white hover:bg-brand-700',
    secondary: 'bg-white text-gray-700 border border-gray-200 hover:border-brand-400 hover:text-brand-600',
    danger: 'bg-rose-600 text-white hover:bg-rose-700',
    ghost: 'text-slate-500 hover:bg-slate-100 hover:text-slate-700',
  };
  return (
    <motion.button
      whileTap={disabled ? undefined : { scale: 0.96 }}
      type={type}
      form={form}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${styles[variant]} ${className}`}
    >
      {icon && <Icon name={icon} size={16} />}
      {children}
    </motion.button>
  );
}

const STATUS_STYLES: Record<string, string> = {
  published: 'bg-emerald-100 text-emerald-700',
  active: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-emerald-100 text-emerald-700',
  passed: 'bg-emerald-100 text-emerald-700',
  'In stock': 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700',
  processing: 'bg-amber-100 text-amber-700',
  'in-progress': 'bg-amber-100 text-amber-700',
  draft: 'bg-slate-100 text-slate-600',
  inactive: 'bg-slate-100 text-slate-600',
  closed: 'bg-slate-100 text-slate-600',
  suspended: 'bg-rose-100 text-rose-700',
  refunded: 'bg-rose-100 text-rose-700',
  'Out of stock': 'bg-rose-100 text-rose-700',
};

export function StatusPill({ value }: { value: string }) {
  const cls = STATUS_STYLES[value] ?? 'bg-brand-100 text-brand-700';
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${cls}`}>
      {value}
    </span>
  );
}

export function StatCard({
  icon,
  value,
  label,
  tone = 'brand',
  delay = 0,
  to,
  onClick,
  hint,
}: {
  icon: string;
  value: ReactNode;
  label: string;
  tone?: 'brand' | 'forest' | 'mint' | 'amber' | 'violet' | 'emerald';
  delay?: number;
  to?: string;
  onClick?: () => void;
  hint?: string;
}) {
  const tones: Record<string, string> = {
    brand: 'bg-brand-50 text-brand-700',
    forest: 'bg-emerald-50 text-emerald-800',
    mint: 'bg-brand-100 text-brand-800',
    amber: 'bg-amber-50 text-amber-800',
    violet: 'bg-emerald-50 text-emerald-800',
    emerald: 'bg-emerald-50 text-emerald-800',
  };
  const interactive = Boolean(to || onClick);
  const inner = (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      whileHover={interactive ? { y: -4 } : undefined}
      className={`group flex items-center gap-4 rounded-lg border border-gray-100 bg-white p-5 shadow-sm ${
        interactive ? 'cursor-pointer hover:border-brand-200 hover:shadow-md' : ''
      }`}
    >
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${tones[tone]}`}>
        <Icon name={icon} size={22} />
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-extrabold leading-none text-gray-800">{value}</div>
        <div className="mt-1 truncate text-xs font-medium text-gray-500">{label}</div>
      </div>
      {interactive && (
        <span className="ml-auto hidden text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-500 sm:block">
          <Icon name="chevron-down" size={16} className="-rotate-90" />
        </span>
      )}
    </motion.div>
  );
  if (to) return <Link to={to} title={hint}>{inner}</Link>;
  if (onClick) return <button onClick={onClick} className="w-full text-left" title={hint}>{inner}</button>;
  return inner;
}

export function PageCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border border-gray-100 bg-white p-6 shadow-sm ${className}`}>
      {children}
    </div>
  );
}
