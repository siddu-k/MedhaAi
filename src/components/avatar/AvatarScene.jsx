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
            {/* 2D Medha slot — drop your 2D PNG at public/art/medha-2d.png */}
            <img
                src="/art/medha-2d.png"
                alt="Medha 2D counsellor"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
                style={{ display: 'none' }}
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                onLoad={(e) => { e.currentTarget.style.display = 'block'; }}
            />
        </div>
    );
}
