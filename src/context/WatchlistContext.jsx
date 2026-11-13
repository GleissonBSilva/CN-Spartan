import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useAuthProfile } from '../hooks/useAuthProfile';

const STORAGE_KEY = (uid) => `wf_watchlist_${uid}`;

const WatchlistContext = createContext(null);

const getCachedAuthUser = () => {
  try {
    return JSON.parse(localStorage.getItem('weflix_user')) ?? null;
  } catch {
    return null;
  }
};

export function WatchlistProvider({ children }) {
  const { user: supaUser } = useAuthProfile();
  const [cachedUser, setCachedUser] = useState(getCachedAuthUser);

  useEffect(() => {
    const syncCached = () => setCachedUser(getCachedAuthUser());
    window.addEventListener('spartan_auth_updated', syncCached);
    window.addEventListener('storage', syncCached);
    return () => {
      window.removeEventListener('spartan_auth_updated', syncCached);
      window.removeEventListener('storage', syncCached);
    };
  }, []);

  const user = useMemo(() => {
    if (supaUser) {
      return {
        uid: supaUser.id,
        email: supaUser.email,
        displayName:
          supaUser.user_metadata?.display_name ||
          supaUser.user_metadata?.full_name ||
          supaUser.email?.split('@')[0],
        isSupabase: true,
      };
    }
    return cachedUser;
  }, [supaUser, cachedUser]);

  const [watchlistIds, setWatchlistIds] = useState(() => {
    const cached = getCachedAuthUser();
    const uid = cached?.uid || cached?.id;
    if (!uid) return new Set();
    try {
      const stored = localStorage.getItem(STORAGE_KEY(uid));
      if (stored) return new Set(JSON.parse(stored).ids || []);
    } catch {
      /* ignore */
    }
    return new Set();
  });

  const [watchlistItems, setWatchlistItems] = useState(() => {
    const cached = getCachedAuthUser();
    const uid = cached?.uid || cached?.id;
    if (!uid) return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY(uid));
      if (stored) return JSON.parse(stored).items || [];
    } catch {
      /* ignore */
    }
    return [];
  });

  const [ready, setReady] = useState(true);

  const activeUid = user?.uid || user?.id || null;

  // Load watchlist from localStorage whenever active user changes
  useEffect(() => {
    if (!activeUid) {
      setWatchlistIds(new Set());
      setWatchlistItems([]);
      setReady(true);
      return;
    }

    try {
      const cached = localStorage.getItem(STORAGE_KEY(activeUid));
      if (cached) {
        const { ids, items } = JSON.parse(cached);
        setWatchlistIds(new Set(ids || []));
        setWatchlistItems(items || []);
      } else {
        setWatchlistIds(new Set());
        setWatchlistItems([]);
      }
    } catch {
      /* ignore malformed cache */
    }
    setReady(true);
  }, [activeUid]);

  const toggleWatchlist = useCallback(
    async (item, onNeedAuth) => {
      if (!activeUid) {
        onNeedAuth?.();
        return;
      }
      const id = String(item.mediaId);
      const nextIds = new Set(watchlistIds);
      let nextItems;

      if (nextIds.has(id)) {
        nextIds.delete(id);
        nextItems = watchlistItems.filter((i) => String(i.mediaId) !== id);
      } else {
        nextIds.add(id);
        const newItem = { id, ...item, addedAt: new Date().toISOString() };
        nextItems = [newItem, ...watchlistItems.filter((i) => String(i.mediaId) !== id)];
      }

      setWatchlistIds(nextIds);
      setWatchlistItems(nextItems);
      try {
        localStorage.setItem(
          STORAGE_KEY(activeUid),
          JSON.stringify({ ids: [...nextIds], items: nextItems })
        );
      } catch {
        /* ignore */
      }
    },
    [activeUid, watchlistIds, watchlistItems]
  );

  return (
    <WatchlistContext.Provider value={{ watchlistIds, watchlistItems, toggleWatchlist, ready, user }}>
      {children}
    </WatchlistContext.Provider>
  );
}

export function useWatchlist() {
  const ctx = useContext(WatchlistContext);
  if (!ctx) throw new Error('useWatchlist must be used inside WatchlistProvider');
  return ctx;
}
