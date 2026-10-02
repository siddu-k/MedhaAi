import { useEffect, useRef } from 'react';

export default function UserVideo() {
    const videoRef = useRef(null);

    useEffect(() => {
        let stream = null;
        async function setupCamera() {
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 1280, height: 720 },
                    audio: false
                });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error("Camera access denied or found no camera:", err);
            }
        }
        setupCamera();

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    return (
        <div className="relative w-full h-full bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl">
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]" // Mirror effect
            />
            {/* Overlay UI */}
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-bold text-white uppercase tracking-wider">Live Feed</span>
            </div>

            <div className="absolute inset-0 border-[12px] border-zinc-950/20 pointer-events-none rounded-2xl" />
        </div>
    );
}
