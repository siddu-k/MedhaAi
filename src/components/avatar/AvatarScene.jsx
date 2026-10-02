import { Canvas } from '@react-three/fiber';
import { CameraControls } from '@react-three/drei';
import { Suspense, useEffect, useRef } from 'react';
import { DoctorAvatar } from './DoctorAvatar';
import useAppStore from '../../stores/appStore';

function AvatarExperience() {
    const controls = useRef();
    const { avatarCustomization } = useAppStore();
    const mood = avatarCustomization?.lightingMood || 'clinical';

    useEffect(() => {
        if (controls.current) {
            controls.current.setLookAt(1, 2.2, 10, 0, 1.5, 0);
            controls.current.setLookAt(0.1, 1.7, 1.2, 0, 1.5, 0, true);
        }
    }, []);

    return (
        <>
            <CameraControls ref={controls} minDistance={0.5} maxDistance={5} />
            {mood === 'cyberpunk' ? (
                <>
                    <ambientLight intensity={0.35} />
                    <directionalLight position={[2, 3, 5]} intensity={1.6} color="#06b6d4" />
                    <directionalLight position={[-2, 1, -3]} intensity={1.2} color="#f43f5e" />
                    <directionalLight position={[0, -1, 2]} intensity={0.7} color="#8b5cf6" />
                </>
            ) : mood === 'warm' ? (
                <>
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[2, 3, 5]} intensity={1.8} color="#fef08a" />
                    <directionalLight position={[-2, 1, -3]} intensity={0.8} color="#f59e0b" />
                    <directionalLight position={[0, -1, 2]} intensity={0.4} color="#fda4af" />
                </>
            ) : mood === 'studio' ? (
                <>
                    <ambientLight intensity={0.45} />
                    <directionalLight position={[2, 3, 5]} intensity={2.0} color="#ffffff" />
                    <directionalLight position={[-2, 1, -3]} intensity={0.7} color="#cbd5e1" />
                    <directionalLight position={[0, -1, 2]} intensity={0.3} color="#94a3b8" />
                </>
            ) : (
                <>
                    <ambientLight intensity={0.4} />
                    <directionalLight position={[2, 3, 5]} intensity={1.8} color="#ffffff" />
                    <directionalLight position={[-2, 1, -3]} intensity={0.6} color="#14b8a6" />
                    <directionalLight position={[0, -1, 2]} intensity={0.3} color="#06b6d4" />
                </>
            )}
            <DoctorAvatar />
        </>
    );
}

export default function AvatarScene() {
    return (
        <div
            className="w-full h-full relative overflow-hidden"
            style={{
                width: '100%',
                height: '100%',
                backgroundImage: 'url(/art/mandala-backdrop.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundColor: '#fcefd6',
            }}
        >
            {/* Original Doctor 3D avatar on top of mandala */}
            <div className="absolute inset-0" style={{ zIndex: 2 }}>
                <Canvas
                    dpr={[1, 1.5]}
                    camera={{ position: [0.1, 1.7, 1.2], fov: 30 }}
                    gl={{ powerPreference: 'high-performance', antialias: true, alpha: true }}
                    onCreated={({ gl }) => {
                        gl.domElement.addEventListener('webglcontextlost', (event) => { event.preventDefault(); }, false);
                    }}
                >
                    <Suspense fallback={null}>
                        <AvatarExperience />
                    </Suspense>
                </Canvas>
            </div>
        </div>
    );
}
