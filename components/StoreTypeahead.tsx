'use client';

import { useEffect, useRef, useState } from 'react';

interface Store {
  store_id: string;
  store_code?: number;
  store_name: string;
  banner?: string;
  region: string;
  region_code: string;
  manager_email?: string;
}

export default function StoreTypeahead() {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);
  const ddRef = useRef<HTMLDivElement>(null);
  
  // Debounced search
  useEffect(() => {
    if (q.trim().length < 1) {
      setItems([]);
      setOpen(false);
      return;
    }
    
    // Don't search if the query contains " — " (already selected)
    if (q.includes(' — ')) {
      return;
    }
    
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const r = await fetch(`/api/stores/search?q=${encodeURIComponent(q)}`);
        const j = await r.json();
        setItems(j.results || []);
        if ((j.results || []).length > 0) {
          setOpen(true);
        }
      } catch (err) {
        console.error('Search error:', err);
        setItems([]);
      } finally {
        setLoading(false);
      }
    }, 200);
    
    return () => clearTimeout(timer);
  }, [q]);
  
  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!ddRef.current) return;
      if (!ddRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  function pickStore(store: Store) {
    // Set the display value
    setQ(`${store.store_id} — ${store.store_name}`);
    
    // Close dropdown immediately and clear items to prevent re-search
    setOpen(false);
    setItems([]);
    
    // Autofill hidden/other inputs
    const setField = (name: string, val: any) => {
      const el = document.querySelector(`[name="${name}"]`) as HTMLInputElement | null;
      if (el) el.value = String(val ?? '');
    };
    
    setField('storeId', store.store_id);
    setField('storeName', store.store_name);
    setField('region', store.region);
    setField('regionCode', store.region_code);
    setField('storeCode', store.store_code ?? '');
    setField('banner', store.banner ?? '');
    setField('managerEmail', store.manager_email ?? '');
  }
  
  return (
    <div className='relative' ref={ddRef}>
      <input 
        className='btn p-3 w-full text-white placeholder-gray-400' 
        placeholder='Type Store ID (e.g., 362) or Name (e.g., Albany)' 
        value={q} 
        onChange={e => setQ(e.target.value)} 
        onFocus={() => { 
          if (items.length > 0 && !q.includes(' — ')) {
            setOpen(true); 
          }
        }}
        autoComplete='off'
      />
      
      {loading && (
        <div className='absolute right-3 top-3 text-white/40 text-sm'>
          Searching...
        </div>
      )}
      
      {open && items.length > 0 && (
        <div className='absolute z-20 mt-1 w-full rounded-xl border border-white/10 bg-black/95 backdrop-blur p-1 max-h-80 overflow-auto shadow-xl'>
          {items.map((store) => (
            <button 
              key={store.store_id} 
              type='button' 
              className='w-full text-left px-4 py-3 hover:bg-white/10 rounded-lg transition-colors'
              onClick={() => pickStore(store)}
            >
              <div className='flex items-baseline justify-between'>
                <div className='text-sm font-medium text-white'>
                  {store.store_code && <span className='text-white/60 mr-2'>{store.store_code}</span>}
                  {store.store_name}
                </div>
                {store.banner && (
                  <span className='text-xs text-white/50 ml-2'>{store.banner}</span>
                )}
              </div>
              <div className='text-xs text-white/50 mt-1'>
                {store.region} ({store.region_code})
                {store.store_id && <span className='ml-2'>• {store.store_id}</span>}
              </div>
            </button>
          ))}
        </div>
      )}
      
      {open && !loading && items.length === 0 && q.trim().length > 0 && (
        <div className='absolute z-20 mt-1 w-full rounded-xl border border-white/10 bg-black/95 backdrop-blur p-4 shadow-xl'>
          <div className='text-sm text-white/50 text-center'>
            No stores found for "{q}"
          </div>
        </div>
      )}
    </div>
  );
}

