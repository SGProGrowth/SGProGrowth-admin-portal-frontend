import { useEffect, useState } from 'react';
import type { EntityDef, EntityRecord } from '../types';

interface EntityFormProps {
  def: EntityDef;
  initial?: EntityRecord | null;
  onSubmit: (values: Record<string, string | number>) => void;
  formId: string;
}

const inputClass =
  'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100';

export function EntityForm({ def, initial, onSubmit, formId }: EntityFormProps) {
  const [values, setValues] = useState<Record<string, string | number>>({});

  useEffect(() => {
    const base: Record<string, string | number> = {};
    def.fields.forEach((f) => {
      base[f.key] = initial ? (initial[f.key] ?? '') : f.type === 'number' ? 0 : '';
    });
    setValues(base);
  }, [def, initial]);

  const set = (key: string, value: string | number) =>
    setValues((v) => ({ ...v, [key]: value }));

  return (
    <form
      id={formId}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(values);
      }}
      className="grid gap-4"
    >
      {def.fields.map((f) => (
        <div key={f.key} className="grid gap-1.5">
          <label className="text-xs font-semibold text-slate-500">
            {f.label}
            {f.required && <span className="text-rose-500"> *</span>}
          </label>
          {f.type === 'textarea' ? (
            <textarea
              className={inputClass}
              rows={3}
              required={f.required}
              value={values[f.key] ?? ''}
              onChange={(e) => set(f.key, e.target.value)}
            />
          ) : f.type === 'select' ? (
            <select
              className={inputClass}
              required={f.required}
              value={values[f.key] ?? ''}
              onChange={(e) => set(f.key, e.target.value)}
            >
              <option value="">Select…</option>
              {f.options?.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
              className={inputClass}
              required={f.required}
              value={values[f.key] ?? ''}
              onChange={(e) =>
                set(f.key, f.type === 'number' ? Number(e.target.value) : e.target.value)
              }
            />
          )}
        </div>
      ))}
    </form>
  );
}
