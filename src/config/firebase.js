import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';

const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || '',
};

export const isFirebaseConfigured = !!(config.apiKey && config.projectId);

let app = null;
let auth = null;
let db = null;
let rtdb = null;

if (isFirebaseConfigured) {
    try {
        app = getApps().length ? getApps()[0] : initializeApp(config);
        auth = getAuth(app);
        db = getFirestore(app);
        rtdb = config.databaseURL ? getDatabase(app) : null;
    } catch (e) {
        console.warn('Firebase init failed:', e?.message);
    }
}

export const googleProvider = new GoogleAuthProvider();
export { app, auth, db, rtdb };
