import { useState, useRef } from 'react';
import useAppStore from '../../stores/appStore';
import { generateQuiz, extractDocumentText } from '../../services/quizService';

const SUGGESTED_TOPICS = [
    { label: 'System Design & Distributed Architectures', icon: '🏛️' },
    { label: 'Data Structures & Algorithms (Trees, Graphs, DP)', icon: '🌲' },
    { label: 'Computer Networks (TCP/IP, HTTP/3, TLS 1.3)', icon: '🌐' },
    { label: 'Operating Systems & Concurrency (Locks, IPC, Paging)', icon: '⚙️' },
    { label: 'Database Internals (B-Trees, WAL, ACID, MVCC)', icon: '💾' },
    { label: 'Modern Machine Learning & Transformers', icon: '🧠' }
];

export default function QuizSetupModal({ onClose }) {
    const { startQuizMode, selectedModel } = useAppStore();
    const [topic, setTopic] = useState('');
    const [questionCount, setQuestionCount] = useState(5);
    const [difficulty, setDifficulty] = useState('medium');
    const [uploadedFile, setUploadedFile] = useState(null);
    const [extractedDocText, setExtractedDocText] = useState('');
    const [isParsingDoc, setIsParsingDoc] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [progressStatus, setProgressStatus] = useState('');
    const [error, setError] = useState(null);

    const fileInputRef = useRef(null);

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadedFile(file);
        setIsParsingDoc(true);
        setError(null);

        try {
            const text = await extractDocumentText(file);
            setExtractedDocText(text);
            if (!topic.trim()) {
                const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
                setTopic(`Assessment: ${cleanName}`);
            }
        } catch (err) {
            console.error('File parsing error:', err);
            setError('Could not extract text from the uploaded document. You can still enter a topic manually.');
        } finally {
            setIsParsingDoc(false);
        }
    };

    const handleClearFile = () => {
        setUploadedFile(null);
        setExtractedDocText('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleGenerate = async (e) => {
        e?.preventDefault();
        const subject = topic.trim() || (uploadedFile ? uploadedFile.name : '');
        if (!subject && !extractedDocText) {
            setError('Please enter a topic or upload a study document/PDF.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setProgressStatus(`Analyzing ${uploadedFile ? 'uploaded document' : 'topic'} and formulating ${questionCount} conceptual questions...`);

        try {
            const quiz = await generateQuiz({
                topic: subject,
                documentText: extractedDocText,
                questionCount,
                difficulty,
                model: selectedModel,
                onProgress: () => {
                    setProgressStatus(`Drafting multiple-choice options & in-depth mechanical explanations...`);
                }
            });

            startQuizMode(quiz);
            onClose();
        } catch (err) {
            console.error('Quiz Generation Error:', err);
            setError(err.message || 'Failed to generate quiz. Please try again.');
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
                        <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <path d="m9 12 2 2 4-4" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-white tracking-tight">AI Assessment & Quiz Generator</h2>
                            <p className="text-xs text-zinc-400">Generate rigorous interactive quizzes from topics, code, notes, or uploaded PDFs</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>

                {/* Body Form */}
                <form onSubmit={handleGenerate} className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-thin scrollbar-thumb-zinc-800">
                    
                    {error && (
                        <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-3 text-xs text-rose-300">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Document Upload Area */}
                    <div>
                        <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                            Upload Study Document or PDF <span className="text-zinc-500 font-normal">(Optional)</span>
                        </label>
                        
                        {!uploadedFile ? (
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-zinc-800 hover:border-amber-500/50 hover:bg-amber-500/5 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all group"
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".pdf,.txt,.md,.json,.csv,.js,.jsx,.ts,.tsx,.py,.java,.cpp,.html"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                />
                                <div className="w-10 h-10 rounded-xl bg-zinc-900 group-hover:bg-amber-500/20 text-zinc-400 group-hover:text-amber-400 flex items-center justify-center transition-colors mb-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                        <polyline points="17 8 12 3 7 8" />
                                        <line x1="12" y1="3" x2="12" y2="15" />
                                    </svg>
                                </div>
                                <p className="text-xs font-semibold text-zinc-300 group-hover:text-white">Click to upload PDF, Notes, or Code</p>
                                <p className="text-[11px] text-zinc-500 mt-0.5">Supports PDF, Markdown, Text, Code (.js, .py, .cpp), CSV</p>
                            </div>
                        ) : (
                            <div className="p-3 rounded-2xl bg-zinc-900 border border-amber-500/30 flex items-center justify-between">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-zinc-200 truncate">{uploadedFile.name}</p>
                                        <p className="text-[10px] text-zinc-500">
                                            {isParsingDoc ? 'Extracting text content...' : `${Math.round(uploadedFile.size / 1024)} KB • Extracted for Quiz Generation`}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleClearFile}
                                    className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 transition-colors"
                                    title="Remove File"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Topic Input */}
                    <div>
                        <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                            Quiz Subject or Focus Area
                        </label>
                        <input
                            type="text"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="e.g. Raft Consensus Algorithm, React Fiber Architecture, Linux Virtual Memory..."
                            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-2xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none transition-all shadow-inner"
                        />
                    </div>

                    {/* Quick Topics */}
                    <div>
                        <span className="text-[11px] font-semibold text-zinc-400 block mb-2">Quick Inspiration:</span>
                        <div className="flex flex-wrap gap-2">
                            {SUGGESTED_TOPICS.map((t, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setTopic(t.label)}
                                    className="px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-[11px] text-zinc-300 hover:text-white transition-all flex items-center gap-1.5"
                                >
                                    <span>{t.icon}</span>
                                    <span>{t.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Question Count & Difficulty Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                        <div>
                            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                                Question Count
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                                {[3, 5, 8, 10].map((num) => (
                                    <button
                                        key={num}
                                        type="button"
                                        onClick={() => setQuestionCount(num)}
                                        className={`py-2 rounded-xl text-xs font-bold border transition-all ${questionCount === num
                                            ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                                            }`}
                                    >
                                        {num} Qs
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                                Assessment Rigor
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { id: 'easy', label: 'Foundational' },
                                    { id: 'medium', label: 'Standard' },
                                    { id: 'hard', label: 'Architect' }
                                ].map((diff) => (
                                    <button
                                        key={diff.id}
                                        type="button"
                                        onClick={() => setDifficulty(diff.id)}
                                        className={`py-2 rounded-xl text-xs font-bold border transition-all ${difficulty === diff.id
                                            ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                                            }`}
                                    >
                                        {diff.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Loading Status */}
                    {isLoading && (
                        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3.5 animate-pulse">
                            <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin shrink-0" />
                            <div className="text-xs text-amber-300 font-medium">{progressStatus || 'Synthesizing evaluation matrix...'}</div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isLoading}
                            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl text-xs font-semibold transition-all border border-zinc-800"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || (!topic.trim() && !extractedDocText)}
                            className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold rounded-xl text-xs transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                    <span>Generating Assessment...</span>
                                </>
                            ) : (
                                <>
                                    <span>Launch Assessment Quiz</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
