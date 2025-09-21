'use client';

import { useEffect, useRef, useState } from 'react';

export default function VoiceRecorder({ onText }: { onText: (t: string) => void }) {
  const [rec, setRec] = useState<MediaRecorder | null>(null);
  const [chunks, setChunks] = useState<BlobPart[]>([]);
  const [recording, setRecording] = useState(false);
  const [sec, setSec] = useState(0);

  useEffect(() => {
    let t: any;
    if (recording) {
      t = setInterval(() => setSec(s => s + 1), 1000);
    }
    return () => clearInterval(t);
  }, [recording]);

  async function start() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream);
    setChunks([]);
    setSec(0);
    
    mr.ondataavailable = (e) => setChunks(c => [...c, e.data]);
    mr.onstop = async () => {
      const blob = new Blob(chunks, { type: mr.mimeType });
      const fd = new FormData();
      fd.append('file', blob, 'audio.webm');
      fd.append('mime', mr.mimeType);
      
      try {
        const r = await fetch('/api/transcribe', { method: 'POST', body: fd });
        if (r.ok) {
          const { text } = await r.json();
          onText(text);
        } else {
          const error = await r.json();
          console.error('Transcription error:', error);
          alert(`Transcription failed: ${error.error || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Transcription request failed:', error);
        alert('Transcription service unavailable. Please type your feedback instead.');
      }
    };
    
    mr.start(250);
    setRec(mr);
    setRecording(true);
  }

  function stop() {
    rec?.stop();
    setRecording(false);
  }

  return (
    <div className='card p-4 rounded-xl space-y-2'>
      <div className='flex gap-2 items-center'>
        {!recording ? (
          <button className='btn' onClick={start}>
            🎙️ Start recording
          </button>
        ) : (
          <button className='btn' onClick={stop}>
            ■ Stop
          </button>
        )}
        <span className='text-slate-600 text-sm'>
          {recording ? `Recording… ${sec}s` : 'Tap to speak your Top-3'}
        </span>
      </div>
      <p className='text-xs text-slate-500'>
        Tip: speak in order: "Apparel…; Home…; Toys…" You can edit text afterward.
      </p>
      <p className='text-xs text-amber-600'>
        Note: Voice transcription requires Azure OpenAI configuration. If unavailable, please type your feedback.
      </p>
    </div>
  );
}
