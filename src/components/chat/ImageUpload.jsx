import { useRef } from 'react';

export default function ImageUpload({ onImageSelect }) {
    const fileInputRef = useRef(null);

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            onImageSelect(file);
            e.target.value = '';
        }
    };

    return (
        <>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleChange}
                className="hidden"
            />
            <button
                onClick={handleClick}
                className="p-2.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors flex-shrink-0"
                title="Attach an image"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                </svg>
            </button>
        </>
    );
}
