'use client';
import { useEffect, useState } from 'react';

export default function StorePicker(){
  const [stores,setStores]=useState<any[]>([]);
  const [q,setQ]=useState('');
  const [sel,setSel]=useState<any>(null);

  useEffect(()=>{
    (async()=>{
      const r=await fetch('/api/stores');
      const j=await r.json();
      setStores(j||[]);
    })();
  },[]);

  const filtered = stores.filter(s => 
    (s.display_name||'').toLowerCase().includes(q.toLowerCase()) || 
    (s.code||'').includes(q)
  );

  function pick(s:any){
    setSel(s); 
    setQ(`${s.display_name} (${s.code})`);
    
    // Auto-fill hidden inputs for submit
    const set=(name:string,val:string)=>{
      const el=document.querySelector(`[name="${name}"]`) as HTMLInputElement; 
      if(el) el.value=val;
    };
    set('storeId', s.code);
    set('storeName', `${s.brand} ${s.store_name}`);
    set('region', ''); // Optional: keep blank or set via mapping later
  }

  return (
    <div className='grid gap-3'>
      <label className='text-sm opacity-80'>Select store (search by name or code)</label>
      <div className='relative'>
        <input 
          className='input' 
          placeholder='e.g., TWL Riccarton or 220' 
          value={q} 
          onChange={e=>{setQ(e.target.value); setSel(null);}}
        />
        {q && !sel && (
          <div className='absolute z-10 mt-2 w-full rounded-2xl glass p-2 max-h-72 overflow-auto'>
            {filtered.slice(0,20).map(s=> (
              <button 
                type='button' 
                key={s.id} 
                className='w-full text-left px-3 py-2 rounded-xl hover:bg-white/10' 
                onClick={()=>pick(s)}
              >
                <div className='text-sm'>
                  {s.display_name} 
                  <span className='opacity-70'>(code {s.code}, {s.brand_color})</span>
                </div>
              </button>
            ))}
            {filtered.length===0 && <div className='px-3 py-2 opacity-60 text-sm'>No matches</div>}
          </div>
        )}
      </div>
      {/* Hidden fields submitted with the form */}
      <input type='hidden' name='storeId'/>
      <input type='hidden' name='storeName'/>
      <input type='hidden' name='region'/>
    </div>
  );
}
