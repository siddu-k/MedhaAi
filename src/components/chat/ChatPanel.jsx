import { useState, useRef, useEffect } from 'react';
import useAppStore from '../../stores/appStore';
import ChatMessage from './ChatMessage';
import ImageUpload from './ImageUpload';
import VoiceControls from '../voice/VoiceControls';
import { streamChat, fileToBase64, extractMermaidDiagram, listLocalModels } from '../../services/aiService';
import { counsellingPromptWith } from '../../services/geminiService';
import { getOutcomeContext, detectObjection, matchDistrict } from '../../services/outcomeService';
import { logObjection, logSession, getDistrict, setDistrict } from '../../services/engagementLog';
import EscalationModal from '../escalation/EscalationModal';
import { speak, stopSpeaking, enqueueSpeech, startListening as startSTT, stopListening as stopSTT } from '../../services/voiceService';

const HOME_CARDS = [
    { id: 'explore', title: 'Explore Careers', desc: 'Discover 100+ career\noptions across sectors', bg: '#e8802e', icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2.5" fill="#fff" stroke="none"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2 2M17.1 17.1l2 2M19.1 4.9l-2 2M6.9 17.1l-2 2"/></svg>
    )},
    { id: 'compare', title: 'Compare Trades', desc: 'Compare skills,\nearnings and job\nopportunities', bg: '#8a2e2e', icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M3 17l5-6 4 4 6-8"/><path d="M14 6h4v4"/><rect x="3" y="19" width="18" height="2" rx="1" fill="#fff" stroke="none"/></svg>
    )},
    { id: 'earnings', title: 'Check Earnings & Jobs', desc: 'View verified data from\ngovernment sources', bg: '#445c3c', icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M6 4h12M6 8h12M6 4l8 8-2 2M6 12l3 8"/></svg>
    )},
    { id: 'roadmap', title: 'Create Your Roadmap', desc: 'Get a personalised\nlearning and career plan', bg: '#e8a83e', icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#4d0d0d"><path d="M5 20L10 4h2l-5 16H5zm4 0l1.5-4h2L11 20H9zm4 0l2.5-7h2L15 20h-2zm4 0l1-2.5h2L18 20h-1z" opacity="0.9"/><rect x="4" y="18" width="16" height="2.5" rx="1"/></svg>
    )},
];

const QUICK = ['Best ITI trade for me?', 'Electrician vs Fitter?', 'Jobs in Andhra Pradesh?', 'How much can I earn?', 'Short term courses?'];

function HeroArt() {
    return (
        <div className="relative w-full flex flex-col items-center pt-2 pb-1 shrink-0">
            <img
                src="/art/hero-medha.png"
                alt="Namaste Medha — Careers in Motion"
                className="w-full max-w-[1020px] h-auto object-contain select-none pointer-events-none rounded-xl"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
        </div>
    );
}

