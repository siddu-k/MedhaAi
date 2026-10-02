import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, push, set } from 'firebase/database';
import { auth, db, rtdb, googleProvider, isFirebaseConfigured } from '../config/firebase';

export { isFirebaseConfigured };

export async function signInWithGoogle() {
    if (!auth) throw new Error('Firebase login is not configured yet. Add your Firebase keys to .env (see .env.example) or continue as Guest.');
    const result = await signInWithPopup(auth, googleProvider);
    const u = result.user;
    return { uid: u.uid, name: u.displayName || u.email || 'User', email: u.email || '', photo: u.photoURL || '' };
}

export async function signOutUser() {
    try { if (auth) await signOut(auth); } catch (e) {}
}

export function watchAuth(cb) {
    if (!auth) return () => {};
    return onAuthStateChanged(auth, (u) => {
        cb(u ? { uid: u.uid, name: u.displayName || u.email || 'User', email: u.email || '', photo: u.photoURL || '' } : null);
    });
}

/** Mirror a counsellor-callback ticket to Firestore + Realtime DB (fire-and-forget). */
export function saveTicketCloud(ticket) {
    if (!isFirebaseConfigured || !auth?.currentUser) return;
    const payload = { ...ticket, uid: auth.currentUser.uid, synced_at: new Date().toISOString() };
    try {
        addDoc(collection(db, 'escalation_tickets'), { ...payload, created: serverTimestamp() }).catch(() => {});
    } catch (e) {}
    try {
        if (rtdb) set(push(ref(rtdb, 'escalation_tickets')), payload).catch(() => {});
    } catch (e) {}
}

/** Mirror an engagement event to Firestore (fire-and-forget). */
export function logEventCloud(event) {
    if (!isFirebaseConfigured || !auth?.currentUser) return;
    try {
        addDoc(collection(db, 'engagement_events'), {
            ...event,
            uid: auth.currentUser.uid,
            created: serverTimestamp(),
        }).catch(() => {});
    } catch (e) {}
}
