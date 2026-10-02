/**
 * Simple fast TTS (Web Speech API) + word-driven lip-sync.
 * One utterance at a time, short sentence queue, no keep-alive hacks.
 */

import {
    startSyntheticSpeech,
    stopSyntheticSpeech,
    updateSyntheticWord,
    setAudioLive,
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
            if (event.results[i].isFinal) finalTranscript += transcript;
            else interim += transcript;
        }
        onResult?.(finalTranscript || interim, !!finalTranscript);
    };
    recognition.onend = () => onEnd?.(finalTranscript);
    recognition.onerror = (event) => {
        if (event.error !== 'aborted') onError?.(event.error);
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

// ─── Text-to-Speech ───
let queue = [];
let playing = false;
let onEndCb = null;
let pickedVoice = null;

function voices() {
    try { return window.speechSynthesis?.getVoices() || []; } catch (e) { return []; }
}

function bestVoice() {
    if (pickedVoice) return pickedVoice;
    const vs = voices().filter((v) => v.lang?.startsWith('en'));
    pickedVoice =
        vs.find((v) => /Natural|Google UK English Female|Jenny|Aria/i.test(v.name) && /^en-(US|GB)$/.test(v.lang)) ||
        vs.find((v) => v.lang === 'en-US') ||
        vs[0] || null;
    return pickedVoice;
}

// Warm up once so the first Read/Speak is instant, not voice-loading slow.
if (typeof window !== 'undefined') {
    const warm = () => {
        try {
            bestVoice();
            const u = new SpeechSynthesisUtterance('');
            u.volume = 0;
            window.speechSynthesis?.speak(u);
            setTimeout(() => { try { window.speechSynthesis?.cancel(); } catch (e) {} }, 100);
        } catch (e) {}
        window.removeEventListener('pointerdown', warm);
        window.removeEventListener('keydown', warm);
    };
    window.addEventListener('pointerdown', warm);
    window.addEventListener('keydown', warm);
    try {
        window.speechSynthesis.onvoiceschanged = () => { pickedVoice = null; };
    } catch (e) {}
}

export function isTTSSupported() {
    return typeof window !== 'undefined' && !!window.speechSynthesis;
}

export function getSystemVoices() {
    return voices().filter((v) => v.lang?.startsWith('en'));
}

function clean(text) {
    return text
        .replace(/```[\s\S]*?```/g, '')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/[*_#~>]/g, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .trim();
}

function splitSentences(text) {
    const out = [];
    const parts = text.match(/[^.?!]+[.?!]+|[^.?!]+$/g) || [text];
    for (const p of parts) {
        const s = p.trim();
        if (!s) continue;
        if (s.length <= 120) out.push(s);
        else {
            // hard cap: break long runs on spaces (short utterances never stall)
            let rest = s;
            while (rest.length > 120) {
                let cut = rest.lastIndexOf(' ', 120);
                if (cut < 40) cut = 120;
                out.push(rest.slice(0, cut).trim());
                rest = rest.slice(cut).trim();
            }
            if (rest) out.push(rest);
        }
    }
    return out;
}

function playNext() {
    if (queue.length === 0) {
        playing = false;
        stopSyntheticSpeech();
        const cb = onEndCb;
        onEndCb = null;
        cb?.();
        return;
    }
    const text = queue.shift();
    const { voiceSettings } = useAppStore.getState();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = Math.min(2, Math.max(0.5, voiceSettings?.rate ?? 1.05));
    u.pitch = Math.min(1.8, Math.max(0.5, voiceSettings?.pitch ?? 1.0));
    u.volume = Math.min(1, Math.max(0, voiceSettings?.volume ?? 1));
    const v = bestVoice();
    if (v) u.voice = v;
    u.onstart = () => {
        setAudioLive(true);
        startSyntheticSpeech(text);
    };
    u.onboundary = (e) => {
        if (e.name === 'word') {
            updateSyntheticWord(text.substring(e.charIndex, e.charIndex + (e.charLength || 6)));
        }
    };
    u.onend = () => { setAudioLive(false); playNext(); };
    u.onerror = () => { setAudioLive(false); playNext(); };
    window.speechSynthesis.speak(u);
}

/** Speak text now (cancels anything playing). */
export function speak(text, onStart, onEnd) {
    const wasSpeaking = playing || !!window.speechSynthesis?.speaking;
    stopSpeaking();
    onEndCb = onEnd || null;
    const cleaned = clean(text);
    if (!cleaned || typeof window === 'undefined' || !window.speechSynthesis) {
        const cb = onEndCb; onEndCb = null; cb?.();
        return;
    }
    const begin = () => {
        queue = splitSentences(cleaned);
        playing = true;
        onStart?.();
        playNext();
    };
    if (wasSpeaking) setTimeout(begin, 150); // Chrome drops speak() right after cancel()
    else begin();
}

/** Queue text behind anything currently playing. */
export function enqueueSpeech(text) {
    const cleaned = clean(text);
    if (!cleaned) return;
    queue.push(...splitSentences(cleaned));
    if (!playing && typeof window !== 'undefined' && window.speechSynthesis) {
        playing = true;
        playNext();
    }
}

/** Stop everything immediately. Lips return to REST. */
export function stopSpeaking() {
    queue = [];
    playing = false;
    setAudioLive(false);
    stopSyntheticSpeech();
    try { window.speechSynthesis?.cancel(); } catch (e) {}
    const cb = onEndCb;
    onEndCb = null;
    cb?.();
}

export function isSpeaking() {
    return playing || (typeof window !== 'undefined' && !!window.speechSynthesis?.speaking);
}
