import useAppStore from '../stores/appStore';
import Sidebar from '../components/ui/Sidebar';

export default function DoubtPage() {
    const { setCurrentPage } = useAppStore();

    const geminiSteps = [
        {
            title: "Get Google Gemini API Key",
            content: "Head to Google AI Studio (aistudio.google.com/app/apikey) and click 'Create API Key'. It is free and takes less than 10 seconds.",
            cmd: null
        },
        {
            title: "Enter Key in Tyloop Settings",
            content: "Open Settings -> Google GenAI (Gemini) tab, paste your API key, and click 'Save Key' & 'Test API Key'.",
            cmd: null
        },
        {
            title: "Select Gemini 3.5 Flash Lite",
            content: "Select Gemini 3.5 Flash Lite (ultra-fast, lightweight multimodal Google GenAI model) to start chatting, generating slide decks, or practicing interviews.",
            cmd: null
        }
    ];

    const ollamaSteps = [
        {
            title: "Download Ollama",
            content: "Visit ollama.com and download the application for Windows, macOS, or Linux.",
            cmd: null
        },
        {
            title: "Pull a Local Model",
            content: "Open your terminal and run the pull command for the model you want. For example, to add Qwen 2.5 Coder:",
            cmd: "ollama pull qwen2.5-coder:7b"
        },
        {
            title: "Verify Ollama is Running",
            content: "Ensure Ollama server is running locally on port 11434:",
            cmd: "ollama list"
        },
        {
            title: "Configure in Tyloop",
            content: "Go to Settings -> Local AI (Ollama) tab and select the model you downloaded.",
            cmd: null
        }
    ];

    return (
        <div className="h-full w-full flex overflow-hidden bg-[#09090b]">
            <Sidebar />

            <main className="flex-1 overflow-y-auto p-6 lg:p-12 scrollbar-thin scrollbar-thumb-zinc-800">
                <div className="max-w-3xl mx-auto space-y-12">
                    <header className="space-y-1">
                        <button
                            onClick={() => setCurrentPage('dashboard')}
                            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-4 flex items-center gap-1 group"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-0.5 transition-transform"><path d="m15 18-6-6 6-6" /></svg>
                            Back to Chat
                        </button>
                        <h1 className="text-3xl font-bold text-zinc-50 tracking-tight">AI Setup Guide</h1>
                        <p className="text-zinc-400">How to set up Google GenAI (Gemini) and Local Offline AI (Ollama) with Tyloop.</p>
                    </header>

                    {/* Gemini Section */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                            <h2 className="text-lg font-bold text-zinc-100">Option 1: Google GenAI (Gemini Cloud) — Recommended</h2>
                        </div>
                        <div className="grid gap-4">
                            {geminiSteps.map((step, i) => (
                                <div key={i} className="flex gap-4 p-5 bg-gradient-to-r from-blue-950/20 to-zinc-900/40 border border-blue-500/20 rounded-2xl">
                                    <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-xs font-bold text-blue-400 shrink-0">
                                        {i + 1}
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="font-semibold text-zinc-100 text-sm">{step.title}</h3>
                                        <p className="text-zinc-400 text-xs leading-relaxed">{step.content}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Ollama Section */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                            <h2 className="text-lg font-bold text-zinc-100">Option 2: Local AI (Ollama - 100% Offline)</h2>
                        </div>
                        <div className="grid gap-4">
                            {ollamaSteps.map((step, i) => (
                                <div key={i} className="flex gap-4 p-5 bg-zinc-900/40 border border-zinc-800 rounded-2xl">
                                    <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-300 shrink-0">
                                        {i + 1}
                                    </div>
                                    <div className="space-y-2 flex-1">
                                        <h3 className="font-semibold text-zinc-100 text-sm">{step.title}</h3>
                                        <p className="text-zinc-400 text-xs leading-relaxed">{step.content}</p>
                                        {step.cmd && (
                                            <div className="group relative">
                                                <code className="block p-2.5 bg-black rounded-lg border border-zinc-800 text-xs font-mono text-zinc-300">
                                                    {step.cmd}
                                                </code>
                                                <button
                                                    onClick={() => navigator.clipboard.writeText(step.cmd)}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-zinc-800 rounded-md transition-all text-zinc-500 hover:text-zinc-50"
                                                    title="Copy to clipboard"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /></svg>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <footer className="p-8 bg-zinc-950 border border-dashed border-zinc-800 rounded-2xl text-center space-y-4">
                        <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center mx-auto border border-zinc-800">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400"><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>
                        </div>
                        <h4 className="font-semibold text-zinc-50 text-sm">Ready to Configure?</h4>
                        <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                            Head over to Settings to enter your Gemini API key or choose a downloaded local Ollama model.
                        </p>
                        <button
                            onClick={() => setCurrentPage('settings')}
                            className="px-6 py-2 bg-white text-black font-semibold rounded-lg hover:bg-zinc-200 transition-all text-xs"
                        >
                            Configure AI Models
                        </button>
                    </footer>
                </div>
            </main>
        </div>
    );
}
