import { useState } from 'react';
import useAppStore from '../../stores/appStore';
import { speak, stopSpeaking, isSpeaking } from '../../services/voiceService';

const HAIR_PRESETS = [
    { name: 'Jet Black', color: '#141414' },
    { name: 'Espresso', color: '#2b231d' },
    { name: 'Chestnut', color: '#4a3324' },
    { name: 'Platinum', color: '#e5e5e5' },
    { name: 'Auburn', color: '#8b3a2b' },
    { name: 'Cyber Cyan', color: '#06b6d4' },
    { name: 'Neon Purple', color: '#9333ea' },
];

const SKIN_PRESETS = [
    { name: 'Fair Ivory', color: '#f8d7c2' },
    { name: 'Warm Natural', color: '#e3ad82' },
    { name: 'Golden Sand', color: '#d19c71' },
    { name: 'Sun Tan', color: '#c68642' },
    { name: 'Caramel', color: '#8d5524' },
    { name: 'Deep Espresso', color: '#4a2c11' },
    { name: 'Cyber Silver', color: '#94a3b8' },
];

const EYE_PRESETS = [
    { name: 'Crystal White', color: '#ffffff' },
    { name: 'Emerald Hazel', color: '#2e7d32' },
    { name: 'Ocean Blue', color: '#1e40af' },
    { name: 'Amber Brown', color: '#634e34' },
    { name: 'Steel Gray', color: '#475569' },
    { name: 'Violet Glow', color: '#7e22ce' },
    { name: 'Neon Cyan', color: '#00f0ff' },
];

const OUTFIT_PRESETS = [
    { name: 'Charcoal Black', color: '#18181b' },
    { name: 'Studio White', color: '#f8fafc' },
    { name: 'Navy Executive', color: '#1e293b' },
    { name: 'Crimson Velvet', color: '#881337' },
    { name: 'Emerald Forest', color: '#064e3b' },
    { name: 'Royal Blue', color: '#1d4ed8' },
];

const LIGHTING_PRESETS = [
    { id: 'clinical', label: 'Crisp Cyan', desc: 'Crisp cool-white & teal rim lighting' },
    { id: 'cyberpunk', label: 'Cyberpunk Neon', desc: 'Electric cyan, magenta & purple' },
    { id: 'warm', label: 'Golden Warmth', desc: 'Cozy amber & soft studio fill' },
    { id: 'studio', label: 'Studio Pro', desc: 'High-contrast balanced portrait key' },
];

