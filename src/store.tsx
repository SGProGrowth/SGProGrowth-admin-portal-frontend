import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { entities as entityDefs } from './data';
import type { EntityRecord } from './types';

type DataMap = Record<string, EntityRecord[]>;

const STORAGE_KEY = 'sgpro_admin_db_v1';

function loadDB(): DataMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as DataMap;
  } catch {
    /* ignore corrupt storage */
  }
  const fresh: DataMap = {};
  Object.values(entityDefs).forEach((def) => {
    fresh[def.key] = def.seed.map((r) => ({ ...r })) as EntityRecord[];
  });
  return fresh;
}

interface StoreContextValue {
  db: DataMap;
  list: (entity: string) => EntityRecord[];
  create: (entity: string, record: Omit<EntityRecord, 'id'>) => void;
  update: (entity: string, id: number, patch: Partial<EntityRecord>) => void;
  remove: (entity: string, id: number) => void;
  resetAll: () => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, setDB] = useState<DataMap>(loadDB);

  useEffect(() => {
    // Make sure newly added entity types get seeded if storage predates them.
    setDB((prev) => {
      let changed = false;
      const next = { ...prev };
      Object.values(entityDefs).forEach((def) => {
        if (!next[def.key]) {
          next[def.key] = def.seed.map((r) => ({ ...r })) as EntityRecord[];
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  }, [db]);

  const list = useCallback((entity: string) => db[entity] ?? [], [db]);

  const create = useCallback((entity: string, record: Omit<EntityRecord, 'id'>) => {
    setDB((prev) => {
      const rows = prev[entity] ?? [];
      const nextId = rows.reduce((max, r) => Math.max(max, r.id), 0) + 1;
      return { ...prev, [entity]: [{ ...record, id: nextId } as EntityRecord, ...rows] };
    });
  }, []);

  const update = useCallback((entity: string, id: number, patch: Partial<EntityRecord>) => {
    setDB((prev) => ({
      ...prev,
      [entity]: (prev[entity] ?? []).map((r) =>
        r.id === id ? ({ ...r, ...patch } as EntityRecord) : r,
      ),
    }));
  }, []);

  const remove = useCallback((entity: string, id: number) => {
    setDB((prev) => ({
      ...prev,
      [entity]: (prev[entity] ?? []).filter((r) => r.id !== id),
    }));
  }, []);

  const resetAll = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setDB(loadDB());
  }, []);

  const value = useMemo(
    () => ({ db, list, create, update, remove, resetAll }),
    [db, list, create, update, remove, resetAll],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
