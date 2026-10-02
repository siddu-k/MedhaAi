import { Lipsync } from 'wawa-lipsync';

/**
 * Minimal lip-sync state for Medha's 2D viseme swapping.
 * No per-frame audio analysis: TTS word boundaries drive the viseme,
 * and `audioLive` (utterance actually audible) gates everything,
 * so lips hold REST whenever there is no sound.
 */

export const lipsyncManager = new Lipsync({ fftSize: 1024, historySize: 6 });

let isSyntheticSpeaking = false;
let currentWord = '';
let wordStartTime = 0;
let audioLive = false;

export function setAudioLive(live) {
    audioLive = !!live;
    if (!audioLive) {
        lipsyncManager.features = { volume: 0, energy: 0 };
        lipsyncManager.viseme = 'viseme_sil';
        lipsyncManager.state = 'silence';
    }
}

export function isAudioLive() {
    return audioLive;
}

function visemeForChar(ch) {
    switch (ch) {
        case 'a': case 'h': return ['viseme_aa', 'vowel'];
        case 'o': case 'w': return ['viseme_O', 'vowel'];
        case 'e': case 'i': case 'y': return ['viseme_E', 'vowel'];
        case 'u': case 'q': return ['viseme_U', 'vowel'];
        case 'p': case 'b': case 'm': return ['viseme_PP', 'consonant'];
        case 'f': case 'v': return ['viseme_FF', 'consonant'];
        case 't': case 'd': case 'n': case 'l': return ['viseme_DD', 'consonant'];
        case 's': case 'z': case 'c': return ['viseme_SS', 'consonant'];
        case 'k': case 'g': return ['viseme_kk', 'consonant'];
        case 'r': return ['viseme_RR', 'consonant'];
        default: return ['viseme_I', 'vowel'];
    }
}

// Called ~70ms by the avatar renderer via lipsyncManager fields.
lipsyncManager.processAudio = function () {
    if (!isSyntheticSpeaking || !audioLive) {
        this.features = { volume: 0, energy: 0 };
        this.viseme = 'viseme_sil';
        this.state = 'silence';
        return;
    }
    const elapsed = (performance.now() - wordStartTime) / 1000;
    const idx = currentWord ? Math.min(currentWord.length - 1, Math.floor(elapsed * 10)) : 0;
    const [v, s] = visemeForChar((currentWord[idx] || 'a').toLowerCase());
    this.viseme = v;
    this.state = s;
    this.features = { volume: 0.32, energy: 0.5 };
};

export function startSyntheticSpeech(initialText = '') {
    isSyntheticSpeaking = true;
    currentWord = (initialText.split(/\s+/)[0] || '').replace(/[^a-zA-Z]/g, '');
    wordStartTime = performance.now();
}

export function updateSyntheticWord(word) {
    if (!word) return;
    currentWord = word.replace(/[^a-zA-Z]/g, '');
    wordStartTime = performance.now();
}

export function stopSyntheticSpeech() {
    isSyntheticSpeaking = false;
    audioLive = false;
    currentWord = '';
    lipsyncManager.features = { volume: 0, energy: 0 };
    lipsyncManager.viseme = 'viseme_sil';
    lipsyncManager.state = 'silence';
}

export function startProcessing() {}
export function stopProcessing() {}

export function connectAudio(audioElement) {
    try { lipsyncManager.connectAudio(audioElement); } catch (e) {}
}

export function getCurrentViseme() {
    return { viseme: lipsyncManager.viseme, state: lipsyncManager.state };
}
