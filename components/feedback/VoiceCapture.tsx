'use client';
import { useEffect, useRef, useState } from 'react';

export default function VoiceCapture({ onText }: { onText: (t: string) => void }) {
  const [recording, setRecording] = useState(false);
  const recRef = useRef<any>(null);
  const supported = typeof window !== 'undefined' && ('webkitSpeechRecognition' in (window as any) || 'SpeechRecognition' in (window as any));

  useEffect(() => {
    if (!supported) return;
    
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    recRef.current = new SR();
    recRef.current.lang = 'en-NZ';
    recRef.current.continuous = false;
    recRef.current.interimResults = true;
    
    recRef.current.onresult = (e: any) => {
      let text = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        text += e.results[i][0].transcript;
      }
      if (text) onText(text);
    };
    
    recRef.current.onend = () => setRecording(false);
  }, [supported, onText]);

  const toggle = () => {
    if (!supported) return alert('Voice not supported on this browser');
    
    if (recording) {
      recRef.current?.stop();
      setRecording(false);
    } else {
      onText('');
      recRef.current?.start();
      setRecording(true);
    }
  };

  return (
    <button 
      type='button' 
      className={'btn ' + (recording ? 'btn-primary' : '')} 
      onClick={toggle} 
      aria-label='Dictate'
    >
      🎤 {recording ? 'Listening…' : 'Speak'}
    </button>
  );
}