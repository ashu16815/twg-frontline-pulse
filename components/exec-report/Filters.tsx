'use client';

import { useEffect, useState } from 'react';

export default function Filters({ onChange }: { onChange: (f: any) => void }) {
  const [scope, setScope] = useState<'week' | 'month'>('week');
  const [week, setWeek] = useState('');
  const [month, setMonth] = useState('');
  const [region, setRegion] = useState('');
  const [storeId, setStoreId] = useState('');
  const [regions, setRegions] = useState<string[]>([]);
  const [stores, setStores] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    (async () => {
      const r = await fetch('/api/lookups/stores');
      const j = await r.json();
      const rs = Array.from(new Set((j.stores || []).map((s: any) => s.region_code))).filter(Boolean) as string[];
      setRegions(rs);
      setStores((j.stores || []).map((s: any) => ({ id: s.store_id, name: `${s.store_id} — ${s.store_name}` })));
    })();
  }, []);

  useEffect(() => {
    onChange({ scope, week, month, region, storeId });
  }, [scope, week, month, region, storeId]);

  return (
    <div className='card grid gap-3 md:grid-cols-5'>
      <div className='flex gap-2'>
        <button
          className={`btn ${scope === 'week' ? 'bg-white/10' : ''}`}
          onClick={() => setScope('week')}
        >
          Week
        </button>
        <button
          className={`btn ${scope === 'month' ? 'bg-white/10' : ''}`}
          onClick={() => setScope('month')}
        >
          Month
        </button>
      </div>
      <input
        className='btn p-2'
        placeholder='FY26-W##'
        value={week}
        onChange={e => setWeek(e.target.value)}
        disabled={scope !== 'week'}
      />
      <input
        className='btn p-2'
        placeholder='YYYY-MM'
        value={month}
        onChange={e => setMonth(e.target.value)}
        disabled={scope !== 'month'}
      />
      <select
        className='btn p-2'
        value={region}
        onChange={e => setRegion(e.target.value)}
      >
        <option value=''>All Regions</option>
        {regions.map(r => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>
      <select
        className='btn p-2'
        value={storeId}
        onChange={e => setStoreId(e.target.value)}
      >
        <option value=''>All Stores</option>
        {stores.map(s => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
    </div>
  );
}
