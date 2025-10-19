'use client';
import { useEffect, useState } from 'react';

export default function StorePicker({ onSelect }: { onSelect: (s: any) => void }) {
  const [q, setQ] = useState('');
  const [opts, setOpts] = useState<any[]>([]);

  useEffect(() => {
    const id = setTimeout(async () => {
      if (!q) return setOpts([]);
      const r = await fetch('/api/stores/search?q=' + encodeURIComponent(q));
      setOpts(await r.json());
    }, 200);
    return () => clearTimeout(id);
  }, [q]);

  return (
    <div className='space-y-2'>
      <input
        className='input w-full'
        placeholder='Type store code or name…'
        value={q}
        onChange={e => setQ(e.target.value)}
      />
      {opts.length > 0 && (
        <ul className='border rounded-xl bg-black/60 max-h-64 overflow-auto'>
          {opts.map(o => (
            <li
              key={o.store_id}
              className='px-3 py-2 hover:bg-white/10 cursor-pointer'
              onClick={() => onSelect(o)}
            >
              <div className='text-sm'>{o.store_code} — {o.store_name}</div>
              <div className='text-xs opacity-70'>{o.region} ({o.region_code}) · {o.banner}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}