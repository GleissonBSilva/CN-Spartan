// Legacy compatibility stub (all auth and database logic is now powered by Supabase)
export const isFirebaseConfigured = false;
export const auth = {
  currentUser: null,
  onAuthStateChanged: (cb) => {
    try {
      cb(null);
    } catch {
      /* ignore */
    }
    return () => {};
  },
  signOut: async () => {},
};
export const googleProvider = {};
export const db = {};
