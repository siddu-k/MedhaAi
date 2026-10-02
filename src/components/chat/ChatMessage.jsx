import { useState, useEffect, useId, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import mermaid from 'mermaid';
import useAppStore from '../../stores/appStore';
import { renderMermaidFresh, cleanMermaidCode } from '../../services/mermaidCache';

// Helper to request in-depth theory for an exact diagram
function requestDiagramTheory(diagramCode, label = 'Diagram') {
    const { setPendingUserPrompt, activeConcept, activeBoardTitle } = useAppStore.getState();
    const topic = activeConcept || activeBoardTitle || label;
    const cleanSnippet = diagramCode ? diagramCode.trim().slice(0, 2500) : '';
    const prompt = `Please provide a thorough scientific theory and step-by-step technical breakdown for "${topic}" based on this exact diagram:

\`\`\`
${cleanSnippet}
\`\`\`

IMPORTANT INSTRUCTIONS:
- Explain in detail using clear technical prose, bullet points, and equations.
- Do NOT output or repeat any diagram code, SVG code, or Three.js code blocks in your reply. Provide ONLY the scientific theory:
1. Core Theory & Fundamental Governing Principles
2. Step-by-Step Breakdown of each component and its physical/systemic role
3. Dynamic Energy/Mass/Data Transfer mechanisms
4. Key Equations / Physical Laws and Real-World Applications`;

    setPendingUserPrompt({
        prompt,
        autoSend: true
    });
}

function MermaidBlock({ code }) {
    const { openDiagramOnBoard } = useAppStore();
    const id = useId().replace(/:/g, '');
    const [svg, setSvg] = useState('');
    const [error, setError] = useState(null);
    const clean = useMemo(() => cleanMermaidCode(code), [code]);

    useEffect(() => {
        let isMounted = true;
        async function renderMermaid() {
            if (!clean) return;

            const { svg: renderedSvg, error: renderErr } = await renderMermaidFresh(clean, `mermaid-chat-${id}`);
            if (isMounted) {
                if (renderedSvg) {
                    setSvg(renderedSvg);
                    setError(null);
                } else if (renderErr) {
                    setError(renderErr);
                }
            }
        }
        renderMermaid();
        return () => { isMounted = false; };
    }, [clean, id]);

    const handleSendToBoard = () => {
        openDiagramOnBoard(clean, 'Diagram from Chat');
    };

    if (error) {
        return (
            <pre className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-400 overflow-x-auto my-2">
                <code>{code}</code>
            </pre>
        );
    }

    return (
        <div className="my-2 rounded-xl overflow-hidden border border-emerald-500/20 bg-zinc-950/80 shadow-md group">
            <div className="px-2.5 py-1.5 bg-zinc-900/70 border-b border-zinc-800/80 flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
                <div className="flex items-center gap-1.5 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider whitespace-nowrap">Flowchart / Diagram</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-auto flex-wrap">
                    <button
                        onClick={() => requestDiagramTheory(clean, 'Flowchart / Diagram')}
                        className="text-[10px] font-semibold text-blue-300 hover:text-white px-2 py-0.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 rounded transition-all flex items-center gap-1 shadow-sm shrink-0 whitespace-nowrap"
                        title="Generate in-depth technical theory for this exact diagram"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                        <span>Theory</span>
                    </button>
                    <button
                        onClick={handleSendToBoard}
                        className="text-[10px] font-semibold text-zinc-300 hover:text-white px-2 py-0.5 bg-zinc-800/90 hover:bg-emerald-950 hover:border-emerald-700/50 border border-zinc-700 rounded transition-all flex items-center gap-1 shrink-0 whitespace-nowrap"
                        title="View on Blackboard"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M8 12h8" /><path d="M12 8v8" /></svg>
                        <span>Blackboard</span>
                    </button>
                </div>
            </div>
            <div
                className="p-2.5 flex items-center justify-center overflow-x-auto select-none [&>svg]:max-w-full [&>svg]:h-auto"
                dangerouslySetInnerHTML={{ __html: svg }}
            />
        </div>
    );
}

function SvgBlock({ code }) {
    const { openDiagramOnBoard } = useAppStore();
    const [isReplaying, setIsReplaying] = useState(false);
    const [displaySvg, setDisplaySvg] = useState(code);

    useEffect(() => {
        setDisplaySvg(code);
    }, [code]);

    const handleReplay = () => {
        if (isReplaying) return;
        setIsReplaying(true);

        const cleanSvg = code.trim();
        const startTagEnd = cleanSvg.indexOf('>');
        let currentLength = startTagEnd !== -1 ? startTagEnd + 1 : 20;
        const totalLength = cleanSvg.length;
        const totalDuration = 2200;
        const frameInterval = 30;
        const totalSteps = totalDuration / frameInterval;
        const chunkSize = Math.max(16, Math.ceil(totalLength / totalSteps));

        const timer = setInterval(() => {
            currentLength += chunkSize;
            if (currentLength >= totalLength) {
                setDisplaySvg(cleanSvg);
                setIsReplaying(false);
                clearInterval(timer);
            } else {
                // Ensure chunks only break at tag closures ('>') or whitespace to prevent truncated attribute values
                let chunk = cleanSvg.slice(0, currentLength);
                const lastCloseTag = chunk.lastIndexOf('>');
                if (lastCloseTag > 0) {
                    chunk = chunk.slice(0, lastCloseTag + 1);
                }
                if (chunk.includes('<svg') && !chunk.includes('</svg>')) {
                    chunk += '\n</svg>';
                }
                // Verify chunk is valid XML before setting to DOM
                try {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(chunk, 'image/svg+xml');
                    if (!doc.querySelector('parsererror')) {
                        setDisplaySvg(chunk);
                    }
                } catch (e) {
                    // Ignore transient chunk parse errors during replay
                }
            }
        }, frameInterval);
    };

    return (
        <div className="my-1.5 rounded-lg border border-emerald-500/20 bg-zinc-950/90 p-1.5 relative group shadow-lg">
            <div className="flex flex-wrap items-center justify-between border-b border-zinc-800/70 pb-1.5 mb-1.5 gap-x-3 gap-y-1.5">
                <div className="flex items-center gap-1.5 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                    <span className="text-[10px] font-bold text-emerald-300 whitespace-nowrap">2D Vector Schematic</span>
                    {isReplaying && (
                        <span className="text-[8.5px] font-mono px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 animate-pulse shrink-0">
                            Streaming...
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-auto flex-wrap">
                    <button
                        onClick={() => requestDiagramTheory(code, '2D Vector Schematic')}
                        className="px-2 py-0.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 hover:border-blue-400 text-blue-300 hover:text-white rounded text-[10px] font-semibold transition-all flex items-center gap-1 shadow-sm shrink-0 whitespace-nowrap"
                        title="Generate in-depth technical theory for this exact diagram"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                        <span>Theory</span>
                    </button>
                    <button
                        onClick={handleReplay}
                        disabled={isReplaying}
                        className={`px-2 py-0.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-emerald-500/50 text-zinc-300 hover:text-emerald-300 rounded text-[10px] font-semibold transition-all flex items-center gap-1 shadow-sm shrink-0 whitespace-nowrap ${isReplaying ? 'opacity-70 cursor-not-allowed' : ''}`}
                        title="Re-stream live SVG code construction"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isReplaying ? 'animate-spin text-emerald-400' : ''}>
                            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                            <path d="M3 3v5h5"/>
                            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
                            <path d="M16 21h5v-5"/>
                        </svg>
                        <span>{isReplaying ? 'Streaming...' : 'Replay'}</span>
                    </button>
                    <button
                        onClick={() => openDiagramOnBoard(code, '2D Vector Schematic')}
                        className="px-2 py-0.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-200 hover:text-white rounded text-[10px] font-semibold transition-all flex items-center gap-1 shrink-0 whitespace-nowrap"
                        title="Open on Blackboard"
                    >
                        <span>Blackboard</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                    </button>
                </div>
            </div>

            <div className="relative overflow-hidden bg-black/40 rounded p-1 flex items-center justify-center min-h-[100px]">
                <div
                    className="max-h-64 w-full overflow-auto flex items-center justify-center [&>svg]:w-full [&>svg]:h-auto transition-all"
                    dangerouslySetInnerHTML={{ __html: displaySvg }}
                />
            </div>

            <div className="mt-1 pt-0.5 border-t border-white/5 flex items-center justify-between text-[9px] text-zinc-500">
                <span className="flex items-center gap-1 text-zinc-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>2D Vector Schematic</span>
                </span>
                <span className="text-zinc-500 font-mono text-[8.5px]">SVG Vector</span>
            </div>
        </div>
    );
}

import { speak, stopSpeaking } from '../../services/voiceService';

function ensureMermaidFences(text) {
    if (!text) return '';
    if (text.includes('```mermaid')) return text;

    const regex = /(?:^|\n)((?:graph\s+(?:TD|TB|LR|RL|BT)|flowchart\s+(?:TD|TB|LR|RL|BT)|sequenceDiagram|classDiagram|stateDiagram(?:-v2)?|erDiagram|journey|gantt|pie|mindmap|timeline|quadrantChart|xychart)[\s\S]*?)(?=\n(?:[A-Z0-9#*-]|Teacher Breakdown|Step-by-Step|The Problem|Key Takeaways|Intuition|Big-O|Complexity|Explanation|Look at the|To understand|\n\n\n|$))/i;

    const match = text.match(regex);
    if (match) {
        const diagramCode = match[1].trim();
        return text.replace(match[1], `\n\`\`\`mermaid\n${diagramCode}\n\`\`\`\n`);
    }

    return text;
}

function renderUserMessageContent(content) {
    if (!content) return null;

    // Detect if this prompt is a Theory request containing an embedded diagram/3D code block
    const isTheoryRequest =
        content.includes('Please provide a thorough scientific theory') ||
        content.includes('based on this exact diagram') ||
        content.includes('based on this exact 3D spatial model');

    if (isTheoryRequest) {
        // Extract topic
        const topicMatch = content.match(/for ["']?([^"'\n:]+)["']? based on/i);
        const topic = topicMatch ? topicMatch[1].trim() : '';

        // Completely hide the embedded code block from chat display!
        const cleanedText = content
            .replace(/```[\s\S]*?```/g, '')
            .replace(/IMPORTANT INSTRUCTIONS:[\s\S]*?(?=(?:1\. Core Theory|Explain in detail|\n\n|$))/i, '')
            .replace(/\n\s*\n\s*\n/g, '\n\n')
            .trim();

        return (
            <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 border border-white/25 text-[#ffe9c9] font-semibold text-xs">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                    </svg>
                    <span>Theory Request {topic ? `• ${topic}` : ''}</span>
                    <span className="text-[10px] text-[#e8c9a8] font-normal ml-0.5">(Model code attached to AI)</span>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-[#fdf3e0] font-medium">
                    {cleanedText}
                </p>
            </div>
        );
    }

    // Also check if any other user message has an embedded code block (e.g. selection context with diagram/SVG)
    if (content.includes('```')) {
        const withoutCode = content.replace(/```[\s\S]*?```/g, '').replace(/\n\s*\n\s*\n/g, '\n\n').trim();
        if (withoutCode) {
            return (
                <div className="space-y-1.5">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap text-[#fdf3e0]">{withoutCode}</p>
                    <div className="inline-flex items-center gap-1 text-[11px] text-[#e8c9a8] bg-white/15 px-2 py-0.5 rounded-md font-mono">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                        <span>[ Attached code hidden from chat ]</span>
                    </div>
                </div>
            );
        }
    }

    return <p className="text-sm leading-relaxed whitespace-pre-wrap text-[#fdf3e0]">{content}</p>;
}

export default function ChatMessage({ message, isTyping }) {
    const isUser = message.role === 'user';
    const { isSpeaking, setIsSpeaking, openDiagramOnBoard } = useAppStore();
    const [isReadingThis, setIsReadingThis] = useState(false);
    const [copied, setCopied] = useState(false);
    const formattedContent = useMemo(() => isUser ? message.content : ensureMermaidFences(message.content), [message.content, isUser]);

    // Keep isReadingThis synced if speaking stops globally
    useEffect(() => {
        if (!isSpeaking && isReadingThis) {
            setIsReadingThis(false);
        }
    }, [isSpeaking, isReadingThis]);

    const handleReadAloud = () => {
        if (isReadingThis) {
            stopSpeaking();
            setIsReadingThis(false);
            setIsSpeaking(false);
        } else {
            // Strip code blocks and raw symbols before reading aloud
            const textToSpeak = (message.content || '')
                .replace(/```[\s\S]*?```/g, ' [Diagram omitted] ')
                .replace(/`([^`]+)`/g, '$1')
                .replace(/[*_#>-]/g, '')
                .trim();
            if (!textToSpeak) return;

            setIsReadingThis(true);
            speak(
                textToSpeak,
                () => {
                    setIsReadingThis(true);
                    setIsSpeaking(true);
                },
                () => {
                    setIsReadingThis(false);
                    setIsSpeaking(false);
                }
            );
        }
    };

    const handleCopy = () => {
        if (message.content) {
            navigator.clipboard.writeText(message.content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className={`flex gap-3 animate-fade-in group ${isUser ? 'justify-end' : 'justify-start'}`}>
            {/* Avatar */}
            {!isUser && (
                <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mt-1">
                    <div className="w-4 h-4 rounded-full border border-zinc-500 flex items-center justify-center">
                        <div className="w-2 h-2 bg-zinc-50 rounded-full" />
                    </div>
                </div>
            )}

            {/* Bubble */}
            <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-[13px] relative ${isUser
                    ? 'bg-[#4a0e0e] text-[#fdf3e0] ml-12 shadow-md'
                    : 'bg-white text-[#3a2a2a] mr-12 shadow-lg'
                    }`}
                style={isUser ? {} : { border: '1px solid #ead9bd' }}
            >
                {/* Image if attached */}
                {message.image_url && (
                    <img
                        src={message.image_url}
                        alt="Attached"
                        className="max-w-full max-h-48 rounded-lg mb-2 object-cover"
                    />
                )}

                {/* Content */}
                {message.content ? (
                    isUser ? (
                        renderUserMessageContent(message.content)
                    ) : (
                        <div>
                            <div className="chat-markdown text-sm leading-relaxed">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm, remarkMath]}
                                    rehypePlugins={[rehypeKatex]}
                                    components={{
                                        code({ node, inline, className, children, ...props }) {
                                            const match = /language-(\w+)/.exec(className || '');
                                            const language = match ? match[1] : '';
                                            const codeContent = String(children).replace(/\n$/, '');

                                            if (!inline && language === 'mermaid') {
                                                return <MermaidBlock code={codeContent} />;
                                            }

                                            const isSvgCode = !inline && (language === 'svg' || (codeContent.trim().startsWith('<svg') && codeContent.trim().includes('</svg>')));
                                            if (isSvgCode) {
                                                return <SvgBlock code={codeContent} />;
                                            }

                                            // Removed: PPT deck / Quiz / 3D viewer blocks (KaushalSaathi redesign)
                                            return !inline ? (
                                                <code className={`block p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-300 overflow-x-auto my-2 whitespace-pre ${className || ''}`} {...props}>
                                                    {children}
                                                </code>
                                            ) : (
                                                <code className="px-1.5 py-0.5 bg-zinc-800 text-zinc-200 rounded text-xs font-mono" {...props}>
                                                    {children}
                                                </code>
                                            );
                                        },
                                        pre({ children }) {
                                            return <div className="my-2">{children}</div>;
                                        },
                                        p({ children }) {
                                            return <div className="mb-2 leading-relaxed last:mb-0">{children}</div>;
                                        }
                                    }}
                                >
                                    {formattedContent}
                                </ReactMarkdown>
                            </div>

                            {/* Message Bottom Action Row (Read Aloud & Copy) */}
                            <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-zinc-500">
                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={handleReadAloud}
                                        className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all ${isReadingThis
                                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                            : 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                                            }`}
                                        title={isReadingThis ? 'Stop Reading Aloud' : 'Read Text Aloud'}
                                    >
                                        {isReadingThis ? (
                                            <>
                                                <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                                                <span className="font-semibold text-rose-300">Speaking...</span>
                                            </>
                                        ) : (
                                            <>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /></svg>
                                                <span>Read Aloud</span>
                                            </>
                                        )}
                                    </button>

                                    <button
                                        onClick={handleCopy}
                                        className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
                                        title="Copy Message Text"
                                    >
                                        {copied ? (
                                            <>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400"><polyline points="20 6 9 17 4 12" /></svg>
                                                <span className="text-emerald-400 font-medium">Copied</span>
                                            </>
                                        ) : (
                                            <>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /></svg>
                                                <span>Copy</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                ) : isTyping ? (
                    <div className="flex items-center gap-1 py-1">
                        <span className="typing-dot" />
                        <span className="typing-dot" />
                        <span className="typing-dot" />
                    </div>
                ) : null}
            </div>
        </div>
    );
}
