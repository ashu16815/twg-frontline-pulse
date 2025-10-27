'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// Date helper functions
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return formatDate(date);
}

function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function RawFeedbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>({ total: 0, page: 1, pageSize: 25, results: [] });
  const [regions, setRegions] = useState<any[]>([]);
  
  // Get filter params from URL
  const filters = {
    start: searchParams.get('start') || getDaysAgo(7),
    end: searchParams.get('end') || formatDate(new Date()),
    region: searchParams.get('region') || 'all',
    store_id: searchParams.get('store_id') || 'all',
    sentiment: searchParams.get('sentiment') || 'all',
    q: searchParams.get('q') || '',
    page: parseInt(searchParams.get('page') || '1'),
    pageSize: parseInt(searchParams.get('pageSize') || '25'),
    order: searchParams.get('order') || 'submitted_at_desc'
  };

  useEffect(() => {
    fetchRegions();
    fetchData();
  }, [searchParams]);

  async function fetchRegions() {
    try {
      const res = await fetch('/api/reports/lookups');
      const json = await res.json();
      if (json.ok) {
        setRegions(json.regions || []);
      }
    } catch (e) {
      console.error('Failed to fetch regions:', e);
    }
  }

  async function fetchData() {
    setLoading(true);
    const params = new URLSearchParams(filters as any).toString();
    const res = await fetch(`/api/feedback/raw?${params}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  }

  function updateQuery(newParams: any) {
    const params = new URLSearchParams({ ...filters, ...newParams, page: '1' });
    router.push(`/feedback/raw?${params.toString()}`);
  }

  function exportCsv() {
    const params = new URLSearchParams(filters as any).toString();
    window.open(`/api/feedback/export-csv?${params}`, '_blank');
  }

  function SentimentIcon({ s }: { s?: string }) {
    const map: any = { positive: '👍', neutral: '😐', negative: '⚠️', pos: '👍', neg: '⚠️', neu: '😐' };
    return <span title={s || 'n/a'}>{map[s || 'neutral']}</span>;
  }

  return (
    <div className='min-h-screen bg-black text-white p-6'>
      <div className='mx-auto max-w-7xl'>
        <header className='flex items-center justify-between gap-4 flex-wrap mb-6'>
          <h1 className='text-2xl font-semibold'>Raw Store Feedback Ledger</h1>
          <div className='flex gap-2'>
            <button 
              className='btn bg-red-600 hover:bg-red-700 text-white'
              onClick={exportCsv}
            >
              📥 Export CSV
            </button>
            <button className='btn' onClick={() => router.push('/executive-reports')}>
              ← Back to Reports
            </button>
          </div>
        </header>

        {/* Filters */}
        <div className='card p-4 mb-6'>
          <div className='grid grid-cols-1 md:grid-cols-6 gap-3'>
            <div>
              <label className='text-sm opacity-80 block mb-1'>Start Date</label>
              <input 
                type='date' 
                className='input w-full' 
                value={filters.start} 
                onChange={e => updateQuery({ start: e.target.value })}
              />
            </div>
            <div>
              <label className='text-sm opacity-80 block mb-1'>End Date</label>
              <input 
                type='date' 
                className='input w-full' 
                value={filters.end} 
                onChange={e => updateQuery({ end: e.target.value })}
              />
            </div>
            <div>
              <label className='text-sm opacity-80 block mb-1'>Region</label>
              <select 
                className='input w-full' 
                value={filters.region} 
                onChange={e => updateQuery({ region: e.target.value })}
              >
                <option value='all'>All Regions</option>
                {regions.map(r => (
                  <option key={r.code} value={r.code}>{r.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className='text-sm opacity-80 block mb-1'>Store</label>
              <input 
                placeholder='Store ID' 
                className='input w-full' 
                value={filters.store_id === 'all' ? '' : filters.store_id} 
                onChange={e => updateQuery({ store_id: e.target.value || 'all' })}
              />
            </div>
            <div>
              <label className='text-sm opacity-80 block mb-1'>Sentiment</label>
              <select 
                className='input w-full' 
                value={filters.sentiment} 
                onChange={e => updateQuery({ sentiment: e.target.value })}
              >
                <option value='all'>All</option>
                <option value='positive'>Positive 👍</option>
                <option value='neutral'>Neutral 😐</option>
                <option value='negative'>Negative ⚠️</option>
              </select>
            </div>
            <div>
              <label className='text-sm opacity-80 block mb-1'>Search</label>
              <input 
                placeholder='keywords...' 
                className='input w-full' 
                value={filters.q} 
                onChange={e => updateQuery({ q: e.target.value })}
              />
            </div>
          </div>
          
          <div className='mt-3 flex gap-3 items-center text-sm'>
            <span className='opacity-80'>Sort by:</span>
            <select 
              className='input' 
              value={filters.order} 
              onChange={e => updateQuery({ order: e.target.value })}
            >
              <option value='submitted_at_desc'>Newest first</option>
              <option value='impact_desc'>Highest impact</option>
            </select>
            <span className='px-2 py-1 rounded bg-red-600/20 text-red-300'>
              {data.total.toLocaleString()} feedback entries
            </span>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className='space-y-3'>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className='h-32 rounded-2xl bg-gray-900 animate-pulse' />
            ))}
          </div>
        ) : data.results?.length === 0 ? (
          <div className='card p-10 text-center'>
            No feedback found for current filters.
          </div>
        ) : (
          <>
            <div className='space-y-3'>
              {data.results?.map((f: any) => (
                <article key={f.id} className='card p-4 border border-gray-800'>
                  <div className='flex items-start justify-between gap-3 mb-3'>
                    <div>
                      <div className='flex items-center gap-3 flex-wrap'>
                        <h3 className='text-lg font-semibold'>
                          {f.store_name || f.store_id} 
                          <span className='opacity-60 text-sm ml-2'>({f.store_id})</span>
                        </h3>
                        {f.region_code && (
                          <span className='px-2 py-1 rounded text-xs bg-blue-600/20 text-blue-300'>
                            {f.region_code}
                          </span>
                        )}
                        {f.banner && (
                          <span className='px-2 py-1 rounded text-xs bg-gray-800 text-gray-300'>
                            {f.banner}
                          </span>
                        )}
                      </div>
                      <div className='text-sm opacity-70 mt-1'>
                        {formatDateTime(f.submitted_at)} • 
                        by {f.author_name || 'Store'}
                      </div>
                    </div>
                    <div className='flex items-center gap-2'>
                      <SentimentIcon s={f.sentiment} />
                      {f.est_impact_dollars && (
                        <span className='px-2 py-1 rounded text-xs bg-red-600/20 text-red-300 font-semibold'>
                          ${Number(f.est_impact_dollars).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
                    <div className='bg-gray-900 rounded-xl p-3'>
                      <div className='text-xs text-green-300 mb-1'>✓ What worked</div>
                      <div className='text-sm whitespace-pre-wrap'>{f.what_worked || '—'}</div>
                    </div>
                    <div className='bg-gray-900 rounded-xl p-3'>
                      <div className='text-xs text-red-300 mb-1'>⚠️ What didn't</div>
                      <div className='text-sm whitespace-pre-wrap'>{f.what_didnt || '—'}</div>
                    </div>
                    <div className='bg-gray-900 rounded-xl p-3'>
                      <div className='text-xs text-blue-300 mb-1'>📋 Actions planned</div>
                      <div className='text-sm whitespace-pre-wrap'>{f.actions_planned || '—'}</div>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Pagination */}
            <div className='mt-6 flex items-center justify-between'>
              <div className='text-sm opacity-70'>
                Page {data.page} of {Math.max(1, Math.ceil(data.total / Math.max(1, data.pageSize)))}
              </div>
              <div className='flex gap-2'>
                <button
                  className='btn'
                  disabled={filters.page <= 1 || loading}
                  onClick={() => updateQuery({ page: Math.max(1, filters.page - 1) })}
                >
                  ← Previous
                </button>
                <button
                  className='btn'
                  disabled={filters.page >= Math.ceil(data.total / filters.pageSize) || loading}
                  onClick={() => updateQuery({ page: filters.page + 1 })}
                >
                  Next →
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

