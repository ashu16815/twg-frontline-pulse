'use client';
import { useState } from 'react';
import VoiceCapture from './VoiceCapture';
import LoadingButton from '@/components/LoadingButton';
import StorePicker from '@/components/StorePicker';

export default function SmartFeedbackForm() {
  const [form, setForm] = useState<any>({});
  const [transcript, setTranscript] = useState('');
  const [notice, setNotice] = useState('');

  function pickStore(s: any) {
    setForm((f: any) => ({
      ...f,
      store_id: s.store_id,
      region_code: s.region_code,
      store_code: s.store_code,
      store_name: s.store_name
    }));
  }

  async function autoFill() {
    setNotice('');
    const r = await fetch('/api/feedback/voice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript })
    });
    const j = await r.json();
    if (j.ok && j.data) {
      setForm((f: any) => ({ ...f, ...j.data }));
    }
  }

  async function submit() {
    setNotice('');
    const idKey = cryptoKey();
    const res = await fetch('/api/feedback/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Idempotency-Key': idKey
      },
      body: JSON.stringify(form)
    });
    const j = await res.json();
    if (j.ok && !j.duplicate) setNotice('Submitted');
    if (j.duplicate) setNotice('Already submitted (ignored).');
    if (!j.ok) setNotice('Error: ' + j.error);
  }

  return (
    <div className='space-y-4'>
      <div className='card p-4 space-y-3'>
        <div className='font-semibold'>Pick Store</div>
        <StorePicker onSelect={pickStore} />
        {form.store_code && (
          <div className='text-xs opacity-70'>
            Selected: {form.store_code} — {form.store_name} ({form.region_code})
          </div>
        )}
      </div>
      
      <div className='card p-4 space-y-3'>
        <div className='font-semibold'>Voice capture</div>
        <VoiceCapture onText={setTranscript} />
        {transcript && (
          <div className='text-xs opacity-70'>Transcript: "{transcript}"</div>
        )}
        <LoadingButton onClick={autoFill} className='w-full'>
          Auto-populate from voice
        </LoadingButton>
      </div>
      
      <div className='card p-4 space-y-3'>
        <input
          className='input'
          placeholder='Top positive'
          value={form.top_positive || ''}
          onChange={e => setForm({ ...form, top_positive: e.target.value })}
        />
        <input
          className='input'
          placeholder='Miss #1'
          value={form.miss1 || ''}
          onChange={e => setForm({ ...form, miss1: e.target.value })}
        />
        <input
          className='input'
          placeholder='Miss #1 dollars'
          type='number'
          value={form.miss1_dollars || 0}
          onChange={e => setForm({ ...form, miss1_dollars: +e.target.value })}
        />
        <textarea
          className='textarea'
          placeholder='Comments'
          value={form.freeform_comments || ''}
          onChange={e => setForm({ ...form, freeform_comments: e.target.value })}
        />
        <LoadingButton onClick={submit} className='w-full'>
          Submit
        </LoadingButton>
        {notice && <div className='text-xs text-white/70'>{notice}</div>}
      </div>
    </div>
  );
}

function cryptoKey() {
  const a = new Uint8Array(16);
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(a);
  }
  return Array.from(a).map(x => x.toString(16).padStart(2, '0')).join('');
}