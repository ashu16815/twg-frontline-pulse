'use client';

import { useEffect, useMemo, useState } from 'react';
import Filters from './Filters';
import LoadingButton from '@/components/LoadingButton';

function Money(n: number) {
  return `$${Math.round(n || 0).toLocaleString()}`;
}

export default function ExecReport() {
  const [filters, setFilters] = useState<any>({ scope: 'week' });
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [feedbackStatus, setFeedbackStatus] = useState<{[key: string]: 'submitting' | 'success' | 'error'}>({});

  async function load() {
    setLoading(true);
    setErr('');
    const p = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v) p.set(k, String(v));
    });
    
    const r = await fetch(`/api/exec-report/summary?${p.toString()}`, { cache: 'no-store' });
    const j = await r.json();
    
    if (!r.ok || !j.ok) {
      setErr(j.error || 'Failed');
      setLoading(false);
      return;
    }
    
    setData(j);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [filters.scope, filters.week, filters.month, filters.region, filters.storeId]);

  const title = useMemo(() => {
    if (!data) return 'Executive Report';
    return data.scope === 'week' ? `Executive Report — ${data.scope_key}` : `Executive Report — ${data.scope_key}`;
  }, [data]);

  async function sendFeedback(section: string, rating: number, comment?: string) {
    const feedbackKey = `${section}-${rating}`;
    setFeedbackStatus(prev => ({ ...prev, [feedbackKey]: 'submitting' }));
    
    try {
      const b = {
        scope: data.scope,
        scope_key: data.scope_key,
        region: filters.region || null,
        storeId: filters.storeId || null,
        section,
        rating,
        comment: comment || null
      };
      
      const response = await fetch('/api/exec-report/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(b)
      });
      
      const result = await response.json();
      
      if (result.ok) {
        setFeedbackStatus(prev => ({ ...prev, [feedbackKey]: 'success' }));
        // Clear success status after 2 seconds
        setTimeout(() => {
          setFeedbackStatus(prev => ({ ...prev, [feedbackKey]: undefined }));
        }, 2000);
      } else {
        throw new Error(result.error || 'Failed to submit feedback');
      }
    } catch (error: any) {
      console.error('Feedback submission error:', error);
      setFeedbackStatus(prev => ({ ...prev, [feedbackKey]: 'error' }));
      // Clear error status after 3 seconds
      setTimeout(() => {
        setFeedbackStatus(prev => ({ ...prev, [feedbackKey]: undefined }));
      }, 3000);
    }
  }

  return (
    <div className='space-y-6'>
      <header className='flex items-center justify-between'>
        <h1 className='text-2xl font-semibold'>{title}</h1>
        <div className='flex gap-2'>
          <LoadingButton onClick={load} className='btn'>
            🔄 Refresh
          </LoadingButton>
        </div>
      </header>

      <Filters onChange={setFilters} />

      {loading && (
        <div className='card flex items-center gap-3 justify-center py-8'>
          <div className='spinner'></div>
          <span className='text-sm'>Loading executive insights...</span>
        </div>
      )}

      {data && (
        <>
          {/* KPI Dashboard */}
          <section className='grid md:grid-cols-4 gap-3'>
            <div className='btn p-4'>
              <div className='text-xs text-slate-400'>Coverage</div>
              <div className='text-2xl'>{data.base?.coveragePct || 0}%</div>
              {data.base?.coveragePct < 70 && (
                <div className='text-xs text-yellow-400 mt-1'>⚠️ Directional</div>
              )}
            </div>
            <div className='btn p-4'>
              <div className='text-xs text-slate-400'>Regions</div>
              <div className='text-2xl'>{data.base?.regions || 0}</div>
            </div>
            <div className='btn p-4'>
              <div className='text-xs text-slate-400'>Submissions</div>
              <div className='text-2xl'>{data.base?.responded || 0}</div>
            </div>
            <div className='btn p-4'>
              <div className='text-xs text-slate-400'>Total reported impact</div>
              <div className='text-2xl'>{Money(data.base?.totalImpact || 0)}</div>
            </div>
          </section>

          {/* Executive Summary */}
          <section className='card'>
            <div className='flex items-center justify-between'>
              <h2 className='font-semibold'>Executive Summary</h2>
              <Thumbs 
                onRate={(r) => sendFeedback('summary', r)} 
                feedbackStatus={feedbackStatus}
                section="summary"
              />
            </div>
            <ul className='list-disc pl-6 text-sm space-y-1 mt-3'>
              {(data?.ai?.summary || []).map((s: string, i: number) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </section>

          {/* What's working / not */}
          <section className='grid md:grid-cols-2 gap-4'>
            <div className='card'>
              <div className='flex items-center justify-between'>
                <h3 className='font-semibold'>What's Working</h3>
                <Thumbs 
                onRate={(r) => sendFeedback('insights', r)} 
                feedbackStatus={feedbackStatus}
                section="insights"
              />
              </div>
              <ul className='list-disc pl-6 text-sm space-y-1 mt-3'>
                {(data?.ai?.whatsWorking || []).map((s: string, i: number) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
            <div className='card'>
              <h3 className='font-semibold'>What's Not</h3>
              <ul className='list-disc pl-6 text-sm space-y-1 mt-3'>
                {(data?.ai?.whatsNot || []).map((x: any, i: number) => (
                  <li key={i}>
                    <span className='text-white/90'>{x.text}</span>
                    <span className='text-white/50 ml-2'>{Money(x.impact || 0)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Opportunities & Actions */}
          <section className='grid md:grid-cols-2 gap-4'>
            <div className='card'>
              <div className='flex items-center justify-between'>
                <h3 className='font-semibold'>Top 3 Opportunities</h3>
                <Thumbs 
                onRate={(r) => sendFeedback('actions', r)} 
                feedbackStatus={feedbackStatus}
                section="actions"
              />
              </div>
              <ol className='list-decimal pl-5 text-sm space-y-2 mt-3'>
                {(data?.ai?.opportunities || []).slice(0, 3).map((o: any, i: number) => (
                  <li key={i}>
                    <div className='font-medium'>{o.text}</div>
                    <div className='text-xs text-white/60'>
                      Theme: {o.theme || '—'} • Impact: {Money(o.impact || 0)}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <div className='card'>
              <h3 className='font-semibold'>Top 3 Suggested Actions</h3>
              <ol className='list-decimal pl-5 text-sm space-y-2 mt-3'>
                {(data?.ai?.actions || []).slice(0, 3).map((a: any, i: number) => (
                  <li key={i}>
                    <div className='font-medium'>{a.action}</div>
                    <div className='text-xs text-white/60'>
                      Owner: {a.owner || 'TBD'} • Expected Impact: {Money(a.expectedImpact || 0)}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          {/* Risk & Opportunity map */}
          <section className='grid md:grid-cols-2 gap-4'>
            <div className='card'>
              <h3 className='font-semibold'>Risks</h3>
              <ul className='list-disc pl-6 text-sm space-y-1 mt-3'>
                {(data?.ai?.risks || []).map((r: string, i: number) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
            <div className='card'>
              <h3 className='font-semibold'>Opportunity by Region</h3>
              <div className='grid grid-cols-2 md:grid-cols-3 gap-2 mt-3'>
                {(data?.ai?.oppByRegion || []).map((x: any) => (
                  <div key={x.region} className='btn p-3 text-left'>
                    <div className='text-sm font-medium'>{x.region}</div>
                    <div className='text-xs text-white/60'>
                      Impact {Money(x.impact || 0)} • ×{x.mentions || 0}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Predictive Outlook (stub) */}
          <section className='card'>
            <div className='flex items-center justify-between'>
              <h3 className='font-semibold'>Predictive Outlook</h3>
              <Thumbs 
                onRate={(r) => sendFeedback('predictive', r)} 
                feedbackStatus={feedbackStatus}
                section="predictive"
              />
            </div>
            {data?.predictive ? (
              <pre className='text-xs whitespace-pre-wrap opacity-80 mt-3'>
                {JSON.stringify(data.predictive, null, 2)}
              </pre>
            ) : (
              <div className='text-sm text-white/60 mt-3'>
                Azure ML endpoint not configured. Add AZURE_ML_SCORING_URI to enable forecasts/scenarios.
              </div>
            )}
          </section>
        </>
      )}

      {err && (
        <div className='text-sm text-red-400 bg-red-900/20 border border-red-500/30 rounded-lg p-4'>
          {err}
        </div>
      )}
    </div>
  );
}

function Thumbs({ 
  onRate, 
  feedbackStatus, 
  section 
}: { 
  onRate: (n: 1 | 2 | 3) => void;
  feedbackStatus: {[key: string]: 'submitting' | 'success' | 'error'};
  section: string;
}) {
  const getButtonClass = (rating: number) => {
    const key = `${section}-${rating}`;
    const status = feedbackStatus[key];
    
    if (status === 'submitting') {
      return 'btn opacity-50 cursor-not-allowed';
    } else if (status === 'success') {
      return 'btn bg-green-600 hover:bg-green-700 text-white';
    } else if (status === 'error') {
      return 'btn bg-red-600 hover:bg-red-700 text-white';
    }
    return 'btn hover:bg-white/10';
  };

  const getButtonContent = (rating: number) => {
    const key = `${section}-${rating}`;
    const status = feedbackStatus[key];
    
    if (status === 'submitting') {
      return '⏳';
    } else if (status === 'success') {
      return '✅';
    } else if (status === 'error') {
      return '❌';
    }
    
    // Default emojis
    switch (rating) {
      case 1: return '👎';
      case 2: return '👌';
      case 3: return '👍';
      default: return '?';
    }
  };

  return (
    <div className='inline-flex gap-2'>
      <button 
        className={getButtonClass(1)} 
        title='Not helpful' 
        onClick={() => onRate(1)}
        disabled={feedbackStatus[`${section}-1`] === 'submitting'}
      >
        {getButtonContent(1)}
      </button>
      <button 
        className={getButtonClass(2)} 
        title='Okay' 
        onClick={() => onRate(2)}
        disabled={feedbackStatus[`${section}-2`] === 'submitting'}
      >
        {getButtonContent(2)}
      </button>
      <button 
        className={getButtonClass(3)} 
        title='Helpful' 
        onClick={() => onRate(3)}
        disabled={feedbackStatus[`${section}-3`] === 'submitting'}
      >
        {getButtonContent(3)}
      </button>
    </div>
  );
}