export default function AvatarCustomizerModal({ isOpen, onClose }) {
    const {
        avatarCustomization, setAvatarCustomization, resetAvatarCustomization,
        voiceSettings, setVoiceSettings, resetVoiceSettings,
        setIsSpeaking
    } = useAppStore();

    const [activeTab, setActiveTab] = useState('appearance'); // appearance | voice
    const [isPlayingPreview, setIsPlayingPreview] = useState(false);

    if (!isOpen) return null;

    const handleTestVoice = () => {
        if (isSpeaking() || isPlayingPreview) {
            stopSpeaking();
            setIsPlayingPreview(false);
            setIsSpeaking(false);
            return;
        }

        setIsPlayingPreview(true);
        speak(
            "Hello! I am Tyloop, your AI companion. My voice tone, pitch, and 3D appearance are calibrated to your preferences.",
            () => {
                setIsPlayingPreview(true);
                setIsSpeaking(true);
            },
            () => {
                setIsPlayingPreview(false);
                setIsSpeaking(false);
            }
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-white tracking-wide">3D Avatar & Voice Studio</h3>
                            <p className="text-[11px] text-zinc-400">Customize 3D character materials, lighting and acoustic tone</p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-all text-xs font-semibold"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                </div>

                {/* Tab Switcher */}
                <div className="px-6 pt-3 border-b border-zinc-800/80 bg-zinc-950 flex gap-2">
                    <button
                        onClick={() => setActiveTab('appearance')}
                        className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${activeTab === 'appearance' ? 'border-emerald-400 text-emerald-400' : 'border-transparent text-zinc-400 hover:text-zinc-200'}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>
                        <span>3D Appearance & Lighting</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('voice')}
                        className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${activeTab === 'voice' ? 'border-emerald-400 text-emerald-400' : 'border-transparent text-zinc-400 hover:text-zinc-200'}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
                        <span>Voice Tone & Equalizer</span>
                    </button>
                </div>

                {/* Tab Content Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-zinc-800">
                    {activeTab === 'appearance' ? (
                        <div className="space-y-6">
                            {/* Hair Color */}
                            <div>
                                <div className="flex items-center justify-between mb-2.5">
                                    <label className="text-xs font-bold text-zinc-300 flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                        <span>Hair Color</span>
                                    </label>
                                    <input
                                        type="color"
                                        value={avatarCustomization.hairColor}
                                        onChange={(e) => setAvatarCustomization({ hairColor: e.target.value })}
                                        className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                                        title="Pick exact hex color"
                                    />
                                </div>
                                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                                    {HAIR_PRESETS.map((preset) => (
                                        <button
                                            key={preset.name}
                                            onClick={() => setAvatarCustomization({ hairColor: preset.color })}
                                            className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-[10px] ${avatarCustomization.hairColor === preset.color ? 'border-emerald-400 bg-emerald-950/30 text-emerald-300' : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700'}`}
                                        >
                                            <span className="w-5 h-5 rounded-full border border-black/40 shadow-md" style={{ backgroundColor: preset.color }} />
                                            <span className="truncate w-full text-center">{preset.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Skin Tone */}
                            <div>
                                <div className="flex items-center justify-between mb-2.5">
                                    <label className="text-xs font-bold text-zinc-300 flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/></svg>
                                        <span>Skin Tone</span>
                                    </label>
                                    <input
                                        type="color"
                                        value={avatarCustomization.skinTone}
                                        onChange={(e) => setAvatarCustomization({ skinTone: e.target.value })}
                                        className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                                        title="Pick exact skin tone"
                                    />
                                </div>
                                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                                    {SKIN_PRESETS.map((preset) => (
                                        <button
                                            key={preset.name}
                                            onClick={() => setAvatarCustomization({ skinTone: preset.color })}
                                            className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-[10px] ${avatarCustomization.skinTone === preset.color ? 'border-emerald-400 bg-emerald-950/30 text-emerald-300' : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700'}`}
                                        >
                                            <span className="w-5 h-5 rounded-full border border-black/40 shadow-md" style={{ backgroundColor: preset.color }} />
                                            <span className="truncate w-full text-center">{preset.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Eye Color */}
                            <div>
                                <div className="flex items-center justify-between mb-2.5">
                                    <label className="text-xs font-bold text-zinc-300 flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                                        <span>Eye / Iris Color</span>
                                    </label>
                                    <input
                                        type="color"
                                        value={avatarCustomization.eyeColor}
                                        onChange={(e) => setAvatarCustomization({ eyeColor: e.target.value })}
                                        className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                                        title="Pick exact eye color"
                                    />
                                </div>
                                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                    {EYE_PRESETS.map((preset) => (
                                        <button
                                            key={preset.name}
                                            onClick={() => setAvatarCustomization({ eyeColor: preset.color })}
                                            className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-[10px] ${avatarCustomization.eyeColor === preset.color ? 'border-emerald-400 bg-emerald-950/30 text-emerald-300' : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700'}`}
                                        >
                                            <span className="w-5 h-5 rounded-full border border-black/40 shadow-md" style={{ backgroundColor: preset.color }} />
                                            <span className="truncate w-full text-center">{preset.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Outfit / Coat Color */}
                            <div>
                                <div className="flex items-center justify-between mb-2.5">
                                    <label className="text-xs font-bold text-zinc-300 flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/></svg>
                                        <span>Outfit / Coat Color</span>
                                    </label>
                                    <input
                                        type="color"
                                        value={avatarCustomization.outfitColor}
                                        onChange={(e) => setAvatarCustomization({ outfitColor: e.target.value })}
                                        className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                                        title="Pick exact outfit color"
                                    />
                                </div>
                                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                    {OUTFIT_PRESETS.map((preset) => (
                                        <button
                                            key={preset.name}
                                            onClick={() => setAvatarCustomization({ outfitColor: preset.color })}
                                            className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-[10px] ${avatarCustomization.outfitColor === preset.color ? 'border-emerald-400 bg-emerald-950/30 text-emerald-300' : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700'}`}
                                        >
                                            <span className="w-5 h-5 rounded-full border border-black/40 shadow-md" style={{ backgroundColor: preset.color }} />
                                            <span className="truncate w-full text-center">{preset.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 3D Studio Lighting Mood */}
                            <div>
                                <label className="text-xs font-bold text-zinc-300 mb-2.5 block flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>
                                    <span>3D Studio Lighting Environment</span>
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    {LIGHTING_PRESETS.map((preset) => (
                                        <button
                                            key={preset.id}
                                            onClick={() => setAvatarCustomization({ lightingMood: preset.id })}
                                            className={`p-3 rounded-2xl border text-left transition-all flex items-start gap-3 ${avatarCustomization.lightingMood === preset.id ? 'border-emerald-400 bg-emerald-950/30' : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'}`}
                                        >
                                            <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300 flex-shrink-0">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-white">{preset.label}</p>
                                                <p className="text-[10px] text-zinc-400">{preset.desc}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Voice Pitch / Tone Slider */}
                            <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-zinc-200 flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 21v-7"/><path d="M4 10V3"/><path d="M12 21v-9"/><path d="M12 8V3"/><path d="M20 21v-5"/><path d="M20 12V3"/><path d="M1 14h6"/><path d="M9 8h6"/><path d="M17 16h6"/></svg>
                                        <span>Voice Pitch / Acoustic Tone</span>
                                    </label>
                                    <span className="text-xs font-mono font-bold text-emerald-400">
                                        {voiceSettings.pitch < 0.9 ? 'Deep Bass' : voiceSettings.pitch > 1.2 ? 'High / Bright' : 'Balanced Natural'} ({voiceSettings.pitch}x)
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="0.5"
                                    max="1.7"
                                    step="0.05"
                                    value={voiceSettings.pitch}
                                    onChange={(e) => setVoiceSettings({ pitch: parseFloat(e.target.value) })}
                                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                                />
                                <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                                    <span>0.5x (Deep Bass)</span>
                                    <span>1.0x (Standard)</span>
                                    <span>1.7x (High Pitch)</span>
                                </div>
                            </div>

                            {/* Speaking Rate / Speed */}
                            <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-zinc-200 flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                                        <span>Speaking Speed / Rate</span>
                                    </label>
                                    <span className="text-xs font-mono font-bold text-emerald-400">
                                        {voiceSettings.rate}x Speed
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="0.7"
                                    max="1.6"
                                    step="0.05"
                                    value={voiceSettings.rate}
                                    onChange={(e) => setVoiceSettings({ rate: parseFloat(e.target.value) })}
                                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                                />
                                <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                                    <span>0.7x (Calm & Deliberate)</span>
                                    <span>1.05x (Natural Flow)</span>
                                    <span>1.6x (Fast Pace)</span>
                                </div>
                            </div>

                            {/* Audio Output Volume */}
                            <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-zinc-200 flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
                                        <span>Master Speech Volume</span>
                                    </label>
                                    <span className="text-xs font-mono font-bold text-emerald-400">
                                        {Math.round(voiceSettings.volume * 100)}%
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="0.1"
                                    max="1.0"
                                    step="0.05"
                                    value={voiceSettings.volume}
                                    onChange={(e) => setVoiceSettings({ volume: parseFloat(e.target.value) })}
                                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                                />
                            </div>

                            {/* Live Test Voice Button */}
                            <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-xs font-bold text-emerald-300">Live Voice & Tone Preview</p>
                                    <p className="text-[11px] text-zinc-400">Audition speech settings with real-time lip-sync</p>
                                </div>
                                <button
                                    onClick={handleTestVoice}
                                    className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 shadow-lg ${isPlayingPreview ? 'bg-rose-500 hover:bg-rose-600 text-white animate-pulse' : 'bg-emerald-500 hover:bg-emerald-400 text-black'}`}
                                >
                                    {isPlayingPreview ? (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect width="14" height="14" x="5" y="5" rx="2"/></svg>
                                            <span>Stop Voice</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                                            <span>Play Preview</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-900/40 flex items-center justify-between">
                    <button
                        onClick={() => {
                            if (activeTab === 'appearance') resetAvatarCustomization();
                            else resetVoiceSettings();
                        }}
                        className="text-xs text-zinc-400 hover:text-rose-400 transition-colors font-medium"
                    >
                        Reset to Defaults
                    </button>

                    <button
                        onClick={onClose}
                        className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl text-xs transition-all shadow-lg"
                    >
                        Save & Done
                    </button>
                </div>

            </div>
        </div>
    );
}
