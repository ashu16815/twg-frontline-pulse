'use client';
import { useState } from 'react';
import VoiceCapture from './VoiceCapture';
import LoadingButton from '@/components/LoadingButton';

export default function SmartFeedbackForm(){
  const [form,setForm]=useState<any>({});
  const [transcript,setTranscript]=useState('');

  async function autoFill(){
    const r = await fetch('/api/feedback/voice',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({transcript})});
    const j = await r.json();
    if(j.ok && j.data){ setForm({ ...form, ...j.data }); }
  }

  return (
    <div className='space-y-4'>
      <VoiceCapture onTranscript={(t)=>setTranscript(t)} />
      {transcript && <div className='text-xs opacity-70'>"{transcript}"</div>}
      <LoadingButton onClick={autoFill} className='btn w-full'>Auto-populate from voice</LoadingButton>
      {/* Render inputs bound to form[...] (store/store_code picker, dollars, etc.) */}
    </div>
  );
}
