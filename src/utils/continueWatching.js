// Helper to save current movie/show to user's continue_watching list
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
  } catch {
    // ignore storage errors
  }
};
