import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import useAppStore from '../../stores/appStore';
import { renderMermaidFresh, cleanMermaidCode } from '../../services/mermaidCache';
import { speak, stopSpeaking, isSpeaking } from '../../services/voiceService';
import PptLiveChat from './PptLiveChat';

function SlideMarkdown({ content, className = '' }) {
    if (!content) return null;
    return (
        <span className={`slide-markdown inline-block ${className}`}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                    p: ({ children }) => <span>{children}</span>,
                    code: ({ children }) => (
                        <code className="px-1.5 py-0.5 bg-zinc-800/80 text-emerald-300 font-mono text-[11px] rounded border border-zinc-700/50">
                            {children}
                        </code>
                    )
                }}
            >
                {content}
            </ReactMarkdown>
        </span>
    );
}

export default function PptDeckViewer() {
    const {
        activePptDeck, exitPptMode, currentSlideIndex,
        setCurrentSlideIndex, isPptPresenting, setIsPptPresenting,
        setIsSpeaking
    } = useAppStore();

    const [copied, setCopied] = useState(false);
    const [isReadingSlide, setIsReadingSlide] = useState(false);
    const [diagramSvg, setDiagramSvg] = useState('');
    const [diagramError, setDiagramError] = useState(null);
    const [showLiveEditor, setShowLiveEditor] = useState(true);
    const [showNavigator, setShowNavigator] = useState(false);

    const slides = activePptDeck?.slides || [];
    const currentSlide = slides[currentSlideIndex] || slides[0];

    // Keyboard Navigation (ArrowLeft, ArrowRight, Space)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
                e.preventDefault();
                setCurrentSlideIndex(Math.min(slides.length - 1, currentSlideIndex + 1));
            } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
                e.preventDefault();
                setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1));
            } else if (e.key === 'Escape') {
                setIsPptPresenting(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentSlideIndex, slides.length]);

    // Render Mermaid Diagram on Current Slide
    useEffect(() => {
        let isMounted = true;
        async function renderSlideDiagram() {
            if (!currentSlide?.diagram) {
                setDiagramSvg('');
                setDiagramError(null);
                return;
            }

            const cleanCode = cleanMermaidCode(currentSlide.diagram);
            const { svg, error } = await renderMermaidFresh(cleanCode, `ppt-slide-${currentSlideIndex}`);
            if (isMounted) {
                if (svg) {
                    setDiagramSvg(svg);
                    setDiagramError(null);
                } else if (error) {
                    setDiagramError(error);
                }
            }
        }

        renderSlideDiagram();
        return () => { isMounted = false; };
    }, [currentSlide?.diagram, currentSlideIndex]);

    // Read Slide Aloud with 3D Avatar
    const handleReadSlideAloud = () => {
        if (isSpeaking() || isReadingSlide) {
            stopSpeaking();
            setIsReadingSlide(false);
            setIsSpeaking(false);
            return;
        }

        const speechScript = currentSlide.speakerNotes || `${currentSlide.title}. ${currentSlide.subtitle || ''}. ${currentSlide.points?.join('. ') || ''}`;
        setIsReadingSlide(true);
        speak(
            speechScript,
            () => {
                setIsReadingSlide(true);
                setIsSpeaking(true);
            },
            () => {
                setIsReadingSlide(false);
                setIsSpeaking(false);
            }
        );
    };

    // Export Deck as Markdown
    const handleCopyMarkdown = () => {
        if (!activePptDeck) return;
        let md = `# ${activePptDeck.title}\n## ${activePptDeck.subtitle}\n\n`;
        activePptDeck.slides.forEach((s) => {
            md += `---\n\n### Slide ${s.slideNumber}: ${s.title}\n*${s.subtitle || ''}*\n\n`;
            s.points?.forEach((p) => { md += `- ${p}\n`; });
            if (s.technicalDetails) {
                md += `\n**Technical Specs**: ${s.technicalDetails}\n`;
            }
            if (s.diagram) {
                md += `\n\`\`\`mermaid\n${s.diagram}\n\`\`\`\n`;
            }
            if (s.speakerNotes) {
                md += `\n> **Speaker Notes**: ${s.speakerNotes}\n\n`;
            }
        });

        navigator.clipboard.writeText(md);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!activePptDeck || slides.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                <p className="text-sm text-zinc-400 mb-4">No active presentation deck loaded.</p>
                <button
                    onClick={exitPptMode}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl text-xs"
                >
                    Back to Studio
                </button>
            </div>
        );
    }

    return (
        <div className={`h-full w-full flex flex-col bg-[#09090b] text-zinc-100 select-none overflow-hidden ${isPptPresenting ? 'fixed inset-0 z-50 bg-black' : ''}`}>
            
            {/* Top Toolbar */}
            <header className="h-14 px-4 sm:px-6 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md flex items-center justify-between flex-shrink-0 z-20">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect width="18" height="14" x="3" y="3" rx="2" /><path d="M7 21h10" /><path d="M12 17v4" />
                        </svg>
                    </div>
                    <div className="overflow-hidden">
                        <h2 className="text-sm font-bold text-white truncate">{activePptDeck.title}</h2>
                        <p className="text-[10px] text-zinc-400 truncate">{activePptDeck.topic}</p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    {/* Toggle Live AI Editor */}
                    {!isPptPresenting && (
                        <button
                            onClick={() => setShowLiveEditor(!showLiveEditor)}
                            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                                showLiveEditor
                                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                                    : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-zinc-400'
                            }`}
                            title="Toggle AI Co-Pilot Live Chat"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>
                            <span>AI Co-Pilot</span>
                        </button>
                    )}

                    {/* Toggle Slide Navigator */}
                    {!isPptPresenting && (
                        <button
                            onClick={() => setShowNavigator(!showNavigator)}
                            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                                showNavigator
                                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                                    : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-zinc-400'
                            }`}
                            title="Toggle Slide Reel"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
                            <span>Slide Reel</span>
                        </button>
                    )}

                    {/* Read Aloud Button */}
                    <button
                        onClick={handleReadSlideAloud}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${isReadingSlide ? 'bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse' : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-zinc-300'}`}
                        title="Have AI Presenter read this slide"
                    >
                        {isReadingSlide ? (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect width="14" height="14" x="5" y="5" rx="2"/></svg>
                                <span>Stop Speech</span>
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
                                <span>Present Slide</span>
                            </>
                        )}
                    </button>

                    {/* Copy Markdown */}
                    <button
                        onClick={handleCopyMarkdown}
                        className="hidden md:flex px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white rounded-xl text-xs font-semibold transition-all items-center gap-1.5"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>
                        <span>{copied ? 'Copied' : 'Markdown'}</span>
                    </button>

                    {/* Print / PDF Export */}
                    <button
                        onClick={() => window.print()}
                        className="hidden sm:flex px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white rounded-xl text-xs font-semibold transition-all items-center gap-1.5"
                        title="Export slides as PDF"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
                        <span>PDF</span>
                    </button>

                    {/* Fullscreen / Presentation Mode */}
                    <button
                        onClick={() => setIsPptPresenting(!isPptPresenting)}
                        className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>
                        <span>{isPptPresenting ? 'Exit Fullscreen' : 'Fullscreen'}</span>
                    </button>

                    {/* Exit */}
                    <button
                        onClick={exitPptMode}
                        className="px-4 py-1.5 bg-zinc-900 hover:bg-rose-950 border border-zinc-700 hover:border-rose-700 text-zinc-300 hover:text-rose-200 rounded-xl text-xs font-bold transition-all"
                    >
                        Exit
                    </button>
                </div>
            </header>

            {/* Main Stage */}
            <div className="flex-1 flex overflow-hidden relative">
                
                {/* ─── LEFT: LIVE AI SLIDE CO-PILOT & QUICK EDITOR ─── */}
                {!isPptPresenting && showLiveEditor && (
                    <PptLiveChat
                        currentSlide={currentSlide}
                        currentSlideIndex={currentSlideIndex}
                        totalSlides={slides.length}
                    />
                )}

                {/* ─── OPTIONAL: SLIDE NAVIGATOR REEL ─── */}
                {!isPptPresenting && showNavigator && (
                    <aside className="w-56 border-r border-zinc-800/80 bg-zinc-950/70 p-3 overflow-y-auto space-y-2 flex-shrink-0 scrollbar-thin scrollbar-thumb-zinc-800">
                        <div className="px-1 py-1 flex items-center justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                            <span>Slide Navigator</span>
                            <span>{slides.length} Slides</span>
                        </div>

                        {slides.map((s, idx) => (
                            <button
                                key={idx}
                                onClick={() => {
                                    stopSpeaking();
                                    setIsReadingSlide(false);
                                    setCurrentSlideIndex(idx);
                                }}
                                className={`w-full p-2.5 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                                    currentSlideIndex === idx
                                        ? 'border-emerald-400 bg-emerald-950/30 ring-1 ring-emerald-500/40 shadow-lg'
                                        : 'border-zinc-800/80 bg-zinc-900/40 hover:border-zinc-700'
                                }`}
                            >
                                <div className="flex items-center justify-between text-[10px]">
                                    <span className="font-mono font-bold text-zinc-400">#{s.slideNumber}</span>
                                    {s.diagram && (
                                        <span className="text-[8px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                                            Diagram
                                        </span>
                                    )}
                                </div>
                                <p className="text-[11px] font-bold text-zinc-200 line-clamp-1">{s.title}</p>
                            </button>
                        ))}
                    </aside>
                )}

                {/* ─── CENTER: HIGH-DENSITY LIVE SLIDE CANVAS ─── */}
                <main className="flex-1 p-4 sm:p-6 flex flex-col items-center justify-between overflow-y-auto bg-gradient-to-b from-[#09090b] via-zinc-950 to-black min-w-0">
                    <div className="w-full max-w-5xl flex-1 flex flex-col justify-between rounded-3xl border border-zinc-800 bg-zinc-950/95 shadow-2xl p-6 sm:p-8 relative overflow-hidden my-auto min-h-[460px] max-h-[700px]">
                        
                        {/* Slide Top Metadata Bar */}
                        <div className="flex items-center justify-between border-b border-zinc-800 pb-3 flex-shrink-0">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-bold text-emerald-400 font-mono flex-shrink-0">
                                    Slide {currentSlide.slideNumber} of {slides.length}
                                </span>
                                <span className="text-xs font-medium text-zinc-400 truncate">{activePptDeck.topic}</span>
                            </div>
                            {currentSlide.technicalDetails && (
                                <span className="hidden md:inline-block text-[10px] font-mono text-emerald-400/80 bg-emerald-950/40 px-2.5 py-0.5 rounded-md border border-emerald-500/20">
                                    {currentSlide.technicalDetails}
                                </span>
                            )}
                        </div>

                        {/* Slide Content Body */}
                        <div className="flex-1 my-4 flex flex-col justify-center min-h-0 overflow-y-auto">
                            {currentSlide.diagram ? (
                                // ─── Split Layout: Technical Breakdown (Left) + Diagram (Right) ───
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full items-center">
                                    <div className="lg:col-span-5 space-y-3.5 flex flex-col justify-center">
                                        <div>
                                            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-tight">
                                                <SlideMarkdown content={currentSlide.title} />
                                            </h1>
                                            {currentSlide.subtitle && (
                                                <p className="text-xs sm:text-sm font-semibold text-emerald-400 mt-1 leading-snug">
                                                    <SlideMarkdown content={currentSlide.subtitle} />
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            {currentSlide.points?.map((pt, i) => (
                                                <div key={i} className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-start gap-2.5 text-xs text-zinc-200 leading-relaxed">
                                                    <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                                                        {i + 1}
                                                    </div>
                                                    <div className="flex-1">
                                                        <SlideMarkdown content={pt} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {currentSlide.callout && (
                                            <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-300 font-medium flex items-center gap-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                                                <SlideMarkdown content={currentSlide.callout} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Responsive Diagram Container */}
                                    <div className="lg:col-span-7 h-full flex items-center justify-center bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 overflow-auto max-h-[360px]">
                                        {diagramSvg ? (
                                            <div
                                                className="w-full flex items-center justify-center [&_svg]:max-h-[320px] [&_svg]:w-auto"
                                                dangerouslySetInnerHTML={{ __html: diagramSvg }}
                                            />
                                        ) : diagramError ? (
                                            <pre className="text-xs font-mono text-zinc-400">{currentSlide.diagram}</pre>
                                        ) : (
                                            <div className="flex items-center gap-2 text-xs text-zinc-500">
                                                <div className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                                                <span>Rendering Diagram...</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                // ─── Dense Technical Grid Layout (No Whitespace Waste) ───
                                <div className="space-y-4 flex flex-col justify-center">
                                    <div>
                                        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                                            <SlideMarkdown content={currentSlide.title} />
                                        </h1>
                                        {currentSlide.subtitle && (
                                            <p className="text-sm sm:text-base font-semibold text-emerald-400 mt-1">
                                                <SlideMarkdown content={currentSlide.subtitle} />
                                            </p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {currentSlide.points?.map((pt, i) => (
                                            <div key={i} className="p-3.5 rounded-2xl bg-zinc-900/70 border border-zinc-800 flex items-start gap-3">
                                                <span className="w-5 h-5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                                                    {i + 1}
                                                </span>
                                                <div className="text-xs sm:text-sm text-zinc-200 leading-relaxed font-normal flex-1">
                                                    <SlideMarkdown content={pt} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {currentSlide.callout && (
                                        <div className="p-3 rounded-2xl bg-emerald-950/25 border border-emerald-500/30 text-xs sm:text-sm text-emerald-300 font-medium flex items-center gap-2.5">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                                            <SlideMarkdown content={currentSlide.callout} />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Slide Footer / Speaker Script Drawer */}
                        <div className="border-t border-zinc-800 pt-2.5 flex items-center justify-between text-xs text-zinc-500 flex-shrink-0">
                            <div className="flex items-center gap-2 truncate max-w-xl">
                                <span className="font-bold text-zinc-400">Speaker Script:</span>
                                <span className="italic truncate">{currentSlide.speakerNotes || 'Concept presentation script active.'}</span>
                            </div>
                            <span className="font-mono text-[10px] hidden sm:inline">Use Arrow Keys / Space to Navigate</span>
                        </div>
                    </div>

                    {/* Bottom Slide Controller & Carousel Strip */}
                    <div className="mt-4 flex items-center gap-3">
                        <button
                            onClick={() => {
                                stopSpeaking();
                                setIsReadingSlide(false);
                                setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1));
                            }}
                            disabled={currentSlideIndex === 0}
                            className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-bold text-zinc-200 disabled:opacity-30 transition-all flex items-center gap-1.5"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                            <span>Previous</span>
                        </button>

                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl">
                            {slides.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => {
                                        stopSpeaking();
                                        setIsReadingSlide(false);
                                        setCurrentSlideIndex(i);
                                    }}
                                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                                        currentSlideIndex === i
                                            ? 'bg-emerald-400 w-6'
                                            : 'bg-zinc-700 hover:bg-zinc-500'
                                    }`}
                                    title={`Slide ${i + 1}`}
                                />
                            ))}
                        </div>

                        <button
                            onClick={() => {
                                stopSpeaking();
                                setIsReadingSlide(false);
                                setCurrentSlideIndex(Math.min(slides.length - 1, currentSlideIndex + 1));
                            }}
                            disabled={currentSlideIndex === slides.length - 1}
                            className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-bold text-zinc-200 disabled:opacity-30 transition-all flex items-center gap-1.5"
                        >
                            <span>Next</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                        </button>
                    </div>
                </main>
            </div>
        </div>
    );
}
