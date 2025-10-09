'use client';

import { useRouter, useSearchParams } from 'next/navigation';

function cellColor(v: number) {
  if (v <= 0) return 'bg-white/5';
  if (v < 1000) return 'bg-red-900/20';
  if (v < 5000) return 'bg-red-900/40';
  if (v < 20000) return 'bg-red-900/60';
  return 'bg-red-900/80';
}

export default function RegionHeatmap({ data }: { data: { region: string; impact: number }[] }) {
  const router = useRouter();
  const sp = useSearchParams();
  const week = sp.get('week') || '';
  const regions = Array.from(new Set(data.map(d => d.region)));

  return (
    <div className='grid grid-cols-2 md:grid-cols-4 gap-2'>
      {regions.map(r => {
        const v = data.find(d => d.region === r)?.impact || 0;
        return (
          <button
            key={r}
            className={`btn p-3 text-left ${cellColor(v)}`}
            onClick={() =>
              router.push(`/exec/region/${encodeURIComponent(r)}?week=${encodeURIComponent(week)}`)
            }
          >
            <div className='text-sm font-medium'>{r}</div>
            <div className='text-xs text-white/60'>Impact ${Math.round(v).toLocaleString()}</div>
          </button>
        );
      })}
    </div>
  );
}

