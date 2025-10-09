'use client';

import { useEffect, useMemo, useState } from 'react';
import FiltersBar from './FiltersBar';
import LoadingButton from '@/components/LoadingButton';
import Spinner from '@/components/Spinner';

function Money(n: number) {
  return `$${Math.round(n || 0).toLocaleString()}`;
}

export default function ReportsView() {
  const [filters, setFilters] = useState<any>({ period: 'week' });
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    
    const p = new URLSearchParams();
    if (filters.period) p.set('period', filters.period);
    if (filters.week) p.set('week', filters.week);
    if (filters.month) p.set('month', filters.month);
    if (filters.region) p.set('region', filters.region);
    if (filters.storeId) p.set('storeId', filters.storeId);
    
    try {
      const r = await fetch(`/api/reports/summary?${p.toString()}`, { cache: 'no-store' });
      const j = await r.json();
      
      if (!r.ok || !j.ok) {
        setError(j.error || 'Failed to load report');
        setLoading(false);
        return;
      }
      
      setData(j);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [filters.period, filters.week, filters.month, filters.region, filters.storeId]);

  const title = useMemo(() => {
    if (!data) return 'Reports';
    return data.period === 'week' ? `Weekly Report — ${data.week}` : `Monthly Report — ${data.month}`;
  }, [data]);

  const ai = data?.ai || {};

  return (
    <div className='space-y-6'>
      <header className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-semibold'>{title}</h1>
          {data?.region && (
            <div className='text-xs text-white/60 mt-1'>Region: {data.region}</div>
          )}
          {data?.storeId && (
            <div className='text-xs text-white/60 mt-1'>Store: {data.storeId}</div>
          )}
        </div>
        <div className='flex gap-2'>
          <LoadingButton onClick={load} className='btn' busyText='Loading...'>
            🔄 Refresh
          </LoadingButton>
        </div>
      </header>

      <FiltersBar onChange={setFilters} />

      {loading && (
        <div className='card flex items-center gap-3 justify-center py-8'>
          <Spinner />
          <span className='text-sm'>Loading AI insights...</span>
        </div>
      )}

      {error && (
        <div className='text-sm text-red-400 bg-red-900/20 border border-red-500/30 rounded-lg p-4'>
          {error}
        </div>
      )}

      {!loading && data && (
        <>
          {/* KPI strip */}
          <section className='grid md:grid-cols-4 gap-3'>
            <div className='btn p-4'>
              <div className='text-xs text-slate-400'>Total reported impact</div>
              <div className='text-2xl'>{Money(data.base?.totalImpact || 0)}</div>
            </div>
            <div className='btn p-4'>
              <div className='text-xs text-slate-400'>Stores submitted</div>
              <div className='text-2xl'>
                {data.base?.responded || 0}
                <span className='text-sm text-white/60'>/{data.base?.stores || 0}</span>
              </div>
            </div>
            <div className='btn p-4'>
              <div className='text-xs text-slate-400'>Regions covered</div>
              <div className='text-2xl'>{data.base?.regions || 0}</div>
            </div>
            <div className='btn p-4'>
              <div className='text-xs text-slate-400'>Coverage</div>
              <div className='text-2xl'>{data.base?.coveragePct || 0}%</div>
              {data.base?.coveragePct < 70 && (
                <div className='text-xs text-yellow-400 mt-1'>⚠️ Directional</div>
              )}
            </div>
          </section>

          {/* AI Header */}
          <section className='card'>
            <div className='flex items-center justify-between'>
              <h2 className='font-semibold'>Executive Report</h2>
              <span className='text-xs text-white/60'>🤖 AI-Generated Insights</span>
            </div>
          </section>

          {/* Top 3 Opportunities */}
          <section className='grid md:grid-cols-2 gap-4'>
            <div className='card'>
              <h3 className='font-semibold mb-3'>Top 3 Opportunities — This Week</h3>
              {ai.topOpportunities?.week?.length > 0 ? (
                <ol className='list-decimal pl-5 text-sm space-y-2'>
                  {ai.topOpportunities.week.slice(0, 3).map((o: any, i: number) => (
                    <li key={i}>
                      <div className='font-medium'>{o.text}</div>
                      <div className='text-xs text-white/60'>
                        Theme: {o.theme || '—'} • Impact: {Money(o.impact || 0)}
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <div className='text-sm text-white/60'>
                  No data available for this week. Try adjusting filters or submit feedback.
                </div>
              )}
            </div>
            <div className='card'>
              <h3 className='font-semibold mb-3'>Top 3 Opportunities — This Month</h3>
              {ai.topOpportunities?.month?.length > 0 ? (
                <ol className='list-decimal pl-5 text-sm space-y-2'>
                  {ai.topOpportunities.month.slice(0, 3).map((o: any, i: number) => (
                    <li key={i}>
                      <div className='font-medium'>{o.text}</div>
                      <div className='text-xs text-white/60'>
                        Theme: {o.theme || '—'} • Impact: {Money(o.impact || 0)}
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <div className='text-sm text-white/60'>
                  No data available for this month. Try adjusting filters or submit feedback.
                </div>
              )}
            </div>
          </section>

          {/* Top 3 Actions */}
          <section className='grid md:grid-cols-2 gap-4'>
            <div className='card'>
              <h3 className='font-semibold mb-3'>Top 3 Suggested Actions — This Week</h3>
              {ai.topActions?.week?.length > 0 ? (
                <ol className='list-decimal pl-5 text-sm space-y-2'>
                  {ai.topActions.week.slice(0, 3).map((a: any, i: number) => (
                    <li key={i}>
                      <div className='font-medium'>{a.action}</div>
                      <div className='text-xs text-white/60'>
                        Owner: {a.owner || 'TBD'} • Expected Impact: {Money(a.expectedImpact || 0)}
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <div className='text-sm text-white/60'>
                  No actions available for this week. Try adjusting filters or submit feedback.
                </div>
              )}
            </div>
            <div className='card'>
              <h3 className='font-semibold mb-3'>Top 3 Suggested Actions — This Month</h3>
              {ai.topActions?.month?.length > 0 ? (
                <ol className='list-decimal pl-5 text-sm space-y-2'>
                  {ai.topActions.month.slice(0, 3).map((a: any, i: number) => (
                    <li key={i}>
                      <div className='font-medium'>{a.action}</div>
                      <div className='text-xs text-white/60'>
                        Owner: {a.owner || 'TBD'} • Expected Impact: {Money(a.expectedImpact || 0)}
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <div className='text-sm text-white/60'>
                  No actions available for this month. Try adjusting filters or submit feedback.
                </div>
              )}
            </div>
          </section>

          {/* Narrative */}
          <section className='card'>
            <h3 className='font-semibold mb-3'>Executive Narrative</h3>
            <p className='text-sm whitespace-pre-wrap text-white/80'>
              {ai.narrative || 'AI narrative unavailable. This may be due to insufficient data coverage or filtering that returns no results.'}
            </p>
          </section>
        </>
      )}
    </div>
  );
}

