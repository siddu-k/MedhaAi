import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { lipsyncManager } from '../../services/lipsyncService';

/* Medha v3 — slim proportions, no face-covering geometry */

function makeKurtaTexture() {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 512;
    const g = c.getContext('2d');
    g.fillStyle = '#f5ede0'; g.fillRect(0, 0, 512, 512);
    g.fillStyle = 'rgba(180,150,110,0.06)';
    for (let y = 0; y < 512; y += 4) g.fillRect(0, y, 512, 1);
    g.strokeStyle = '#a83232'; g.lineWidth = 6;
    g.beginPath(); g.moveTo(206, 8); g.lineTo(256, 90); g.lineTo(306, 8); g.stroke();
    g.strokeStyle = '#d9a03a'; g.lineWidth = 2.5;
    g.beginPath(); g.moveTo(214, 8); g.lineTo(256, 80); g.lineTo(298, 8); g.stroke();
    const flower = (x, y, s) => {
        g.fillStyle = '#b03030';
        for (let i = 0; i < 5; i++) {
            const a = (i / 5) * Math.PI * 2;
            g.beginPath();
            g.ellipse(x + Math.cos(a) * 7 * s, y + Math.sin(a) * 7 * s, 5 * s, 3 * s, a, 0, Math.PI * 2);
            g.fill();
        }
        g.fillStyle = '#d9a03a';
        g.beginPath(); g.arc(x, y, 4 * s, 0, Math.PI * 2); g.fill();
    };
    flower(256, 140, 1); flower(228, 180, 0.8); flower(284, 180, 0.8);
    g.fillStyle = '#a83232'; g.fillRect(0, 474, 512, 8);
    g.fillStyle = '#d9a03a'; g.fillRect(0, 466, 512, 4);
    for (let x = 24; x < 512; x += 46) flower(x, 442, 0.65);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
}

