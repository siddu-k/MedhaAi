import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import useAppStore from '../../stores/appStore';
import { speak, stopSpeaking } from '../../services/voiceService';
import { renderMermaidFresh, cleanMermaidCode } from '../../services/mermaidCache';

function QuizMermaidBlock({ code }) {
    const [svg, setSvg] = useState('');
    const clean = cleanMermaidCode(code);

    useEffect(() => {
        let isMounted = true;
        async function render() {
            if (!clean) return;
            const { svg: renderedSvg } = await renderMermaidFresh(clean, 'quiz-mermaid-' + Math.random().toString(36).substring(7));
            if (isMounted && renderedSvg) {
                setSvg(renderedSvg);
            }
        }
        render();
        return () => { isMounted = false; };
    }, [clean]);

    if (!svg) {
        return (
            <div className="p-3 my-2 bg-zinc-950/80 border border-zinc-800 rounded-xl text-xs font-mono text-amber-300/80 flex items-center gap-2">
                <div className="w-3 h-3 border border-amber-400 border-t-transparent rounded-full animate-spin" />
                <span>Rendering diagram...</span>
            </div>
        );
    }

    return (
        <div className="my-3 rounded-2xl overflow-hidden border border-amber-500/20 bg-zinc-950/90 shadow-lg p-3 flex justify-center [&>svg]:max-w-full [&>svg]:h-auto">
            <div dangerouslySetInnerHTML={{ __html: svg }} />
        </div>
    );
}

function QuizMarkdown({ content, className = '' }) {
    if (!content) return null;
    return (
        <span className={`quiz-markdown inline-block max-w-full ${className}`}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                    p: ({ children }) => <span className="leading-relaxed">{children}</span>,
                    code: ({ inline, className, children, ...props }) => {
                        const match = /language-(\w+)/.exec(className || '');
                        const language = match ? match[1] : '';
                        const codeContent = String(children).replace(/\n$/, '');

                        if (!inline && language === 'mermaid') {
                            return <QuizMermaidBlock code={codeContent} />;
                        }

                        return !inline ? (
                            <code className="block p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-300 overflow-x-auto my-1.5 whitespace-pre">
                                {children}
                            </code>
                        ) : (
                            <code className="px-1.5 py-0.5 bg-zinc-800/90 text-amber-300 font-mono text-[11px] rounded border border-zinc-700/60" {...props}>
                                {children}
                            </code>
                        );
                    }
                }}
            >
                {content}
            </ReactMarkdown>
        </span>
    );
}

