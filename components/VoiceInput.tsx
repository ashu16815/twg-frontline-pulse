'use client';

import { useState, useEffect } from 'react';

interface VoiceInputProps {
  onText: (text: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function VoiceInput({ onText, placeholder = "Click mic to speak", disabled = false }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Check if Web Speech API is supported
    if (typeof window !== 'undefined') {
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        setIsSupported(true);
        console.log('✅ Web Speech API is supported');
      } else {
        console.log('❌ Web Speech API not supported');
        setError('Speech recognition not supported in this browser');
      }
    }
  }, []);

  const startListening = async () => {
    if (!isSupported || disabled) {
      setError('Speech recognition not supported or disabled');
      return;
    }

    setError(''); // Clear any previous errors
    console.log('🎙️ Starting voice input...');

    // Check microphone permissions
    try {
      if (navigator.permissions) {
        const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        console.log('🎤 Microphone permission:', permission.state);
        if (permission.state === 'denied') {
          setError('Microphone access denied. Please enable in browser settings.');
          return;
        }
      }
    } catch (e) {
      console.log('Could not check microphone permissions:', e);
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const rec = new SpeechRecognition();

    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      setIsListening(true);
      setError('');
      console.log('Voice input started');
    };

    rec.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        console.log('Voice input recognized:', finalTranscript);
        onText(finalTranscript);
        setError(''); // Clear error on successful recognition
      }
    };

    rec.onerror = (event: any) => {
      console.error('❌ Voice input error:', event.error);
      
      // Handle specific error types more gracefully
      if (event.error === 'aborted') {
        console.log('Voice input was aborted');
        setIsListening(false);
        return;
      }
      
      if (event.error === 'no-speech') {
        setError('No speech detected. Please try again.');
        setTimeout(() => {
          if (!isListening) {
            rec.start();
          }
        }, 1000);
        return;
      }
      
      // Handle serious errors with user-friendly messages
      if (event.error === 'network') {
        setError('Network error. Please check your connection.');
      } else if (event.error === 'not-allowed') {
        setError('Microphone access denied. Please allow microphone access.');
      } else if (event.error === 'service-not-allowed') {
        setError('Speech recognition service not available.');
      } else {
        setError(`Speech recognition error: ${event.error}`);
      }
      
      setIsListening(false);
    };

    rec.onend = () => {
      console.log('Voice input ended');
      setIsListening(false);
    };

    try {
      rec.start();
      setRecognition(rec);
    } catch (error) {
      console.error('Failed to start voice input:', error);
      setError('Failed to start voice input. Please try again.');
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
      <div className="flex flex-col items-center gap-1">
        <button 
          disabled 
          className="p-2 text-gray-400 cursor-not-allowed"
          title="Speech recognition not supported in this browser"
        >
          🎙️
        </button>
        <span className="text-xs text-gray-400">Not supported</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {!isListening ? (
        <button 
          onClick={startListening}
          disabled={disabled}
          className={`p-2 rounded-lg transition-colors ${
            disabled 
              ? 'text-gray-400 cursor-not-allowed' 
              : 'text-green-400 hover:text-green-300 hover:bg-green-500/10'
          }`}
          title="Click to speak"
        >
          🎙️
        </button>
      ) : (
        <button 
          onClick={stopListening}
          className="p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
          title="Click to stop"
        >
          ■
        </button>
      )}
      
      {/* Status indicator */}
      {isListening && (
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
          <span className="text-xs text-red-400">Listening...</span>
        </div>
      )}
      
      {/* Error display */}
      {error && (
        <div className="text-xs text-red-400 max-w-32 truncate" title={error}>
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}
