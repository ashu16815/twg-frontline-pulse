'use client';
import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, LineChart, Line, Legend } from 'recharts';

const fetcher=(u:string)=>fetch(u).then(r=>r.json());

export default function ExecutiveReport(){
  // Filters
  const [scope_type,setScopeType]=useState<'network'|'region'|'store'>('network');
  const [scope_key,setScopeKey]=useState('');
  const [iso_week,setWeek]=useState('');
  const [month_key,setMonth]=useState('');
  const [area_code,setArea]=useState('');
  const [showDetails,setShowDetails]=useState(false);

  const qsBase = new URLSearchParams({ scope_type, ...(scope_key?{scope_key}:{}) , ...(iso_week?{iso_week}:{}) , ...(month_key?{month_key}:{}) });
  const qsKpi = new URLSearchParams({ scope_type, ...(scope_key?{scope_key}:{}) , ...(iso_week?{iso_week}:{}) , ...(month_key?{month_key}:{}) , ...(area_code?{area_code}:{}) });
  const { data: snapshotData, mutate } = useSWR('/api/exec/snapshot?'+qsBase.toString(), fetcher, { revalidateOnFocus:false });
  const { data: kpi } = useSWR('/api/exec/kpis?'+qsKpi.toString(), fetcher, { revalidateOnFocus:false });

  const analysis = snapshotData?.snapshot?.analysis_json ? JSON.parse(snapshotData.snapshot.analysis_json) : null;
  const stamp = snapshotData?.snapshot?.created_at ? 
    (() => {
      try {
        return new Date(snapshotData.snapshot.created_at).toLocaleString();
      } catch (e) {
        console.error('Date parsing error:', e, 'Date string:', snapshotData.snapshot.created_at);
        return 'Invalid Date';
      }
    })() : 'Not generated yet';

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

  // Heatmap data per region from KPI API
  const regionRows = useMemo(()=>{
    const obj = kpi?.regions||{}; return Object.keys(obj).map(k=>({ region:k, feedbacks: obj[k].feedbacks, miss: obj[k].miss_dollars }));
  },[kpi]);

  return (
    <div className='space-y-6'>
      {/* Header & Filters */}
      <div className='card p-4 grid grid-cols-2 md:grid-cols-6 gap-3'>
        <select className='input' value={scope_type} onChange={e=>setScopeType(e.target.value as any)}>
          <option value='network'>Network</option>
          <option value='region'>Region</option>
          <option value='store'>Store</option>
        </select>
        <input className='input' placeholder='Scope key (AKL or store_id)' value={scope_key} onChange={e=>setScopeKey(e.target.value)} />
        <input className='input' placeholder='ISO Week (YYYY-Www)' value={iso_week} onChange={e=>setWeek(e.target.value)} />
        <input className='input' placeholder='Month (YYYY-MM)' value={month_key} onChange={e=>setMonth(e.target.value)} />
        <select className='input' value={area_code} onChange={e=>setArea(e.target.value)}>
          <option value=''>All Areas</option>
          <option value='AVAIL'>Availability</option>
          <option value='SUPPLY'>Supply Chain</option>
          <option value='ROSTER'>Rosters</option>
          <option value='PRICING'>Pricing</option>
          <option value='MERCH'>Merchandising</option>
          <option value='SERVICE'>Service</option>
        </select>
        <button className={`btn btn-primary ${busy?'opacity-60 pointer-events-none':''}`} onClick={generate}>
          ⚡ Generate AI Report
        </button>
      </div>

      {/* Timestamp + Status */}
      <div className='card p-4 flex items-center justify-between'>
        <div className='text-sm'>
          AI analysis as of <span className='font-semibold'>{stamp}</span>
          {snapshotData?.snapshot && (
            <span className='ml-2 text-xs opacity-70'>
              (Generated {new Date(snapshotData.snapshot.created_at).toLocaleDateString()})
            </span>
          )}
        </div>
        <div className='flex items-center gap-3'>
          {job?.status && <span className='text-xs px-2 py-1 rounded-full bg-white/10'>{job.status}</span>}
          <button 
            className='text-xs px-3 py-1 rounded bg-white/10 hover:bg-white/20 transition-colors'
            onClick={() => mutate()}
          >
            🔄 Refresh
          </button>
          <div className='text-xs opacity-70'>This page always renders from the latest AI snapshot stored in the database.</div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className='grid md:grid-cols-3 gap-4'>
        <div className='card p-4'>
          <div className='text-xs opacity-70'>Feedback Volume</div>
          <div className='text-2xl font-semibold'>{(kpi?.kpis?.totalFeedbacks??0).toLocaleString?.()}</div>
        </div>
        <div className='card p-4'>
          <div className='text-xs opacity-70'>Estimated Missed Sales ($)</div>
          <div className='text-2xl font-semibold'>${(kpi?.kpis?.totalMiss??0).toLocaleString?.()}</div>
        </div>
        <div className='card p-4'>
          <div className='text-xs opacity-70'>Mood Index</div>
          <div className='text-2xl font-semibold'>{kpi?.kpis?.mood?.toFixed?.(2) ?? '—'}</div>
        </div>
      </div>

      {/* AI Narrative & Actions */}
      <div className='grid md:grid-cols-2 gap-6'>
        <div className='card p-4'>
          <div className='font-semibold mb-2'>Executive Narrative</div>
          {!analysis? <div className='text-sm opacity-70'>No AI snapshot yet. Click ⚡ Generate AI Report.</div> :
            <div className='text-sm leading-6'>{analysis.narrative||'—'}</div>}
        </div>
        <div className='card p-4'>
          <div className='font-semibold mb-2'>Top 3 Actions</div>
          {!analysis? <div className='text-sm opacity-70'>No AI snapshot yet.</div> : (analysis.top_actions||[]).slice(0,3).map((a:any,i:number)=> (
            <div key={i} className='mb-3'>• {a.action} <span className='opacity-70'>(Owner: {a.owner}, {a.eta_weeks}w, +${a.expected_uplift_dollars?.toLocaleString?.()})</span></div>
          ))}
        </div>
      </div>

      {/* Opportunities & Risk */}
      <div className='grid md:grid-cols-2 gap-6'>
        <div className='card p-4'>
          <div className='font-semibold mb-2'>Top Opportunities by Estimated Impact</div>
          {!analysis? <div className='text-sm opacity-70'>No AI snapshot yet.</div> : (
            <ResponsiveContainer width='100%' height={260}>
              <BarChart data={(analysis.top_opportunities||[])}>
                <CartesianGrid strokeDasharray='3 3'/>
                <XAxis dataKey='theme'/>
                <YAxis/>
                <Tooltip/>
                <Bar dataKey='impact_dollars' fill='#3b82f6'/>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className='card p-4'>
          <div className='font-semibold mb-2'>Risks & Mitigations</div>
          {!analysis? <div className='text-sm opacity-70'>No AI snapshot yet.</div> : (analysis.risks||[]).slice(0,5).map((r:any,i:number)=> (
            <div key={i} className='mb-2'>• {r.risk} <span className='opacity-70'>(Mitigation: {r.mitigation})</span></div>
          ))}
        </div>
      </div>

      {/* Region heat map (proxy via bars) & volume trend */}
      <div className='grid md:grid-cols-2 gap-6'>
        <div className='card p-4'>
          <div className='font-semibold mb-2'>Regional Impact (Missed $)</div>
          <ResponsiveContainer width='100%' height={260}>
            <BarChart data={regionRows}>
              <CartesianGrid strokeDasharray='3 3'/>
              <XAxis dataKey='region'/>
              <YAxis/>
              <Tooltip/>
              <Bar dataKey='miss' fill='#ef4444'/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className='card p-4'>
          <div className='font-semibold mb-2'>Feedback Volume by Week (from AI)</div>
          {analysis?.volume_series?.length? (
            <ResponsiveContainer width='100%' height={260}>
              <LineChart data={analysis.volume_series}>
                <CartesianGrid strokeDasharray='3 3'/>
                <XAxis dataKey='week'/>
                <YAxis/>
                <Tooltip/>
                <Legend/>
                <Line type='monotone' dataKey='count' stroke='#10b981' strokeWidth={2}/>
              </LineChart>
            </ResponsiveContainer>
          ) : <div className='text-sm opacity-70'>No AI snapshot yet.</div>}
        </div>
      </div>

      {/* Detailed Feedback Section */}
      <div className='card p-4'>
        <div className='flex items-center justify-between mb-4'>
          <div className='font-semibold'>Detailed Feedback Data</div>
          <button 
            className='text-sm px-3 py-1 rounded bg-white/10 hover:bg-white/20 transition-colors'
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? '🔼 Hide Details' : '🔽 Show Details'}
          </button>
        </div>
        
        {showDetails && (
          <div className='space-y-4'>
            <div className='text-sm opacity-70 mb-4'>
              This section shows the raw feedback data used to generate the AI analysis above. 
              Use this to understand the specific feedback that contributed to the insights.
            </div>
            
            {snapshotData?.snapshot ? (
              <div className='space-y-3'>
                {/* Snapshot Metadata */}
                <div className='grid md:grid-cols-2 gap-4 text-sm'>
                  <div>
                    <span className='font-medium'>Snapshot ID:</span> {snapshotData.snapshot.snapshot_id}
                  </div>
                  <div>
                    <span className='font-medium'>Rows Analyzed:</span> {snapshotData.snapshot.rows_used || 0}
                  </div>
                  <div>
                    <span className='font-medium'>AI Model:</span> {snapshotData.snapshot.gen_model || 'Unknown'}
                  </div>
                  <div>
                    <span className='font-medium'>Processing Time:</span> {snapshotData.snapshot.gen_ms || 0}ms
                  </div>
                  <div>
                    <span className='font-medium'>Scope:</span> {snapshotData.snapshot.scope_type || 'network'}
                  </div>
                  <div>
                    <span className='font-medium'>Scope Key:</span> {snapshotData.snapshot.scope_key || 'All'}
                  </div>
                  {snapshotData.snapshot.iso_week && (
                    <div>
                      <span className='font-medium'>ISO Week:</span> {snapshotData.snapshot.iso_week}
                    </div>
                  )}
                  {snapshotData.snapshot.month_key && (
                    <div>
                      <span className='font-medium'>Month:</span> {snapshotData.snapshot.month_key}
                    </div>
                  )}
                </div>

                {/* Executive-Friendly Analysis Display */}
                <div className='space-y-4'>
                  {/* Top Opportunities */}
                  {analysis?.top_opportunities?.length > 0 && (
                    <div>
                      <div className='font-medium mb-3'>Key Opportunities Identified</div>
                      <div className='grid md:grid-cols-2 gap-3'>
                        {analysis.top_opportunities.map((opp: any, i: number) => (
                          <div key={i} className='bg-blue-500/10 border border-blue-500/20 p-3 rounded'>
                            <div className='font-medium text-blue-300'>{opp.theme}</div>
                            <div className='text-lg font-semibold text-blue-200'>${opp.impact_dollars?.toLocaleString?.()}</div>
                            <div className='text-sm opacity-80 mt-1'>{opp.why}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Top Actions */}
                  {analysis?.top_actions?.length > 0 && (
                    <div>
                      <div className='font-medium mb-3'>Recommended Actions</div>
                      <div className='space-y-2'>
                        {analysis.top_actions.map((action: any, i: number) => (
                          <div key={i} className='bg-green-500/10 border border-green-500/20 p-3 rounded'>
                            <div className='font-medium text-green-300'>{action.action}</div>
                            <div className='text-sm mt-1 grid md:grid-cols-3 gap-2'>
                              <span className='opacity-80'>Owner: <span className='text-green-200'>{action.owner}</span></span>
                              <span className='opacity-80'>Timeline: <span className='text-green-200'>{action.eta_weeks} weeks</span></span>
                              <span className='opacity-80'>Expected Impact: <span className='text-green-200'>+${action.expected_uplift_dollars?.toLocaleString?.()}</span></span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Risks */}
                  {analysis?.risks?.length > 0 && (
                    <div>
                      <div className='font-medium mb-3'>Risk Assessment</div>
                      <div className='space-y-2'>
                        {analysis.risks.map((risk: any, i: number) => (
                          <div key={i} className='bg-red-500/10 border border-red-500/20 p-3 rounded'>
                            <div className='font-medium text-red-300'>{risk.risk}</div>
                            <div className='text-sm opacity-80 mt-1'>
                              <span className='text-red-200'>Mitigation:</span> {risk.mitigation}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Volume Trends */}
                  {analysis?.volume_series?.length > 0 && (
                    <div>
                      <div className='font-medium mb-3'>Feedback Volume Trends</div>
                      <div className='bg-gray-500/10 border border-gray-500/20 p-3 rounded'>
                        <div className='grid grid-cols-2 md:grid-cols-4 gap-2 text-sm'>
                          {analysis.volume_series.slice(0, 8).map((vol: any, i: number) => (
                            <div key={i} className='text-center'>
                              <div className='opacity-70'>{vol.week}</div>
                              <div className='font-medium'>{vol.count}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Executive Narrative */}
                  {analysis?.narrative && (
                    <div>
                      <div className='font-medium mb-3'>Executive Summary</div>
                      <div className='bg-purple-500/10 border border-purple-500/20 p-4 rounded'>
                        <div className='text-sm leading-relaxed'>{analysis.narrative}</div>
                      </div>
                    </div>
                  )}

                  {/* Sample Feedback Data (if available) */}
                  {analysis?.sample_feedback && (
                    <div>
                      <div className='font-medium mb-3'>Sample Customer Feedback</div>
                      <div className='space-y-2'>
                        {analysis.sample_feedback.slice(0, 3).map((feedback: any, i: number) => (
                          <div key={i} className='bg-yellow-500/10 border border-yellow-500/20 p-3 rounded'>
                            <div className='flex justify-between items-start mb-2'>
                              <div className='font-medium text-yellow-300'>Store {feedback.store_id || 'Unknown'}</div>
                              <div className='text-xs px-2 py-1 rounded-full bg-white/10'>
                                {feedback.overall_mood === 'pos' ? '😊 Positive' : feedback.overall_mood === 'neg' ? '😞 Negative' : '😐 Neutral'}
                              </div>
                            </div>
                            <div className='text-sm space-y-1'>
                              {feedback.miss1 && <div><span className='opacity-70'>Issue 1:</span> {feedback.miss1}</div>}
                              {feedback.miss2 && <div><span className='opacity-70'>Issue 2:</span> {feedback.miss2}</div>}
                              {feedback.miss3 && <div><span className='opacity-70'>Issue 3:</span> {feedback.miss3}</div>}
                              {feedback.freeform_comments && <div><span className='opacity-70'>Comments:</span> {feedback.freeform_comments}</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className='text-sm opacity-70'>
                No snapshot data available. Generate an AI report to see detailed feedback information.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
