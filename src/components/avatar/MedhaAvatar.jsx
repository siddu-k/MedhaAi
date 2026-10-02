import { useEffect, useRef, useState } from 'react';
import useAppStore from '../../stores/appStore';
import { lipsyncManager, isAudioLive } from '../../services/lipsyncService';

/**
 * Medha 2D — full-body viseme swapping (frames copied byte-identical
 * from MEDHA2D, mapped by file name, never edited).
 *   viseme_REST.png — silence (fallback)
 *   A <- "AH"      E <- "EE"       I <- own frame
 *   O <- rounded   WQ <- "W Q" (U) M <- "M B P"    F <- "F V"
 *   L <- "L T D N" TH <- own frame R <- own frame  G <- own frame (K)
 * Silence rule: REST unless TTS audio is actually audible.
 */

const FRAMES = {
    REST: 'viseme_REST.png',
    A: 'viseme_A.png',
    E: 'viseme_E.png',
    I: 'viseme_I.png',
    O: 'viseme_O.png',
    WQ: 'viseme_WQ.png',
    M: 'viseme_M.png',
    F: 'viseme_F.png',
    L: 'viseme_L.png',
    TH: 'viseme_TH.png',
    R: 'viseme_R.png',
    G: 'viseme_G.png',
};

function visemeToFrame(v) {
    switch (v) {
        case 'viseme_aa': return 'A';
        case 'viseme_E': return 'E';
        case 'viseme_I': return 'I';
        case 'viseme_O': return 'O';
        case 'viseme_U': return 'WQ';
        case 'viseme_PP': return 'M';
        case 'viseme_FF': return 'F';
        case 'viseme_DD': return 'L';
        case 'viseme_TH': return 'TH';
        case 'viseme_RR': return 'R';
        case 'viseme_kk': return 'G';
        case 'viseme_SS': return 'E';
        case 'viseme_CH': return 'A';
        default: return 'REST';
    }
}

if (typeof Image !== 'undefined') {
    Object.values(FRAMES).forEach((f) => { const im = new Image(); im.src = `/art/medha/${f}?v=10`; });
}

export default function MedhaAvatar({ className = '', style = {} }) {
    const { isSpeaking, isAiTyping } = useAppStore();
    const [frame, setFrame] = useState('REST');
    const [blink, setBlink] = useState(false);
    const aliveRef = useRef(true);
    const speakingRef = useRef(false);
    speakingRef.current = !!(isSpeaking || isAiTyping);

    useEffect(() => {
        aliveRef.current = true;
        return () => { aliveRef.current = false; };
    }, []);

    // Swap only while audio is live; otherwise hard REST.
    useEffect(() => {
        const id = setInterval(() => {
            lipsyncManager.processAudio(); // advance word -> viseme from TTS timing
            const vol = lipsyncManager.features?.volume || 0;
            const audible = speakingRef.current
                && isAudioLive()
                && lipsyncManager.state !== 'silence'
                && vol > 0.02;
            const next = audible ? visemeToFrame(lipsyncManager.viseme || 'viseme_sil') : 'REST';
            setFrame((prev) => (prev === next ? prev : next));
        }, 70);
        return () => clearInterval(id);
    }, []);

    // Random blink every 3–6s (whole-frame micro-dim, frames stay registered)
    useEffect(() => {
        let t;
        const loop = () => {
            t = setTimeout(() => {
                if (!aliveRef.current) return;
                setBlink(true);
                setTimeout(() => { if (aliveRef.current) { setBlink(false); loop(); } }, 140);
            }, 3000 + Math.random() * 3000);
        };
        loop();
        return () => clearTimeout(t);
    }, []);

    return (
        <div className={`medha2d-root ${className}`} style={{ position: 'relative', width: '100%', height: '100%', ...style }}>
            {/* Contain-fit stage pinned bottom: % always maps to frame pixels */}
            <div style={{
                position: 'absolute', inset: 0, margin: 'auto auto 0 auto',
                aspectRatio: '1094 / 1437', maxWidth: '100%', maxHeight: '100%',
                animation: 'medha-breathe 4.2s ease-in-out infinite', transformOrigin: '50% 100%',
            }}>
                <img
                    src={`/art/medha/${FRAMES[frame]}?v=10`}
                    alt="Medha"
                    draggable={false}
                    style={{
                        position: 'absolute', inset: 0, width: '100%', height: '100%',
                        filter: blink ? 'brightness(0.97)' : 'none',
                        transition: 'filter 120ms',
                    }}
                    onError={(e) => { if (!e.currentTarget.src.endsWith('viseme_REST.png')) e.currentTarget.src = '/art/medha/viseme_REST.png?v=10'; }}
                />
            </div>
            <style>{`
                @keyframes medha-breathe {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.006); }
                }
            `}</style>
        </div>
    );
}
