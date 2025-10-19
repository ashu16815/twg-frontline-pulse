'use client';

import { useEffect, useState } from 'react';

export default function WebSpeechRecorder({ onText }: { onText: (t: string) => void }) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Check if Web Speech API is supported
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setIsSupported(true);
    }
  }, []);

  const startListening = () => {
    if (!isSupported) {
      setError('Speech recognition not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    setError(''); // Clear any previous errors

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const rec = new SpeechRecognition();

    rec.continuous = false; // Changed to false to avoid aborted errors
    rec.interimResults = false;
    rec.lang = 'en-US';
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      setIsListening(true);
      setError('');
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
        setError(''); // Clear error on successful recognition
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
        setError('No speech detected. Please try speaking again.');
        // Don't show error for no-speech, just restart
        setTimeout(() => {
          if (!isListening) {
            rec.start();
          }
        }, 1000);
        return;
      }
      
      // Handle serious errors with user-friendly messages
      if (event.error === 'network') {
        setError('Network error. Please check your internet connection and try again.');
      } else if (event.error === 'not-allowed') {
        setError('Microphone access denied. Please allow microphone access and try again.');
      } else if (event.error === 'service-not-allowed') {
        setError('Speech recognition service not available. Please try again later.');
      } else {
        setError(`Speech recognition error: ${event.error}. Please try again.`);
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
      setError('Failed to start speech recognition. Please try again.');
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
      <div className='p-4 bg-red-500/10 border border-red-500/30 rounded-lg'>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-red-400 text-lg">❌</span>
          <h3 className="text-lg font-semibold text-red-300">Browser Not Supported</h3>
        </div>
        <p className='text-sm text-red-300'>
          Voice input not supported in this browser. Please use Chrome or Edge, or type your feedback instead.
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-3'>
      {/* Main Recording Interface */}
      <div className='flex gap-3 items-center'>
        {!isListening ? (
          <button 
            className='btn btn-primary text-lg px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold' 
            onClick={startListening}
          >
            🎙️ Start Recording
          </button>
        ) : (
          <button 
            className='btn btn-secondary text-lg px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold' 
            onClick={stopListening}
          >
            ■ Stop Recording
          </button>
        )}
        <div className="flex-1">
          <p className='text-green-300 font-medium'>
            {isListening ? '🎧 Listening... Speak now!' : 'Click to start speaking your feedback'}
          </p>
          <p className='text-sm text-green-400'>
            {isListening ? 'Speak clearly into your microphone' : 'Browser speech recognition - instant results!'}
          </p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className='p-3 bg-red-500/10 border border-red-500/30 rounded-lg'>
          <p className='text-sm text-red-300'>
            ⚠️ {error}
          </p>
        </div>
      )}

      {/* Tips */}
      <div className='p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg'>
        <p className='text-sm text-blue-300'>
          💡 <strong>Tip:</strong> Speak clearly and naturally. You can say things like: 
          "Apparel sales are strong, Home department needs more staff, Toys section is well organized"
        </p>
        <p className='text-xs text-blue-400 mt-1'>
          ✅ No server required • ✅ Works offline • ✅ Instant results
        </p>
      </div>
    </div>
  );
}
