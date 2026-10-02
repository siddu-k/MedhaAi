import { Lipsync } from 'wawa-lipsync';

/**
 * Lip Sync Service — manages wawa-lipsync instance, physical audio connections,
 * and high-fidelity synthetic phoneme generation for Web Speech Synthesis.
 */

export const lipsyncManager = new Lipsync({
    fftSize: 1024,
    historySize: 6,
});

let animationFrameId = null;
let isSyntheticSpeaking = false;
let currentWord = '';
let wordStartTime = 0;
let hasPhysicalAudio = false;

// Store original processAudio to delegate when physical audio is present
const originalProcessAudio = lipsyncManager.processAudio.bind(lipsyncManager);

/**
 * Enhanced processAudio handles both physical Web Audio analyzers and synthetic speech
 */
lipsyncManager.processAudio = function () {
    if (hasPhysicalAudio && !isSyntheticSpeaking) {
        return originalProcessAudio();
    }

    if (!isSyntheticSpeaking) {
        this.features = { volume: 0, energy: 0 };
        this.viseme = 'viseme_sil';
        this.state = 'silence';
        return;
    }

    // Generate natural speech cadence and mouth opening
    const now = performance.now();
    const elapsedSinceWord = (now - wordStartTime) / 1000;

    // Multi-frequency syllable rhythm (4–6 Hz average conversational syllable frequency)
    const wave1 = Math.sin(now * 0.022) * 0.5 + 0.5;
    const wave2 = Math.cos(now * 0.015) * 0.5 + 0.5;
    const dynamicVolume = 0.12 + 0.22 * (wave1 * 0.65 + wave2 * 0.35);

    this.features = {
        volume: dynamicVolume,
        energy: dynamicVolume * 1.6,
    };

    let activeViseme = 'viseme_aa';
    let activeState = 'vowel';

    if (currentWord && currentWord.length > 0) {
        // Sample phoneme based on progression through current spoken word
        const charIdx = Math.min(
            currentWord.length - 1,
            Math.floor(elapsedSinceWord * 10)
        );
        const char = currentWord[charIdx]?.toLowerCase() || 'a';

        if (['a', 'h'].includes(char)) {
            activeViseme = 'viseme_aa';
            activeState = 'vowel';
        } else if (['o', 'w'].includes(char)) {
            activeViseme = 'viseme_O';
            activeState = 'vowel';
        } else if (['e', 'i', 'y'].includes(char)) {
            activeViseme = 'viseme_E';
            activeState = 'vowel';
        } else if (['u', 'q'].includes(char)) {
            activeViseme = 'viseme_U';
            activeState = 'vowel';
        } else if (['p', 'b', 'm'].includes(char)) {
            activeViseme = 'viseme_PP';
            activeState = 'consonant';
        } else if (['f', 'v'].includes(char)) {
            activeViseme = 'viseme_FF';
            activeState = 'consonant';
        } else if (['t', 'd', 'n', 'l'].includes(char)) {
            activeViseme = 'viseme_DD';
            activeState = 'consonant';
        } else if (['s', 'z', 'c'].includes(char)) {
            activeViseme = 'viseme_SS';
            activeState = 'consonant';
        } else if (['k', 'g'].includes(char)) {
            activeViseme = 'viseme_kk';
            activeState = 'consonant';
        } else if (['r'].includes(char)) {
            activeViseme = 'viseme_RR';
            activeState = 'consonant';
        } else {
            activeViseme = 'viseme_I';
            activeState = 'vowel';
        }
    } else {
        // Natural cycling viseme sequence
        const visemePool = [
            { v: 'viseme_aa', s: 'vowel' },
            { v: 'viseme_O', s: 'vowel' },
            { v: 'viseme_E', s: 'vowel' },
            { v: 'viseme_PP', s: 'consonant' },
            { v: 'viseme_DD', s: 'consonant' },
            { v: 'viseme_SS', s: 'consonant' },
            { v: 'viseme_U', s: 'vowel' },
        ];
        const poolIndex = Math.floor((now * 0.007) % visemePool.length);
        activeViseme = visemePool[poolIndex].v;
        activeState = visemePool[poolIndex].s;
    }

    this.viseme = activeViseme;
    this.state = activeState;
};

/**
 * Start synthetic speech lip-sync mode
 */
export function startSyntheticSpeech(initialText = '') {
    isSyntheticSpeaking = true;
    currentWord = initialText.split(/\s+/)[0] || '';
    wordStartTime = performance.now();
    startProcessing();
}

/**
 * Update the active spoken word from Web Speech API boundary events
 */
export function updateSyntheticWord(word) {
    if (!word) return;
    currentWord = word.replace(/[^a-zA-Z]/g, '');
    wordStartTime = performance.now();
}

/**
 * Stop synthetic speech lip-sync mode
 */
export function stopSyntheticSpeech() {
    isSyntheticSpeaking = false;
    currentWord = '';
    lipsyncManager.features = { volume: 0, energy: 0 };
    lipsyncManager.viseme = 'viseme_sil';
    lipsyncManager.state = 'silence';
}

/**
 * Start the lipsync processing loop
 */
export function startProcessing() {
    if (animationFrameId) return;

    const loop = () => {
        animationFrameId = requestAnimationFrame(loop);
        lipsyncManager.processAudio();
    };
    loop();
}

/**
 * Stop the lipsync processing loop
 */
export function stopProcessing() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
}

/**
 * Connect a physical HTMLAudioElement to the lipsync manager
 */
export function connectAudio(audioElement) {
    try {
        hasPhysicalAudio = true;
        lipsyncManager.connectAudio(audioElement);
        startProcessing();
    } catch (e) {
        console.error('Lipsync audio connection error:', e);
    }
}

/**
 * Get the current viseme from lipsync manager
 */
export function getCurrentViseme() {
    return {
        viseme: lipsyncManager.viseme,
        state: lipsyncManager.state,
    };
}
