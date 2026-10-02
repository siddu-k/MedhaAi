/**
 * Voice Service — Universal Web Speech API implementation for STT and TTS
 * Features real-time phoneme lip-syncing, sentence chunking, and Edge/Chrome keep-alive.
 */

import {
    lipsyncManager,
    startSyntheticSpeech,
    stopSyntheticSpeech,
    updateSyntheticWord,
} from './lipsyncService';
import useAppStore from '../stores/appStore';

// ─── Speech-to-Text ───
let recognition = null;

export function isSTTSupported() {
    return typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function startListening(onResult, onEnd, onError) {
    if (!isSTTSupported()) {
        onError?.('Speech recognition not supported in this browser');
        return null;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    let finalTranscript = '';

    recognition.onresult = (event) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscript += transcript;
            } else {
                interim += transcript;
            }
        }
        onResult?.(finalTranscript || interim, !!finalTranscript);
    };

    recognition.onend = () => {
        onEnd?.(finalTranscript);
    };

    recognition.onerror = (event) => {
        if (event.error !== 'aborted') {
            onError?.(event.error);
        }
    };

    recognition.start();
    return recognition;
}

export function stopListening() {
    if (recognition) {
        recognition.stop();
        recognition = null;
    }
}

// ─── Text-to-Speech (Web Speech API) ───
let speechQueue = [];
let isAudioPlaying = false;
let onEndGlobal = null;
let keepAliveTimer = null;
let cachedVoices = [];

// Initialize voices eagerly and cache them
if (typeof window !== 'undefined' && window.speechSynthesis) {
    cachedVoices = window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {
        cachedVoices = window.speechSynthesis.getVoices();
    };
}

export function isTTSSupported() {
    return typeof window !== 'undefined' && !!window.speechSynthesis;
}

export function getSystemVoices() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
        const voices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices();
        return voices.filter(v => v.lang.startsWith('en'));
    }
    return [];
}

/**
 * Pick the best sounding voice (prioritizing natural/neural English voices)
 */
function pickBestVoice(preferredName) {
    const voices = getSystemVoices();
    if (voices.length === 0) return null;

    if (preferredName) {
        const match = voices.find(v => v.name === preferredName || v.voiceURI === preferredName);
        if (match) return match;
    }

    // Prioritize natural / Google / Edge neural voices
    const natural = voices.find(v =>
        (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Jenny') || v.name.includes('Aria') || v.name.includes('Guy')) &&
        (v.lang === 'en-US' || v.lang === 'en-GB')
    );
    if (natural) return natural;

    const enUS = voices.find(v => v.lang === 'en-US');
    if (enUS) return enUS;

    return voices[0];
}

/**
 * Helper to split text into manageable sentences for natural pauses and avoiding Chrome's 15s freeze
 */
function chunkText(text) {
    const regex = /[^.?!;:\n]+[.?!;:\n]+|[^.?!;:\n]+$/g;
    const matches = text.match(regex);
    if (!matches) return [text];
    return matches.map(s => s.trim()).filter(s => s.length > 0);
}

function playNextChunk() {
    if (speechQueue.length === 0) {
        isAudioPlaying = false;
        clearInterval(keepAliveTimer);
        keepAliveTimer = null;
        stopSyntheticSpeech();

        if (onEndGlobal) {
            const cb = onEndGlobal;
            onEndGlobal = null;
            cb();
        }
        return;
    }

    const chunk = speechQueue.shift();
    const { voiceSettings } = useAppStore.getState();
    const rate = voiceSettings?.rate || 1.05;
    const pitch = voiceSettings?.pitch || 1.0;
    const volume = voiceSettings?.volume ?? 1.0;

    const utterance = new SpeechSynthesisUtterance(chunk);
    utterance.rate = Math.min(2.0, Math.max(0.5, rate));
    utterance.pitch = Math.min(1.8, Math.max(0.5, pitch));
    utterance.volume = Math.min(1.0, Math.max(0.0, volume));

    const selectedVoice = pickBestVoice(voiceSettings?.voiceName);
    if (selectedVoice) {
        utterance.voice = selectedVoice;
    }

    utterance.onstart = () => {
        isAudioPlaying = true;
    };

    // Drive 3D avatar lip-sync accurately on word boundaries
    utterance.onboundary = (event) => {
        if (event.name === 'word') {
            const word = chunk.substring(event.charIndex, event.charIndex + (event.charLength || 6)).trim();
            updateSyntheticWord(word);
        }
    };

    utterance.onend = () => {
        playNextChunk();
    };

    utterance.onerror = (e) => {
        if (e.error !== 'canceled' && e.error !== 'interrupted') {
            console.warn('Speech synthesis chunk error:', e.error);
        }
        playNextChunk();
    };

    // Chromium keep-alive to prevent speech synthesis pausing after 14s
    clearInterval(keepAliveTimer);
    keepAliveTimer = setInterval(() => {
        if (isAudioPlaying && window.speechSynthesis?.speaking) {
            window.speechSynthesis.pause();
            window.speechSynthesis.resume();
        }
    }, 12000);

    window.speechSynthesis.speak(utterance);
}

/**
 * Speak full text, canceling previous utterance and driving 3D avatar lip-sync
 */
export function speak(text, onStart, onEnd) {
    stopSpeaking();
    onEndGlobal = onEnd;

    // Clean markdown, diagrams, formulas, code fences before speech
    const cleanText = text
        .replace(/```[\s\S]*?```/g, ' [Diagram omitted] ')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/[*_#~>]/g, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/\$\$[\s\S]*?\$\$/g, ' [formula] ')
        .replace(/\$[^$]+\$/g, ' [symbol] ')
        .trim();

    if (!cleanText || typeof window === 'undefined' || !window.speechSynthesis) {
        onEnd?.();
        return;
    }

    const chunks = chunkText(cleanText);
    if (chunks.length === 0) {
        onEnd?.();
        return;
    }

    speechQueue = [...chunks];
    isAudioPlaying = true;
    onStart?.();

    // Start synthetic phoneme sync
    startSyntheticSpeech(chunks[0]);
    playNextChunk();
}

/**
 * Enqueue speech without stopping currently speaking content
 */
export function enqueueSpeech(text) {
    const cleanText = text
        .replace(/```[\s\S]*?```/g, '')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/[*_#~>]/g, '')
        .trim();

    const chunks = chunkText(cleanText);
    if (chunks.length === 0) return;

    speechQueue.push(...chunks);

    if (!isAudioPlaying) {
        isAudioPlaying = true;
        startSyntheticSpeech(chunks[0]);
        playNextChunk();
    }
}

/**
 * Stop any active or queued speech
 */
export function stopSpeaking() {
    speechQueue = [];
    isAudioPlaying = false;
    clearInterval(keepAliveTimer);
    keepAliveTimer = null;

    stopSyntheticSpeech();

    if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }

    if (onEndGlobal) {
        const cb = onEndGlobal;
        onEndGlobal = null;
        cb();
    }
}

export function isSpeaking() {
    return isAudioPlaying || (typeof window !== 'undefined' && !!window.speechSynthesis?.speaking);
}
