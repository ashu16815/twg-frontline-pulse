'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

function isoWeek(d: Date) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const onejan = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((+t - +onejan) / 86400000) + onejan.getUTCDay() + 1) / 7);
  return `${t.getUTCFullYear()}-W${week.toString().padStart(2, '0')}`;
}

export default function WeekPicker() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [val, setVal] = useState(sp.get('week') || isoWeek(new Date()));

  useEffect(() => {
    setVal(sp.get('week') || val);
  }, [sp]);

  function apply(w: string) {
    const url = new URL(window.location.href);
    url.searchParams.set('week', w);
    router.push(url.pathname + url.search);
  }

  return (
    <div className='flex items-center gap-2'>
      <input
        className='btn p-2 text-sm'
        value={val}
        onChange={e => setVal(e.target.value)}
        placeholder='YYYY-W##'
      />
      <button className='btn btn-liquid' onClick={() => apply(val)}>
        Apply
      </button>
    </div>
  );
}

