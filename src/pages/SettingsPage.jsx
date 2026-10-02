import { useState, useEffect } from 'react';
import useAppStore from '../stores/appStore';
import Sidebar from '../components/ui/Sidebar';
import { listLocalModels, pullModel } from '../services/ollamaService';
import { POPULAR_GEMINI_MODELS, testGeminiApiKey, isGeminiModel } from '../services/geminiService';

export default function SettingsPage() {
    const {
        userName, setUserName,
        selectedModel, setSelectedModel,
        aiProvider, setAiProvider,
        geminiApiKey, setGeminiApiKey,
        setCurrentPage,
        localModels, setLocalModels,
        downloadingModel, setDownloadingModel,
        downloadProgress, setDownloadProgress,
        downloadStatus, setDownloadStatus
    } = useAppStore();

    const [nameInput, setNameInput] = useState(userName || '');
    const [apiKeyInput, setApiKeyInput] = useState(geminiApiKey || '');
    const [showApiKey, setShowApiKey] = useState(false);
    const [keySavedStatus, setKeySavedStatus] = useState('');
    const [testingKey, setTestingKey] = useState(false);
    const [testResult, setTestResult] = useState(null); // { success: boolean, message: string }

    // Active tab in settings: 'gemini' | 'ollama'
    const [activeTab, setActiveTab] = useState(() => isGeminiModel(selectedModel) ? 'gemini' : 'ollama');
    const [searchQuery, setSearchQuery] = useState('');
    const [customGeminiInput, setCustomGeminiInput] = useState('');

    useEffect(() => {
        refreshModels();
    }, []);

    const refreshModels = async () => {
        const models = await listLocalModels();
        setLocalModels(models);
    };

    const handleNameUpdate = (e) => {
        e.preventDefault();
        setUserName(nameInput);
    };

    const handleSaveApiKey = (e) => {
        e?.preventDefault();
        setGeminiApiKey(apiKeyInput.trim());
        setKeySavedStatus('API Key saved!');
        setTestResult(null);
        setTimeout(() => setKeySavedStatus(''), 3000);
    };

    const handleTestApiKey = async () => {
        const keyToTest = apiKeyInput.trim() || geminiApiKey;
        if (!keyToTest) {
            setTestResult({ success: false, message: 'Please enter a Gemini API Key first.' });
            return;
        }

        setTestingKey(true);
        setTestResult(null);

        try {
            await testGeminiApiKey(keyToTest, 'gemini-3.5-flash-lite');
            setGeminiApiKey(keyToTest);
            setTestResult({ success: true, message: 'Verified! Successfully connected to Google Gemini API.' });
        } catch (err) {
            setTestResult({ success: false, message: err.message || 'Connection failed. Check your API key.' });
        } finally {
            setTestingKey(false);
        }
    };

    const popularLocalModels = [
        { id: 'qwen2.5-coder:7b', name: 'Qwen 2.5 Coder (7B)', description: 'Balanced for coding and general tasks.' },
        { id: 'qwen3-vl:4b', name: 'Qwen 3 VL (4B)', description: 'Optimized for vision and image analysis.' },
        { id: 'llama3.2:3b', name: 'Llama 3.2 (3B)', description: 'Fast, modern, and efficient.' },
        { id: 'mistral:latest', name: 'Mistral (7B)', description: 'Dense and high-performing.' },
        { id: 'phi3:latest', name: 'Phi-3 (3.8B)', description: 'Tiny but surprisingly capable.' },
        { id: 'deepseek-coder:6.7b', name: 'DeepSeek Coder', description: 'Specialized for programming.' }
    ];

    const filteredLocalModels = popularLocalModels.filter(m =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handlePullModel = async (modelId) => {
        if (downloadingModel) return;

        setDownloadingModel(modelId);
        setDownloadProgress(0);
        setDownloadStatus('Starting download...');

        try {
            await pullModel(modelId, (progress) => {
                if (progress.status === 'downloading' && progress.total) {
                    const percent = Math.round((progress.completed / progress.total) * 100);
                    setDownloadProgress(percent);
                    setDownloadStatus(`Downloading: ${percent}%`);
                } else {
                    setDownloadStatus(progress.status);
                }
            });
            setDownloadStatus('Success! Model ready.');
            setTimeout(() => {
                setDownloadingModel(null);
                setDownloadProgress(0);
                refreshModels();
            }, 2000);
        } catch (err) {
            setDownloadStatus('Error: ' + err.message);
            setTimeout(() => setDownloadingModel(null), 5000);
        }
    };

    const isModelInstalled = (modelId) => {
        return localModels.some(m => m.name === modelId || m.name.split(':')[0] === modelId.split(':')[0]);
    };

    const handleSelectGeminiModel = (modelId) => {
        setSelectedModel(modelId);
        setAiProvider('gemini');
    };

    const handleSelectLocalModel = (modelId) => {
        setSelectedModel(modelId);
        setAiProvider('local');
    };

    return (
        <div className="h-full w-full flex overflow-hidden bg-[#09090b]">
            <Sidebar />

            <main className="flex-1 overflow-y-auto p-6 lg:p-12 scrollbar-thin scrollbar-thumb-zinc-800">
                <div className="max-w-3xl mx-auto space-y-10">
                    <header className="space-y-1">
                        <button
                            onClick={() => setCurrentPage('dashboard')}
                            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-4 flex items-center gap-1 group"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-0.5 transition-transform"><path d="m15 18-6-6 6-6" /></svg>
                            Back to Chat
                        </button>
                        <h1 className="text-3xl font-bold text-zinc-50 tracking-tight">Settings & AI Models</h1>
                        <p className="text-zinc-400">Choose between Google GenAI Cloud (Gemini) and Local Offline AI (Ollama).</p>
                    </header>

                    {/* Profile Section */}
                    <section className="space-y-4 bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800/50">
                        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                            Profile
                        </h2>
                        <form onSubmit={handleNameUpdate} className="space-y-3">
                            <label className="block text-xs text-zinc-500">DISPLAY NAME</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={nameInput}
                                    onChange={(e) => setNameInput(e.target.value)}
                                    placeholder="Enter your name"
                                    className="flex-1 px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-50 focus:outline-none focus:border-zinc-500 transition-all text-sm"
                                />
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-white text-black font-semibold rounded-lg hover:bg-zinc-200 transition-all text-sm shadow-sm"
                                >
                                    Save
                                </button>
                            </div>
                        </form>
                    </section>

                    {/* AI Provider Switcher Tabs */}
                    <section className="space-y-6">
                        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                            <div className="flex items-center gap-2 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                                <button
                                    onClick={() => setActiveTab('gemini')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                                        activeTab === 'gemini'
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                            : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                                    }`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20" /><path d="m17 5-10 14" /><path d="m7 5 10 14" /></svg>
                                    Google GenAI (Gemini)
                                    {isGeminiModel(selectedModel) && (
                                        <span className="w-2 h-2 rounded-full bg-blue-300 animate-pulse" />
                                    )}
                                </button>
                                <button
                                    onClick={() => setActiveTab('ollama')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                                        activeTab === 'ollama'
                                            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                                            : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                                    }`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" /><rect x="2" y="14" width="20" height="8" rx="2" /><line x1="6" y1="6" x2="6.01" y2="6" /><line x1="6" y1="18" x2="6.01" y2="18" /></svg>
                                    Local AI (Ollama)
                                    {!isGeminiModel(selectedModel) && (
                                        <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                                    )}
                                </button>
                            </div>

                            <div className="text-right">
                                <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 block">Active Model</span>
                                <span className="text-xs font-semibold text-zinc-200">{selectedModel}</span>
                            </div>
                        </div>

                        {/* ─── TAB 1: GOOGLE GENAI (GEMINI) ─── */}
                        {activeTab === 'gemini' && (
                            <div className="space-y-8 animate-in fade-in duration-200">
                                {/* API Key Setup Card */}
                                <div className="bg-gradient-to-b from-blue-950/20 to-zinc-900/40 p-6 rounded-2xl border border-blue-500/20 space-y-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <h3 className="text-sm font-bold text-blue-400 flex items-center gap-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21 2-2 2m-1.5 1.5L10 13m-4 4 1.5 1.5M3 21l3-3m-3 3 1.5-1.5m6-6 3 3" /></svg>
                                                Google Gemini API Configuration
                                            </h3>
                                            <p className="text-xs text-zinc-400 mt-1">
                                                Enter your Gemini API key to access Google's state-of-the-art GenAI models (e.g., Gemini 3.7 Flash, Gemini 2.5 Pro).
                                            </p>
                                        </div>
                                        <a
                                            href="https://aistudio.google.com/app/apikey"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-medium rounded-lg border border-blue-500/30 transition-all flex items-center gap-1.5 flex-shrink-0"
                                        >
                                            <span>Get Free API Key</span>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                                        </a>
                                    </div>

                                    <div className="space-y-3 pt-2">
                                        <div className="relative">
                                            <input
                                                type={showApiKey ? 'text' : 'password'}
                                                value={apiKeyInput}
                                                onChange={(e) => setApiKeyInput(e.target.value)}
                                                placeholder="AIzaSy..."
                                                className="w-full pl-4 pr-12 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 font-mono text-xs focus:outline-none focus:border-blue-500 transition-all placeholder:text-zinc-600"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowApiKey(!showApiKey)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs"
                                            >
                                                {showApiKey ? 'Hide' : 'Show'}
                                            </button>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={handleSaveApiKey}
                                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs transition-all shadow-md shadow-blue-600/20"
                                            >
                                                Save Key
                                            </button>
                                            <button
                                                onClick={handleTestApiKey}
                                                disabled={testingKey}
                                                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium rounded-lg text-xs transition-all disabled:opacity-50 flex items-center gap-1.5"
                                            >
                                                {testingKey && <div className="w-3 h-3 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />}
                                                <span>{testingKey ? 'Testing Connection...' : 'Test API Key'}</span>
                                            </button>

                                            {keySavedStatus && (
                                                <span className="text-xs text-emerald-400 font-medium animate-in fade-in">{keySavedStatus}</span>
                                            )}
                                        </div>

                                        {testResult && (
                                            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                                                testResult.success
                                                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                                                    : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                                            }`}>
                                                <span className="font-bold">{testResult.success ? '✓' : '✗'}</span>
                                                <span>{testResult.message}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Gemini Models Grid */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
                                            Select Google Gemini Model
                                        </h3>
                                        <span className="text-[10px] text-zinc-500">Official @google/genai SDK</span>
                                    </div>

                                    <div className="grid gap-3 sm:grid-cols-1">
                                        {POPULAR_GEMINI_MODELS.map((model) => {
                                            const isSelected = selectedModel === model.id;

                                            return (
                                                <div
                                                    key={model.id}
                                                    className={`group relative p-5 rounded-2xl border transition-all duration-300 cursor-pointer ${
                                                        isSelected
                                                            ? 'bg-gradient-to-br from-blue-900/30 via-zinc-900 to-zinc-900 border-blue-500 ring-2 ring-blue-500/20'
                                                            : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                                                    }`}
                                                    onClick={() => handleSelectGeminiModel(model.id)}
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="text-base font-bold tracking-tight text-zinc-50">
                                                            {model.name}
                                                        </span>
                                                        <div className={`px-2.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest ${
                                                            isSelected
                                                                ? 'bg-blue-500 text-white'
                                                                : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                                        }`}>
                                                            {model.tag}
                                                        </div>
                                                    </div>
                                                    <p className="text-xs leading-relaxed mb-4 text-zinc-400">
                                                        {model.description}
                                                    </p>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleSelectGeminiModel(model.id);
                                                        }}
                                                        className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${
                                                            isSelected
                                                                ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-md shadow-blue-500/20'
                                                                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                                                        }`}
                                                    >
                                                        {isSelected ? '✓ Active Model (Selected)' : 'Select Model'}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ─── TAB 2: LOCAL AI (OLLAMA) ─── */}
                        {activeTab === 'ollama' && (
                            <div className="space-y-6 animate-in fade-in duration-200">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21 16-4 4-4-4" /><path d="M17 20V4" /><path d="m3 8 4-4 4 4" /><path d="M7 4v16" /></svg>
                                        Local Ollama Models
                                    </h3>
                                    <button
                                        onClick={refreshModels}
                                        className="text-[10px] text-zinc-500 hover:text-white transition-colors flex items-center gap-1"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.21-8.58" /><path d="M15 3h6v6" /></svg>
                                        Refresh Local List
                                    </button>
                                </div>

                                {/* Search Bar */}
                                <div className="relative group">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-zinc-400 transition-colors"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search for a local model (e.g., llama3, deepseek)..."
                                        className="w-full pl-10 pr-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-xl text-zinc-50 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-all text-sm"
                                    />
                                </div>

                                {/* Download Progress Card */}
                                {downloadingModel && (
                                    <div className="p-5 bg-zinc-900 border border-zinc-700 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className="flex justify-between items-center mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                <span className="text-sm font-semibold text-white">Pulling {downloadingModel}</span>
                                            </div>
                                            <span className="text-xs font-mono text-zinc-500">{downloadStatus}</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-emerald-400 transition-all duration-300"
                                                style={{ width: `${downloadProgress}%` }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Model Grid */}
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {filteredLocalModels.map((model) => {
                                        const installed = isModelInstalled(model.id);
                                        const isSelected = selectedModel === model.id;

                                        return (
                                            <div
                                                key={model.id}
                                                className={`group relative p-4 rounded-xl border transition-all duration-300 ${isSelected
                                                        ? 'bg-zinc-50 border-white ring-4 ring-white/5'
                                                        : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                                                    }`}
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className={`text-sm font-bold tracking-tight ${isSelected ? 'text-black' : 'text-zinc-50'}`}>
                                                        {model.name}
                                                    </span>
                                                    {installed ? (
                                                        <div className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest ${isSelected ? 'bg-black/10 text-black' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
                                                            Installed
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => handlePullModel(model.id)}
                                                            disabled={!!downloadingModel}
                                                            className="px-3 py-1 bg-zinc-100 hover:bg-white text-black text-[10px] font-bold rounded-md transition-all disabled:opacity-20"
                                                        >
                                                            Pull
                                                        </button>
                                                    )}
                                                </div>
                                                <p className={`text-[11px] leading-relaxed mb-4 ${isSelected ? 'text-zinc-700' : 'text-zinc-500'}`}>
                                                    {model.description}
                                                </p>

                                                {installed && (
                                                    <button
                                                        onClick={() => handleSelectLocalModel(model.id)}
                                                        className={`w-full py-2 rounded-lg text-xs font-bold transition-all ${isSelected
                                                                ? 'bg-black text-white hover:bg-zinc-800'
                                                                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100'
                                                            }`}
                                                    >
                                                        {isSelected ? '✓ Active Model' : 'Select Model'}
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Custom Pull */}
                                <div className="p-8 bg-zinc-950 border border-dashed border-zinc-800 rounded-2xl text-center space-y-4">
                                    <div className="w-12 h-12 rounded-xl bg-zinc-900 flex items-center justify-center mx-auto border border-zinc-800">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-600"><path d="M12 2v20" /><path d="m19 15-7 7-7-7" /></svg>
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="font-semibold text-zinc-50 text-sm">Download Any Local Model</h4>
                                        <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                                            Need a specific version? Enter the full Ollama model tag below to download it.
                                        </p>
                                    </div>
                                    <div className="flex gap-2 max-w-sm mx-auto">
                                        <input
                                            type="text"
                                            id="customModelInput"
                                            placeholder="e.g., codellama:13b"
                                            className="flex-1 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-all"
                                        />
                                        <button
                                            onClick={() => handlePullModel(document.getElementById('customModelInput').value)}
                                            disabled={!!downloadingModel}
                                            className="px-4 py-2 bg-white text-black font-bold rounded-lg hover:bg-zinc-200 transition-all text-xs disabled:opacity-20"
                                        >
                                            Pull
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
}
