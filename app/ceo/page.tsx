import { sbAdmin } from '@/lib/supabase-admin';
import { weekKey } from '@/lib/gpt5';
import Image from 'next/image';

export default async function Page({ searchParams }: { searchParams: { message?: string; store?: string; region?: string } }){
  const isoWeek = weekKey(new Date());
  const [{data:rows},{data:summ}] = await Promise.all([
    sbAdmin.from('store_feedback').select('*').eq('iso_week',isoWeek),
    sbAdmin.from('weekly_summary').select('*').eq('iso_week',isoWeek)
  ]);
  const regions = Array.from(new Set((rows||[]).map((r:any)=>r.region)));
  
  return (
    <main className='max-w-7xl mx-auto px-6 py-10 space-y-8'>
      {searchParams.message && (
        <div className='bg-green-50 border border-green-200 rounded-lg p-4 mb-6'>
          <h2 className='text-lg font-semibold text-green-800 mb-2'>✅ Submission Received</h2>
          <p className='text-green-700 text-sm'>
            {searchParams.message} Store: {searchParams.store} • Region: {searchParams.region}
          </p>
        </div>
      )}
      
      <section className='relative overflow-hidden rounded-3xl glass'>
        <div className='absolute -inset-40 opacity-[.18]'>
          <Image src='https://images.unsplash.com/photo-1520962962295-c5dc6131c9f0?q=80&w=2400&auto=format&fit=crop' alt='bg' fill className='object-cover'/>
        </div>
        <div className='relative p-8'>
          <h1 className='text-2xl font-semibold'>CEO Office — Week {isoWeek}</h1>
          <p className='opacity-80 mt-2'>Executive summaries by region. Click a region card to see store submissions.</p>
        </div>
      </section>
      
      <section className='grid md:grid-cols-3 gap-4'>
        {regions.map((r)=>{
          const s = (summ||[]).find((x:any)=>x.region===r);
          return (
            <div key={r as string} className='card rounded-3xl hover:scale-[1.01] transition will-change-transform'>
              <div className='text-xs opacity-60'>{isoWeek} • {r as string}</div>
              <div className='mt-2 whitespace-pre-wrap'>{s?.summary || 'No summary yet.'}</div>
              <div className='mt-3 text-sm opacity-80'>Themes: {(s?.top_themes || []).join(', ') || '—'}</div>
            </div>
          )
        })}
      </section>
      
      <section className='card rounded-3xl'>
        <h2 className='text-lg font-semibold mb-3'>This Week — Submissions</h2>
        <div className='overflow-x-auto'>
          <table className='table'>
            <thead><tr><th>When</th><th>Store</th><th>Region</th><th>Issue 1</th><th>Issue 2</th><th>Issue 3</th><th>Overall</th><th>Themes</th></tr></thead>
            <tbody>
              {(rows||[]).map((r:any)=> (
                <tr key={r.id}>
                  <td>{new Date(r.created_at).toLocaleString()}</td>
                  <td>{r.store_id} — {r.store_name}</td>
                  <td>{r.region}</td>
                  <td>{r.issue1_cat}: {r.issue1_text} ({r.issue1_mood||'-'})</td>
                  <td>{r.issue2_cat}: {r.issue2_text} ({r.issue2_mood||'-'})</td>
                  <td>{r.issue3_cat}: {r.issue3_text} ({r.issue3_mood||'-'})</td>
                  <td>{r.overall_mood||'-'}</td>
                  <td>{(r.themes||[]).join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}