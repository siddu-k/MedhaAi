import { useState } from 'react';
import useAppStore from '../stores/appStore';
import { signInWithGoogle, isFirebaseConfigured } from '../services/firebaseService';

export default function LandingPage() {
    const { setUserName, setAuthUser, authUser } = useAppStore();
    const [name, setName] = useState('');
    const [showLogin, setShowLogin] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    const enterAsGuest = () => {
        setAuthUser(null);
        setUserName(name.trim() || 'Guest');
    };

    const handleContinue = () => {
        if (authUser) {
            setUserName(authUser.name);
        } else {
            setShowLogin(true);
        }
    };

    const handleGoogle = async () => {
        setBusy(true);
        setError('');
        try {
            const u = await signInWithGoogle();
            setAuthUser(u);
            setUserName(u.name);
        } catch (e) {
            setError(e.message || 'Google login failed. Try Guest instead.');
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="h-full w-full flex overflow-hidden" style={{ background: '#fff6e5' }}>
            {/* Left: themed hero */}
            <div className="hidden md:flex flex-col w-[46%] shrink-0 relative overflow-hidden" style={{ background: '#4d0d0d' }}>
                <div className="absolute left-0 top-0 bottom-0 w-[8px] kaushal-ethnic-edge" />
                <div className="flex-1 flex flex-col items-center justify-center px-10 text-center relative">
                    <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 420px 300px at 50% 30%, rgba(232,168,62,0.18), transparent 70%)' }} />
                    <svg width="72" height="72" viewBox="0 0 48 48" className="relative mb-4">
                        <path d="M24 4C20 10 14 14 8 16c6 1 11 0 14-2-1 4-1 8 0 12-3-2-8-3-12-2 5 4 10 6 14 6-1 3-1 6 0 9 1-3 1-6 0-9 4 0 9-2 14-6-4-1-9 0-12 2 1-4 1-8 0-12 3 2 8 3 14 2-6-2-12-6-16-12z" fill="#e8802e" />
                        <path d="M24 10c-2.5 4-6 6.5-10 7.5 3 .5 6 0 8-1-.5 2.5-.5 5 0 7.5-2-1-4.5-1.5-7-1 3 2.5 6 3.5 8.5 3.5-.5 2-.5 4 0.5 6 .8-2 1-4 .5-6 2.5 0 5.5-1 8.5-3.5-2.5-.5-5 0-7 1 .5-2.5.5-5 0-7.5 2 1 5 1.5 8 1-4-1-7.5-3.5-10-7.5z" fill="#f5c86e" />
                    </svg>
                    <h1 className="relative text-[34px] leading-tight font-extrabold" style={{ color: '#fdf3e0', fontFamily: 'Georgia, serif' }}>Medha</h1>
                    <p className="relative text-[13px] mt-1 tracking-wide" style={{ color: '#c98a5b' }}>AI CAREER COUNSELLING FOR VOCATIONAL INDIA</p>
                    <p className="relative text-[14px] mt-5 leading-relaxed" style={{ color: '#f0d9b5' }}>
                        Confused about ITI, jobs, or earnings?<br />
                        Talk to Medha — with your parents, in your language.
                    </p>
                    <div className="relative flex items-center gap-2 mt-6">
                        <span className="px-3 py-1.5 rounded-full text-[11.5px] font-semibold" style={{ background: 'rgba(253,243,224,0.12)', color: '#f0d9b5' }}>English + Hindi voice</span>
                        <span className="px-3 py-1.5 rounded-full text-[11.5px] font-semibold" style={{ background: 'rgba(253,243,224,0.12)', color: '#f0d9b5' }}>Verified earnings data</span>
                    </div>
                </div>
                <div className="h-[14px] kaushal-bottom-strip relative" />
            </div>

            {/* Right: continue / login card */}
            <div className="flex-1 flex items-center justify-center p-6 relative kaushal-center-wrap">
                <div className="w-full max-w-[420px] rounded-3xl bg-[#fffdf5] p-8 shadow-xl relative" style={{ border: '1px solid #efdfc2' }}>
                    {!showLogin ? (
                        <>
                            <img
                                src="/art/hero-medha.png"
                                alt="Medha — careers in motion"
                                className="w-full h-[120px] object-cover object-center rounded-2xl mb-5"
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Your name (optional)"
                                className="w-full mt-5 px-4 py-3 rounded-xl text-[13.5px] outline-none"
                                style={{ background: '#f8efdc', border: '1px solid #e8d5b5', color: '#4d0d0d' }}
                            />
                            <button
                                onClick={handleContinue}
                                className="w-full mt-3 py-3 rounded-xl text-[15px] font-bold text-white transition-all hover:opacity-95"
                                style={{ background: '#7a1f1f' }}
                            >
                                Continue →
                            </button>
                            <p className="text-[11px] mt-3 text-center" style={{ color: '#8a6a4a' }}>Chats stay on this device · Login syncs callbacks to the cloud</p>
                        </>
                    ) : (
                        <>
                            <h2 className="text-[22px] font-extrabold" style={{ color: '#3a0d0d', fontFamily: 'Georgia, serif' }}>How do you want to continue?</h2>
                            <p className="text-[13px] mt-1 mb-5" style={{ color: '#6b5a4a' }}>
                                {authUser ? `Signed in as ${authUser.name}` : 'Login saves your counsellor callbacks online. Guest keeps everything on this device.'}
                            </p>
                            {error && (
                                <p className="text-[12px] mb-3 px-3 py-2 rounded-xl" style={{ background: '#fbe3e3', color: '#7a1f1f' }}>{error}</p>
                            )}
                            <button
                                onClick={handleGoogle}
                                disabled={busy}
                                className="w-full py-3 rounded-xl text-[14px] font-bold bg-white flex items-center justify-center gap-2.5 transition-all hover:shadow disabled:opacity-60"
                                style={{ border: '1px solid #d9a679', color: '#4d0d0d' }}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.6 12.3c0-.8-.1-1.5-.2-2.3H12v4.5h6c-.3 1.4-1.2 2.5-2.4 3.2v2.7h3.9c2.3-2.1 3.1-5 3.1-8.1z" /><path fill="#34A853" d="M12 22c3.2 0 5.9-1.1 7.9-2.9l-3.9-2.7c-1.1.7-2.4 1.1-4 1.1-3.1 0-5.7-2.1-6.6-4.9H1.4v2.8C3.4 19.5 7.4 22 12 22z" /><path fill="#FBBC05" d="M5.4 12.6c-.2-.7-.4-1.6-.4-2.6s.1-1.9.4-2.6V4.6H1.4C.5 6.3 0 8.1 0 10s.5 3.7 1.4 5.4l4-2.8z" /><path fill="#EA4335" d="M12 4.5c1.8 0 3.3.6 4.6 1.8L20 2.9C17.9 1.1 15.2 0 12 0 7.4 0 3.4 2.5 1.4 6.4l4 2.8c.9-2.7 3.5-4.7 6.6-4.7z" /></svg>
                                {busy ? 'Signing in…' : 'Continue with Google'}
                            </button>
                            {!isFirebaseConfigured && (
                                <p className="text-[11.5px] mt-2" style={{ color: '#8a6a4a' }}>Tip: add Firebase keys to <b>.env</b> to enable Google login (see .env.example).</p>
                            )}
                            <button
                                onClick={enterAsGuest}
                                className="w-full mt-2.5 py-3 rounded-xl text-[14px] font-bold text-white"
                                style={{ background: '#4d0d0d' }}
                            >
                                Continue as Guest{name.trim() ? ` (${name.trim()})` : ''}
                            </button>
                            <button onClick={() => { setShowLogin(false); setError(''); }} className="w-full mt-2 py-2 text-[12.5px] font-semibold" style={{ color: '#7a1f1f' }}>
                                ← Back
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
