'use client';
import { useEffect, useState } from 'react';
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';

export default function VoiceCapture({onTranscript}:{onTranscript:(t:string)=>void}){
  const [rec,setRec]=useState<sdk.SpeechRecognizer|null>(null);
  const [listening,setListening]=useState(false);
  const [error,setError]=useState('');

  useEffect(()=>{ return ()=>{ rec?.close(); } },[rec]);

  async function start(){
    try{
      setError('');
      const key = process.env.NEXT_PUBLIC_AZ_SPEECH_KEY!;
      const region = process.env.NEXT_PUBLIC_AZ_SPEECH_REGION!;
      const speechConfig = sdk.SpeechConfig.fromSubscription(key, region);
      speechConfig.speechRecognitionLanguage = 'en-NZ';
      const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput();
      const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);
      setRec(recognizer); setListening(true);
      recognizer.recognized = (_s, e)=>{ if(e.result?.text){ onTranscript(e.result.text); } };
      recognizer.sessionStopped = ()=>{ setListening(false); recognizer.close(); };
      recognizer.canceled = (_,ev)=>{ setListening(false); setError(ev.errorDetails||'Canceled'); recognizer.close(); };
      recognizer.startContinuousRecognitionAsync();
    }catch(e:any){ setError(e.message||'Mic error'); }
  }
  function stop(){ rec?.stopContinuousRecognitionAsync(()=>{ setListening(false); rec?.close();}); }

  return (
    <div className='flex items-center gap-2'>
      {!listening && <button className='btn' onClick={start}>🎙️ Start</button>}
      {listening && <button className='btn' onClick={stop}>■ Stop</button>}
      {error && <span className='text-xs text-red-400'>{error}</span>}
    </div>
  );
}
