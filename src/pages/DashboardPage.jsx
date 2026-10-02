import { useEffect, useState } from 'react';
import useAppStore from '../stores/appStore';
import Sidebar from '../components/ui/Sidebar';
import ErrorBoundary from '../components/ui/ErrorBoundary';
import ChatPanel from '../components/chat/ChatPanel';
import MedhaAvatar from '../components/avatar/MedhaAvatar';
import CounsellingCall from '../components/interview/CounsellingCall';
import MermaidBoard from '../components/visualize/MermaidBoard';

export default function DashboardPage() {
    const {
        fetchSessions, isInterviewMode, exitInterview,
        isVisualizeMode, exitVisualizeMode,
        setPendingUserPrompt,
    } = useAppStore();

    const [activeNav, setActiveNav] = useState('home');
    const [isCallMode, setIsCallMode] = useState(false);
    const lang = useAppStore((s) => s.lang);

    useEffect(() => { fetchSessions(); }, []);
    useEffect(() => {
        const s = useAppStore.getState();
        if (s.isPptMode || s.isQuizMode) useAppStore.setState({ isPptMode: false, isQuizMode: false });
    }, []);

    return (
        <div className="h-full w-full flex overflow-hidden" style={{ background: '#fff6e5', color: '#4d0d0d' }}>
            {isInterviewMode ? (
                <div className="flex-1 flex min-w-0 h-full">
                    <ErrorBoundary name="family counselling room">
                        <CounsellingCall onNav={setActiveNav} activeNav={activeNav} />
                    </ErrorBoundary>
                </div>
            ) : (
            <>
            <Sidebar activeNav={activeNav} onNav={setActiveNav} />

            {/* Center */}
            <div className="flex-1 flex min-w-0 h-full relative kaushal-center-wrap">
                <div className="absolute bottom-0 left-0 right-0 h-[14px] kaushal-bottom-strip z-20" />

                <div className="flex-1 flex flex-col min-w-0 relative z-10">
                    <ErrorBoundary name="counselling chat">
                    {isVisualizeMode ? (
                        <div className="flex-1 flex flex-col p-5 gap-3 overflow-hidden">
                            <div className="flex items-center justify-between max-w-[1020px] w-full mx-auto">
                                <span className="text-[11px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-white" style={{ border: '1px solid #e8d5b5', color: '#2e7d5b' }}>● Career Roadmap</span>
                                <button onClick={exitVisualizeMode} className="px-5 py-2 text-[12px] font-bold rounded-xl" style={{ background: '#4d0d0d', color: '#fdf3e0' }}>Back to Chat</button>
                            </div>
                            <div className="flex-1 min-h-0 rounded-2xl overflow-hidden bg-white max-w-[1020px] w-full mx-auto" style={{ border: '1px solid #e8d5b5' }}>
                                <MermaidBoard />
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex min-w-0 overflow-hidden">
                            <ChatPanel hideHero={false} isCallMode={isCallMode} setIsCallMode={setIsCallMode} />
                        </div>
                    )}
                    </ErrorBoundary>
                </div>
            </div>

            {/* Right — mandala backdrop, no 3D avatar */}
            <div className="hidden lg:flex flex-col w-[420px] shrink-0 h-full relative kaushal-right">
                <div className="absolute top-0 left-0 right-0 h-[110px] pointer-events-none kaushal-hangings" />
                <div
                    className="flex-1 relative min-h-0 mx-2 rounded-xl overflow-hidden"
                    style={{
                        backgroundImage: 'url(/art/mandala-backdrop.png)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        backgroundColor: '#fcefd6',
                    }}
                >
                    {/* Medha stage — full-body viseme frames */}
                    <div className="absolute inset-0">
                        <MedhaAvatar className="pointer-events-none select-none" />
                    </div>
                    {/* Floating controls directly on mandala — no container bg */}
                    <div className="absolute top-2 right-2 flex items-center gap-2 bg-transparent p-0 m-0" style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}>
                        <button className="w-9 h-9 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-sm" style={{ border: '1px solid #e8d5b5', color: '#8a5a2a' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4l1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
                        </button>
                        <button onClick={() => useAppStore.getState().setLang(useAppStore.getState().lang === 'hi' ? 'en' : 'hi')} className="flex items-center gap-1 px-3.5 py-2 rounded-full bg-white/90 backdrop-blur text-[12px] font-bold shadow-sm" style={{ border: '1px solid #d9a679', color: '#4d0d0d' }}>
                            {lang === 'hi' ? 'HI' : 'EN'}
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m6 9 6 6 6-6"/></svg>
                        </button>
                    </div>
                </div>
                <div className="p-3.5 relative z-10">
                    <div className="rounded-2xl px-4 py-3 bg-[#fffdf5] flex items-center gap-3" style={{ border: '1px solid #e8d5b5', boxShadow: '0 6px 24px rgba(120,60,20,0.12)' }}>
                        <div className="flex-1 leading-tight">
                            <p className="text-[14px] font-bold flex items-center gap-1.5" style={{ color: '#4d0d0d', fontFamily: 'Georgia, serif' }}><span className="w-2 h-2 rounded-full inline-block" style={{ background: '#4caf7d' }} /> Medha AI</p>
                            <p className="text-[9.5px] font-semibold tracking-[0.08em] mt-0.5" style={{ color: '#8a6a4a' }}>AI CAREER COUNSELLOR</p>
                            <p className="text-[10px] font-bold mt-1 flex items-center gap-1" style={{ color: '#4a7a5b' }}><span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: '#4caf7d' }} /> VOICE COUNSELLOR ACTIVE</p>
                        </div>
                        <button onClick={() => useAppStore.getState().setLang(useAppStore.getState().lang === 'hi' ? 'en' : 'hi')} className="px-3 py-2 rounded-[10px] text-[12px] font-semibold bg-white flex items-center gap-1.5" style={{ border: '1px solid #4d0d0d', color: '#4d0d0d' }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M2 12h20M12 2a15 15 0 010 20 15 15 0 010-20z"/></svg>
                            {lang === 'hi' ? 'हिंदी' : 'EN / HI'}
                        </button>
                    </div>
                </div>
                <div className="h-[14px] kaushal-bottom-strip" />
            </div>
            </>
            )}
        </div>
    );
}
