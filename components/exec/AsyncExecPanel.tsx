'use client';

import { useEffect, useState } from 'react';

export default function AsyncExecPanel() {
  const [filters, setFilters] = useState({
    scope_type: 'network', 
    scope_key: '', 
    iso_week: '', 
    month_key: ''
  });
  
  const [snapshot, setSnapshot] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<any>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    // Load snapshot data
    const loadSnapshot = async () => {
      try {
        const qs = new URLSearchParams(
          Object.fromEntries(
            Object.entries(filters).filter(([_, v]) => v)
          )
        );
        const response = await fetch('/api/exec/snapshot?' + qs.toString());
        const data = await response.json();
        setSnapshot(data.snapshot);
      } catch (error) {
        console.error('Failed to load snapshot:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSnapshot();
  }, [filters]);

  async function generate() {
    try {
      const r = await fetch('/api/exec/job', {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(filters) 
      });
      const j = await r.json();
      setJob(j.job);
      poll(j.job.job_id);
    } catch (error) {
      console.error('Failed to create job:', error);
    }
  }

  async function poll(id: string) {
    setChecking(true);
    const t = setInterval(async () => {
      try {
        const r = await fetch('/api/exec/job?job_id=' + id);
        const j = await r.json();
        setJob(j.job);
        
        if (j.job?.status === 'succeeded' || j.job?.status === 'failed' || j.job?.status === 'canceled') {
          clearInterval(t);
          setChecking(false);
          // Reload snapshot
          const qs = new URLSearchParams(
            Object.fromEntries(
              Object.entries(filters).filter(([_, v]) => v)
            )
          );
          const response = await fetch('/api/exec/snapshot?' + qs.toString());
          const data = await response.json();
          setSnapshot(data.snapshot);
        }
      } catch (error) {
        console.error('Polling error:', error);
        clearInterval(t);
        setChecking(false);
      }
    }, 2000);
  }

  const stamp = snapshot?.created_at 
    ? new Date(snapshot.created_at + 'Z').toLocaleString() 
    : '—';
  
  const analysis = snapshot?.analysis_json 
    ? JSON.parse(snapshot.analysis_json) 
    : null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/60">Loading AI analysis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {/* Filters */}
      <div className='card p-4 grid grid-cols-2 md:grid-cols-4 gap-3'>
        <select 
          className='input' 
          value={filters.scope_type} 
          onChange={e => setFilters(f => ({ ...f, scope_type: e.target.value }))}
        >
          <option value='network'>Network</option>
          <option value='region'>Region</option>
          <option value='store'>Store</option>
        </select>
        
        <input 
          className='input' 
          placeholder='Scope key (e.g., AKL or store_id)' 
          value={filters.scope_key} 
          onChange={e => setFilters(f => ({ ...f, scope_key: e.target.value }))} 
        />
        
        <input 
          className='input' 
          placeholder='ISO Week (YYYY-Www)' 
          value={filters.iso_week} 
          onChange={e => setFilters(f => ({ ...f, iso_week: e.target.value }))} 
        />
        
        <input 
          className='input' 
          placeholder='Month (YYYY-MM)' 
          value={filters.month_key} 
          onChange={e => setFilters(f => ({ ...f, month_key: e.target.value }))} 
        />
      </div>

      {/* Status and Generate Button */}
      <div className='card p-4 flex items-center justify-between'>
        <div className='text-sm'>
          AI analysis: <span className='opacity-70'>last updated</span>{' '}
          <span className='font-medium'>{stamp}</span>
        </div>
        
        <div className='flex items-center gap-2'>
          {job?.status && (
            <span className='text-xs px-2 py-1 rounded-full bg-white/10'>
              {job.status}
            </span>
          )}
          <button 
            className='btn' 
            onClick={generate} 
            disabled={checking}
          >
            ⚡ Generate AI Analysis
          </button>
        </div>
      </div>

      {/* Analysis Results */}
      <div className='card p-4'>
        {!analysis ? (
          <div className='text-sm opacity-70'>
            AI analysis temporarily disabled or not generated yet. Use the button above to generate a snapshot. 
            Fallback KPIs still load instantly.
          </div>
        ) : (
          <div className='space-y-3 text-sm'>
            <div className='font-semibold'>Top 3 Opportunities</div>
            {(analysis.top_opportunities || []).slice(0, 3).map((t: any, i: number) => (
              <div key={i}>
                • {t.theme} — est. ${t.impact_dollars?.toLocaleString?.()}
                <div className='opacity-70 text-xs'>{t.why}</div>
              </div>
            ))}
            
            <div className='font-semibold mt-4'>Top 3 Actions</div>
            {(analysis.top_actions || []).slice(0, 3).map((a: any, i: number) => (
              <div key={i}>
                • {a.action} (Owner: {a.owner}, {a.eta_weeks}w, +${a.expected_uplift_dollars?.toLocaleString?.()})
              </div>
            ))}
            
            {(analysis.risks || []).length > 0 && (
              <>
                <div className='font-semibold mt-4'>Key Risks</div>
                {(analysis.risks || []).slice(0, 2).map((r: any, i: number) => (
                  <div key={i}>
                    • {r.risk} — {r.mitigation}
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}