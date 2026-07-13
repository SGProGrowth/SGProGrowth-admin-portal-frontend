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
import { apiFetch, isApiEnabled } from './lib/api';
import { getToken, hasValidToken } from './lib/auth';
import type { EntityRecord } from './types';

type DataMap = Record<string, EntityRecord[]>;

const STORAGE_KEY = 'sgpro_admin_db_v1';

function loadLocalDB(): DataMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as DataMap;
  } catch {
    /* ignore corrupt storage */
  }
  const fresh: DataMap = {};
  Object.values(entityDefs).forEach((def) => {
    fresh[def.key] = [];
  });
  return fresh;
}

interface StoreContextValue {
  db: DataMap;
  ready: boolean;
  list: (entity: string) => EntityRecord[];
  create: (entity: string, record: Omit<EntityRecord, 'id'>) => void;
  update: (entity: string, id: number, patch: Partial<EntityRecord>) => void;
  remove: (entity: string, id: number) => void;
  resetAll: () => void;
  refresh: () => Promise<void>;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, setDB] = useState<DataMap>(loadLocalDB);
  const [ready, setReady] = useState(!isApiEnabled());

  const syncFromApi = useCallback(async () => {
    if (!isApiEnabled() || !hasValidToken()) {
      setReady(true);
      return;
    }
    try {
      const data = await apiFetch<DataMap>('/entities');
      setDB(data);
    } catch {
      setDB((prev) => {
        const empty: DataMap = {};
        Object.values(entityDefs).forEach((def) => {
          empty[def.key] = prev[def.key] ?? [];
        });
        return empty;
      });
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!isApiEnabled()) {
      setDB((prev) => {
        let changed = false;
        const next = { ...prev };
        Object.values(entityDefs).forEach((def) => {
          if (!next[def.key]) {
            next[def.key] = [];
            changed = true;
          }
        });
        return changed ? next : prev;
      });
      return;
    }

    setReady(false);
    void syncFromApi();

    const onAuth = () => {
      if (getToken()) {
        setReady(false);
        void syncFromApi();
      }
    };
    window.addEventListener('sgpro-auth', onAuth);
    return () => window.removeEventListener('sgpro-auth', onAuth);
  }, [syncFromApi]);

  useEffect(() => {
    if (!isApiEnabled()) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    }
  }, [db]);

  const list = useCallback((entity: string) => db[entity] ?? [], [db]);

  const create = useCallback((entity: string, record: Omit<EntityRecord, 'id'>) => {
    if (isApiEnabled() && hasValidToken()) {
      void apiFetch<EntityRecord>(`/entities/${entity}`, {
        method: 'POST',
        body: JSON.stringify(record),
      }).then((created) => {
        setDB((prev) => ({
          ...prev,
          [entity]: [created, ...(prev[entity] ?? []).filter((r) => r.id !== created.id)],
        }));
      });
      return;
    }

    setDB((prev) => {
      const rows = prev[entity] ?? [];
      const nextId = rows.reduce((max, r) => Math.max(max, r.id), 0) + 1;
      return { ...prev, [entity]: [{ ...record, id: nextId } as EntityRecord, ...rows] };
    });
  }, []);

  const update = useCallback((entity: string, id: number, patch: Partial<EntityRecord>) => {
    if (isApiEnabled() && hasValidToken()) {
      void apiFetch<EntityRecord>(`/entities/${entity}/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      }).then((updated) => {
        setDB((prev) => ({
          ...prev,
          [entity]: (prev[entity] ?? []).map((r) => (r.id === id ? updated : r)),
        }));
      });
      return;
    }

    setDB((prev) => ({
      ...prev,
      [entity]: (prev[entity] ?? []).map((r) =>
        r.id === id ? ({ ...r, ...patch } as EntityRecord) : r,
      ),
    }));
  }, []);

  const remove = useCallback((entity: string, id: number) => {
    if (isApiEnabled() && hasValidToken()) {
      void apiFetch<void>(`/entities/${entity}/${id}`, { method: 'DELETE' }).then(() => {
        setDB((prev) => ({
          ...prev,
          [entity]: (prev[entity] ?? []).filter((r) => r.id !== id),
        }));
      });
      return;
    }

    setDB((prev) => ({
      ...prev,
      [entity]: (prev[entity] ?? []).filter((r) => r.id !== id),
    }));
  }, []);

  const resetAll = useCallback(() => {
    if (isApiEnabled() && hasValidToken()) {
      void apiFetch<DataMap>('/entities/reset', { method: 'POST' }).then((data) => setDB(data));
      return;
    }
    localStorage.removeItem(STORAGE_KEY);
    setDB(loadLocalDB());
  }, []);

  const refresh = useCallback(async () => {
    await syncFromApi();
  }, [syncFromApi]);

  const value = useMemo(
    () => ({ db, ready, list, create, update, remove, resetAll, refresh }),
    [db, ready, list, create, update, remove, resetAll, refresh],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
