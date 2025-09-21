'use client';

import { useState } from 'react';

export default function PasscodeGate({ children }: { children: React.ReactNode }) {
  const [ok, setOk] = useState(false);
  const [code, setCode] = useState('');

  if (!ok) {
    return (
      <div className='max-w-md mx-auto mt-12 card rounded-3xl p-8 space-y-3'>
        <h2 className='text-xl font-semibold'>Enter passcode</h2>
        <input className='input' value={code} onChange={e=>setCode(e.target.value)} placeholder='Passcode'/>
        <div className='flex gap-3'>
          <button className='btn' onClick={async()=>{
            const r = await fetch('/api/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code})});
            if(r.ok) setOk(true); else alert('Invalid passcode');
          }}>Continue</button>
          <button className='btn' onClick={()=>{setCode('')}}>Clear</button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
