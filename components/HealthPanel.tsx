'use client';
import useSWR from 'swr';
const f=(u:string)=>fetch(u).then(r=>r.json());
export default function HealthPanel(){
  const {data} = useSWR('/api/health', f, { refreshInterval: 15000 });
  if(!data) return <div className='card'>Checking…</div>;
  return (
    <div className='card'>
      <div className='font-semibold mb-2'>System Health</div>
      <div className='grid grid-cols-2 gap-2 text-sm'>
        <div>SQL: {data.details?.sql?.ok? '✅' : '❌'}</div>
        <div>OpenAI: {data.details?.openai?.ok? '✅' : '❌'}</div>
      </div>
      {!data.ok && <div className='text-xs text-yellow-300 mt-2'>Some services are slow or unreachable. We retry automatically.</div>}
    </div>
  );
}
