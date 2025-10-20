'use client';
import { useEffect, useState } from 'react';
import useSWR from 'swr';
const f=(u:string)=>fetch(u).then(r=>r.json());

export default function ExecReportInline(){
  // filters on the same page (no separate page)
  const [scope_type,setScopeType]=useState<'network'|'region'|'store'>('network');
  const [scope_key,setScopeKey]=useState('');
  const [iso_week,setWeek]=useState('');
  const [month_key,setMonth]=useState('');

  const qs = new URLSearchParams({ scope_type, ...(scope_key?{scope_key}:{}) , ...(iso_week?{iso_week}:{}) , ...(month_key?{month_key}:{}) });
  const {data, mutate} = useSWR('/api/exec/snapshot?'+qs.toString(), f, { revalidateOnFocus:false });

  // Debug logging
  useEffect(() => {
    if (data) {
      console.log('ExecReportInline data:', data);
      console.log('Snapshot created_at:', data?.snapshot?.created_at);
    }
  }, [data]);

  const [job,setJob]=useState<any>(null);
  const [busy,setBusy]=useState(false);

  async function generate(){
    setBusy(true);
    const r = await fetch('/api/exec/job',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ scope_type, scope_key: scope_key||null, iso_week: iso_week||null, month_key: month_key||null }) });
    const j = await r.json(); setJob(j.job); poll(j.job.job_id);
  }
  function poll(id:string){
    const i = setInterval(async()=>{
      const r = await fetch('/api/exec/job?job_id='+id); const j = await r.json(); setJob(j.job);
      if(j.job?.status==='succeeded' || j.job?.status==='failed' || j.job?.status==='canceled'){ clearInterval(i); setBusy(false); mutate(); }
    }, 2000);
  }

  const stamp = data?.snapshot?.created_at ? 
    (() => {
      try {
        return new Date(data.snapshot.created_at).toLocaleString();
      } catch (e) {
        console.error('Date parsing error:', e, 'Date string:', data.snapshot.created_at);
        return 'Invalid Date';
      }
    })() : 'Not generated yet';
  const analysis = data?.snapshot?.analysis_json ? JSON.parse(data.snapshot.analysis_json) : null;

  return (
    <div className='space-y-6'>
      {/* Controls stay in the same report page */}
      <div className='card p-4 grid grid-cols-2 md:grid-cols-4 gap-3'>
        <select className='input' value={scope_type} onChange={e=>setScopeType(e.target.value as any)}>
          <option value='network'>Network</option>
          <option value='region'>Region</option>
          <option value='store'>Store</option>
        </select>
        <input className='input' placeholder='Scope key (AKL or store_id)' value={scope_key} onChange={e=>setScopeKey(e.target.value)} />
        <input className='input' placeholder='ISO Week (YYYY-Www)' value={iso_week} onChange={e=>setWeek(e.target.value)} />
        <input className='input' placeholder='Month (YYYY-MM)' value={month_key} onChange={e=>setMonth(e.target.value)} />
      </div>

      {/* AI banner (timestamp + generate) */}
      <div className='card p-4 flex items-center justify-between'>
        <div className='text-sm'>AI analysis as of <span className='font-medium'>{stamp}</span></div>
        <div className='flex items-center gap-2'>
          {job?.status && <span className='text-xs px-2 py-1 rounded-full bg-white/10'>{job.status}</span>}
          <button className={`btn ${busy?'opacity-60 pointer-events-none':''}`} onClick={generate}>⚡ Generate AI Report</button>
        </div>
      </div>

      {/* Exec content (ALWAYS rendered from the latest snapshot) */}
      <div className='grid md:grid-cols-2 gap-6'>
        <div className='card p-4'>
          <div className='font-semibold mb-2'>Top 3 Opportunities</div>
          {!analysis? <div className='text-sm opacity-70'>No AI snapshot yet. Generate to populate.</div> :
            (analysis.top_opportunities||[]).slice(0,3).map((t:any,i:number)=>(
              <div key={i} className='mb-2'>• {t.theme} — est. ${t.impact_dollars?.toLocaleString?.()}<div className='text-xs opacity-70'>{t.why}</div></div>
            ))}
        </div>
        <div className='card p-4'>
          <div className='font-semibold mb-2'>Top 3 Actions</div>
          {!analysis? <div className='text-sm opacity-70'>No AI snapshot yet. Generate to populate.</div> :
            (analysis.top_actions||[]).slice(0,3).map((a:any,i:number)=>(
              <div key={i} className='mb-2'>• {a.action} (Owner: {a.owner}, {a.eta_weeks}w, +${a.expected_uplift_dollars?.toLocaleString?.()})</div>
            ))}
        </div>
      </div>

      <div className='card p-4'>
        <div className='font-semibold mb-2'>Executive Narrative</div>
        {!analysis? <div className='text-sm opacity-70'>No AI snapshot yet. Generate to populate.</div> :
          <div className='text-sm leading-6'>{analysis.narrative||'—'}</div>}
      </div>

      {/* Optional small trend from snapshot */}
      {analysis?.volume_series?.length>0 && (
        <div className='card p-4'>
          <div className='font-semibold mb-2'>Feedback Volume by Week</div>
          <div className='text-xs opacity-70'>({analysis.volume_series.length} weeks)</div>
          <ul className='text-sm mt-2 grid md:grid-cols-2 gap-1'>
            {analysis.volume_series.map((d:any,i:number)=>(<li key={i}>{d.week}: {d.count}</li>))}
          </ul>
        </div>
      )}

      {/* Feedback Details Section */}
      {data?.snapshot && (
        <div className='card p-4'>
          <div className='font-semibold mb-2'>Report Generation Details</div>
          <div className='text-sm space-y-2'>
            <div className='flex justify-between'>
              <span className='opacity-70'>Data Source:</span>
              <span>Store Feedback Database</span>
            </div>
            <div className='flex justify-between'>
              <span className='opacity-70'>Rows Analyzed:</span>
              <span>{data.snapshot.rows_used || 0} feedback entries</span>
            </div>
            <div className='flex justify-between'>
              <span className='opacity-70'>AI Model:</span>
              <span>{data.snapshot.gen_model || 'Unknown'}</span>
            </div>
            <div className='flex justify-between'>
              <span className='opacity-70'>Processing Time:</span>
              <span>{data.snapshot.gen_ms || 0}ms</span>
            </div>
            <div className='flex justify-between'>
              <span className='opacity-70'>Scope:</span>
              <span>{data.snapshot.scope_type || 'network'}</span>
            </div>
            {data.snapshot.scope_key && (
              <div className='flex justify-between'>
                <span className='opacity-70'>Filter:</span>
                <span>{data.snapshot.scope_key}</span>
              </div>
            )}
            {data.snapshot.iso_week && (
              <div className='flex justify-between'>
                <span className='opacity-70'>Week:</span>
                <span>{data.snapshot.iso_week}</span>
              </div>
            )}
            {data.snapshot.month_key && (
              <div className='flex justify-between'>
                <span className='opacity-70'>Month:</span>
                <span>{data.snapshot.month_key}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
