import { useEffect, useRef, useState } from 'react';
import useAppStore from '../../stores/appStore';
import ChatPanel from '../chat/ChatPanel';
import Medha2DAvatar from '../avatar/Medha2DAvatar';
import UserVideo from './UserVideo';
import { stopSpeaking } from '../../services/voiceService';

const RAIL = [
    { id: 'home', label: 'Home', icon: (<svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3l9 8h-3v9h-4v-6H10v6H6v-9H3z" /></svg>) },
    { id: 'explore', label: 'Search', icon: (<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>) },
    { id: 'compare', label: 'Compare', icon: (<svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="12" width="3.5" height="8" rx="1" /><rect x="10.2" y="7" width="3.5" height="13" rx="1" /><rect x="16.5" y="3" width="3.5" height="17" rx="1" /></svg>) },
    { id: 'earnings', label: 'Jobs', icon: (<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2" /></svg>) },
    { id: 'roadmap', label: 'Learn', icon: (<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 9L12 4 2 9l10 5 10-5z" /><path d="M6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5" /></svg>) },
    { id: 'resources', label: 'Library', icon: (<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19V5a2 2 0 012-2h13v16H6a2 2 0 00-2 2zm0 0a2 2 0 002 2h13" /></svg>) },
    { id: 'family', label: 'Family', icon: (<svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor"><circle cx="8" cy="8" r="3" /><circle cx="16.5" cy="9" r="2.5" /><path d="M2 20c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" /></svg>) },
];

const QUICK = ['Show career options', 'Compare roles', 'Required skills', 'Roadmap for each role'];

const RESOURCES = [
    { name: 'Skill India Portal', desc: 'Courses, ITIs & PMKVY schemes', url: 'https://www.skillindia.gov.in' },
    { name: 'PMKVY Official', desc: 'Free short-term skill training', url: 'https://www.pmkvyofficial.org' },
    { name: 'Apprenticeship India (NAPS)', desc: 'Paid shop-floor training', url: 'https://www.apprenticeshipindia.gov.in' },
    { name: 'NCVET / NSQF', desc: 'Qualification levels & job maps', url: 'https://ncvet.gov.in' },
    { name: 'NSDC', desc: 'Sector skill councils & partners', url: 'https://nsdcindia.org' },
];

function CtrlBtn({ label, active, danger, onClick, children }) {
    return (
        <button
            onClick={onClick}
            className="flex flex-col items-center gap-1 group"
            title={label}
        >
            <span
                className="w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-sm"
                style={{
                    background: danger ? '#c0392b' : active ? '#4d0d0d' : '#fff',
                    color: danger || active ? '#fff' : '#4d0d0d',
                    border: danger ? 'none' : '1px solid #e8d5b5',
                }}
            >
                {children}
            </span>
            <span className="text-[10px] font-medium" style={{ color: danger ? '#c0392b' : '#5a3a2a' }}>{label}</span>
        </button>
    );
}

export default function CounsellingCall({ onNav }) {
    const {
        exitInterview, setCurrentPage, setPendingUserPrompt,
        userName, messages, createSession, currentSession,
    } = useAppStore();
    const [tab, setTab] = useState('chat');
    const [muted, setMuted] = useState(false);
    const [camOn, setCamOn] = useState(true);
    const [captionsOn, setCaptionsOn] = useState(true);
    const [recording, setRecording] = useState(false);
    const [moreOpen, setMoreOpen] = useState(false);
    const [notes, setNotes] = useState('');
    const [isCallMode, setIsCallMode] = useState(true);
    const recRef = useRef(null);
    const recChunks = useRef([]);
    const recStream = useRef(null);

    const sessionId = currentSession?.id;

    useEffect(() => {
        if (sessionId) setNotes(localStorage.getItem(`medha_notes_${sessionId}`) || '');
    }, [sessionId]);

    const saveNotes = (v) => {
        setNotes(v);
        if (sessionId) localStorage.setItem(`medha_notes_${sessionId}`, v);
    };

    const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant' && m.content?.trim());
    const captionText = (lastAssistant?.content || '')
        .replace(/```[\s\S]*?```/g, '')
        .replace(/[*_#>]/g, '')
        .trim()
        .split('\n')[0]
        ?.slice(0, 140);

    const goHome = (navId) => {
        stopSpeaking();
        setIsCallMode(false);
        exitInterview();
        if (onNav) onNav(navId || 'home');
        setCurrentPage('dashboard');
    };

    const railNav = (id) => {
        if (id === 'home') { goHome('home'); return; }
        const prompts = {
            explore: 'Explore vocational careers suitable for me',
            compare: 'Compare two trades for me',
            earnings: 'Show verified earnings for ITI trades',
            roadmap: 'Create my career roadmap',
            resources: 'Show government skilling resources',
            family: 'My parents have concerns about vocational careers',
        };
        stopSpeaking();
        setIsCallMode(false);
        exitInterview();
        if (onNav) onNav(id);
        setCurrentPage('dashboard');
        if (prompts[id]) setPendingUserPrompt({ prompt: prompts[id], autoSend: id !== 'home' });
    };

    const toggleRecord = async () => {
        if (recording) {
            try { recRef.current?.stop(); } catch (e) {}
            recStream.current?.getTracks().forEach((t) => t.stop());
            setRecording(false);
            return;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            recStream.current = stream;
            recChunks.current = [];
            const rec = new MediaRecorder(stream);
            recRef.current = rec;
            rec.ondataavailable = (e) => { if (e.data.size) recChunks.current.push(e.data); };
            rec.onstop = () => {
                const blob = new Blob(recChunks.current, { type: 'audio/webm' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = 'medha-counselling-session.webm';
                a.click();
                setTimeout(() => URL.revokeObjectURL(a.href), 5000);
            };
            rec.start();
            setRecording(true);
        } catch (e) {
            downloadTranscript();
        }
    };

    const downloadTranscript = () => {
        const text = messages.map((m) => `${m.role === 'user' ? 'You' : 'Medha'}: ${m.content}`).join('\n\n');
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([text || 'No messages yet.'], { type: 'text/plain' }));
        a.download = 'medha-counselling-transcript.txt';
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 5000);
        setMoreOpen(false);
    };

    const shareSession = async () => {
        const data = { title: 'Medha Counselling', text: 'Join my career counselling session on Medha', url: window.location.href };
        try {
            if (navigator.share) await navigator.share(data);
            else { await navigator.clipboard.writeText(window.location.href); }
        } catch (e) {}
    };

    return (
        <div className="h-full w-full flex overflow-hidden" style={{ background: '#fff6e5' }}>
            {/* Slim icon rail */}
            <div className="w-[60px] shrink-0 flex flex-col items-center py-3 gap-1 relative" style={{ background: '#4d0d0d' }}>
                <div className="absolute left-0 top-0 bottom-0 w-[4px] kaushal-ethnic-edge" />
                <button className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ color: '#f0d9b5', border: '1px solid rgba(240,217,181,0.25)' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
                {RAIL.map((r) => (
                    <button
                        key={r.id}
                        title={r.label}
                        onClick={() => railNav(r.id)}
                        className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
                        style={{
                            background: r.id === 'home' ? '#f7e8c9' : 'transparent',
                            color: r.id === 'home' ? '#4d0d0d' : '#e8a83e',
                        }}
                    >
                        {r.icon}
                    </button>
                ))}
                <button
                    className="mt-auto w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ color: '#a0613c', border: '1px solid rgba(240,217,181,0.2)' }}
                    onClick={() => goHome('home')}
                    title="Back"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6l6 6-6 6" /></svg>
                </button>
            </div>

            {/* Center: banner + videos + controls */}
            <div className="flex-1 flex flex-col min-w-0 relative kaushal-center-wrap">
                {/* Top banner */}
                <div className="relative px-8 pt-4 pb-2 overflow-hidden shrink-0">
                    <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 420px 200px at 70% 20%, rgba(232,168,62,0.16), transparent 70%)' }} />
                    <div className="flex items-start justify-between relative">
                        <div>
                            <h2 className="text-[24px] leading-[1.2] font-extrabold" style={{ color: '#3a0d0d', fontFamily: 'Georgia, serif' }}>
                                Guiding your<br />skills today for a<br />brighter tomorrow
                            </h2>
                            <div className="h-[3px] w-10 mt-2 rounded-full" style={{ background: '#b06a2a' }} />
                        </div>
                        <div className="hidden xl:flex items-end gap-3 pr-2 opacity-90">
                            <svg width="72" height="56" viewBox="0 0 72 56"><rect x="8" y="10" width="46" height="32" rx="3" fill="#fff" stroke="#7a1f1f" strokeWidth="2" /><path d="M20 34l5-8 4 5 6-10" stroke="#7a1f1f" strokeWidth="2" fill="none" /><rect x="26" y="42" width="10" height="4" fill="#7a1f1f" /><rect x="14" y="46" width="34" height="3" rx="1.5" fill="#b06a2a" /></svg>
                            <svg width="76" height="60" viewBox="0 0 76 60"><rect x="14" y="30" width="48" height="10" rx="2" fill="#c0392b" /><rect x="18" y="20" width="40" height="10" rx="2" fill="#e8802e" /><path d="M38 20L20 10l18-6 18 6-18 10z" fill="#4d0d0d" /><rect x="54" y="10" width="4" height="12" fill="#d9a03a" /><circle cx="56" cy="24" r="3" fill="#d9a03a" /></svg>
                            <svg width="44" height="60" viewBox="0 0 44 60"><path d="M22 4a12 12 0 00-7 21.5c1.5 1.3 2 2.7 2 4.5h10c0-1.8.5-3.2 2-4.5A12 12 0 0022 4z" fill="#e8a83e" stroke="#b06a2a" strokeWidth="1.5" /><path d="M17 34h10M18 38h8" stroke="#7a1f1f" strokeWidth="2.5" /></svg>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-sm" style={{ border: '1px solid #e8d5b5', color: '#8a5a2a' }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4l1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
                            </button>
                            <button className="flex items-center gap-1 px-3.5 py-2 rounded-full bg-white text-[12px] font-bold shadow-sm" style={{ border: '1px solid #d9a679', color: '#4d0d0d' }}>
                                EN
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m6 9 6 6 6-6" /></svg>
                            </button>
                            <div className="w-9 h-9 rounded-full flex items-center justify-center text-[14px] font-bold text-white" style={{ background: '#9a8a76' }}>
                                {(userName?.charAt(0) || 'S').toUpperCase()}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Video tiles */}
                <div className="flex-1 min-h-0 grid grid-cols-2 gap-4 px-6 py-2">
                    {/* Medha tile */}
                    <div className="relative rounded-2xl overflow-hidden shadow-lg" style={{ border: '1px solid #e8d5b5', background: 'linear-gradient(160deg, #f7e3c2 0%, #e9c9a0 45%, #c9a071 100%)' }}>
                        <div className="absolute inset-0 flex items-center justify-center p-4">
                            <Medha2DAvatar className="pointer-events-none select-none" style={{ maxWidth: '78%' }} />
                        </div>
                        <div className="absolute bottom-3 left-3 flex items-center gap-2.5 px-3.5 py-2 rounded-xl" style={{ background: 'rgba(40,10,10,0.55)', backdropFilter: 'blur(6px)' }}>
                            <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#4caf7d', boxShadow: '0 0 0 3px rgba(76,175,125,0.3)' }} />
                            <span>
                                <span className="block text-[13px] font-bold text-white leading-tight">Medha AI</span>
                                <span className="block text-[10.5px] text-white/75 leading-tight">AI Career Counsellor</span>
                            </span>
                        </div>
                        {captionsOn && captionText && (
                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 max-w-[80%] px-3 py-1.5 rounded-lg text-[11.5px] text-white text-center" style={{ background: 'rgba(0,0,0,0.55)' }}>
                                {captionText}
                            </div>
                        )}
                    </div>
                    {/* You tile (laptop cam) */}
                    <div className="relative rounded-2xl overflow-hidden shadow-lg bg-black" style={{ border: '1px solid #e8d5b5' }}>
                        {camOn ? (
                            <UserVideo bare />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-2" style={{ background: '#2a1512' }}>
                                <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white" style={{ background: '#9a8a76' }}>
                                    {(userName?.charAt(0) || 'S').toUpperCase()}
                                </div>
                                <p className="text-[12px] text-white/70">Camera off</p>
                            </div>
                        )}
                        <div className="absolute bottom-3 left-3 flex items-center gap-2.5 px-3.5 py-2 rounded-xl" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}>
                            <span className="relative flex items-center justify-center">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><circle cx="12" cy="8" r="3.5" /><path d="M5 20c0-3.3 3.1-6 7-6s7 2.7 7 6" /></svg>
                                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-black" style={{ background: '#4caf7d' }} />
                            </span>
                            <span>
                                <span className="block text-[13px] font-bold text-white leading-tight">You</span>
                                <span className="block text-[10.5px] text-white/75 leading-tight">Student</span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* Call controls */}
                <div className="flex justify-center pb-3 pt-1 shrink-0">
                    <div className="flex items-end gap-4 px-6 py-3 rounded-2xl bg-white shadow-lg" style={{ border: '1px solid #efdfc2' }}>
                        <CtrlBtn label={muted ? 'Unmute' : 'Mute'} active={muted} onClick={() => { setMuted(!muted); setIsCallMode(muted); }}>
                            {muted
                                ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" /><path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M2 2l20 20" /></svg>
                                : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" /><path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" /></svg>}
                        </CtrlBtn>
                        <CtrlBtn label="Camera" active={!camOn} onClick={() => setCamOn(!camOn)}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="13" height="12" rx="2" /><path d="M15 10l7-3v10l-7-3" /></svg>
                        </CtrlBtn>
                        <CtrlBtn label="Share" onClick={shareSession}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="13" rx="2" /><path d="M8 21h8M12 17v4" /></svg>
                        </CtrlBtn>
                        <CtrlBtn label="End Call" danger onClick={() => goHome('home')}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3 11l18-7-7 18-2.5-7.5L3 11z" transform="rotate(135 12 12)" /></svg>
                        </CtrlBtn>
                        <CtrlBtn label="Captions" active={captionsOn} onClick={() => setCaptionsOn(!captionsOn)}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M10 10.5a2.5 2.5 0 00-4 2 2.5 2.5 0 004 2M18 10.5a2.5 2.5 0 00-4 2 2.5 2.5 0 004 2" /></svg>
                        </CtrlBtn>
                        <CtrlBtn label="Record" active={recording} onClick={toggleRecord}>
                            <span className="w-[18px] h-[18px] rounded-full" style={{ border: '2px solid currentColor' }}>
                                <span className="block w-[8px] h-[8px] rounded-full mx-auto mt-[3px]" style={{ background: recording ? '#fff' : '#c0392b' }} />
                            </span>
                        </CtrlBtn>
                        <div className="relative">
                            <CtrlBtn label="More" onClick={() => setMoreOpen(!moreOpen)}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="19" cy="12" r="1.8" /></svg>
                            </CtrlBtn>
                            {moreOpen && (
                                <div className="absolute bottom-full mb-2 right-0 w-48 rounded-xl bg-white shadow-xl overflow-hidden" style={{ border: '1px solid #e8d5b5' }}>
                                    <button onClick={downloadTranscript} className="w-full text-left px-4 py-2.5 text-[12.5px] hover:bg-amber-50" style={{ color: '#4d0d0d' }}>Download transcript</button>
                                    <button onClick={() => { createSession(); setMoreOpen(false); }} className="w-full text-left px-4 py-2.5 text-[12.5px] hover:bg-amber-50" style={{ color: '#4d0d0d' }}>New chat</button>
                                    <button onClick={() => goHome('home')} className="w-full text-left px-4 py-2.5 text-[12.5px] hover:bg-amber-50" style={{ color: '#4d0d0d' }}>Back to home</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Right chat column */}
            <div className="w-[320px] shrink-0 h-full hidden md:flex flex-col p-3 pl-0">
                <div className="flex-1 flex flex-col min-h-0 rounded-2xl bg-white shadow-lg overflow-hidden" style={{ border: '1px solid #efdfc2' }}>
                    <div className="flex items-center gap-1.5 px-3 pt-3 shrink-0">
                        {[
                            { id: 'chat', label: 'Chat', icon: (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="4" /><path d="M12 8v6M9 11h6" /></svg>) },
                            { id: 'notes', label: 'Notes', icon: (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2h9l5 5v15H6z" /><path d="M14 2v6h6" /></svg>) },
                            { id: 'resources', label: 'Resources', icon: (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19V5a2 2 0 012-2h13v16H6a2 2 0 00-2 2zm0 0a2 2 0 002 2h13" /></svg>) },
                        ].map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setTab(t.id)}
                                className="flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-[12px] font-semibold transition-all"
                                style={{
                                    background: tab === t.id ? '#4d0d0d' : 'transparent',
                                    color: tab === t.id ? '#fff' : '#5a3a2a',
                                }}
                            >
                                {t.icon} {t.label}
                            </button>
                        ))}
                    </div>
                    {tab === 'chat' && (
                        <>
                            <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                                <ChatPanel hideHero compact isCallMode={isCallMode} setIsCallMode={setIsCallMode} />
                            </div>
                            <div className="px-3 pb-1 flex flex-wrap gap-1.5 shrink-0">
                                {QUICK.map((q) => (
                                    <button
                                        key={q}
                                        onClick={() => setPendingUserPrompt({ prompt: q, autoSend: true })}
                                        className="px-3 py-1.5 rounded-full text-[11px] font-medium bg-white transition-all hover:shadow"
                                        style={{ border: '1px solid #e8d5b5', color: '#5a3a2a' }}
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                    {tab === 'notes' && (
                        <div className="flex-1 min-h-0 p-3 flex flex-col">
                            <textarea
                                value={notes}
                                onChange={(e) => saveNotes(e.target.value)}
                                placeholder="Session notes — saved automatically..."
                                className="flex-1 w-full p-3 rounded-xl text-[12.5px] outline-none resize-none"
                                style={{ background: '#f8efdc', color: '#4d0d0d', border: '1px solid #e8d5b5' }}
                            />
                        </div>
                    )}
                    {tab === 'resources' && (
                        <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2 kaushal-scroll">
                            {RESOURCES.map((r) => (
                                <a key={r.name} href={r.url} target="_blank" rel="noreferrer" className="block p-3 rounded-xl bg-white transition-all hover:shadow" style={{ border: '1px solid #efdfc2' }}>
                                    <p className="text-[12.5px] font-bold" style={{ color: '#4d0d0d' }}>{r.name}</p>
                                    <p className="text-[11px]" style={{ color: '#8a6a4a' }}>{r.desc}</p>
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
