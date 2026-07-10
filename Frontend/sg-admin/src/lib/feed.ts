import { useCallback, useEffect, useState } from 'react';
import { activities as fallbackActivities, messages as fallbackMessages } from '../data';
import type { ActivityItem, MessageItem } from '../types';
import { apiFetch, isApiEnabled } from './api';
import { hasValidToken } from './auth';

export function useActivities() {
  const [items, setItems] = useState<ActivityItem[]>(fallbackActivities);
  const [loading, setLoading] = useState(isApiEnabled());

  useEffect(() => {
    if (!isApiEnabled() || !hasValidToken()) {
      setLoading(false);
      return;
    }
    void apiFetch<ActivityItem[]>('/feed/activities')
      .then(setItems)
      .catch(() => setItems(fallbackActivities))
      .finally(() => setLoading(false));
  }, []);

  return { items, loading };
}

export function useMessages() {
  const [items, setItems] = useState<MessageItem[]>(fallbackMessages);
  const [loading, setLoading] = useState(isApiEnabled());

  const reload = useCallback(() => {
    if (!isApiEnabled() || !hasValidToken()) return Promise.resolve();
    return apiFetch<MessageItem[]>('/feed/messages').then(setItems);
  }, []);

  useEffect(() => {
    if (!isApiEnabled() || !hasValidToken()) {
      setLoading(false);
      return;
    }
    void reload().finally(() => setLoading(false));
  }, [reload]);

  const markRead = useCallback(
    async (id: number) => {
      if (!isApiEnabled() || !hasValidToken()) return;
      try {
        await apiFetch<void>(`/feed/messages/${id}/read`, { method: 'PATCH' });
        setItems((prev) => prev.map((m) => (m.id === id ? { ...m, unread: false } : m)));
      } catch {
        /* ignore */
      }
    },
    [],
  );

  const unreadCount = items.filter((m) => m.unread).length;

  return { items, loading, unreadCount, markRead, reload };
}
