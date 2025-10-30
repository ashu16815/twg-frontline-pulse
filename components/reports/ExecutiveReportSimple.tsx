'use client';

import { useState, useEffect } from 'react';

/**
 * Simple Executive Report Component
 * Shows: Top 3 opportunities, Top 3 pain points, Executive summary, What's working well
 */
export default function ExecutiveReportSimple() {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [regionFilter, setRegionFilter] = useState('all');
  const [storeFilter, setStoreFilter] = useState('all');
  const [daysFilter, setDaysFilter] = useState('7');
  const [regions, setRegions] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [lookupsLoading, setLookupsLoading] = useState(false);

  // Fetch lookups on mount
  useEffect(() => {
    fetchLookups();
  }, []);

  async function fetchLookups() {
    setLookupsLoading(true);
    try {
      const response = await fetch('/api/reports/lookups');
      const result = await response.json();
      if (result.ok) {
        setRegions([{ code: 'all', label: 'All Regions' }, ...result.regions]);
        setStores([{ id: 'all', label: 'All Stores' }, ...result.stores]);
      }
    } catch (err) {
      console.error('Error fetching lookups:', err);
    } finally {
      setLookupsLoading(false);
    }
  }

  async function generateReport() {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/reports/executive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          region_code: regionFilter === 'all' ? null : regionFilter,
          store_id: storeFilter === 'all' ? null : storeFilter,
          days: parseInt(daysFilter)
        })
      });
      // Be resilient to non-JSON error bodies (e.g., HTML error page or plain text)
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const text = await response.text();
        setError(text?.slice(0, 200) || 'Unexpected non-JSON response');
        setReport(null);
        return;
      }

      const result = await response.json();

      if (response.ok && result?.ok && result.report) {
        setReport(result);
        console.log('📊 Report generated:', result);
      } else {
        setError(result?.error || 'Failed to generate report');
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Error generating report:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-semibold'>Executive Report - Last {daysFilter} Days</h1>
      </div>

      {/* Filters */}
      <div className='card p-4 space-y-3'>
        <div className='grid md:grid-cols-4 gap-3'>
          <select
            className='input'
            value={daysFilter}
            onChange={(e) => setDaysFilter(e.target.value)}
          >
            <option value='7'>Last 7 Days</option>
            <option value='15'>Last 15 Days</option>
            <option value='21'>Last 21 Days</option>
            <option value='30'>Last 30 Days</option>
          </select>
          <select
            className='input'
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            disabled={lookupsLoading}
          >
            {regions.map((r: any) => (
              <option key={r.code} value={r.code}>{r.label}</option>
            ))}
          </select>
          <select
            className='input'
            value={storeFilter}
            onChange={(e) => setStoreFilter(e.target.value)}
            disabled={lookupsLoading}
          >
            {stores.map((s: any) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
          <button
            className={`btn btn-primary ${loading ? 'opacity-60' : ''}`}
            onClick={generateReport}
            disabled={loading}
          >
            {loading ? '⏳ Generating...' : '⚡ Generate Report'}
          </button>
        </div>
        <div className='text-xs opacity-70'>
          Select time period, region, and store, then click to generate report
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className='card p-4 bg-red-500/10 border-red-500/20'>
          <div className='text-red-300'>{error}</div>
        </div>
      )}

      {/* Report Content */}
      {report && (
        <>
          {/* Executive Summary */}
          {report.report?.executive_summary && (
            <div className='card p-6'>
              <h2 className='text-lg font-semibold mb-4'>Executive Summary</h2>
              <div className='text-sm leading-relaxed'>{report.report.executive_summary}</div>
            </div>
          )}

          {/* What's Working Well */}
          {report.report?.what_is_working_well && report.report.what_is_working_well.length > 0 && (
            <div className='card p-4'>
              <h3 className='font-semibold mb-4 text-green-300'>✅ What's Working Well</h3>
              <div className='space-y-2'>
                {report.report.what_is_working_well.map((item: any, i: number) => (
                  <div key={i} className='bg-green-500/10 border border-green-500/20 p-3 rounded'>
                    <div className='text-sm'>{item}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* What's Not Working */}
          {report.report?.what_is_not_working && report.report.what_is_not_working.length > 0 && (
            <div className='card p-4'>
              <h3 className='font-semibold mb-4 text-orange-300'>❌ What's Not Working</h3>
              <div className='space-y-2'>
                {report.report.what_is_not_working.map((item: any, i: number) => (
                  <div key={i} className='bg-orange-500/10 border border-orange-500/20 p-3 rounded'>
                    <div className='text-sm'>{item}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Additional Information */}
          {report.report?.additional_information && (
            <div className='card p-4'>
              <h3 className='font-semibold mb-4 text-blue-300'>ℹ️ Additional Information</h3>
              <div className='bg-blue-500/10 border border-blue-500/20 p-4 rounded'>
                <div className='text-sm leading-relaxed'>{report.report.additional_information}</div>
              </div>
            </div>
          )}

          {/* Grid: Top Opportunities & Pain Points */}
          <div className='grid md:grid-cols-2 gap-6'>
            {/* Top 3 Opportunities */}
            <div className='card p-4'>
              <h3 className='font-semibold mb-4 text-blue-300'>🚀 Top 3 Opportunities</h3>
              {report.report?.top_opportunities && report.report.top_opportunities.length > 0 ? (
                <div className='space-y-2'>
                  {report.report.top_opportunities.slice(0, 3).map((opp: any, i: number) => (
                    <div key={i} className='bg-blue-500/10 border border-blue-500/20 p-3 rounded'>
                      <div className='text-sm font-medium'>{opp}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className='text-sm opacity-70'>No opportunities identified</div>
              )}
            </div>

            {/* Top 3 Pain Points */}
            <div className='card p-4'>
              <h3 className='font-semibold mb-4 text-red-300'>⚠️ Top 3 Pain Points</h3>
              {report.report?.top_pain_points && report.report.top_pain_points.length > 0 ? (
                <div className='space-y-2'>
                  {report.report.top_pain_points.slice(0, 3).map((pain: any, i: number) => (
                    <div key={i} className='bg-red-500/10 border border-red-500/20 p-3 rounded'>
                      <div className='text-sm font-medium'>{pain}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className='text-sm opacity-70'>No pain points identified</div>
              )}
            </div>
          </div>

          {/* Recommended Actions */}
          {report.report?.recommended_actions && report.report.recommended_actions.length > 0 && (
            <div className='card p-4'>
              <h3 className='font-semibold mb-4'>📋 Recommended Actions</h3>
              <div className='space-y-2'>
                {report.report.recommended_actions.map((action: any, i: number) => (
                  <div key={i} className='bg-yellow-500/10 border border-yellow-500/20 p-3 rounded'>
                    <div className='text-sm'>{action}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          {report.metadata && (
            <div className='card p-4'>
              <div className='grid grid-cols-4 gap-4'>
                <div>
                  <div className='text-xs opacity-70'>Period</div>
                  <div className='text-lg font-semibold'>{report.metadata.days_period} days</div>
                </div>
                <div>
                  <div className='text-xs opacity-70'>Feedback Count</div>
                  <div className='text-lg font-semibold'>{report.metadata.feedback_count}</div>
                </div>
                <div>
                  <div className='text-xs opacity-70'>Stores</div>
                  <div className='text-lg font-semibold'>{report.metadata.stores_count}</div>
                </div>
                <div>
                  <div className='text-xs opacity-70'>Est. Impact</div>
                  <div className='text-lg font-semibold'>${report.metadata.estimated_impact?.toLocaleString()}</div>
                </div>
              </div>
            </div>
          )}

          {/* Show Details Toggle */}
          <div className='card p-4'>
            <button
              className='btn btn-secondary w-full'
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? '▼ Hide Details' : '▶ Show Details'}
            </button>
          </div>

          {/* Detailed Feedback Data */}
          {showDetails && report.raw_data && (
            <div className='card p-4 space-y-4'>
              <h3 className='font-semibold'>📊 Raw Feedback Data Analyzed</h3>
              
              {/* What's Working Well - Details */}
              {report.raw_data.whats_working && report.raw_data.whats_working.length > 0 && (
                <div>
                  <h4 className='text-sm font-medium mb-2 text-green-300'>✅ What's Working Well ({report.raw_data.whats_working.length})</h4>
                  <div className='space-y-2 max-h-64 overflow-y-auto text-xs'>
                    {report.raw_data.whats_working.map((item: any, i: number) => (
                      <div key={i} className='bg-green-500/10 border border-green-500/20 p-2 rounded'>
                        <div className='font-medium'>{item.theme}</div>
                        <div className='text-xs opacity-70'>Store: {item.store_name || item.store_id} | Region: {item.region_code}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* What's Not Working - Details */}
              {report.raw_data.whats_not_working && report.raw_data.whats_not_working.length > 0 && (
                <div>
                  <h4 className='text-sm font-medium mb-2 text-orange-300'>❌ What's Not Working ({report.raw_data.whats_not_working.length})</h4>
                  <div className='space-y-2 max-h-64 overflow-y-auto text-xs'>
                    {report.raw_data.whats_not_working.map((item: any, i: number) => (
                      <div key={i} className='bg-orange-500/10 border border-orange-500/20 p-2 rounded'>
                        <div className='flex justify-between'>
                          <span className='font-medium'>{item.issue}</span>
                          <span className='font-semibold text-red-300'>${item.impact?.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional Information - Details */}
              {report.raw_data.additional_info && report.raw_data.additional_info.length > 0 && (
                <div>
                  <h4 className='text-sm font-medium mb-2 text-blue-300'>ℹ️ Additional Information ({report.raw_data.additional_info.length})</h4>
                  <div className='space-y-2 max-h-64 overflow-y-auto text-xs'>
                    {report.raw_data.additional_info.map((item: any, i: number) => (
                      <div key={i} className='bg-blue-500/10 border border-blue-500/20 p-3 rounded'>
                        <div className='grid grid-cols-3 gap-2 mb-2'>
                          <div><span className='opacity-70'>Store:</span> {item.store_name || item.store_id}</div>
                          <div><span className='opacity-70'>Region:</span> {item.region_code}</div>
                          <div><span className='opacity-70'>Mood:</span> {item.overall_mood}</div>
                        </div>
                        <div className='text-sm'>{item.comment}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Detailed Feedbacks */}
              {report.raw_data.sample_feedbacks && report.raw_data.sample_feedbacks.length > 0 && (
                <div>
                  <h4 className='text-sm font-medium mb-2'>📝 Detailed Feedback ({report.raw_data.sample_feedbacks.length})</h4>
                  <div className='space-y-2 max-h-64 overflow-y-auto'>
                    {report.raw_data.sample_feedbacks.map((feedback: any, i: number) => (
                      <div key={i} className='bg-gray-500/10 border border-gray-500/20 p-3 rounded text-xs'>
                        <div className='grid grid-cols-4 gap-2 mb-2'>
                          <div><span className='opacity-70'>Store:</span> {feedback.store_name || feedback.store_id}</div>
                          <div><span className='opacity-70'>Region:</span> {feedback.region_code}</div>
                          <div><span className='opacity-70'>Mood:</span> {feedback.overall_mood}</div>
                          <div><span className='opacity-70'>Impact:</span> ${(feedback.miss1_dollars || feedback.miss2_dollars || feedback.miss3_dollars || 0)}</div>
                        </div>
                        <div className='space-y-1'>
                          {feedback.top_positive && <div className='text-green-300'>✅ {feedback.top_positive}</div>}
                          {feedback.top_negative_1 && <div className='text-red-300'>❌ {feedback.top_negative_1} (${feedback.miss1_dollars || 0})</div>}
                          {feedback.top_negative_2 && <div className='text-red-300'>❌ {feedback.top_negative_2} (${feedback.miss2_dollars || 0})</div>}
                          {feedback.top_negative_3 && <div className='text-red-300'>❌ {feedback.top_negative_3} (${feedback.miss3_dollars || 0})</div>}
                          {feedback.freeform_comments && <div className='opacity-70 mt-2'>{feedback.freeform_comments}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* No Report Message */}
      {!report && !loading && (
        <div className='card p-8 text-center opacity-70'>
          <div>Click "Generate Report" to create an executive summary</div>
          <div className='text-xs mt-2'>Analyzes last 7 days of store feedback</div>
        </div>
      )}
    </div>
  );
}
