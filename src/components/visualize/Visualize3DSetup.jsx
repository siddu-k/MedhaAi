import { useState } from 'react';
import useAppStore from '../../stores/appStore';

export default function Visualize3DSetup({ onClose }) {
    const [concept, setConcept] = useState('');
    const { startVisualizeMode, setVisualDimension } = useAppStore();

    const presets = [
        {
            title: "V4 Combustion Engine",
            category: "Mechanical CAD",
            prompt: "Create a 3D animated model of a V4 combustion engine with pistons reciprocating, crankshaft rotating, and spark timing"
        },
        {
            title: "Deep Neural Network (3D)",
            category: "Artificial Intelligence",
            prompt: "Create a 3D multi-layer neural network with input, hidden, and output node layers with pulsing animated synaptic weights"
        },
        {
            title: "Diamond Crystal Lattice",
            category: "Materials Science",
            prompt: "Create a 3D atomic structure of a Diamond carbon crystal lattice with tetrahedral covalent bonds"
        },
        {
            title: "Planetary Keplerian Orbit",
            category: "Astrophysics",
            prompt: "Create a 3D interactive model of the Solar System with the Sun and orbiting planets with kinematic orbital trails"
        },
        {
            title: "Lorenz Attractor 3D Surface",
            category: "Parametric Mathematics",
            prompt: "Create an interactive 3D chaotic Lorenz Attractor parametric curve in Three.js with glowing particle trajectories"
        },
        {
            title: "Robotic 6-DOF Arm",
            category: "Robotics & Kinematics",
            prompt: "Create a 3D multi-joint robotic arm with base, shoulder, elbow, wrist, and gripper with smooth kinematic articulation"
        }
    ];

    const handleStart = (selectedPrompt) => {
        const text = selectedPrompt || concept;
        if (!text.trim()) return;
        setVisualDimension('3d');
        startVisualizeMode(text.trim(), '3d');
        onClose?.();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md select-none">
            <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="p-6 border-b border-zinc-800 bg-gradient-to-r from-indigo-500/20 via-zinc-900 to-transparent">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <span className="p-1 px-2.5 text-[10px] font-bold bg-indigo-500 text-white rounded-full uppercase tracking-wider">
                                3D Spatial
                            </span>
                            <h2 className="text-xl font-bold text-zinc-50">
                                3D Spatial & CAD Studio
                            </h2>
                        </div>
                        <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                        </button>
                    </div>
                    <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                        Generate interactive Three.js 3D spatial models, mechanical CAD assemblies, volumetric neural networks, crystal lattices, and kinematic physics animations.
                    </p>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                    {/* Custom Input */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                            What 3D model or spatial mechanism do you want to explore?
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={concept}
                                onChange={(e) => setConcept(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleStart()}
                                placeholder="e.g., Jet Engine Turbine or DNA Double Helix structure"
                                className="flex-1 px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 transition-all"
                                autoFocus
                            />
                            <button
                                onClick={() => handleStart()}
                                disabled={!concept.trim()}
                                className="px-5 py-3 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl text-sm transition-all disabled:opacity-30 disabled:hover:bg-indigo-500 flex-shrink-0 shadow-lg shadow-indigo-500/25"
                            >
                                Launch 3D
                            </button>
                        </div>
                    </div>

                    {/* Presets */}
                    <div className="space-y-3">
                        <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Popular 3D Spatial & Engineering Models</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {presets.map((preset, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleStart(preset.prompt)}
                                    className="p-3.5 bg-zinc-950/60 hover:bg-zinc-800/80 border border-zinc-800 hover:border-indigo-500/40 rounded-xl text-left transition-all group flex flex-col justify-between"
                                >
                                    <div className="flex items-center justify-between w-full mb-1">
                                        <span className="text-xs font-bold text-zinc-200 group-hover:text-indigo-300 transition-colors">
                                            {preset.title}
                                        </span>
                                        <span className="text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded-full text-indigo-400">
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
