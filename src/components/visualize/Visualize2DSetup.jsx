import { useState } from 'react';
import useAppStore from '../../stores/appStore';

export default function Visualize2DSetup({ onClose }) {
    const [concept, setConcept] = useState('');
    const { startVisualizeMode, setVisualDimension } = useAppStore();

    const presets = [
        {
            title: "Binary Search Tree (BST)",
            category: "Data Structures",
            prompt: "Draw a Binary Search Tree with nodes 50, 30, 70, 20, 40, 60, 80 and show search path for 60"
        },
        {
            title: "Dijkstra's Shortest Path",
            category: "Graph Theory",
            prompt: "Draw a weighted graph and step-by-step trace Dijkstra's algorithm from vertex A to D"
        },
        {
            title: "5V Regulated Power Circuit",
            category: "Electronics",
            prompt: "Draw a 5V regulated DC circuit diagram with transformer, rectifier diode, capacitor filter, 7805 regulator, and LED"
        },
        {
            title: "Full Adder Logic Circuit",
            category: "Digital Logic",
            prompt: "Draw a 1-bit Full Adder circuit using XOR, AND, and OR logic gates with inputs A, B, Cin and outputs Sum, Cout"
        },
        {
            title: "Sliding Window Maximum",
            category: "Algorithms",
            prompt: "Visualize the Sliding Window technique on array [1, 3, -1, -3, 5, 3, 6, 7] with window size k=3"
        },
        {
            title: "OAuth 2.0 PKCE Flow",
            category: "Security",
            prompt: "Explain the OAuth 2.0 Authorization Code Flow with PKCE using a sequence diagram"
        }
    ];

    const handleStart = (selectedPrompt) => {
        const text = selectedPrompt || concept;
        if (!text.trim()) return;
        setVisualDimension('2d');
        startVisualizeMode(text.trim(), '2d');
        onClose?.();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md select-none">
            <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="p-6 border-b border-zinc-800 bg-gradient-to-r from-emerald-500/15 via-zinc-900 to-transparent">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <span className="p-1 px-2.5 text-[10px] font-bold bg-emerald-500 text-black rounded-full uppercase tracking-wider">
                                2D Vector
                            </span>
                            <h2 className="text-xl font-bold text-zinc-50">
                                2D Vector & Schematic Visualizer
                            </h2>
                        </div>
                        <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                        </button>
                    </div>
                    <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                        Generate dynamic Mermaid diagrams, authentic electronic circuit schematics, algorithm tree/graph topologies, and step-by-step traces.
                    </p>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                    {/* Custom Input */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
                            What 2D schematic or algorithm do you want to learn?
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={concept}
                                onChange={(e) => setConcept(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleStart()}
                                placeholder="e.g., Red-Black Tree insertion or H-Bridge Motor Driver circuit"
                                className="flex-1 px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-all"
                                autoFocus
                            />
                            <button
                                onClick={() => handleStart()}
                                disabled={!concept.trim()}
                                className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl text-sm transition-all disabled:opacity-30 disabled:hover:bg-emerald-500 flex-shrink-0 shadow-lg shadow-emerald-500/20"
                            >
                                Start Class
                            </button>
                        </div>
                    </div>

                    {/* Presets */}
                    <div className="space-y-3">
                        <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Recommended 2D Schematics & Algorithmic Topologies</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {presets.map((preset, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleStart(preset.prompt)}
                                    className="p-3.5 bg-zinc-950/60 hover:bg-zinc-800/80 border border-zinc-800 hover:border-emerald-500/40 rounded-xl text-left transition-all group flex flex-col justify-between"
                                >
                                    <div className="flex items-center justify-between w-full mb-1">
                                        <span className="text-xs font-bold text-zinc-200 group-hover:text-emerald-300 transition-colors">
                                            {preset.title}
                                        </span>
                                        <span className="text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded-full text-zinc-400">
                                            {preset.category}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-zinc-500 line-clamp-2 mt-1">
                                        {preset.prompt}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
