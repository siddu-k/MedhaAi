import { useState } from 'react';
import useAppStore from '../stores/appStore';

export default function OnboardingPage() {
    const [name, setName] = useState('');
    const { setUserName } = useAppStore();

    const handleSubmit = (e) => {
        e.preventDefault();
        if (name.trim()) {
            setUserName(name.trim());
        }
    };

    return (
        <div className="h-full w-full flex items-center justify-center bg-[#09090b]">
            <div className="max-w-md w-full p-8 space-y-8 bg-zinc-900/50 border border-zinc-800 rounded-2xl backdrop-blur-sm animate-fade-in">
                <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-zinc-700">
                        <div className="w-6 h-6 rounded-full border border-zinc-500 flex items-center justify-center">
                            <div className="w-3 h-3 bg-zinc-50 rounded-full" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-zinc-50 tracking-tight">Welcome to Tyloop AI</h1>
                    <p className="text-zinc-400 text-sm">Let's get started. What should I call you?</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter your name"
                            className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-50 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-all text-center"
                            autoFocus
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={!name.trim()}
                        className="w-full py-3 bg-white text-black font-semibold rounded-xl hover:bg-zinc-200 transition-all disabled:opacity-50 disabled:grayscale shadow-lg shadow-white/5"
                    >
                        Continue
                    </button>
                </form>

                <p className="text-center text-[10px] text-zinc-600">
                    Your name and chat history are stored locally on this device.
                </p>
            </div>
        </div>
    );
}
