'use client';
import { useState } from 'react';
import LoadingButton from '@/components/LoadingButton';

export default function SubmitFeedbackForm(){
  const [form,setForm]=useState<any>({});
  const [notice,setNotice]=useState('');

  async function submit(){
    setNotice('');
    const idKey = cryptoRandomKey();
    const res = await fetch('/api/feedback/submit',{ method:'POST', headers:{ 'Content-Type':'application/json','X-Idempotency-Key': idKey }, body: JSON.stringify(form) });
    const j = await res.json();
    if(j.ok && !j.duplicate) setNotice('Submitted');
    if(j.duplicate) setNotice('Already submitted (ignored).');
    if(!j.ok) setNotice('Error: '+j.error);
  }

  return (
    <div className='space-y-4'>
      {/* existing inputs... setForm({ ...form, field: value }) */}
      <LoadingButton onClick={submit} className='btn-primary w-full'>Submit</LoadingButton>
      {notice && <div className='text-xs text-white/70'>{notice}</div>}
    </div>
  );
}

function cryptoRandomKey(){
  const a = new Uint8Array(16);
  if(typeof window!=='undefined' && window.crypto?.getRandomValues){ window.crypto.getRandomValues(a);}
  return Array.from(a).map(x=>x.toString(16).padStart(2,'0')).join('');
}
