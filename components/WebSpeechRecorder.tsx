'use client';

import { useEffect, useState } from 'react';

export default function WebSpeechRecorder({ onText }: { onText: (t: string) => void }) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

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
    const rec = new SpeechRecognition();

    rec.continuous = false; // Changed to false to avoid aborted errors
    rec.interimResults = false;
    rec.lang = 'en-US';
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      setIsListening(true);
      console.log('Speech recognition started');
    };

    rec.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        console.log('Speech recognized:', finalTranscript);
        onText(finalTranscript);
      }
    };

    rec.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      
      // Handle specific error types more gracefully
      if (event.error === 'aborted') {
        console.log('Speech recognition was aborted (user stopped or interrupted)');
        setIsListening(false);
        return;
      }
      
      if (event.error === 'no-speech') {
        console.log('No speech detected, trying again...');
        // Don't show error for no-speech, just restart
        setTimeout(() => {
          if (!isListening) {
            rec.start();
          }
        }, 1000);
        return;
      }
      
      // Only show alert for serious errors
      if (event.error === 'network' || event.error === 'not-allowed') {
        alert(`Speech recognition error: ${event.error}. Please check your microphone permissions.`);
      }
      
      setIsListening(false);
    };

    rec.onend = () => {
      console.log('Speech recognition ended');
      setIsListening(false);
    };

    try {
      rec.start();
      setRecognition(rec);
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognition) {
      recognition.stop();
    }
    setIsListening(false);
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
