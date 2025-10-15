'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { getFinancialYearWeek } from '@/lib/timezone';

function financialWeek(d: Date) {
  return getFinancialYearWeek(d);
}

export default function WeekPicker() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [val, setVal] = useState(sp.get('week') || financialWeek(new Date()));

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
        placeholder='FY26-W##'
      />
      <button className='btn btn-liquid' onClick={() => apply(val)}>
        Apply
      </button>
    </div>
  );
}

