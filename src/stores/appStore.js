import { create } from 'zustand';

// Helper to load from localStorage
const loadStorage = (key, defaultValue) => {
    try {
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : defaultValue;
    } catch (e) {
        return defaultValue;
    }
};

// Helper to save to localStorage
const saveStorage = (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
};

const useAppStore = create((set, get) => ({
    // ─── Profile & Settings ───
    userName: loadStorage('tyloop_user_name', null),
    selectedModel: (() => {
        const stored = loadStorage('tyloop_selected_model', 'gemini-3.5-flash-lite');
        // If stored was another Gemini model, normalize to gemini-3.5-flash-lite
        if (stored && stored.startsWith('gemini') && stored !== 'gemini-3.5-flash-lite') {
            saveStorage('tyloop_selected_model', 'gemini-3.5-flash-lite');
            return 'gemini-3.5-flash-lite';
        }
        return stored || 'gemini-3.5-flash-lite';
    })(),
    aiProvider: loadStorage('tyloop_ai_provider', 'gemini'), // 'gemini' | 'local'
    geminiApiKey: loadStorage('tyloop_gemini_api_key', import.meta.env.VITE_GEMINI_API_KEY || ''),
    authLoading: false,
    isProcessing: false,
    isInterviewMode: false,
    activeJobDescription: '',
    interviewStarted: false,
    isVisualizeMode: false,
    activeConcept: '',
    activeBoardDiagram: '',
    activeBoardTitle: '',
    isAvatarEnabled: loadStorage('tyloop_avatar_enabled', true),

    setAiProvider: (provider) => {
        set({ aiProvider: provider });
        saveStorage('tyloop_ai_provider', provider);
    },
    setGeminiApiKey: (key) => {
        set({ geminiApiKey: key });
        saveStorage('tyloop_gemini_api_key', key);
    },

    setIsAvatarEnabled: (val) => {
        set({ isAvatarEnabled: val });
        saveStorage('tyloop_avatar_enabled', val);
    },
    toggleAvatarEnabled: () => {
        const next = !get().isAvatarEnabled;
        set({ isAvatarEnabled: next });
        saveStorage('tyloop_avatar_enabled', next);
    },

    // ─── Model Management ───
    localModels: [],
    downloadingModel: null,
    downloadProgress: 0,
    downloadStatus: '',

    setLocalModels: (models) => set({ localModels: models }),
    setDownloadingModel: (model) => set({ downloadingModel: model }),
    setDownloadProgress: (progress) => set({ downloadProgress: progress }),
    setDownloadStatus: (status) => set({ downloadStatus: status }),

    setUserName: (name) => {
        set({ userName: name });
        saveStorage('tyloop_user_name', name);
    },
    setSelectedModel: (model) => {
        set({ selectedModel: model });
        saveStorage('tyloop_selected_model', model);
    },

    // ─── 3D Avatar Customization ───
    avatarCustomization: loadStorage('tyloop_avatar_customization', {
        hairColor: '#2b231d',      // Dark Chestnut Brown
        skinTone: '#f8d7c2',       // Fair Ivory
        eyeColor: '#ffffff',       // Luminous / Crystal White
        outfitColor: '#18181b',    // Charcoal / Suit
        bottomColor: '#1e293b',    // Navy Slate
        lightingMood: 'clinical',  // clinical | cyberpunk | warm | studio
    }),

    setAvatarCustomization: (updates) => {
        set((state) => {
            const next = { ...state.avatarCustomization, ...updates };
            saveStorage('tyloop_avatar_customization', next);
            return { avatarCustomization: next };
        });
    },

    resetAvatarCustomization: () => {
        const defaultCustom = {
            hairColor: '#2b231d',
            skinTone: '#f8d7c2',
            eyeColor: '#ffffff',
            outfitColor: '#18181b',
            bottomColor: '#1e293b',
            lightingMood: 'clinical',
        };
        set({ avatarCustomization: defaultCustom });
        saveStorage('tyloop_avatar_customization', defaultCustom);
    },

    // ─── Voice & Tone Settings ───
    voiceSettings: loadStorage('tyloop_voice_settings', {
        pitch: 1.0,      // 0.5 (Deep Bass) to 1.8 (High/Bright)
        rate: 1.05,      // 0.7x to 1.6x
        volume: 1.0,     // 0.0 to 1.0
        bassBoost: 0,    // -5dB to +12dB
        voiceURI: '',    // Preferred System Voice URI
    }),

    setVoiceSettings: (updates) => {
        set((state) => {
            const next = { ...state.voiceSettings, ...updates };
            saveStorage('tyloop_voice_settings', next);
            return { voiceSettings: next };
        });
    },

    resetVoiceSettings: () => {
        const defaultVoice = {
            pitch: 1.0,
            rate: 1.05,
            volume: 1.0,
            bassBoost: 0,
            voiceURI: '',
        };
        set({ voiceSettings: defaultVoice });
        saveStorage('tyloop_voice_settings', defaultVoice);
    },

    // ─── Navigation ───
    currentPage: 'dashboard',
    setCurrentPage: (page) => set({ currentPage: page }),

    // ─── Chat Sessions ───
    sessions: loadStorage('tyloop_sessions', []),
    currentSession: null,
    messages: [],
    isAiTyping: false,
    pendingUserPrompt: null,

    setPendingUserPrompt: (prompt) => set({ pendingUserPrompt: prompt }),

    setSessions: (sessions) => {
        set({ sessions });
        saveStorage('tyloop_sessions', sessions);
    },
    setCurrentSession: (session) => {
        if (!session) {
            set({ currentSession: null, messages: [] });
            return;
        }
        // Clear messages immediately to avoid bleeding before loading new ones
        set({ currentSession: session, messages: [] });
        get().loadSessionMessages(session.id);

        // If this session is a slide deck session, restore active deck
        if (session.pptDeck) {
            set({
                activePptDeck: session.pptDeck,
                isPptMode: true,
                isQuizMode: false,
                isVisualizeMode: false,
                isInterviewMode: false,
                currentSlideIndex: 0
            });
            saveStorage('tyloop_active_ppt', session.pptDeck);
        } else if (session.quiz) {
            set({
                activeQuiz: session.quiz,
                isQuizMode: true,
                isPptMode: false,
                isVisualizeMode: false,
                isInterviewMode: false,
                quizUserAnswers: {},
                quizSubmitted: false
            });
            saveStorage('tyloop_active_quiz', session.quiz);
        }
    },
    setMessages: (messages) => set({ messages }),
    setIsAiTyping: (typing) => set({ isAiTyping: typing }),
    setIsProcessing: (processing) => set({ isProcessing: processing }),
    setIsSpeaking: (speaking) => set({ isSpeaking: speaking }),

    startInterview: (description) => {
        set({
            isInterviewMode: true,
            isVisualizeMode: false,
            activeJobDescription: description,
            currentPage: 'dashboard',
            interviewStarted: true
        });
        get().createSession(`Interview: ${description.substring(0, 20)}...`);
    },
    exitInterview: () => {
        set({
            isInterviewMode: false,
            activeJobDescription: '',
            currentPage: 'dashboard',
            interviewStarted: false
        });
    },
    setInterviewStarted: (started) => set({ interviewStarted: started }),

    visualDimension: '2d', // '2d' | '3d'
    active3DCode: '',
    setVisualDimension: (dim) => set({ visualDimension: dim }),
    setActive3DCode: (code) => set({ active3DCode: code }),

    startVisualizeMode: (concept = '', dimension = '2d') => {
        set({
            isVisualizeMode: true,
            isInterviewMode: false,
            visualDimension: dimension,
            activeConcept: concept,
            activeBoardDiagram: '',
            active3DCode: '',
            activeBoardTitle: concept || (dimension === '3d' ? '3D Spatial Studio' : 'Teacher Board'),
            currentPage: 'dashboard',
        });
        get().createSession(`${dimension === '3d' ? '3D' : 'Visualize'}: ${concept ? concept.substring(0, 20) + '...' : 'Classroom Board'}`);
    },
    openDiagramOnBoard: (diagramCode, title = 'Diagram from Chat') => {
        set({
            isVisualizeMode: true,
            isInterviewMode: false,
            visualDimension: '2d',
            activeConcept: '', // Empty to avoid triggering a new Ollama prompt
            activeBoardDiagram: diagramCode,
            activeBoardTitle: title,
            currentPage: 'dashboard'
        });
    },
    open3DOnBoard: (threeCode, title = '3D Scene from Chat') => {
        set({
            isVisualizeMode: true,
            isInterviewMode: false,
            visualDimension: '3d',
            activeConcept: '',
            active3DCode: threeCode,
            activeBoardTitle: title,
            currentPage: 'dashboard'
        });
    },
    exitVisualizeMode: () => {
        set({
            isVisualizeMode: false,
            activeConcept: '',
            activeBoardDiagram: '',
            active3DCode: '',
            activeBoardTitle: '',
            currentPage: 'dashboard',
        });
        // Keeps the existing active session and messages!
    },
    setActiveConcept: (concept) => set({ activeConcept: concept }),
    setActiveBoardTitle: (title) => set({ activeBoardTitle: title }),

    setBoardDiagram: (diagram, title = '') => {
        set((state) => ({
            activeBoardDiagram: diagram,
            activeBoardTitle: title ? title : state.activeBoardTitle
        }));
    },

    // ─── AI Slide Deck Studio (PPT Mode) ───
    isPptMode: false,
    activePptDeck: loadStorage('tyloop_active_ppt', null),
    currentSlideIndex: 0,
    isPptPresenting: false,

    startPptMode: (deck) => {
        set({
            isPptMode: true,
            isInterviewMode: false,
            isVisualizeMode: false,
            activePptDeck: deck,
            currentSlideIndex: 0,
            currentPage: 'dashboard'
        });
        if (deck) {
            saveStorage('tyloop_active_ppt', deck);
            const title = deck.topic || deck.title || 'Presentation';

            // Create a dedicated chat session for this slide deck
            const newSession = get().createSession(`Deck: ${title.substring(0, 24)}`);
            newSession.pptDeck = deck;

            // Update session in sessions list with pptDeck metadata
            set((state) => {
                const updatedSessions = state.sessions.map(s => s.id === newSession.id ? { ...s, pptDeck: deck } : s);
                saveStorage('tyloop_sessions', updatedSessions);
                return { sessions: updatedSessions, currentSession: { ...newSession, pptDeck: deck } };
            });

            // Save slide deck summary as the initial assistant message in this session's history
            const summaryMessage = {
                id: crypto.randomUUID(),
                session_id: newSession.id,
                role: 'assistant',
                content: `### 📊 AI Slide Deck: **${title}**\n*Theme: ${deck.theme || 'Modern'} • ${deck.slides?.length || 0} Visual Slides Generated*\n\n${deck.slides?.map((s, idx) => `${idx + 1}. **${s.title}**${s.subtitle ? ` — *${s.subtitle}*` : ''}`).join('\n')}\n\n\`\`\`json:ppt-deck\n${JSON.stringify(deck, null, 2)}\n\`\`\``,
                created_at: new Date().toISOString()
            };
            get().addMessage(summaryMessage);
        }
    },
    exitPptMode: () => {
        set({
            isPptMode: false,
            isPptPresenting: false,
            currentPage: 'dashboard'
        });
    },
    setActivePptDeck: (deck) => {
        set({ activePptDeck: deck });
        saveStorage('tyloop_active_ppt', deck);

        // Also sync with current session if active
        const curr = get().currentSession;
        if (curr) {
            set((state) => {
                const updated = state.sessions.map(s => s.id === curr.id ? { ...s, pptDeck: deck } : s);
                saveStorage('tyloop_sessions', updated);
                return { sessions: updated, currentSession: { ...curr, pptDeck: deck } };
            });
        }
    },
    setCurrentSlideIndex: (idx) => set({ currentSlideIndex: idx }),
    setIsPptPresenting: (val) => set({ isPptPresenting: val }),

    // ─── AI Quiz Mode ───
    isQuizMode: false,
    activeQuiz: loadStorage('tyloop_active_quiz', null),
    quizUserAnswers: {}, // { [questionIndex]: selectedOptionIndex }
    quizSubmitted: false,

    startQuizMode: (quiz) => {
        set({
            isQuizMode: true,
            isPptMode: false,
            isInterviewMode: false,
            isVisualizeMode: false,
            activeQuiz: quiz,
            quizUserAnswers: {},
            quizSubmitted: false,
            currentPage: 'dashboard'
        });
        if (quiz) {
            saveStorage('tyloop_active_quiz', quiz);
            const topic = quiz.topic || quiz.title || 'Technical Assessment';

            // Create a dedicated chat session for this quiz
            const newSession = get().createSession(`Quiz: ${topic.substring(0, 24)}`);
            newSession.quiz = quiz;

            // Update session in sessions list with quiz metadata
            set((state) => {
                const updatedSessions = state.sessions.map(s => s.id === newSession.id ? { ...s, quiz } : s);
                saveStorage('tyloop_sessions', updatedSessions);
                return { sessions: updatedSessions, currentSession: { ...newSession, quiz } };
            });

            // Save quiz summary message into session history
            const summaryMessage = {
                id: crypto.randomUUID(),
                session_id: newSession.id,
                role: 'assistant',
                content: `### 🎯 AI Assessment Quiz: **${quiz.title || topic}**\n*Difficulty: ${quiz.difficulty || 'Medium'} • ${quiz.questions?.length || 0} Questions*\n\n${quiz.questions?.map((q, idx) => `**Q${idx + 1}.** ${q.question}`).join('\n\n')}\n\n\`\`\`json:quiz-data\n${JSON.stringify(quiz, null, 2)}\n\`\`\``,
                created_at: new Date().toISOString()
            };
            get().addMessage(summaryMessage);
        }
    },
    exitQuizMode: () => {
        set({
            isQuizMode: false,
            currentPage: 'dashboard'
        });
    },
    selectQuizAnswer: (questionIndex, optionIndex) => {
        set((state) => ({
            quizUserAnswers: {
                ...state.quizUserAnswers,
                [questionIndex]: optionIndex
            }
        }));
    },
    submitQuiz: () => {
        set({ quizSubmitted: true });
    },
    resetQuiz: () => {
        set({ quizUserAnswers: {}, quizSubmitted: false });
    },

    updateCurrentSlide: (slideUpdates) => {
        set((state) => {
            if (!state.activePptDeck || !state.activePptDeck.slides) return {};
            const nextSlides = [...state.activePptDeck.slides];
            const currentIndex = state.currentSlideIndex;
            if (currentIndex >= 0 && currentIndex < nextSlides.length) {
                nextSlides[currentIndex] = {
                    ...nextSlides[currentIndex],
                    ...slideUpdates
                };
                const nextDeck = {
                    ...state.activePptDeck,
                    slides: nextSlides
                };
                saveStorage('tyloop_active_ppt', nextDeck);
                return { activePptDeck: nextDeck };
            }
            return {};
        });
    },

    addSlideAfterCurrent: (newSlide) => {
        set((state) => {
            if (!state.activePptDeck) return {};
            const currentSlides = state.activePptDeck.slides || [];
            const insertIndex = state.currentSlideIndex + 1;
            const createdSlide = newSlide || {
                slideNumber: insertIndex + 1,
                layout: 'dense_grid',
                title: 'New Slide Topic',
                subtitle: 'Deep-dive into component behavior',
                points: [
                    'Key structural component analysis and state transitions',
                    'Operational parameters and runtime performance characteristics',
                    'Failure modes, resilience guarantees, and fallback strategies'
                ],
                technicalDetails: 'Latency: < 5ms | Space: O(N) | State: Invariant',
                diagram: '',
                callout: 'Optimizes throughput by decoupling critical execution stages.',
                speakerNotes: 'This slide provides an architectural walkthrough of the newly added component.'
            };

            const updatedSlides = [
                ...currentSlides.slice(0, insertIndex),
                createdSlide,
                ...currentSlides.slice(insertIndex)
            ].map((s, idx) => ({ ...s, slideNumber: idx + 1 }));

            const updatedDeck = {
                ...state.activePptDeck,
                slideCount: updatedSlides.length,
                slides: updatedSlides
            };
            saveStorage('tyloop_active_ppt', updatedDeck);
            return {
                activePptDeck: updatedDeck,
                currentSlideIndex: insertIndex
            };
        });
    },

    deleteCurrentSlide: () => {
        set((state) => {
            if (!state.activePptDeck || !state.activePptDeck.slides || state.activePptDeck.slides.length <= 1) return {};
            const currentSlides = state.activePptDeck.slides;
            const deleteIndex = state.currentSlideIndex;
            const updatedSlides = currentSlides
                .filter((_, idx) => idx !== deleteIndex)
                .map((s, idx) => ({ ...s, slideNumber: idx + 1 }));

            const nextIndex = Math.min(deleteIndex, updatedSlides.length - 1);
            const updatedDeck = {
                ...state.activePptDeck,
                slideCount: updatedSlides.length,
                slides: updatedSlides
            };
            saveStorage('tyloop_active_ppt', updatedDeck);
            return {
                activePptDeck: updatedDeck,
                currentSlideIndex: nextIndex
            };
        });
    },

    addMessage: (message) => {
        const newMessages = [...get().messages, message];
        set({ messages: newMessages });

        // Save to localStorage for this session
        const sessionId = get().currentSession?.id;
        if (sessionId) {
            saveStorage(`tyloop_messages_${sessionId}`, newMessages);
        }
    },

    updateLastMessage: (content) => set((state) => {
        const msgs = [...state.messages];
        if (msgs.length > 0 && msgs[msgs.length - 1].role === 'assistant') {
            msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content };
        }

        // Save to localStorage
        const sessionId = state.currentSession?.id;
        if (sessionId) {
            saveStorage(`tyloop_messages_${sessionId}`, msgs);
        }

        return { messages: msgs };
    }),

    fetchSessions: () => {
        let sessions = loadStorage('tyloop_sessions', []);
        if (sessions.length === 0) {
            const newSession = {
                id: crypto.randomUUID(),
                user_id: 'guest',
                title: 'New Chat',
                created_at: new Date().toISOString()
            };
            sessions = [newSession];
            saveStorage('tyloop_sessions', sessions);
        }
        set({ sessions });
        const active = get().currentSession || sessions[0];
        set({ currentSession: active });
        get().loadSessionMessages(active.id);
    },

    createSession: () => {
        const newSession = {
            id: crypto.randomUUID(),
            user_id: 'guest',
            title: 'New Chat',
            created_at: new Date().toISOString()
        };

        const sessions = [newSession, ...get().sessions];
        set({
            sessions,
            currentSession: newSession,
            messages: []
        });
        saveStorage('tyloop_sessions', sessions);
        return newSession;
    },

    loadSessionMessages: (sessionId) => {
        const messages = loadStorage(`tyloop_messages_${sessionId}`, []);
        set({ messages });
    },

    saveMessage: (sessionId, role, content, imageUrl = null) => {
        const newMessage = {
            id: crypto.randomUUID(),
            session_id: sessionId,
            role,
            content,
            image_url: imageUrl,
            created_at: new Date().toISOString()
        };
        get().addMessage(newMessage);
        return newMessage;
    },

    deleteSession: (sessionId) => {
        const newSessions = get().sessions.filter(s => s.id !== sessionId);
        const isCurrent = get().currentSession?.id === sessionId;

        set({
            sessions: newSessions,
            currentSession: isCurrent ? (newSessions[0] || null) : get().currentSession,
            messages: isCurrent ? [] : get().messages
        });

        saveStorage('tyloop_sessions', newSessions);
        localStorage.removeItem(`tyloop_messages_${sessionId}`);

        if (isCurrent && newSessions[0]) {
            get().loadSessionMessages(newSessions[0].id);
        }
    },

    // ─── Voice State ───
    isListening: false,
    isSpeaking: false,
    setIsListening: (val) => set({ isListening: val }),
    setIsSpeaking: (val) => set({ isSpeaking: val }),

    // ─── Sidebar ───
    sidebarOpen: true,
    toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

    // Mocks for compatibility
    initAuth: () => set({ authLoading: false }),
    signOut: () => {
        localStorage.clear();
        set({
            userName: null,
            selectedModel: 'qwen2.5-coder:7b',
            sessions: [],
            currentSession: null,
            messages: [],
            currentPage: 'dashboard'
        });
    }
}));

export default useAppStore;
