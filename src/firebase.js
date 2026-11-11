import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const rawApiKey = import.meta.env.VITE_FIREBASE_API_KEY;
export const isFirebaseConfigured = Boolean(
  rawApiKey &&
  rawApiKey.trim() !== '' &&
  !rawApiKey.includes('DummyKey')
);

const firebaseConfig = {
  apiKey: isFirebaseConfigured ? rawApiKey : "demo-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "demo-app.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo-app",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "demo-app.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1234567890:web:abcdef",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-DEV12345"
};

// Initialize Firebase App safely
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Only initialize live Auth network client if valid Firebase credentials exist
// When using Supabase, safe fallback mock prevents 400 Bad Request to Google Identity Toolkit
export const auth = isFirebaseConfigured ? getAuth(app) : {
  currentUser: null,
  onAuthStateChanged: (cb) => {
    try { cb(null); } catch (e) { /* ignore */ }
    return () => {};
  },
  signOut: async () => {}
};

export const googleProvider = isFirebaseConfigured ? new GoogleAuthProvider() : {};
export const db = getFirestore(app);