export default function ChatPanel({ hideHero = false, isCallMode = false, setIsCallMode = null, compact = false }) {
    const {
        messages, addMessage, updateLastMessage,
        currentSession, isAiTyping, setIsAiTyping,
        saveMessage, setIsSpeaking,
        isSpeaking, isListening, setIsListening,
        selectedModel,
        isVisualizeMode, activeConcept,
        activeBoardDiagram, isAvatarEnabled,
        localModels, setLocalModels,
        pendingUserPrompt, setPendingUserPrompt,
    } = useAppStore();

    const [input, setInput] = useState('');
    const [attachedImage, setAttachedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [localCall, setLocalCall] = useState(false);
    const callMode = setIsCallMode ? isCallMode : localCall;
    const setCallMode = setIsCallMode || setLocalCall;
    const [retry, setRetry] = useState(0);
    const sentRef = useRef(null);
    const [showEscalation, setShowEscalation] = useState(false);

    const chatContainerRef = useRef(null);
    const abortRef = useRef(null);
    const inputRef = useRef(null);
    const currentRequestIdRef = useRef(0);
    const lockRef = useRef(false);

    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        lockRef.current = scrollHeight - scrollTop - clientHeight > 90;
    };
    useEffect(() => {
        if (chatContainerRef.current && !lockRef.current) chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }, [messages, isAiTyping]);

    useEffect(() => {
        if (!localModels || localModels.length === 0) {
            listLocalModels().then((m) => { if (m?.length) setLocalModels(m); }).catch(() => {});
        }
    }, []);
    useEffect(() => {
        setInput(''); setAttachedImage(null); setImagePreview(null);
        if (abortRef.current) abortRef.current.abort();
    }, [currentSession?.id]);

    useEffect(() => {
        if (!callMode) { if (isListening) { stopSTT(); setIsListening(false); } return; }
        if (isAiTyping || isSpeaking || isListening) return;
        const t = setTimeout(() => {
            setIsListening(true);
            startSTT(
                (tx) => setInput(tx),
                (final) => {
                    setIsListening(false);
                    const text = (final || '').trim();
                    if (text) {
                        // guard: ignore echoes of what we just sent (stop() triggers onend)
                        const last = sentRef.current;
                        const now = Date.now();
                        if (!last || last.text !== text || now - last.at > 2500) {
                            sentRef.current = { text, at: now };
                            handleSend(text);
                            setInput('');
                        } else {
                            setRetry((r) => r + 1);
                        }
                    } else {
                        setRetry((r) => r + 1); // silence: re-open the mic
                    }
                },
                () => { setIsListening(false); setRetry((r) => r + 1); } // error: recover
            );
        }, 700);
        return () => { clearTimeout(t); stopSTT(); setIsListening(false); };
    }, [callMode, isAiTyping, isSpeaking, isListening, retry]);

    const handleSend = async (text = input) => {
        const store = useAppStore.getState();
        if (store.isProcessing) return;
        const trimmed = typeof text === 'string' ? text.trim() : '';
        if (!trimmed && !attachedImage) return;
        let activeSession = currentSession;
        if (!activeSession) activeSession = store.createSession();
        store.setIsProcessing(true);
        lockRef.current = false;
        setInput('');
        const curImg = attachedImage; const curPrev = imagePreview;
        setAttachedImage(null); setImagePreview(null);
        try {
            if (activeSession.title === 'New Chat' && trimmed) {
                const nt = trimmed.length > 25 ? trimmed.substring(0, 25) + '...' : trimmed;
                store.setSessions(store.sessions.map(s => s.id === activeSession.id ? { ...s, title: nt } : s));
            }
            await saveMessage(activeSession.id, 'user', trimmed, curPrev);
            // Track resistance signals for the admin dashboard + remember district
            try {
                const foundDistrict = matchDistrict(trimmed);
                if (foundDistrict) setDistrict(foundDistrict);
                logSession(activeSession.id, foundDistrict || getDistrict());
                const objection = detectObjection(trimmed);
                if (objection) logObjection(objection, activeSession.id, foundDistrict || getDistrict());
            } catch (e) {}
            const hist = messages.map(m => ({ role: m.role, content: m.content }));
            hist.push({ role: 'user', content: trimmed });
            if (curImg) { try { const b = await fileToBase64(curImg); hist[hist.length - 1].images = [b]; } catch (e) {} }
            setIsAiTyping(true);
            addMessage({ id: crypto.randomUUID(), role: 'assistant', content: '', created_at: new Date().toISOString() });
            const reqId = ++currentRequestIdRef.current;
            if (abortRef.current) abortRef.current.abort();
            abortRef.current = new AbortController();
            const autoSpeak = isAvatarEnabled || callMode;
            if (autoSpeak) speak('', () => setIsSpeaking(true), () => setIsSpeaking(false));
            let spoken = 0;
            const full = await streamChat(hist, (partial) => {
                if (reqId !== currentRequestIdRef.current) return;
                updateLastMessage(partial);
                const d = extractMermaidDiagram(partial);
                if (d) store.setBoardDiagram(d);
                if (autoSpeak) {
                    let w = partial.substring(spoken);
                    const re = /[^.?!]+[.?!](?:\s+|$)/g; let m;
                    let flushed = false;
                    while ((m = re.exec(w)) !== null) {
                        if (m[0].trim()) { enqueueSpeech(m[0]); spoken += (m.index + m[0].length); w = partial.substring(spoken); re.lastIndex = 0; flushed = true; }
                    }
                    // No full sentence yet but a clause is ready — speak it now
                    // instead of waiting for [.?!] so 1-on-1 voice starts instantly.
                    if (!flushed && w.length > 60) {
                        const ci = Math.max(w.lastIndexOf(','), w.lastIndexOf(';'), w.lastIndexOf(':'), w.lastIndexOf('—'));
                        if (ci > 30) {
                            const clause = w.slice(0, ci + 1);
                            enqueueSpeech(clause);
                            spoken += clause.length;
                        }
                    }
                }
            }, abortRef.current.signal, selectedModel,
                {
                    isInterviewMode: store.isInterviewMode,
                    jobDescription: store.activeJobDescription,
                    isVisualizeMode: store.isVisualizeMode, visualDimension: '2d', activeConcept: store.activeConcept,
                    // Verified outcome data + language ride along as the system prompt
                    systemPrompt: counsellingPromptWith(getOutcomeContext(trimmed), store.lang || 'en'),
                });
            if (reqId === currentRequestIdRef.current) {
                const fd = extractMermaidDiagram(full);
                if (fd) store.setBoardDiagram(fd);
                if (autoSpeak && full.substring(spoken).trim()) enqueueSpeech(full.substring(spoken));
            }
        } catch (err) {
            if (err.name !== 'AbortError') updateLastMessage(`Connection Error: ${err.message}`);
        } finally {
            setIsAiTyping(false);
            useAppStore.getState().setIsProcessing(false);
            abortRef.current = null;
        }
    };

    useEffect(() => {
        if (pendingUserPrompt) {
            const pt = typeof pendingUserPrompt === 'string' ? pendingUserPrompt : pendingUserPrompt.prompt;
            const auto = typeof pendingUserPrompt === 'object' ? pendingUserPrompt.autoSend !== false : true;
            if (auto) handleSend(pt);
            else { setInput(pt); inputRef.current?.focus(); }
            setPendingUserPrompt(null);
        }
    }, [pendingUserPrompt]);

    const onKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };
    const onImg = (f) => { setAttachedImage(f); const r = new FileReader(); r.onload = (e) => setImagePreview(e.target.result); r.readAsDataURL(f); };
    const stop = () => { if (abortRef.current) { abortRef.current.abort(); abortRef.current = null; } stopSpeaking(); setIsSpeaking(false); setIsAiTyping(false); useAppStore.getState().setIsProcessing(false); };
    const cardSend = (id) => {
        const map = {
            explore: 'Discover vocational trades based on my interests', compare: 'Compare Electrician vs Fitter: skills, earnings and jobs',
            earnings: 'Show verified earnings and placement data for ITI trades from government sources', roadmap: 'Create my personalised learning and career roadmap',
        };
        handleSend(map[id]);
    };
    const showHero = messages.length === 0 && !hideHero;

    return (
        <div className="flex flex-col h-full w-full kaushal-chat">
            <div ref={chatContainerRef} onScroll={handleScroll} className={`flex-1 overflow-y-auto kaushal-scroll ${compact ? 'px-3 py-3' : 'px-6 py-4'}`}>
                {showHero ? (
                    <div className="max-w-[1020px] mx-auto">
                        <HeroArt />
                        <div className="grid grid-cols-4 gap-2.5 mt-2.5">
                            {HOME_CARDS.map((c) => (
                                <button key={c.id} onClick={() => cardSend(c.id)} className="text-left rounded-[10px] p-2.5 bg-[#fffdf5] flex flex-col gap-1 transition-all hover:shadow-[0_8px_24px_rgba(120,60,20,0.12)] hover:-translate-y-[1px] min-h-[118px]" style={{ border: '1px solid #efdfc2', boxShadow: '0 2px 12px rgba(120,60,20,0.06)' }}>
                                    <div className="w-[32px] h-[32px] rounded-[8px] flex items-center justify-center shrink-0" style={{ background: c.bg }}>{c.icon}</div>
                                    <p className="text-[12px] font-semibold leading-snug tracking-tight" style={{ color: '#4d0d0d', fontFamily: 'Inter, system-ui, sans-serif' }}>{c.title}</p>
                                    <p className="text-[10px] leading-[1.4] whitespace-pre-line flex-1 font-normal" style={{ color: '#6b6a6a', fontFamily: 'Inter, system-ui, sans-serif' }}>{c.desc}</p>
                                    <span className="w-[20px] h-[20px] rounded-full flex items-center justify-center self-end" style={{ border: '1px solid #d9a679', color: '#8a5a2a', background: '#fff' }}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 6l6 6-6 6"/></svg></span>
                                </button>
                            ))}
                        </div>
                        <div className="mt-4">
                            <div className="flex items-center justify-between">
                                <p className="text-[13px] font-semibold flex items-center gap-1.5 tracking-tight" style={{ color: '#4d0d0d', fontFamily: 'Inter, system-ui, sans-serif' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e8802e" strokeWidth="2"><path d="M9 18h6M10 21h4M12 3a6 6 0 00-4 10.5c.8.7 1 1.5 1 2.5h6c0-1 .2-1.8 1-2.5A6 6 0 0012 3z"/></svg> Quick Questions</p>
                                <button className="text-[11.5px] font-semibold flex items-center gap-1" style={{ color: '#5a3a2a', fontFamily: 'Inter, system-ui, sans-serif' }}>See All <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>
                            </div>
                            <div className="flex flex-wrap gap-2.5 mt-3">
                                {QUICK.map((q) => (
                                    <button key={q} onClick={() => handleSend(q)} className="px-[18px] py-[9px] rounded-full text-[12.5px] font-medium transition-all hover:shadow" style={{ background: '#f3e5c8', color: '#5a3a2a', border: '1px solid transparent' }}>{q}</button>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className={`${compact ? 'max-w-none' : 'max-w-[1020px]'} mx-auto space-y-5 pt-2`}>
                        {messages.map((msg, i) => (
                            <ChatMessage key={i} message={msg} isTyping={isAiTyping && i === messages.length - 1 && msg.role === 'assistant'} />
                        ))}
                    </div>
                )}
            </div>

            {(isAiTyping || isSpeaking) && (
                <div className="px-4 pb-2 flex justify-center">
                    <button onClick={stop} className="px-4 py-1.5 rounded-full text-xs font-semibold shadow" style={{ background: '#4d0d0d', color: '#fdf3e0' }}>Stop</button>
                </div>
            )}
            {imagePreview && (
                <div className="px-6 pb-2 max-w-[800px] mx-auto w-full">
                    <div className="inline-flex items-center gap-2 bg-white rounded-xl p-2" style={{ border: '1px solid #e8d5b5' }}>
                        <img src={imagePreview} alt="Preview" className="w-12 h-12 object-cover rounded-lg" />
                        <button onClick={() => { setAttachedImage(null); setImagePreview(null); }} style={{ color: '#a00' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
                    </div>
                </div>
            )}
            <div className={`${compact ? 'px-3 pb-3' : 'px-6 pb-5'} pt-1`}>
                <div className={`${compact ? 'max-w-none' : 'max-w-[800px]'} mx-auto rounded-[16px] bg-[#fffdf5] flex items-center gap-1.5 p-2 pl-3`} style={{ border: '1px solid #e8d5b5', boxShadow: '0 6px 24px rgba(120,60,20,0.10)' }}>
                    <span style={{ color: '#8a5a2a' }}><ImageUpload onImageSelect={onImg} /></span>
                    <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={onKey} placeholder="Ask me anything about careers, trades, skills, jobs..." className="flex-1 mx-1 px-4 py-2.5 text-[13px] outline-none rounded-[10px]" style={{ background: '#f8efdc', color: '#4d0d0d' }} />
                    <VoiceControls onResult={(t) => t && setInput(t)} />
                    <button onClick={() => handleSend()} disabled={!input.trim() && !attachedImage} className="w-[42px] h-[42px] rounded-[10px] flex items-center justify-center text-white disabled:opacity-30" style={{ background: '#7a1f1f' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M3 11l18-7-7 18-2.5-7.5L3 11z"/></svg></button>
                </div>
                {!compact && (
                    <div className="max-w-[800px] mx-auto mt-2 text-center">
                        <button onClick={() => setShowEscalation(true)} className="text-[12px] font-semibold underline underline-offset-2" style={{ color: '#7a1f1f' }}>Need a human counsellor? Request a callback</button>
                    </div>
                )}
            </div>
            {showEscalation && <EscalationModal onClose={() => setShowEscalation(false)} />}
        </div>
    );
}
