import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useAuthProfile } from '../hooks/useAuthProfile';

const STORAGE_KEY = (uid) => `wf_watchlist_${uid}`;

const WatchlistContext = createContext(null);

// Read cached auth user written by Sidebar (same key)
const getCachedAuthUser = () => {
  try { return JSON.parse(localStorage.getItem('weflix_user')) ?? null; } catch { return null; }
};

export function WatchlistProvider({ children }) {
  const { user: supaUser } = useAuthProfile();
  const [fbUser, setFbUser] = useState(getCachedAuthUser);

  const user = useMemo(() => {
    if (supaUser) {
      return {
        uid: supaUser.id,
        email: supaUser.email,
        displayName: supaUser.user_metadata?.display_name || supaUser.email?.split('@')[0],
        isSupabase: true,
      };
    }
    return fbUser;
  }, [supaUser, fbUser]);

  const [watchlistIds, setWatchlistIds] = useState(() => {
    const cached = getCachedAuthUser();
    if (!cached) return new Set();
    try {
      const stored = localStorage.getItem(STORAGE_KEY(cached.uid));
      if (stored) return new Set(JSON.parse(stored).ids || []);
    } catch { /* ignore */ }
    return new Set();
  });
  const [watchlistItems, setWatchlistItems] = useState(() => {
    const cached = getCachedAuthUser();
    if (!cached) return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY(cached.uid));
      if (stored) return JSON.parse(stored).items || [];
    } catch { /* ignore */ }
    return [];
  });
  const [ready, setReady] = useState(true);

  // Track Firebase auth fallback
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) {
        setFbUser(u);
      } else {
        setFbUser(null);
      }
    });
    return () => unsub();
  }, []);

  // Load watchlist from localStorage whenever active user (Supabase or Firebase) changes
  useEffect(() => {
    if (!user?.uid) {
      setWatchlistIds(new Set());
      setWatchlistItems([]);
      setReady(true);
      return;
    }

    try {
      const cached = localStorage.getItem(STORAGE_KEY(user.uid));
      if (cached) {
        const { ids, items } = JSON.parse(cached);
        setWatchlistIds(new Set(ids || []));
        setWatchlistItems(items || []);
      } else {
        setWatchlistIds(new Set());
        setWatchlistItems([]);
      }
    } catch { /* ignore malformed cache */ }
    setReady(true);
  }, [user?.uid]);

  // Subscribe to Firestore only when logged into Firebase
  useEffect(() => {
    if (!user?.uid || user.isSupabase) return;

    const ref = collection(db, 'users', user.uid, 'watchlist');
    const unsub = onSnapshot(ref, (snapshot) => {
      const ids = new Set();
      const items = [];
      snapshot.forEach((d) => {
        ids.add(String(d.data().mediaId));
        items.push({ id: d.id, ...d.data() });
      });

      const sorted = items.sort((a, b) => (b.addedAt || '').localeCompare(a.addedAt || ''));
      setWatchlistIds(ids);
      setWatchlistItems(sorted);
      setReady(true);

      try {
        localStorage.setItem(STORAGE_KEY(user.uid), JSON.stringify({ ids: [...ids], items: sorted }));
      } catch { /* quota exceeded — ignore */ }
    }, () => {
      setReady(true);
    });

    return () => unsub();
  }, [user]);

  const toggleWatchlist = useCallback(async (item, onNeedAuth) => {
    if (!user?.uid) {
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
      localStorage.setItem(STORAGE_KEY(user.uid), JSON.stringify({ ids: [...nextIds], items: nextItems }));
    } catch { /* ignore */ }

    if (!user.isSupabase) {
      try {
        const ref = doc(db, 'users', user.uid, 'watchlist', id);
        if (!nextIds.has(id)) {
          await deleteDoc(ref);
        } else {
          await setDoc(ref, { ...item, addedAt: new Date().toISOString() });
        }
      } catch { /* ignore Firestore error when offline */ }
    }
  }, [user, watchlistIds, watchlistItems]);

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
