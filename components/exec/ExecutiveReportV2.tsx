'use client';
import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, LineChart, Line, Legend } from 'recharts';

const f = (u: string) => fetch(u).then(r => r.json());

export default function ExecutiveReportV2() {
  const [scope_type, setScopeType] = useState<'network' | 'region' | 'store'>('network');
  const [scope_key, setScopeKey] = useState('');
  const [range, setRange] = useState<'this_week' | 'last_7' | ''>('last_7');
  const [iso_week, setWeek] = useState('');
  const [month_key, setMonth] = useState('');
  const [area_code, setArea] = useState('');

  const qsBase = new URLSearchParams({ 
    scope_type, 
    ...(scope_key ? { scope_key } : {}), 
    ...(iso_week ? { iso_week } : {}), 
    ...(month_key ? { month_key } : {}) 
  });
  
  const qsKpi = new URLSearchParams({ 
    scope_type, 
    ...(scope_key ? { scope_key } : {}), 
    ...(iso_week ? { iso_week } : {}), 
    ...(month_key ? { month_key } : {}), 
    ...(range ? { range } : {}), 
    ...(area_code ? { area_code } : {}) 
  });

  const { data: snapshot } = useSWR('/api/exec/snapshot?' + qsBase.toString(), f, { revalidateOnFocus: false });
  const { data: kpi } = useSWR('/api/exec/kpis?' + qsKpi.toString(), f, { revalidateOnFocus: false });
  const { data: issues } = useSWR('/api/stock-issues?' + new URLSearchParams({ 
    ...(scope_type === 'region' && scope_key ? { region_code: scope_key } : {}), 
    ...(scope_type === 'store' && scope_key ? { store_id: scope_key } : {}), 
    days: '7' 
  }).toString(), f, { revalidateOnFocus: false });

  const analysis = snapshot?.snapshot?.analysis_json ? JSON.parse(snapshot.snapshot.analysis_json) : null;
  const stamp = snapshot?.snapshot?.created_at ? new Date(snapshot.snapshot.created_at + 'Z').toLocaleString() : 'Not generated yet';

  async function generate() {
    await fetch('/api/exec/job', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        scope_type, 
        scope_key: scope_key || null, 
        iso_week: iso_week || null, 
        month_key: month_key || null 
      })
    });
  }

  const regionRows = useMemo(() => {
    const obj = kpi?.regions || {};
    return Object.keys(obj).map(k => ({ 
      region: k, 
      feedbacks: obj[k].feedbacks, 
      miss: obj[k].miss_dollars 
    }));
  }, [kpi]);

  return (
    <div className='space-y-6'>
      {/* Header & Filters */}
      <div className='card p-4 grid grid-cols-2 md:grid-cols-8 gap-3'>
        <select className='input' value={scope_type} onChange={e => setScopeType(e.target.value as any)}>
          <option value='network'>Network</option>
          <option value='region'>Region</option>
          <option value='store'>Store</option>
        </select>
        <input className='input' placeholder='Scope key (AKL or store_id)' value={scope_key} onChange={e => setScopeKey(e.target.value)} />
        <button className={'btn' + (range === 'this_week' ? ' btn-primary' : '')} onClick={() => { setRange('this_week'); setWeek(''); setMonth(''); }}>
          This Week
        </button>
        <button className={'btn' + (range === 'last_7' ? ' btn-primary' : '')} onClick={() => { setRange('last_7'); setWeek(''); setMonth(''); }}>
          Last 7 Days
        </button>
        <input className='input' placeholder='ISO Week (YYYY-Www)' value={iso_week} onChange={e => { setMonth(''); setRange(''); setWeek(e.target.value); }} />
        <input className='input' placeholder='Month (YYYY-MM)' value={month_key} onChange={e => { setWeek(''); setRange(''); setMonth(e.target.value); }} />
        <select className='input' value={area_code} onChange={e => setArea(e.target.value)}>
          <option value=''>All Areas</option>
          <option value='Availability'>Availability</option>
          <option value='Supply Chain'>Supply Chain</option>
          <option value='Rosters'>Rosters</option>
          <option value='Pricing'>Pricing</option>
          <option value='Merchandising'>Merchandising</option>
          <option value='Service'>Service</option>
        </select>
        <button className='btn' onClick={generate}>⚡ Generate AI Report</button>
      </div>

      {/* Timestamp + Status */}
      <div className='card p-4 flex items-center justify-between'>
        <div className='text-sm'>AI analysis as of <span className='font-semibold'>{stamp}</span></div>
        <div className='text-xs opacity-70'>Renders from the latest snapshot stored in SQL; generation runs in background.</div>
      </div>

      {/* KPI Cards */}
      <div className='grid md:grid-cols-3 gap-4'>
        <div className='card p-4'>
          <div className='text-xs opacity-70'>Feedback Volume</div>
          <div className='text-2xl font-semibold'>{(kpi?.kpis?.totalFeedbacks ?? 0).toLocaleString?.()}</div>
        </div>
        <div className='card p-4'>
          <div className='text-xs opacity-70'>Estimated Missed Sales ($)</div>
          <div className='text-2xl font-semibold'>${(kpi?.kpis?.totalMiss ?? 0).toLocaleString?.()}</div>
        </div>
        <div className='card p-4'>
          <div className='text-xs opacity-70'>Mood Index</div>
          <div className='text-2xl font-semibold'>{kpi?.kpis?.mood?.toFixed ? kpi.kpis.mood.toFixed(2) : '—'}</div>
        </div>
      </div>

      {/* AI Narrative & Actions */}
      <div className='grid md:grid-cols-2 gap-6'>
        <div className='card p-4'>
          <div className='font-semibold mb-2'>Executive Narrative</div>
          {!analysis ? <div className='text-sm opacity-70'>No AI snapshot yet. Click ⚡ Generate AI Report.</div> : <div className='text-sm leading-6'>{analysis.narrative || '—'}</div>}
        </div>
        <div className='card p-4'>
          <div className='font-semibold mb-2'>Top 5 Actions</div>
          {!analysis ? <div className='text-sm opacity-70'>No AI snapshot yet.</div> : (analysis.top_actions || []).slice(0, 5).map((a: any, i: number) => (
            <div key={i} className='mb-3'>• {a.action} <span className='opacity-70'>(Owner: {a.owner}, {a.eta_weeks}w, +${a.expected_uplift_dollars?.toLocaleString?.()})</span></div>
          ))}
        </div>
      </div>

      {/* Opportunities & Risk */}
      <div className='grid md:grid-cols-2 gap-6'>
        <div className='card p-4'>
          <div className='font-semibold mb-2'>Top Opportunities by Estimated Impact</div>
          {!analysis ? <div className='text-sm opacity-70'>No AI snapshot yet.</div> : (
            <ResponsiveContainer width='100%' height={260}>
              <BarChart data={(analysis.top_opportunities || []).slice(0, 6)}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='theme' />
                <YAxis />
                <Tooltip />
                <Bar dataKey='impact_dollars' />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className='card p-4'>
          <div className='font-semibold mb-2'>Risks & Mitigations</div>
          {!analysis ? <div className='text-sm opacity-70'>No AI snapshot yet.</div> : (analysis.risks || []).slice(0, 6).map((r: any, i: number) => (
            <div key={i} className='mb-2'>• {r.risk} <span className='opacity-70'>(Mitigation: {r.mitigation})</span></div>
          ))}
        </div>
      </div>

      {/* Region heat map & volume trend */}
      <div className='grid md:grid-cols-2 gap-6'>
        <div className='card p-4'>
          <div className='font-semibold mb-2'>Regional Impact (Missed $)</div>
          <ResponsiveContainer width='100%' height={260}>
            <BarChart data={regionRows}>
              <CartesianGrid strokeDasharray='3 3' />
              <XAxis dataKey='region' />
              <YAxis />
              <Tooltip />
              <Bar dataKey='miss' />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className='card p-4'>
          <div className='font-semibold mb-2'>Feedback Volume by Week (AI)</div>
          {analysis?.volume_series?.length ? (
            <ResponsiveContainer width='100%' height={260}>
              <LineChart data={analysis.volume_series}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='week' />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type='monotone' dataKey='count' />
              </LineChart>
            </ResponsiveContainer>
          ) : <div className='text-sm opacity-70'>No AI snapshot yet.</div>}
        </div>
      </div>

      {/* Stock & Delivery Issues */}
      <div className='card p-4'>
        <div className='font-semibold mb-2'>Stock & Delivery Issues — Last 7 Days</div>
        {!issues?.items?.length ? <div className='text-sm opacity-70'>No issues captured yet.</div> : (
          <ul className='text-sm grid md:grid-cols-2 gap-2'>
            {issues.items.slice(0, 12).map((it: any) => (
              <li key={it.issue_id}>• [{it.issue_type}] {it.short_title} <span className='opacity-70'>({it.issue_date})</span> {it.est_impact_dollars ? `— $${Number(it.est_impact_dollars).toLocaleString()}` : ''}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