export default function QuizViewer() {
    const {
        activeQuiz,
        exitQuizMode,
        quizUserAnswers,
        selectQuizAnswer,
        quizSubmitted,
        submitQuiz,
        resetQuiz
    } = useAppStore();

    const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
    const [isSpeakingQuestion, setIsSpeakingQuestion] = useState(false);

    if (!activeQuiz || !activeQuiz.questions || activeQuiz.questions.length === 0) {
        return (
            <div className="h-full w-full flex flex-col items-center justify-center p-6 bg-zinc-950 text-zinc-400">
                <p>No active quiz loaded.</p>
                <button
                    onClick={exitQuizMode}
                    className="mt-4 px-4 py-2 bg-zinc-900 border border-zinc-700 text-white rounded-xl text-xs font-bold"
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }

    const questions = activeQuiz.questions;
    const currentQ = questions[activeQuestionIdx] || questions[0];
    const totalQ = questions.length;
    const answeredCount = Object.keys(quizUserAnswers).length;

    // Calculate score
    const score = questions.reduce((acc, q, idx) => {
        return acc + (quizUserAnswers[idx] === q.correctAnswerIndex ? 1 : 0);
    }, 0);
    const percentage = Math.round((score / totalQ) * 100);

    const handleSpeakCurrent = () => {
        if (isSpeakingQuestion) {
            stopSpeaking();
            setIsSpeakingQuestion(false);
        } else {
            const optionsText = currentQ.options.map((opt, i) => `Option ${String.fromCharCode(65 + i)}: ${opt}`).join('. ');
            const fullText = `Question ${activeQuestionIdx + 1}: ${currentQ.question}. ${optionsText}`;
            speak(
                fullText,
                () => setIsSpeakingQuestion(true),
                () => setIsSpeakingQuestion(false)
            );
        }
    };

    return (
        <div className="h-full w-full flex flex-col bg-[#09090b] text-zinc-100 overflow-hidden select-none">
            
            {/* Quiz Top Navigation Bar */}
            <header className="px-6 py-3.5 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                                {activeQuiz.difficulty || 'Standard'} Assessment
                            </span>
                            <h2 className="text-sm font-bold text-white tracking-tight truncate max-w-md">
                                {activeQuiz.title || activeQuiz.topic || 'Assessment Quiz'}
                            </h2>
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                            {answeredCount} of {totalQ} questions answered
                        </p>
                    </div>
                </div>

                {/* Top Action Controls */}
                <div className="flex items-center gap-2.5">
                    <button
                        onClick={handleSpeakCurrent}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${isSpeakingQuestion ? 'bg-amber-500/20 border-amber-500 text-amber-300 animate-pulse' : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-zinc-300'}`}
                        title="Have AI Assistant read this question aloud"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
                        <span>{isSpeakingQuestion ? 'Stop Audio' : 'Read Aloud'}</span>
                    </button>

                    {quizSubmitted ? (
                        <button
                            onClick={resetQuiz}
                            className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                            <span>Retake Quiz</span>
                        </button>
                    ) : (
                        <button
                            onClick={submitQuiz}
                            disabled={answeredCount === 0}
                            className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold rounded-xl text-xs transition-all shadow-md shadow-amber-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Submit & Score
                        </button>
                    )}

                    <button
                        onClick={exitQuizMode}
                        className="px-3.5 py-1.5 bg-zinc-900 hover:bg-rose-950 border border-zinc-700 hover:border-rose-700 text-zinc-300 hover:text-rose-200 rounded-xl text-xs font-bold transition-all"
                    >
                        Exit
                    </button>
                </div>
            </header>

            {/* Quiz Content Stage */}
            <div className="flex-1 flex overflow-hidden">
                
                {/* ─── LEFT: Question Jump Navigator ─── */}
                <aside className="w-64 border-r border-zinc-800 bg-zinc-950/60 p-4 flex flex-col flex-shrink-0 overflow-y-auto">
                    <div className="flex items-center justify-between text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-3">
                        <span>Question Matrix</span>
                        <span>{totalQ} Items</span>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                        {questions.map((q, idx) => {
                            const isAnswered = quizUserAnswers[idx] !== undefined;
                            const isCurrent = activeQuestionIdx === idx;
                            const isCorrect = quizSubmitted && quizUserAnswers[idx] === q.correctAnswerIndex;
                            const isWrong = quizSubmitted && isAnswered && !isCorrect;

                            return (
                                <button
                                    key={idx}
                                    onClick={() => setActiveQuestionIdx(idx)}
                                    className={`h-10 rounded-xl font-bold text-xs transition-all flex items-center justify-center relative ${isCurrent
                                        ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-zinc-950'
                                        : ''
                                        } ${quizSubmitted
                                            ? isCorrect
                                                ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-300'
                                                : isWrong
                                                    ? 'bg-rose-500/20 border border-rose-500 text-rose-300'
                                                    : 'bg-zinc-900 border border-zinc-800 text-zinc-500'
                                            : isAnswered
                                                ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300'
                                                : 'bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400'
                                        }`}
                                >
                                    <span>{idx + 1}</span>
                                    {isAnswered && !quizSubmitted && (
                                        <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-400" />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Score Card if Submitted */}
                    {quizSubmitted && (
                        <div className="mt-auto pt-4 border-t border-zinc-800">
                            <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-center">
                                <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Overall Score</p>
                                <div className="text-3xl font-extrabold text-white mt-1">
                                    {percentage}%
                                </div>
                                <p className="text-xs text-zinc-400 mt-1">
                                    {score} of {totalQ} Correct
                                </p>
                                <div className="w-full bg-zinc-800 rounded-full h-2 mt-3 overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-500 ${percentage >= 80 ? 'bg-emerald-500' : percentage >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </aside>

                {/* ─── CENTER: Active Question Stage ─── */}
                <main className="flex-1 overflow-y-auto p-8 flex flex-col justify-between max-w-4xl mx-auto w-full">
                    <div className="space-y-6">
                        {/* Progress Bar & Header */}
                        <div>
                            <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
                                <span className="font-bold text-amber-400 uppercase tracking-wider">
                                    Question {activeQuestionIdx + 1} of {totalQ}
                                </span>
                                <span className="font-mono text-[11px] text-zinc-500">
                                    {currentQ.difficulty ? `${currentQ.difficulty.toUpperCase()} LEVEL` : 'TECHNICAL'}
                                </span>
                            </div>
                            <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                                <div
                                    className="bg-amber-500 h-full transition-all duration-300"
                                    style={{ width: `${((activeQuestionIdx + 1) / totalQ) * 100}%` }}
                                />
                            </div>
                        </div>

                        {/* Question Prompt */}
                        <div className="p-6 rounded-3xl bg-zinc-900/80 border border-zinc-800 shadow-xl">
                            <h3 className="text-lg sm:text-xl font-bold text-white leading-relaxed">
                                <QuizMarkdown content={currentQ.question} />
                            </h3>
                        </div>

                        {/* Options List */}
                        <div className="space-y-3">
                            {currentQ.options.map((option, optIdx) => {
                                const isSelected = quizUserAnswers[activeQuestionIdx] === optIdx;
                                const isCorrect = optIdx === currentQ.correctAnswerIndex;
                                const showEvaluation = quizSubmitted;

                                let borderBgStyle = 'bg-zinc-900/60 hover:bg-zinc-800/80 border-zinc-800 text-zinc-200';
                                if (showEvaluation) {
                                    if (isCorrect) {
                                        borderBgStyle = 'bg-emerald-950/40 border-emerald-500 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.15)]';
                                    } else if (isSelected && !isCorrect) {
                                        borderBgStyle = 'bg-rose-950/40 border-rose-500 text-rose-200 shadow-[0_0_20px_rgba(244,63,94,0.15)]';
                                    } else {
                                        borderBgStyle = 'bg-zinc-900/30 border-zinc-800/50 text-zinc-500';
                                    }
                                } else if (isSelected) {
                                    borderBgStyle = 'bg-amber-500/15 border-amber-500 text-amber-100 shadow-[0_0_20px_rgba(245,158,11,0.15)]';
                                }

                                return (
                                    <button
                                        key={optIdx}
                                        type="button"
                                        disabled={quizSubmitted}
                                        onClick={() => selectQuizAnswer(activeQuestionIdx, optIdx)}
                                        className={`w-full p-4 rounded-2xl border transition-all text-left flex items-start gap-4 ${borderBgStyle}`}
                                    >
                                        <div className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${showEvaluation
                                            ? isCorrect
                                                ? 'bg-emerald-500 text-black'
                                                : isSelected && !isCorrect
                                                    ? 'bg-rose-500 text-white'
                                                    : 'bg-zinc-800 text-zinc-400'
                                            : isSelected
                                                ? 'bg-amber-500 text-black shadow-md'
                                                : 'bg-zinc-800 text-zinc-300'
                                            }`}>
                                            {String.fromCharCode(65 + optIdx)}
                                        </div>
                                        <div className="flex-1 text-xs sm:text-sm font-medium leading-relaxed pt-0.5">
                                            <QuizMarkdown content={option} />
                                        </div>
                                        {showEvaluation && isCorrect && (
                                            <span className="text-emerald-400 font-bold text-xs shrink-0 pt-0.5 flex items-center gap-1">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                                <span>Correct</span>
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Explanation Card if Submitted */}
                        {quizSubmitted && currentQ.explanation && (
                            <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 animate-in fade-in duration-300">
                                <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-1.5">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                                    <span>Technical Mechanics & Rationale</span>
                                </div>
                                <div className="text-xs text-zinc-300 leading-relaxed">
                                    <QuizMarkdown content={currentQ.explanation} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Bottom Navigation Buttons */}
                    <div className="pt-6 border-t border-zinc-800 flex items-center justify-between mt-6">
                        <button
                            type="button"
                            disabled={activeQuestionIdx === 0}
                            onClick={() => setActiveQuestionIdx(p => Math.max(0, p - 1))}
                            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                            <span>Previous</span>
                        </button>

                        <div className="text-xs font-mono text-zinc-500">
                            {activeQuestionIdx + 1} / {totalQ}
                        </div>

                        <button
                            type="button"
                            disabled={activeQuestionIdx === totalQ - 1}
                            onClick={() => setActiveQuestionIdx(p => Math.min(totalQ - 1, p + 1))}
                            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <span>Next Question</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                        </button>
                    </div>
                </main>
            </div>
        </div>
    );
}
