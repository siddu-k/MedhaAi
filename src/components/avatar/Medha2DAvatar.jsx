import { useEffect, useRef, useState } from 'react';
import useAppStore from '../../stores/appStore';
import { lipsyncManager, isAudioLive } from '../../services/lipsyncService';

/**
 * Medha 2D — full-body viseme swapping.
 * All 8 frames divided from the same full-body expression grid,
 * so every frame is pixel-registered: only the mouth/expression changes.
 *   /art/medha/full_REST.png — silence (also the fallback)
 *   /art/medha/full_A.png (a, aa)  /art/medha/full_E.png (e, i)
 *   /art/medha/full_O.png (o, u)   /art/medha/full_M.png (m, b, p)
 *   /art/medha/full_F.png (f, v)   /art/medha/full_L.png (l, t, d, n)
 *   /art/medha/full_S.png (s, sh, z)
 * Silence rule: lips show REST unless TTS audio is actually audible
 * (utterance.onstart → audioLive). No sound ever = REST, never stuck.
 */

const FACE_FILES = {
    REST: 'full_REST.png',
    A: 'full_A.png',
    E: 'full_E.png',
    O: 'full_O.png',
    M: 'full_M.png',
    F: 'full_F.png',
    L: 'full_L.png',
    S: 'full_S.png',
};

function visemeToFace(v) {
    switch (v) {
        case 'viseme_aa': return 'A';
        case 'viseme_E':
        case 'viseme_I': return 'E';
        case 'viseme_O':
        case 'viseme_U': return 'O';
        case 'viseme_PP': return 'M';
        case 'viseme_FF': return 'F';
        case 'viseme_DD':
        case 'viseme_TH': return 'L';
        case 'viseme_SS':
        case 'viseme_kk':
        case 'viseme_RR':
        case 'viseme_CH': return 'S';
        default: return 'REST';
    }
}

// Preload all frames once so swaps never flash.
if (typeof Image !== 'undefined') {
    Object.values(FACE_FILES).forEach((f) => { const im = new Image(); im.src = `/art/medha/${f}?v=5`; });
}

export default function Medha2DAvatar({ className = '', style = {} }) {
    const { isSpeaking, isAiTyping } = useAppStore();
    const [face, setFace] = useState('REST');
    const [blink, setBlink] = useState(false);
    const aliveRef = useRef(true);
    const speakingRef = useRef(false);
    speakingRef.current = !!(isSpeaking || isAiTyping);

    useEffect(() => {
        aliveRef.current = true;
        return () => { aliveRef.current = false; };
    }, []);

    // Swap only while audio is live; otherwise hard REST (fixes stuck mouth).
    useEffect(() => {
        const id = setInterval(() => {
            const vol = lipsyncManager.features?.volume || 0;
            const audible = speakingRef.current
                && isAudioLive()
                && lipsyncManager.state !== 'silence'
                && vol > 0.02;
            const next = audible ? visemeToFace(lipsyncManager.viseme || 'viseme_sil') : 'REST';
            setFace((prev) => (prev === next ? prev : next));
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
            <img
                src={`/art/medha/${FACE_FILES[face]}?v=5`}
                alt="Medha"
                draggable={false}
                style={{
                    width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center bottom',
                    filter: blink ? 'brightness(0.97)' : 'none',
                    transition: 'filter 120ms',
                }}
                onError={(e) => { if (!e.currentTarget.src.endsWith('full_REST.png')) e.currentTarget.src = '/art/medha/full_REST.png?v=5'; }}
            />
            <style>{`
                @keyframes medha-breathe {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.006); }
                }
            `}</style>
        </div>
    );
}
