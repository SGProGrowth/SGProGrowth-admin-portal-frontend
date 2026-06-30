import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { EntityForm } from '../components/EntityForm';
import { Modal } from '../components/Modal';
import { PageHeader } from '../components/PageHeader';
import { Button, StatCard, StatusPill } from '../components/ui';
import { entities } from '../data';
import { initials } from '../lib/auth';
import { Icon } from '../lib/icons';
import { useToast } from '../lib/toast';
import { useStore } from '../store';
import type { EntityDef, EntityRecord, PromoteConfig } from '../types';

const BADGE_TONES = [
  'bg-emerald-100 text-emerald-700',
  'bg-violet-100 text-violet-700',
  'bg-sky-100 text-sky-700',
  'bg-pink-100 text-pink-700',
  'bg-amber-100 text-amber-700',
  'bg-teal-100 text-teal-700',
];

const PILL_KEYS = ['status', 'stock', 'privacy'];
const NUMERIC_KEYS = ['students', 'price', 'entries', 'issued', 'attempts', 'members', 'submissions', 'views', 'questions', 'awarded', 'replies'];

export function EntityPage() {
  const { entity = '' } = useParams();
  const def = entities[entity];
  const store = useStore();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sort, setSort] = useState('recent');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EntityRecord | null>(null);
  const [viewing, setViewing] = useState<EntityRecord | null>(null);

  const rows = store.list(entity);
  const statusField = def?.fields.find((f) => f.key === 'status');

  const filtered = useMemo(() => {
    let list = [...rows];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((r) => Object.values(r).some((v) => String(v).toLowerCase().includes(q)));
    }
    if (statusField && statusFilter !== 'all') {
      list = list.filter((r) => r.status === statusFilter);
    }
    if (sort === 'alphabetical') {
      const k = def?.fields[0].key ?? 'id';
      list.sort((a, b) => String(a[k]).localeCompare(String(b[k])));
    } else if (sort === 'recent') {
      list.sort((a, b) => b.id - a.id);
    }
    return list;
  }, [rows, search, statusFilter, sort, statusField, def]);

  const kpis = useMemo(() => (def ? computeKpis(def, rows) : []), [def, rows]);

  if (!def) {
    return <div className="text-slate-500">Unknown section.</div>;
  }

  const columns = def.columns ?? def.fields.slice(0, 5).map((f) => f.key);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (row: EntityRecord) => {
    setEditing(row);
    setModalOpen(true);
  };

  const handleSubmit = (values: Record<string, string | number>) => {
    if (editing) {
      store.update(entity, editing.id, values);
      toast(`${def.singular} updated`, 'success');
    } else {
      store.create(entity, values);
      toast(`${def.singular} created`, 'success');
    }
    setModalOpen(false);
  };

  const handleDelete = (row: EntityRecord) => {
    if (confirm(`Delete this ${def.singular.toLowerCase()}? This cannot be undone.`)) {
      store.remove(entity, row.id);
      toast(`${def.singular} deleted`, 'info');
      setViewing(null);
    }
  };

  const handlePromote = (row: EntityRecord) => {
    const p = def.promote;
    if (!p) return;
    const isPromoted = String(row[p.field]) === p.to;
    store.update(entity, row.id, { [p.field]: isPromoted ? p.from : p.to });
    toast(isPromoted ? `${row.name} is no longer an admin` : `${row.name} is now an admin`, isPromoted ? 'info' : 'success');
  };

  return (
    <div>
      <PageHeader
        title={def.label}
        subtitle={`${rows.length} ${rows.length === 1 ? def.singular.toLowerCase() : def.label.toLowerCase()} · click any item for details`}
        actions={
          <Button icon="plus" onClick={openCreate}>
            New {def.singular}
          </Button>
        }
      />

      {kpis.length > 1 && (
        <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {kpis.map((k, i) => (
            <StatCard key={k.label} icon={k.icon} value={k.value} label={k.label} tone={k.tone} delay={i * 0.05} />
          ))}
        </div>
      )}

      <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-100">
        <div className="flex min-w-[200px] flex-1 items-center gap-2 rounded-lg bg-slate-100 px-3 py-2">
          <Icon name="search" size={16} className="text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${def.label.toLowerCase()}…`}
            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
        </div>
        {statusField && (
          <div className="flex flex-wrap gap-1.5">
            {['all', ...(statusField.options ?? [])].map((opt) => (
              <button
                key={opt}
                onClick={() => setStatusFilter(opt)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${
                  statusFilter === opt
                    ? 'bg-gradient-to-r from-brand-600 to-accent-600 text-white'
                    : 'border border-slate-200 text-slate-500 hover:border-brand-400 hover:text-brand-600'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        )}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 outline-none"
        >
          <option value="recent">Recent</option>
          <option value="alphabetical">Alphabetical</option>
        </select>
      </div>

      {entity === 'courses' ? (
        <CourseCardGrid rows={filtered} onEdit={openEdit} onDelete={handleDelete} onView={setViewing} />
      ) : def.view === 'cards' ? (
        <RecordCardGrid def={def} rows={filtered} onEdit={openEdit} onDelete={handleDelete} onView={setViewing} />
      ) : (
        <TableView
          rows={filtered}
          columns={columns}
          labels={def.fields}
          onEdit={openEdit}
          onDelete={handleDelete}
          onView={setViewing}
          promote={def.promote}
          onPromote={handlePromote}
        />
      )}

      {filtered.length === 0 && (
        <div className="rounded-2xl bg-white py-16 text-center text-slate-400 ring-1 ring-slate-100">
          <Icon name={def.icon} size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">No {def.label.toLowerCase()} found. Create your first one.</p>
        </div>
      )}

      <Modal
        open={modalOpen}
        title={editing ? `Edit ${def.singular}` : `New ${def.singular}`}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="entity-form">
              {editing ? 'Save Changes' : `Create ${def.singular}`}
            </Button>
          </>
        }
      >
        <EntityForm def={def} initial={editing} onSubmit={handleSubmit} formId="entity-form" />
      </Modal>

      <Modal
        open={Boolean(viewing)}
        title={`${def.singular} details`}
        onClose={() => setViewing(null)}
        footer={
          viewing && (
            <>
              <Button variant="danger" icon="trash" onClick={() => handleDelete(viewing)}>
                Delete
              </Button>
              <Button
                icon="edit"
                onClick={() => {
                  const row = viewing;
                  setViewing(null);
                  openEdit(row);
                }}
              >
                Edit
              </Button>
            </>
          )
        }
      >
        {viewing && <DetailView def={def} row={viewing} />}
      </Modal>
    </div>
  );
}

function computeKpis(def: EntityDef, rows: EntityRecord[]) {
  type Kpi = { icon: string; value: string | number; label: string; tone: 'brand' | 'violet' | 'emerald' | 'amber' };
  const kpis: Kpi[] = [{ icon: def.icon, value: rows.length, label: `Total ${def.label}`, tone: 'brand' }];

  const pillKey = PILL_KEYS.find((k) => def.fields.some((f) => f.key === k));
  if (pillKey) {
    const opts = def.fields.find((f) => f.key === pillKey)?.options ?? [];
    opts.slice(0, 2).forEach((opt) => {
      kpis.push({
        icon: statusIcon(opt),
        value: rows.filter((r) => String(r[pillKey]) === opt).length,
        label: capitalize(opt),
        tone: statusTone(opt),
      });
    });
  }

  const tones: Kpi['tone'][] = ['violet', 'emerald', 'amber'];
  for (const k of def.columns ?? []) {
    if (kpis.length >= 4) break;
    if (NUMERIC_KEYS.includes(k) && def.fields.some((f) => f.key === k)) {
      const sum = rows.reduce((s, r) => s + Number(r[k] || 0), 0);
      const label = def.fields.find((f) => f.key === k)?.label ?? k;
      kpis.push({
        icon: 'bar-chart',
        value: k === 'price' || k === 'total' ? `₹${sum.toLocaleString('en-IN')}` : sum,
        label: `Total ${label}`,
        tone: tones[(kpis.length - 1) % tones.length],
      });
    }
  }
  return kpis;
}

function statusTone(v: string): 'brand' | 'violet' | 'emerald' | 'amber' {
  if (['published', 'active', 'completed', 'In stock', 'passed'].includes(v)) return 'emerald';
  if (['pending', 'processing', 'in-progress'].includes(v)) return 'amber';
  return 'violet';
}
function statusIcon(v: string): string {
  if (['published', 'active', 'completed', 'In stock', 'passed'].includes(v)) return 'check';
  if (['pending', 'processing'].includes(v)) return 'clock';
  return 'file';
}
function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function RoleBadge({ value, adminValue }: { value: string; adminValue: string }) {
  const isAdmin = value === adminValue;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
        isAdmin ? 'bg-gradient-to-r from-brand-600 to-accent-600 text-white' : 'bg-slate-100 text-slate-600'
      }`}
    >
      {isAdmin && <Icon name="shield" size={11} />}
      {value}
    </span>
  );
}

function fmt(key: string, value: string | number) {
  if (key === 'price' || key === 'total') return value ? `₹${value}` : 'Free';
  if (key === 'progress' || key === 'completion' || key === 'avgScore' || key === 'passmark' || key === 'commission')
    return `${value}%`;
  return String(value);
}

function DetailView({ def, row }: { def: EntityDef; row: EntityRecord }) {
  return (
    <div className="space-y-1">
      {def.fields.map((f) => {
        const val = row[f.key];
        const isPill = PILL_KEYS.includes(f.key);
        return (
          <div key={f.key} className="flex items-start justify-between gap-4 border-b border-slate-50 py-2.5 last:border-0">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{f.label}</span>
            <span className="max-w-[60%] text-right text-sm text-slate-700">
              {isPill ? <StatusPill value={String(val)} /> : val === '' || val === undefined ? '—' : fmt(f.key, val)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function TableView({
  rows,
  columns,
  labels,
  onEdit,
  onDelete,
  onView,
  promote,
  onPromote,
}: {
  rows: EntityRecord[];
  columns: string[];
  labels: { key: string; label: string }[];
  onEdit: (r: EntityRecord) => void;
  onDelete: (r: EntityRecord) => void;
  onView: (r: EntityRecord) => void;
  promote?: PromoteConfig;
  onPromote?: (r: EntityRecord) => void;
}) {
  const labelOf = (k: string) => labels.find((l) => l.key === k)?.label ?? k;
  if (rows.length === 0) return null;
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80 text-left">
              {columns.map((c) => (
                <th key={c} className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                  {labelOf(c)}
                </th>
              ))}
              <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wide text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <motion.tr
                key={row.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.02 }}
                onClick={() => onView(row)}
                className="cursor-pointer border-b border-slate-50 last:border-0 hover:bg-brand-50/40"
              >
                {columns.map((c) => (
                  <td key={c} className="max-w-xs px-4 py-3 text-slate-700">
                    {PILL_KEYS.includes(c) ? (
                      <StatusPill value={String(row[c])} />
                    ) : promote && c === promote.field ? (
                      <RoleBadge value={String(row[c])} adminValue={promote.to} />
                    ) : (
                      <span className="line-clamp-2">{fmt(c, row[c])}</span>
                    )}
                  </td>
                ))}
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-end gap-1">
                    {promote && onPromote && (
                      <button
                        onClick={() => onPromote(row)}
                        className={`mr-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition ${
                          String(row[promote.field]) === promote.to
                            ? 'border border-slate-200 text-slate-500 hover:border-rose-300 hover:text-rose-600'
                            : 'bg-gradient-to-r from-brand-600 to-accent-600 text-white hover:brightness-105'
                        }`}
                        title={String(row[promote.field]) === promote.to ? promote.revertLabel : promote.label}
                      >
                        {String(row[promote.field]) === promote.to ? promote.revertLabel : promote.label}
                      </button>
                    )}
                    <button
                      onClick={() => onView(row)}
                      className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                      title="View"
                    >
                      <Icon name="eye" size={16} />
                    </button>
                    <button
                      onClick={() => onEdit(row)}
                      className="rounded-lg p-1.5 text-slate-400 transition hover:bg-brand-50 hover:text-brand-600"
                      title="Edit"
                    >
                      <Icon name="edit" size={16} />
                    </button>
                    <button
                      onClick={() => onDelete(row)}
                      className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                      title="Delete"
                    >
                      <Icon name="trash" size={16} />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CourseCardGrid({
  rows,
  onEdit,
  onDelete,
  onView,
}: {
  rows: EntityRecord[];
  onEdit: (r: EntityRecord) => void;
  onDelete: (r: EntityRecord) => void;
  onView: (r: EntityRecord) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {rows.map((c, idx) => (
        <motion.div
          key={c.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.04 }}
          whileHover={{ y: -4 }}
          onClick={() => onView(c)}
          className="flex cursor-pointer flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 transition hover:shadow-lg hover:ring-brand-200"
        >
          <div className="relative h-36 overflow-hidden bg-slate-100">
            <img src={String(c.image)} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
            <span className="absolute left-2 top-2"><StatusPill value={String(c.status)} /></span>
          </div>
          <div className="flex flex-1 flex-col p-4">
            <h3 className="mb-2 line-clamp-2 text-sm font-bold text-slate-800">{c.title}</h3>
            <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-accent-600 text-[8px] font-bold text-white">
                {initials(String(c.instructor))}
              </span>
              {c.instructor}
            </div>
            <span className={`mb-3 inline-block w-fit rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${BADGE_TONES[idx % BADGE_TONES.length]}`}>
              {c.category}
            </span>
            <div className="mb-3 flex flex-wrap gap-x-3 gap-y-1 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
              <span className="flex items-center gap-1"><Icon name="users" size={12} /> {c.students}</span>
              <span className="flex items-center gap-1"><Icon name="clock" size={12} /> {c.duration}</span>
              <span className="flex items-center gap-1 text-amber-500"><Icon name="star" size={12} /> {c.rating} ({c.reviews})</span>
            </div>
            <div className="mt-auto flex gap-2" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => onEdit(c)} className="flex-1 rounded-lg bg-brand-900 py-2 text-xs font-semibold text-white transition hover:bg-brand-800">
                Edit
              </button>
              <button onClick={() => onDelete(c)} className="rounded-lg border border-slate-200 px-3 py-2 text-slate-400 transition hover:border-rose-300 hover:text-rose-600">
                <Icon name="trash" size={14} />
              </button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function RecordCardGrid({
  def,
  rows,
  onEdit,
  onDelete,
  onView,
}: {
  def: EntityDef;
  rows: EntityRecord[];
  onEdit: (r: EntityRecord) => void;
  onDelete: (r: EntityRecord) => void;
  onView: (r: EntityRecord) => void;
}) {
  const titleKey = def.fields[0].key;
  const pillKey = PILL_KEYS.find((k) => def.fields.some((f) => f.key === k));
  const descField = def.fields.find((f) => f.type === 'textarea');
  const labelOf = (k: string) => def.fields.find((f) => f.key === k)?.label ?? k;
  const metaKeys = (def.columns ?? [])
    .filter((k) => k !== titleKey && k !== pillKey && k !== descField?.key)
    .slice(0, 3);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {rows.map((c, idx) => (
        <motion.div
          key={c.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.04 }}
          whileHover={{ y: -4 }}
          onClick={() => onView(c)}
          className="flex cursor-pointer flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 transition hover:shadow-lg hover:ring-brand-200"
        >
          <div className="flex items-center justify-between gap-2 bg-gradient-to-r from-brand-600 to-accent-600 px-4 py-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white">
              <Icon name={def.icon} size={20} />
            </span>
            {pillKey && <StatusPill value={String(c[pillKey])} />}
          </div>
          <div className="flex flex-1 flex-col p-4">
            <h3 className="line-clamp-2 text-sm font-bold text-slate-800">{c[titleKey]}</h3>
            {descField && c[descField.key] !== '' && c[descField.key] !== undefined && (
              <p className="mt-1 line-clamp-2 text-xs italic text-slate-500">“{c[descField.key]}”</p>
            )}
            {metaKeys.length > 0 && (
              <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
                {metaKeys.map((k) => (
                  <div key={k} className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-slate-400">{labelOf(k)}</span>
                    <span className="truncate font-medium text-slate-600">{fmt(k, c[k])}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 flex gap-2" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => onEdit(c)} className="flex-1 rounded-lg bg-brand-900 py-2 text-xs font-semibold text-white transition hover:bg-brand-800">
                Edit
              </button>
              <button onClick={() => onDelete(c)} className="rounded-lg border border-slate-200 px-3 py-2 text-slate-400 transition hover:border-rose-300 hover:text-rose-600">
                <Icon name="trash" size={14} />
              </button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
