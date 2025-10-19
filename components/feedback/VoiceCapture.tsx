'use client';
import { useEffect, useState } from 'react';
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';

export default function VoiceCapture({ onTranscript }: { onTranscript: (t: string) => void }) {
  const [rec, setRec] = useState<sdk.SpeechRecognizer | null>(null);
  const [on, setOn] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => () => rec?.close(), [rec]);

  async function start() {
    try {
      setErr('');
      const key = process.env.NEXT_PUBLIC_AZ_SPEECH_KEY!;
      const region = process.env.NEXT_PUBLIC_AZ_SPEECH_REGION!;
      
      const speechConfig = sdk.SpeechConfig.fromSubscription(key, region);
      speechConfig.speechRecognitionLanguage = 'en-NZ';
      
      const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput();
      const r = new sdk.SpeechRecognizer(speechConfig, audioConfig);
      setRec(r);
      setOn(true);

      r.recognized = (_s, e) => {
        if (e.result?.text) onTranscript(e.result.text);
      };

      r.sessionStopped = () => {
        setOn(false);
        r.close();
      };

      r.canceled = (_, ev) => {
        setOn(false);
        setErr(ev.errorDetails || 'Canceled');
        r.close();
      };

      r.startContinuousRecognitionAsync();
    } catch (e: any) {
      setErr(e.message || 'Mic error');
    }
  }

  function stop() {
    rec?.stopContinuousRecognitionAsync(() => {
      setOn(false);
      rec?.close();
    });
  }

  return (
    <div className='flex items-center gap-2'>
      {!on ? (
        <button className='btn' onClick={start}>
          🎙️ Start
        </button>
      ) : (
        <button className='btn' onClick={stop}>
          ■ Stop
        </button>
      )}
      {err && <span className='text-xs text-red-400'>{err}</span>}
    </div>
  );
}