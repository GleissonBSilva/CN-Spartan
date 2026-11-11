import { doc, setDoc, deleteDoc, getDocs, collection, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

// Helper to save current movie/show to user's continue_watching list (localStorage + Firestore fallback)
export const saveToContinueWatching = async (userUid, item) => {
  if (!userUid || !item || !item.id) return;

  try {
    const cacheKey = `wf_cw_cache_items_${userUid}`;
    const existingRaw = localStorage.getItem(cacheKey) || localStorage.getItem('wf_cw_cache_items') || '[]';
    const existing = JSON.parse(existingRaw);
    const updatedItem = { ...item, updatedAt: Date.now() };
    const filtered = Array.isArray(existing)
      ? existing.filter((i) => String(i.id) !== String(item.id))
      : [];
    const nextList = [updatedItem, ...filtered].slice(0, 20);
    localStorage.setItem(cacheKey, JSON.stringify(nextList));
    localStorage.setItem('wf_cw_cache_items', JSON.stringify(nextList));
    window.dispatchEvent(new Event('continueWatchingUpdated'));
  } catch {
    // ignore storage errors
  }

  try {
    const ref = doc(db, 'users', userUid, 'continue_watching', String(item.id));
    await setDoc(ref, {
      ...item,
      updatedAt: Date.now(),
    });

    const q = query(collection(db, 'users', userUid, 'continue_watching'), orderBy('updatedAt', 'desc'));
    const snaps = await getDocs(q);
    if (snaps.docs.length > 20) {
      const toDelete = snaps.docs.slice(20);
      for (const d of toDelete) {
        await deleteDoc(d.ref);
      }
    }
  } catch {
    // Silent fallback when user is authenticated via Supabase only
  }
};

export const removeFromContinueWatching = async (userUid, id) => {
  if (!userUid || !id) return;
  try {
    const cacheKey = `wf_cw_cache_items_${userUid}`;
    const existingRaw = localStorage.getItem(cacheKey) || localStorage.getItem('wf_cw_cache_items') || '[]';
    const existing = JSON.parse(existingRaw);
    const nextList = Array.isArray(existing)
      ? existing.filter((i) => String(i.id) !== String(id))
      : [];
    localStorage.setItem(cacheKey, JSON.stringify(nextList));
    localStorage.setItem('wf_cw_cache_items', JSON.stringify(nextList));
    window.dispatchEvent(new Event('continueWatchingUpdated'));
  } catch {}

  try {
    const ref = doc(db, 'users', userUid, 'continue_watching', String(id));
    await deleteDoc(ref);
  } catch {
    // Silent fallback
  }
};
