'use client';

import { useEffect, useState } from 'react';

export default function WebSpeechRecorder({ onText }: { onText: (t: string) => void }) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if Web Speech API is supported
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setIsSupported(true);
    }
  }, []);

  const startListening = () => {
    if (!isSupported) {
      alert('Speech recognition not supported in this browser');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        onText(finalTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      alert(`Speech recognition error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const stopListening = () => {
    setIsListening(false);
    // The recognition will stop automatically
  };

  if (!isSupported) {
    return (
      <div className='card p-4 rounded-xl space-y-2'>
        <p className='text-xs text-amber-600'>
          Voice input not supported in this browser. Please type your feedback instead.
        </p>
      </div>
    );
  }

  return (
    <div className='card p-4 rounded-xl space-y-2'>
      <div className='flex gap-2 items-center'>
        {!isListening ? (
          <button className='btn' onClick={startListening}>
            🎙️ Start recording (Browser)
          </button>
        ) : (
          <button className='btn' onClick={stopListening}>
            ■ Stop
          </button>
        )}
        <span className='text-slate-600 text-sm'>
          {isListening ? 'Listening...' : 'Tap to speak your Top-3 (Browser Speech API)'}
        </span>
      </div>
      <p className='text-xs text-slate-500'>
        Tip: speak in order: "Apparel…; Home…; Toys…" You can edit text afterward.
      </p>
      <p className='text-xs text-blue-600'>
        Using browser built-in speech recognition (no server required).
      </p>
    </div>
  );
}
