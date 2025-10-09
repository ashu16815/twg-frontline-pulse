'use client';
import { useEffect, useState } from 'react';

export default function StorePicker(){
  const [stores, setStores] = useState<any[]>([]);
  const [regions, setRegions] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [regionQ, setRegionQ] = useState('');
  const [sel, setSel] = useState<any>(null);
  const [selRegion, setSelRegion] = useState<any>(null);

  useEffect(()=>{
    (async()=>{
      const r = await fetch('/api/stores');
      const j = await r.json();
      setStores(j||[]);
      
      // Extract unique regions from stores
      const regions = j?.map((s: any) => s.region).filter(Boolean) || [];
      const uniqueRegions = Array.from(new Set(regions)).map((region) => ({
        name: region as string,
        id: (region as string).toLowerCase().replace(/\s+/g, '-')
      }));
      setRegions(uniqueRegions);
    })();
  },[]);

  const filteredStores = stores.filter(s => 
    (s.display_name||'').toLowerCase().includes(q.toLowerCase()) || 
    (s.code||'').includes(q) ||
    (s.region||'').toLowerCase().includes(q.toLowerCase())
  );

  const filteredRegions = regions.filter(r => 
    (r.name||'').toLowerCase().includes(regionQ.toLowerCase())
  );

  function pickStore(s: any){
    setSel(s); 
    setQ(`${s.display_name} (${s.code})`);
    
    // Auto-fill hidden inputs for submit
    const set = (name: string, val: string) => {
      const el = document.querySelector(`[name="${name}"]`) as HTMLInputElement; 
      if(el) el.value = val;
    };
    set('storeId', s.code);
    set('storeName', `${s.brand} ${s.store_name}`);
    set('region', s.region || '');
    
    // Auto-select region if store has one
    if (s.region) {
      setSelRegion({ name: s.region, id: s.region.toLowerCase().replace(/\s+/g, '-') });
      setRegionQ(s.region);
    }
  }

  function pickRegion(r: any) {
    setSelRegion(r);
    setRegionQ(r.name);
    
    const set = (name: string, val: string) => {
      const el = document.querySelector(`[name="${name}"]`) as HTMLInputElement; 
      if(el) el.value = val;
    };
    set('region', r.name);
  }

  return (
    <div className='grid gap-4'>
      <div className='grid gap-3'>
        <label className='text-sm opacity-80'>Select store (search by name, code, or region)</label>
        <div className='relative'>
          <input 
            className='input' 
            placeholder='e.g., TWL Riccarton, 220, or North' 
            value={q} 
            onChange={e=>{setQ(e.target.value); setSel(null);}}
          />
          {q && !sel && (
            <div className='absolute z-10 mt-2 w-full rounded-2xl glass p-2 max-h-72 overflow-auto'>
              {filteredStores.slice(0,20).map(s=> (
                <button 
                  type='button' 
                  key={s.id} 
                  className='w-full text-left px-3 py-2 rounded-xl hover:bg-white/10' 
                  onClick={()=>pickStore(s)}
                >
                  <div className='text-sm'>
                    {s.display_name} 
                    <span className='opacity-70'>(code {s.code}, {s.region || 'No region'})</span>
                  </div>
                </button>
              ))}
              {filteredStores.length===0 && <div className='px-3 py-2 opacity-60 text-sm'>No matches</div>}
            </div>
          )}
        </div>
      </div>

      <div className='grid gap-3'>
        <label className='text-sm opacity-80'>Select region (optional - auto-filled if store has region)</label>
        <div className='relative'>
          <input 
            className='input' 
            placeholder='e.g., North, South, Central' 
            value={regionQ} 
            onChange={e=>{setRegionQ(e.target.value); setSelRegion(null);}}
          />
          {regionQ && !selRegion && (
            <div className='absolute z-10 mt-2 w-full rounded-2xl glass p-2 max-h-48 overflow-auto'>
              {filteredRegions.slice(0,10).map(r=> (
                <button 
                  type='button' 
                  key={r.id} 
                  className='w-full text-left px-3 py-2 rounded-xl hover:bg-white/10' 
                  onClick={()=>pickRegion(r)}
                >
                  <div className='text-sm'>{r.name}</div>
                </button>
              ))}
              {filteredRegions.length===0 && <div className='px-3 py-2 opacity-60 text-sm'>No matches</div>}
            </div>
          )}
        </div>
      </div>

      {/* Hidden fields submitted with the form */}
      <input type='hidden' name='storeId'/>
      <input type='hidden' name='storeName'/>
      <input type='hidden' name='region'/>
    </div>
  );
}
