'use client';
import { useState } from 'react';
import useSWR from 'swr';
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import StorePicker from '@/components/StorePicker';
import LoadingButton from '@/components/LoadingButton';

const f = (u: string) => fetch(u).then(r => r.json());

export default function StockIssuesPage() {
  const [form, setForm] = useState<any>({});
  const [submitted, setSubmitted] = useState(false);
  const [filterDays, setFilterDays] = useState(7);
  const [filterRegion, setFilterRegion] = useState('');

  const { data: issues, mutate } = useSWR(`/api/stock-issues?days=${filterDays}${filterRegion ? `&region_code=${filterRegion}` : ''}`, f, { 
    revalidateOnFocus: false,
    refreshInterval: 30000 
  });

  function pickStore(s: any) {
    setForm((f: any) => ({
      ...f,
      store_id: s.store_id,
      region_code: s.region_code,
      store_code: s.store_code,
      store_name: s.store_name
    }));
  }

  async function submitIssue() {
    if (!form.store_id || !form.issue_date || !form.issue_type || !form.short_title) {
      alert('Please fill in all required fields');
      return;
    }

    const res = await fetch('/api/stock-issues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });

    const j = await res.json();
    if (j.ok) {
      setSubmitted(true);
      setForm({});
      mutate(); // Refresh the issues list
      setTimeout(() => setSubmitted(false), 3000);
    } else {
      alert('Error: ' + j.error);
    }
  }

  // Group issues by type for chart
  const issuesByType = issues?.items?.reduce((acc: any, issue: any) => {
    const type = issue.issue_type || 'other';
    if (!acc[type]) acc[type] = { count: 0, dollars: 0 };
    acc[type].count++;
    acc[type].dollars += Number(issue.est_impact_dollars || 0);
    return acc;
  }, {}) || {};

  const chartData = Object.entries(issuesByType).map(([type, data]: [string, any]) => ({
    type,
    count: data.count,
    dollars: data.dollars
  }));

  return (
    <div className='max-w-7xl mx-auto p-6 space-y-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-semibold'>Stock & Delivery Issues</h1>
        <div className='text-sm opacity-70'>
          Track and manage inventory issues across stores
        </div>
      </div>

      {/* Submit New Issue */}
      <div className='card p-6'>
        <h2 className='text-xl font-semibold mb-4'>Report New Issue</h2>
        <div className='grid md:grid-cols-2 gap-6'>
          <div className='space-y-4'>
            <div>
              <label className='text-sm font-medium'>Store *</label>
              <StorePicker onSelect={pickStore} />
              {form.store_code && (
                <div className='text-xs opacity-70 mt-1'>
                  Selected: {form.store_code} — {form.store_name} ({form.region_code})
                </div>
              )}
            </div>

            <div>
              <label className='text-sm font-medium'>Issue Date *</label>
              <input
                type='date'
                className='input w-full'
                value={form.issue_date || ''}
                onChange={e => setForm({ ...form, issue_date: e.target.value })}
                required
              />
            </div>

            <div>
              <label className='text-sm font-medium'>Issue Type *</label>
              <select
                className='input w-full'
                value={form.issue_type || ''}
                onChange={e => setForm({ ...form, issue_type: e.target.value })}
                required
              >
                <option value=''>Select issue type</option>
                <option value='delivery'>Delivery Issue</option>
                <option value='presentation'>Presentation Issue</option>
                <option value='frequency'>Frequency Issue</option>
                <option value='out_of_stock'>Out of Stock</option>
                <option value='overstock'>Overstock</option>
                <option value='cancelled_load'>Cancelled Load</option>
                <option value='double_load'>Double Load</option>
                <option value='other'>Other</option>
              </select>
            </div>

            <div>
              <label className='text-sm font-medium'>Severity</label>
              <select
                className='input w-full'
                value={form.severity || 2}
                onChange={e => setForm({ ...form, severity: Number(e.target.value) })}
              >
                <option value={1}>Low</option>
                <option value={2}>Medium</option>
                <option value={3}>High</option>
              </select>
            </div>
          </div>

          <div className='space-y-4'>
            <div>
              <label className='text-sm font-medium'>Short Title *</label>
              <input
                type='text'
                className='input w-full'
                placeholder='Brief description of the issue'
                value={form.short_title || ''}
                onChange={e => setForm({ ...form, short_title: e.target.value })}
                required
              />
            </div>

            <div>
              <label className='text-sm font-medium'>Estimated Impact ($)</label>
              <input
                type='number'
                className='input w-full'
                placeholder='Estimated financial impact'
                value={form.est_impact_dollars || ''}
                onChange={e => setForm({ ...form, est_impact_dollars: Number(e.target.value) })}
              />
            </div>

            <div>
              <label className='text-sm font-medium'>Details</label>
              <textarea
                className='input w-full'
                rows={3}
                placeholder='Additional details about the issue'
                value={form.details || ''}
                onChange={e => setForm({ ...form, details: e.target.value })}
              />
            </div>

            <div>
              <label className='text-sm font-medium'>Reported By</label>
              <input
                type='text'
                className='input w-full'
                placeholder='Your name or role'
                value={form.reported_by || ''}
                onChange={e => setForm({ ...form, reported_by: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className='mt-6 flex justify-end'>
          <LoadingButton onClick={submitIssue} className='btn-primary'>
            {submitted ? '✅ Issue Submitted' : 'Submit Issue'}
          </LoadingButton>
        </div>
      </div>

      {/* Filters */}
      <div className='card p-4'>
        <div className='flex items-center gap-4'>
          <div>
            <label className='text-sm font-medium'>Time Range:</label>
            <select
              className='input ml-2'
              value={filterDays}
              onChange={e => setFilterDays(Number(e.target.value))}
            >
              <option value={1}>Last 24 Hours</option>
              <option value={3}>Last 3 Days</option>
              <option value={7}>Last 7 Days</option>
              <option value={14}>Last 2 Weeks</option>
              <option value={30}>Last 30 Days</option>
            </select>
          </div>
          <div>
            <label className='text-sm font-medium'>Region:</label>
            <select
              className='input ml-2'
              value={filterRegion}
              onChange={e => setFilterRegion(e.target.value)}
            >
              <option value=''>All Regions</option>
              <option value='AKL'>Auckland</option>
              <option value='WGN'>Wellington</option>
              <option value='CAN'>Canterbury</option>
              <option value='TR'>Taranaki</option>
            </select>
          </div>
        </div>
      </div>

      {/* Charts */}
      {chartData.length > 0 && (
        <div className='grid md:grid-cols-2 gap-6'>
          <div className='card p-4'>
            <h3 className='font-semibold mb-2'>Issues by Type (Count)</h3>
            <ResponsiveContainer width='100%' height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='type' />
                <YAxis />
                <Tooltip />
                <Bar dataKey='count' fill='#3b82f6' />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className='card p-4'>
            <h3 className='font-semibold mb-2'>Issues by Type (Impact $)</h3>
            <ResponsiveContainer width='100%' height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='type' />
                <YAxis />
                <Tooltip />
                <Bar dataKey='dollars' fill='#ef4444' />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Issues List */}
      <div className='card p-4'>
        <h3 className='font-semibold mb-4'>Recent Issues ({issues?.items?.length || 0})</h3>
        {!issues?.items?.length ? (
          <div className='text-sm opacity-70'>No issues found for the selected time range.</div>
        ) : (
          <div className='space-y-3'>
            {issues.items.map((issue: any) => (
              <div key={issue.issue_id} className='border border-gray-200 rounded-lg p-4'>
                <div className='flex justify-between items-start mb-2'>
                  <div>
                    <div className='font-medium'>{issue.short_title}</div>
                    <div className='text-sm opacity-70'>
                      {issue.store_code} ({issue.region_code}) • {issue.issue_date}
                    </div>
                  </div>
                  <div className='flex items-center gap-2'>
                    <span className={`px-2 py-1 rounded text-xs ${
                      issue.severity === 3 ? 'bg-red-100 text-red-800' :
                      issue.severity === 2 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {issue.severity === 3 ? 'High' : issue.severity === 2 ? 'Medium' : 'Low'}
                    </span>
                    {issue.est_impact_dollars && (
                      <span className='text-sm font-medium text-red-600'>
                        ${Number(issue.est_impact_dollars).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className='text-sm'>
                  <span className='font-medium'>Type:</span> {issue.issue_type}
                  {issue.details && (
                    <>
                      <br />
                      <span className='font-medium'>Details:</span> {issue.details}
                    </>
                  )}
                  {issue.reported_by && (
                    <>
                      <br />
                      <span className='font-medium'>Reported by:</span> {issue.reported_by}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