function makeDupattaTexture() {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 512;
    const g = c.getContext('2d');
    g.fillStyle = '#7a1f1f'; g.fillRect(0, 0, 256, 512);
    g.fillStyle = 'rgba(217,160,58,0.28)';
    for (let y = 30; y < 512; y += 56) for (let x = 24; x < 256; x += 48) { g.beginPath(); g.arc(x, y, 5, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = '#d9a03a'; g.fillRect(0, 0, 14, 512); g.fillRect(242, 0, 14, 512);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
}

const VISEME_MOUTH = {
    viseme_sil: { open: 0.02, wide: 0.45 },
    viseme_aa: { open: 0.95, wide: 0.62 },
    viseme_E: { open: 0.42, wide: 0.95 },
    viseme_I: { open: 0.35, wide: 0.85 },
    viseme_O: { open: 0.75, wide: 0.34 },
    viseme_U: { open: 0.38, wide: 0.36 },
    viseme_PP: { open: 0.04, wide: 0.5 },
    viseme_FF: { open: 0.18, wide: 0.6 },
    viseme_DD: { open: 0.3, wide: 0.62 },
    viseme_SS: { open: 0.28, wide: 0.7 },
    viseme_kk: { open: 0.5, wide: 0.55 },
    viseme_RR: { open: 0.4, wide: 0.6 },
};

export function MedhaAvatar(props) {
    const root = useRef();
    const headGrp = useRef();
    const jawGrp = useRef();
    const mouthOuter = useRef();
    const mouthInner = useRef();
    const eyeGrpL = useRef();
    const eyeGrpR = useRef();
    const bodyGrp = useRef();
    const [blink, setBlink] = useState(false);
    const mouthState = useRef({ open: 0.02, wide: 0.45 });

    const kurtaTex = useMemo(() => (typeof document !== 'undefined' ? makeKurtaTexture() : null), []);
    const dupattaTex = useMemo(() => (typeof document !== 'undefined' ? makeDupattaTexture() : null), []);

    const mats = useMemo(() => ({
        skin: new THREE.MeshStandardMaterial({ color: '#f0c39f', roughness: 0.55 }),
        skinShadow: new THREE.MeshStandardMaterial({ color: '#dfa17e', roughness: 0.6 }),
        hair: new THREE.MeshStandardMaterial({ color: '#171114', roughness: 0.38 }),
        eyeWhite: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.25 }),
        iris: new THREE.MeshStandardMaterial({ color: '#4a2c14', roughness: 0.3 }),
        pupil: new THREE.MeshStandardMaterial({ color: '#0d0906', roughness: 0.2 }),
        liner: new THREE.MeshStandardMaterial({ color: '#1a1214', roughness: 0.5 }),
        lip: new THREE.MeshStandardMaterial({ color: '#c26a63', roughness: 0.5 }),
        mouthIn: new THREE.MeshStandardMaterial({ color: '#571e1e', roughness: 0.85 }),
        kurta: new THREE.MeshStandardMaterial({ map: kurtaTex, roughness: 0.85 }),
        salwar: new THREE.MeshStandardMaterial({ color: '#7a1f1f', roughness: 0.8 }),
        dupatta: new THREE.MeshStandardMaterial({ map: dupattaTex, roughness: 0.75, side: THREE.DoubleSide }),
        gold: new THREE.MeshStandardMaterial({ color: '#d9a03a', metalness: 0.8, roughness: 0.32 }),
        tablet: new THREE.MeshStandardMaterial({ color: '#15151a', roughness: 0.45 }),
        shoe: new THREE.MeshStandardMaterial({ color: '#8a2e2e', roughness: 0.6 }),
    }), [kurtaTex, dupattaTex]);

    useEffect(() => {
        let t;
        const loop = () => {
            t = setTimeout(() => {
                setBlink(true);
                setTimeout(() => { setBlink(false); loop(); }, 160);
            }, THREE.MathUtils.randInt(2000, 4500));
        };
        loop();
        return () => clearTimeout(t);
    }, []);

    useFrame((state) => {
        const t = state.clock.elapsedTime;
        lipsyncManager.processAudio();
        const v = lipsyncManager.viseme || 'viseme_sil';
        const vol = lipsyncManager.features?.volume || 0;
        const speaking = lipsyncManager.state !== 'silence' && vol > 0.03;
        const target = VISEME_MOUTH[v] || VISEME_MOUTH.viseme_sil;
        const amp = speaking ? THREE.MathUtils.clamp(vol * 2.4, 0.25, 1) : 0;
        const wantOpen = speaking ? target.open * amp : 0.06;
        mouthState.current.open = THREE.MathUtils.lerp(mouthState.current.open, wantOpen, speaking ? 0.5 : 0.1);
        mouthState.current.wide = THREE.MathUtils.lerp(mouthState.current.wide, target.wide, 0.3);
        const { open, wide } = mouthState.current;
        if (mouthOuter.current) {
            mouthOuter.current.scale.set(0.5 + wide * 0.6, 0.22 + open * 0.9, 1);
            mouthOuter.current.position.y = -0.052 - open * 0.015;
        }
        if (mouthInner.current) {
            mouthInner.current.scale.set(0.36 + wide * 0.45, 0.12 + open * 0.7, 1);
            mouthInner.current.visible = open > 0.07;
        }
        if (jawGrp.current) {
            jawGrp.current.position.y = -open * 0.04;
        }
        const eyeS = blink ? 0.1 : 1;
        if (eyeGrpL.current) eyeGrpL.current.scale.y = THREE.MathUtils.lerp(eyeGrpL.current.scale.y, eyeS, 0.55);
        if (eyeGrpR.current) eyeGrpR.current.scale.y = THREE.MathUtils.lerp(eyeGrpR.current.scale.y, eyeS, 0.55);
        if (headGrp.current) {
            const nod = speaking ? Math.sin(t * 6) * 0.02 * amp : Math.sin(t * 1.2) * 0.01;
            headGrp.current.rotation.x = THREE.MathUtils.lerp(headGrp.current.rotation.x, nod, 0.12);
            headGrp.current.rotation.y = THREE.MathUtils.lerp(headGrp.current.rotation.y, Math.sin(t * 0.9) * 0.03, 0.08);
            headGrp.current.position.y = 1.44 + Math.sin(t * 1.6) * 0.004;
        }
        if (bodyGrp.current) bodyGrp.current.position.y = Math.sin(t * 1.6) * 0.005;
    });

    return (
        <group ref={root} {...props} dispose={null}>
            <group ref={bodyGrp}>
                {/* legs */}
                <mesh position={[-0.09, 0.30, 0]} material={mats.salwar}>
                    <capsuleGeometry args={[0.07, 0.38, 6, 12]} />
                </mesh>
                <mesh position={[0.09, 0.30, 0]} material={mats.salwar}>
                    <capsuleGeometry args={[0.07, 0.38, 6, 12]} />
                </mesh>
                {[-0.09, 0.09].map((x) => (
                    <mesh key={x} position={[x, 0.04, 0.045]} scale={[1, 0.6, 1.3]} material={mats.shoe}>
                        <sphereGeometry args={[0.06, 14, 10]} />
                    </mesh>
                ))}
                {/* kurta — slim, top BELOW chin */}
                <mesh position={[0, 0.86, 0]} material={mats.kurta}>
                    <cylinderGeometry args={[0.165, 0.235, 0.66, 24]} />
                </mesh>
                {/* shoulders */}
                <mesh position={[0, 1.17, 0]} scale={[1.25, 0.5, 0.9]} material={mats.kurta}>
                    <sphereGeometry args={[0.14, 20, 14]} />
                </mesh>
                {/* arms slim */}
                <group position={[-0.20, 1.12, 0]} rotation={[0, 0, 0.12]}>
                    <mesh position={[0, -0.18, 0]} material={mats.kurta}>
                        <capsuleGeometry args={[0.042, 0.30, 6, 10]} />
                    </mesh>
                    <mesh position={[0, -0.38, 0.01]} material={mats.skin}>
                        <sphereGeometry args={[0.042, 12, 10]} />
                    </mesh>
                </group>
                <group position={[0.20, 1.12, 0]} rotation={[0, 0, -0.35]}>
                    <mesh position={[0, -0.18, 0]} material={mats.kurta}>
                        <capsuleGeometry args={[0.042, 0.30, 6, 10]} />
                    </mesh>
                    <mesh position={[0.01, -0.38, 0.03]} material={mats.skin}>
                        <sphereGeometry args={[0.042, 12, 10]} />
                    </mesh>
                </group>
                {/* tablet */}
                <mesh position={[-0.19, 0.72, 0.13]} rotation={[-0.25, 0.25, 0.08]} material={mats.tablet}>
                    <boxGeometry args={[0.16, 0.22, 0.018]} />
                </mesh>
                {/* dupatta — thin side drapes, away from face */}
                <mesh position={[-0.17, 0.72, 0.06]} rotation={[0.06, 0.2, 0.06]} material={mats.dupatta}>
                    <planeGeometry args={[0.13, 0.72]} />
                </mesh>
                <mesh position={[0.17, 0.78, -0.10]} rotation={[0.08, -0.5, -0.05]} material={mats.dupatta}>
                    <planeGeometry args={[0.12, 0.62]} />
                </mesh>
            </group>

            {/* HEAD — small, high, clear of body */}
            <group ref={headGrp} position={[0, 1.44, 0]}>
                <mesh position={[0, -0.13, 0]} material={mats.skinShadow}>
                    <cylinderGeometry args={[0.048, 0.06, 0.14, 12]} />
                </mesh>
                {/* skull */}
                <mesh material={mats.skin}>
                    <sphereGeometry args={[0.125, 32, 24]} />
                </mesh>
                {/* chin */}
                <mesh position={[0, -0.075, 0.015]} scale={[0.82, 0.62, 0.82]} material={mats.skin}>
                    <sphereGeometry args={[0.095, 20, 14]} />
                </mesh>

                {/* eyes — blink via group scale */}
                {[{ x: -0.047, ref: eyeGrpL }, { x: 0.047, ref: eyeGrpR }].map(({ x, ref }, i) => (
                    <group key={x} ref={ref} position={[x, 0.008, 0.104]}>
                        <mesh material={mats.eyeWhite} scale={[1, 1.3, 0.45]}>
                            <sphereGeometry args={[0.024, 16, 12]} />
                        </mesh>
                        <mesh position={[0, -0.001, 0.014]} material={mats.iris}>
                            <sphereGeometry args={[0.0125, 12, 10]} />
                        </mesh>
                        <mesh position={[0, -0.001, 0.022]} material={mats.pupil}>
                            <sphereGeometry args={[0.0058, 8, 8]} />
                        </mesh>
                        <mesh position={[0, 0.022, 0.002]} rotation={[0, 0, i === 0 ? 0.12 : -0.12]} material={mats.liner}>
                            <boxGeometry args={[0.05, 0.006, 0.008]} />
                        </mesh>
                    </group>
                ))}
                {/* brows */}
                <mesh position={[-0.048, 0.072, 0.102]} rotation={[0, 0, 0.1]} material={mats.liner}>
                    <boxGeometry args={[0.048, 0.007, 0.006]} />
                </mesh>
                <mesh position={[0.048, 0.072, 0.102]} rotation={[0, 0, -0.1]} material={mats.liner}>
                    <boxGeometry args={[0.048, 0.007, 0.006]} />
                </mesh>
                {/* nose */}
                <mesh position={[0, -0.028, 0.12]} rotation={[0.25, 0, 0]} material={mats.skinShadow}>
                    <coneGeometry args={[0.011, 0.028, 8]} />
                </mesh>
                {/* jhumkas */}
                {[-0.124, 0.124].map((x) => (
                    <group key={x} position={[x, -0.025, 0.005]}>
                        <mesh material={mats.gold}><sphereGeometry args={[0.009, 8, 8]} /></mesh>
                        <mesh position={[0, -0.022, 0]} material={mats.gold}><coneGeometry args={[0.013, 0.026, 8]} /></mesh>
                    </group>
                ))}

                {/* mouth */}
                <group ref={jawGrp} position={[0, 0, 0.095]}>
                    <mesh ref={mouthOuter} position={[0, -0.052, 0.012]} material={mats.lip}>
                        <sphereGeometry args={[0.024, 14, 10]} />
                    </mesh>
                    <mesh ref={mouthInner} position={[0, -0.054, 0.014]} material={mats.mouthIn}>
                        <sphereGeometry args={[0.018, 12, 8]} />
                    </mesh>
                </group>

                {/* HAIR — tight cap, no face cover */}
                <mesh position={[0, 0.015, -0.045]} scale={[1.14, 1.18, 1.05]} material={mats.hair}>
                    <sphereGeometry args={[0.125, 24, 18]} />
                </mesh>
                <mesh position={[0, 0.055, 0.005]} scale={[1.06, 0.82, 1.0]} material={mats.hair}>
                    <sphereGeometry args={[0.126, 24, 18, 0, Math.PI * 2, 0, Math.PI * 0.52]} />
                </mesh>
                {/* side bobs — behind ears */}
                <mesh position={[-0.12, -0.045, -0.01]} scale={[0.42, 0.85, 0.65]} material={mats.hair}>
                    <sphereGeometry args={[0.085, 14, 12]} />
                </mesh>
                <mesh position={[0.12, -0.045, -0.01]} scale={[0.42, 0.85, 0.65]} material={mats.hair}>
                    <sphereGeometry args={[0.085, 14, 12]} />
                </mesh>
                {/* bangs — thin strip high on forehead */}
                <mesh position={[0, 0.082, 0.088]} rotation={[-0.1, 0, 0]} material={mats.hair}>
                    <boxGeometry args={[0.185, 0.038, 0.035]} />
                </mesh>
            </group>
        </group>
    );
}

export default MedhaAvatar;
