import { useState, useRef, useEffect } from 'react';
import useAppStore from '../../stores/appStore';
import { streamChat } from '../../services/aiService';

export default function PptLiveChat({ currentSlide, currentSlideIndex, totalSlides }) {
    const {
        updateCurrentSlide, addSlideAfterCurrent, deleteCurrentSlide,
        selectedModel, messages, addMessage, updateLastMessage, currentSession
    } = useAppStore();

    const [input, setInput] = useState('');
    const [isModifying, setIsModifying] = useState(false);
    const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'edit'
    const messagesEndRef = useRef(null);
    const abortControllerRef = useRef(null);

    // Auto-scroll messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isModifying]);

    // Fast Quick Actions
    const quickActions = [
        {
            label: '📊 Add Diagram',
            prompt: 'Generate and add a relevant, clean Mermaid diagram (graph LR or sequenceDiagram) explaining this slide topic.',
        },
        {
            label: '⚡ Deepen Technical Details',
            prompt: 'Refine the bullet points with precise technical metrics, time/space complexities, or architecture constraints.',
        },
        {
            label: '🎯 Make Punchier',
            prompt: 'Condense the bullet points into concise, impactful architectural takeaways.',
        },
        {
            label: '🎙️ Pro Speaker Script',
            prompt: 'Write an engaging, authoritative 4-sentence speaker script in the speakerNotes field for presenting this slide.',
        }
    ];

    const handleSendPrompt = async (promptText) => {
        const userQuery = promptText || input.trim();
        if (!userQuery || isModifying) return;

        setInput('');
        const userMsg = {
            id: crypto.randomUUID(),
            role: 'user',
            content: userQuery,
            created_at: new Date().toISOString()
        };
        addMessage(userMsg);

        const assistantMsgId = crypto.randomUUID();
        addMessage({
            id: assistantMsgId,
            role: 'assistant',
            content: 'Analyzing and updating slide...',
            created_at: new Date().toISOString()
        });

        setIsModifying(true);

        const systemPrompt = `You are Tyloop AI Slide Architect & Co-Pilot.
You are modifying Slide #${currentSlideIndex + 1} of the presentation.

CURRENT SLIDE DATA:
\`\`\`json
${JSON.stringify(currentSlide, null, 2)}
\`\`\`

USER REQUEST: "${userQuery}"

DIRECTIONS:
1. When asked to modify, enhance, add a diagram, or rewrite parts of this slide:
   - Output an updated JSON object enclosed strictly in a \`\`\`json ... \`\`\` block containing the modified slide fields:
     {
       "title": "...",
       "subtitle": "...",
       "points": ["point 1", "point 2", "point 3"],
       "technicalDetails": "...",
       "diagram": "graph LR\\n  A --> B",
       "callout": "...",
       "speakerNotes": "..."
     }
2. Ensure Mermaid diagrams are valid syntax ('graph TD', 'graph LR', 'sequenceDiagram', 'stateDiagram-v2').
3. Include a concise, helpful 1-2 sentence explanation of the slide modifications after the JSON block.`;

        let assistantReply = '';
        abortControllerRef.current = new AbortController();

        try {
            await streamChat(
                [
                    { role: 'system', content: systemPrompt },
                    ...messages.map(m => ({ role: m.role, content: m.content })),
                    { role: 'user', content: userQuery }
                ],
                (token) => {
                    assistantReply = token;
                    updateLastMessage(token);

                    // Live JSON extraction as tokens arrive
                    const jsonMatch = token.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/i);
                    if (jsonMatch) {
                        try {
                            const parsed = JSON.parse(jsonMatch[1]);
                            if (parsed.title || parsed.points || parsed.diagram) {
                                updateCurrentSlide(parsed);
                            }
                        } catch (e) {
                            // Incomplete JSON stream, wait for completion
                        }
                    }
                },
                abortControllerRef.current.signal,
                selectedModel
            );

            // Final parse pass
            const finalJsonMatch = assistantReply.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/i);
            if (finalJsonMatch) {
                try {
                    const parsed = JSON.parse(finalJsonMatch[1]);
                    if (parsed.title || parsed.points || parsed.diagram) {
                        updateCurrentSlide(parsed);
                    }
                } catch (e) {
                    console.error('Failed to parse final slide JSON:', e);
                }
            }
        } catch (err) {
            updateLastMessage(`⚠️ Error modifying slide: ${err.message}`);
        } finally {
            setIsModifying(false);
        }
    };

    return (
        <div className="w-80 sm:w-96 h-full flex flex-col border-r border-zinc-800 bg-zinc-950/95 flex-shrink-0 z-10 select-text">
            {/* Header */}
            <div className="p-3.5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
                <div className="flex items-center gap-2 overflow-hidden">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                    <span className="text-xs font-bold text-white tracking-wide truncate">
                        Slide Co-Pilot (#{currentSlideIndex + 1})
                    </span>
                </div>
                <div className="flex items-center bg-black/40 border border-zinc-800 rounded-lg p-0.5 flex-shrink-0">
                    <button
                        onClick={() => setActiveTab('chat')}
                        className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${
                            activeTab === 'chat' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                    >
                        AI Chat
                    </button>
                    <button
                        onClick={() => setActiveTab('edit')}
                        className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${
                            activeTab === 'edit' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                    >
                        Manual
                    </button>
                </div>
            </div>

            {activeTab === 'chat' ? (
                <>
                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto p-3.5 space-y-3 text-xs scrollbar-thin scrollbar-thumb-zinc-800">
                        {messages.length === 0 ? (
                            <div className="p-3.5 rounded-2xl bg-zinc-900/70 border border-zinc-800 text-zinc-300 space-y-2">
                                <div className="text-[11px] font-bold text-emerald-400">✨ Slide Co-Pilot Ready</div>
                                <p className="text-[11px] text-zinc-400 leading-relaxed">
                                    I can modify <strong>Slide #{currentSlideIndex + 1} ("{currentSlide?.title || 'Current Slide'}")</strong> in real-time. Try asking me to add a diagram, deepen technical details, or rewrite bullet points!
                                </p>
                            </div>
                        ) : (
                            messages.map((m, idx) => (
                                <div
                                    key={m.id || idx}
                                    className={`p-3 rounded-2xl ${
                                        m.role === 'user'
                                            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-100 ml-4'
                                            : 'bg-zinc-900/80 border border-zinc-800/80 text-zinc-300 mr-4'
                                    }`}
                                >
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1 flex items-center justify-between">
                                        <span>{m.role === 'user' ? 'You' : 'Tyloop Co-Pilot'}</span>
                                        {m.created_at && (
                                            <span className="text-[9px] font-normal text-zinc-600">
                                                {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        )}
                                    </div>
                                    <div className="whitespace-pre-wrap leading-relaxed">
                                        {/* Clean out raw JSON block from UI message for clean presentation */}
                                        {m.content.replace(/```json[\s\S]*?```/g, '✨ *Slide updated with new content and diagram.*')}
                                    </div>
                                </div>
                            ))
                        )}
                        {isModifying && (
                            <div className="flex items-center gap-2 p-2.5 bg-zinc-900/60 border border-zinc-800 rounded-xl text-[11px] text-zinc-400 animate-pulse">
                                <div className="w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                                <span>Applying live slide modifications...</span>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Action Chips */}
                    <div className="p-2.5 border-t border-zinc-800/80 bg-zinc-900/30">
                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5 px-1">
                            1-Click Quick Edits
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                            {quickActions.map((qa, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSendPrompt(qa.prompt)}
                                    disabled={isModifying}
                                    className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white rounded-lg text-[11px] text-left truncate transition-all disabled:opacity-50"
                                >
                                    {qa.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Chat Input */}
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSendPrompt(input);
                        }}
                        className="p-3 border-t border-zinc-800 bg-zinc-950 flex items-center gap-2"
                    >
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={`Modify Slide #${currentSlideIndex + 1}...`}
                            disabled={isModifying}
                            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-all disabled:opacity-50"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isModifying}
                            className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl text-xs transition-all disabled:opacity-30 flex-shrink-0"
                        >
                            Apply
                        </button>
                    </form>
                </>
            ) : (
                /* Manual Quick Edit Tab */
                <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs scrollbar-thin scrollbar-thumb-zinc-800">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Slide Title</label>
                        <input
                            type="text"
                            value={currentSlide?.title || ''}
                            onChange={(e) => updateCurrentSlide({ title: e.target.value })}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Subtitle</label>
                        <input
                            type="text"
                            value={currentSlide?.subtitle || ''}
                            onChange={(e) => updateCurrentSlide({ subtitle: e.target.value })}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Bullet Points</label>
                        {currentSlide?.points?.map((pt, i) => (
                            <div key={i} className="flex gap-1.5 items-center">
                                <span className="text-zinc-500 font-mono text-[10px]">{i + 1}.</span>
                                <input
                                    type="text"
                                    value={pt}
                                    onChange={(e) => {
                                        const newPoints = [...(currentSlide.points || [])];
                                        newPoints[i] = e.target.value;
                                        updateCurrentSlide({ points: newPoints });
                                    }}
                                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                                />
                            </div>
                        ))}
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Mermaid Diagram Code</label>
                        <textarea
                            value={currentSlide?.diagram || ''}
                            onChange={(e) => updateCurrentSlide({ diagram: e.target.value })}
                            rows={5}
                            placeholder="graph LR&#10;  A --> B"
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 font-mono text-[11px] text-emerald-300 focus:outline-none focus:border-emerald-500"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Callout & Takeaway</label>
                        <input
                            type="text"
                            value={currentSlide?.callout || ''}
                            onChange={(e) => updateCurrentSlide({ callout: e.target.value })}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Speaker Script Notes</label>
                        <textarea
                            value={currentSlide?.speakerNotes || ''}
                            onChange={(e) => updateCurrentSlide({ speakerNotes: e.target.value })}
                            rows={3}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500"
                        />
                    </div>

                    <div className="pt-2 flex gap-2 border-t border-zinc-800">
                        <button
                            onClick={() => addSlideAfterCurrent()}
                            className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold"
                        >
                            ➕ Add Slide After
                        </button>
                        {totalSlides > 1 && (
                            <button
                                onClick={() => deleteCurrentSlide()}
                                className="px-3 py-2 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 rounded-lg text-xs font-semibold"
                            >
                                Delete
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
