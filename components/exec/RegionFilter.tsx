'use client';

import { useRouter, useSearchParams } from 'next/navigation';

export default function RegionFilter({ regions }: { regions: string[] }) {
  const sp = useSearchParams();
  const router = useRouter();
  const current = sp.get('region') || '';

  function setRegion(r: string) {
    const url = new URL(window.location.href);
    if (r) url.searchParams.set('region', r);
    else url.searchParams.delete('region');
    router.push(url.pathname + url.search);
  }

  return (
    <div className='flex items-center gap-2'>
      <select className='btn p-2 text-sm' value={current} onChange={e => setRegion(e.target.value)}>
        <option value=''>All Regions</option>
        {regions.map(r => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
    </div>
  );
}

