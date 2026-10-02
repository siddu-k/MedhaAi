import { useState, useCallback } from 'react';
import useAppStore from '../../stores/appStore';
import { startListening, stopListening, isSTTSupported } from '../../services/voiceService';

export default function VoiceControls({ onResult }) {
    const { isListening, setIsListening } = useAppStore();
    const [transcript, setTranscript] = useState('');

    const handleToggle = useCallback(() => {
        if (isListening) {
            stopListening();
            setIsListening(false);
            if (transcript) {
                onResult?.(transcript);
                setTranscript('');
            }
        } else {
            setIsListening(true);
            setTranscript('');
            startListening(
                (text, isFinal) => {
                    setTranscript(text);
                    // Do not call onResult() here; the native onEnd callback 
                    // below will handle sending the complete message once.
                },
                (finalText) => {
                    setIsListening(false);
                    if (finalText) {
                        onResult?.(finalText);
                    }
                    setTranscript('');
                },
                (error) => {
                    console.error('STT error:', error);
                    setIsListening(false);
                    setTranscript('');
                }
            );
        }
    }, [isListening, transcript, onResult]);

    if (!isSTTSupported()) return null;

    return (
        <button
            onClick={handleToggle}
            className={`relative p-2.5 rounded-xl transition-all flex-shrink-0 ${isListening
                ? 'bg-rose-500/10 text-rose-500 pulse-ring border border-rose-500/20'
                : 'text-zinc-500 hover:text-zinc-50 hover:bg-zinc-800'
                }`}
            title={isListening ? 'Stop listening' : 'Start voice input'}
        >
            {isListening ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="1" y1="1" x2="23" y2="23" /><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" /><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .76-.13 1.49-.35 2.17" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
                </svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
                </svg>
            )}
        </button>
    );
}
