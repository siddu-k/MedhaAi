import { useState } from 'react';
import useAppStore from '../../stores/appStore';
import { generatePptDeck } from '../../services/pptService';

const PPT_TEMPLATES = [
    { topic: 'Transformer Architecture & Attention Mechanisms', tag: 'Deep Learning' },
    { topic: 'System Design: Scalable URL Shortener', tag: 'Architecture' },
    { topic: 'Stop-and-Wait & Sliding Window Network Protocols', tag: 'Networking' },
    { topic: 'DC Circuit Analysis, Ohm\'s Law & Kirchhoff\'s Rules', tag: 'Electronics' },
    { topic: 'Binary Search & Divide-and-Conquer Algorithms', tag: 'Algorithms' },
    { topic: 'Zero-Knowledge Proofs & Modern Cryptography', tag: 'Security' },
];

const THEMES = [
    { id: 'cyberpunk', name: 'Cyber Neon', bg: 'bg-zinc-950 border-emerald-500/30', accent: 'from-emerald-400 to-cyan-400' },
    { id: 'slate', name: 'Executive Slate', bg: 'bg-slate-950 border-blue-500/30', accent: 'from-blue-400 to-indigo-400' },
    { id: 'aurora', name: 'Deep Aurora', bg: 'bg-purple-950/40 border-purple-500/30', accent: 'from-purple-400 to-pink-400' },
    { id: 'amber', name: 'Warm Amber', bg: 'bg-amber-950/30 border-amber-500/30', accent: 'from-amber-400 to-orange-400' },
];

const AUDIENCES = [
    { id: 'Educational & Technical', label: 'Technical & Educational', desc: 'Detailed concepts & architectural diagrams' },
    { id: 'Executive Briefing', label: 'Executive Briefing', desc: 'High-level strategy, KPIs & punchy takeaways' },
    { id: 'Beginner Friendly', label: 'Beginner Friendly', desc: 'Intuitive analogies & step-by-step breakdowns' },
];

export default function PptSetupModal({ onClose }) {
    const { startPptMode, selectedModel } = useAppStore();
    const [topic, setTopic] = useState('');
    const [slideCount, setSlideCount] = useState(5);
    const [theme, setTheme] = useState('cyberpunk');
    const [audience, setAudience] = useState('Educational & Technical');
    const [isLoading, setIsLoading] = useState(false);
    const [progressStatus, setProgressStatus] = useState('');
    const [error, setError] = useState(null);

    const handleGenerate = async (e) => {
        e?.preventDefault();
        const trimmed = topic.trim();
        if (!trimmed) return;

        setIsLoading(true);
        setError(null);
        setProgressStatus(`Structuring ${slideCount} high-impact slides with visual diagrams...`);

        try {
            const deck = await generatePptDeck({
                topic: trimmed,
                slideCount,
                theme,
                audience,
                model: selectedModel,
                onProgress: () => {
                    setProgressStatus(`Drafting visual flowcharts & speaker scripts (${slideCount} slides)...`);
                }
            });

            startPptMode(deck);
            onClose();
        } catch (err) {
            console.error('PPT Generation Error:', err);
            setError(err.message || 'Failed to generate presentation. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
                
                {/* Header */}
                <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/40">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect width="18" height="14" x="3" y="3" rx="2" /><path d="M7 21h10" /><path d="M12 17v4" /><path d="m9 9 6 3-6 3Z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-white tracking-wide">AI Presentation Studio</h3>
                            <p className="text-[11px] text-zinc-400">Generate complete visual slide decks with diagrams & speaker scripts</p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="w-8 h-8 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-all disabled:opacity-50"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                </div>

                {/* Form Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-zinc-800">
                    {/* Topic Input */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-200 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                            <span>Topic or Concept</span>
                        </label>
                        <input
                            type="text"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="e.g. System Design for Instagram, Quantum Computing, Stop and Wait Protocol..."
                            disabled={isLoading}
                            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors shadow-inner"
                        />
                    </div>

                    {/* Quick Topic Chips */}
                    <div className="space-y-2">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Quick Suggestions</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {PPT_TEMPLATES.map((tmpl, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setTopic(tmpl.topic)}
                                    disabled={isLoading}
                                    className="px-3 py-2 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 rounded-xl text-left transition-all flex items-center justify-between text-xs text-zinc-300 group"
                                >
                                    <span className="truncate flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500 group-hover:text-emerald-400"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                        <span className="truncate">{tmpl.topic}</span>
                                    </span>
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono flex-shrink-0 group-hover:text-emerald-400">
                                        {tmpl.tag}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Slide Count Slider (Minimum 3 to Maximum 12) */}
                    <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-zinc-200 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="14" x="3" y="3" rx="2"/><path d="M7 21h10"/><path d="M12 17v4"/></svg>
                                <span>Number of Slides to Generate</span>
                            </label>
                            <span className="text-sm font-mono font-bold text-emerald-400 bg-emerald-950/40 px-2.5 py-0.5 rounded-lg border border-emerald-500/30">
                                {slideCount} Slides
                            </span>
                        </div>
                        <input
                            type="range"
                            min="3"
                            max="12"
                            step="1"
                            value={slideCount}
                            onChange={(e) => setSlideCount(parseInt(e.target.value))}
                            disabled={isLoading}
                            className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                        />
                        <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                            <span>3 Slides (Brief)</span>
                            <span>5 Slides (Standard)</span>
                            <span>8 Slides (Detailed)</span>
                            <span>12 Slides (Deep Dive)</span>
                        </div>
                    </div>

                    {/* Deck Visual Theme */}
                    <div className="space-y-2.5">
                        <label className="text-xs font-bold text-zinc-200 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>
                            <span>Visual Deck Theme</span>
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            {THEMES.map((thm) => (
                                <button
                                    key={thm.id}
                                    type="button"
                                    onClick={() => setTheme(thm.id)}
                                    disabled={isLoading}
                                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col gap-1.5 ${theme === thm.id ? 'border-emerald-400 bg-emerald-950/25 ring-1 ring-emerald-500/50' : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'}`}
                                >
                                    <p className="text-xs font-bold text-white">{thm.name}</p>
                                    <div className={`h-1.5 w-full rounded-full bg-gradient-to-r ${thm.accent}`} />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Target Audience & Tone */}
                    <div className="space-y-2.5">
                        <label className="text-xs font-bold text-zinc-200 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 4.24 4.24"/><path d="m14.83 9.17 4.24-4.24"/><path d="m14.83 14.83 4.24 4.24"/><path d="m9.17 14.83-4.24 4.24"/></svg>
                            <span>Audience & Depth</span>
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {AUDIENCES.map((aud) => (
                                <button
                                    key={aud.id}
                                    type="button"
                                    onClick={() => setAudience(aud.id)}
                                    disabled={isLoading}
                                    className={`p-3 rounded-2xl border text-left transition-all ${audience === aud.id ? 'border-emerald-400 bg-emerald-950/25' : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'}`}
                                >
                                    <p className="text-xs font-bold text-white">{aud.label}</p>
                                    <p className="text-[10px] text-zinc-400 mt-1">{aud.desc}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                            <span>{error}</span>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-900/40 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="text-xs text-zinc-400 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={handleGenerate}
                        disabled={!topic.trim() || isLoading}
                        className="px-6 py-2.5 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-black font-bold rounded-xl text-xs transition-all shadow-[0_0_20px_rgba(52,211,153,0.3)] disabled:opacity-50 flex items-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                <span>Generating {slideCount} Slides...</span>
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                                <span>Generate Presentation Deck</span>
                            </>
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
}
