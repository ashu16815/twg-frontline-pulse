'use client';

import { useState, useEffect } from 'react';

export default function TestSpeechPage() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
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

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      console.log('Speech recognition started');
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        console.log('Speech recognized:', finalTranscript);
        setTranscript(finalTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      
      if (event.error === 'aborted') {
        console.log('Speech recognition was aborted');
        setIsListening(false);
        return;
      }
      
      if (event.error === 'no-speech') {
        console.log('No speech detected');
        setIsListening(false);
        return;
      }
      
      alert(`Speech recognition error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      console.log('Speech recognition ended');
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      setIsListening(false);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <h1 className="text-2xl font-bold mb-4">Speech Recognition Test</h1>
        <p className="text-white/60">Loading...</p>
      </div>
    );
  }

  if (!isSupported) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <h1 className="text-2xl font-bold mb-4">Speech Recognition Test</h1>
        <p className="text-red-400">Speech recognition not supported in this browser.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-4">Speech Recognition Test</h1>
      
      <div className="mb-4">
        <button
          onClick={startListening}
          disabled={isListening}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded"
        >
          {isListening ? 'Listening...' : 'Start Recording'}
        </button>
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Transcript:</h2>
        <div className="bg-gray-800 p-4 rounded min-h-[100px]">
          {transcript || 'No speech detected yet...'}
        </div>
      </div>

      <div className="text-sm text-gray-400">
        <p>Status: {isListening ? 'Listening...' : 'Ready'}</p>
        <p>Supported: {isSupported ? 'Yes' : 'No'}</p>
      </div>
    </div>
  );
}
