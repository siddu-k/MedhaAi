import { useState } from 'react';
import useAppStore from '../../stores/appStore';

export default function InterviewSetup({ onClose }) {
    const [description, setDescription] = useState('');
    const { startInterview } = useAppStore();

    const handleStart = () => {
        if (!description.trim()) return;
        startInterview(description);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-zinc-800 bg-gradient-to-r from-rose-500/10 to-transparent">
                    <h2 className="text-xl font-bold text-zinc-50 flex items-center gap-2">
                        <span className="p-1 px-2 text-[10px] bg-rose-500 text-white rounded uppercase tracking-tighter">AI Recruiter</span>
                        Start Mock Interview
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1">Tyloop AI will act as a professional interviewer for your target role.</p>
                </div>

                <div className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Job Role & Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Example: Software Engineer at Google. Requires React, Python, and system design expertise..."
                            className="w-full h-40 bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500/40 transition-all resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl">
                            <p className="text-[10px] font-bold text-zinc-500 uppercase">Atmosphere</p>
                            <p className="text-xs text-zinc-300 mt-0.5">Professional Office</p>
                        </div>
                        <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl">
                            <p className="text-[10px] font-bold text-zinc-500 uppercase">Difficulty</p>
                            <p className="text-xs text-zinc-300 mt-0.5">Adaptive</p>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-zinc-950/50 border-t border-zinc-800 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleStart}
                        disabled={!description.trim()}
                        className="px-6 py-2 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 disabled:hover:bg-rose-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-rose-500/20"
                    >
                        Start Interview
                    </button>
                </div>
            </div>
        </div>
    );
}
