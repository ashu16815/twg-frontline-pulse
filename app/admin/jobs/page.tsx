'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function JobsAdminPage() {
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(false);

  const { data, mutate } = useSWR(
    `/api/admin/jobs?page=${page}&limit=50&status=${statusFilter}`,
    fetcher,
    {
      refreshInterval: autoRefresh ? 2000 : 0,
    }
  );

  const jobs = data?.jobs || [];
  const stats = data?.stats;
  const pagination = data?.pagination;

  async function triggerWorker() {
    try {
      await fetch('/api/admin/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'trigger_worker' })
      });
      alert('Worker triggered successfully');
      mutate();
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
  }

  async function cancelJob(jobId: string) {
    if (!confirm('Are you sure you want to cancel this job?')) return;
    
    try {
      await fetch('/api/admin/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel_job', job_id: jobId })
      });
      alert('Job canceled');
      mutate();
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
  }

  async function loadJobDetails(jobId: string) {
    try {
      const response = await fetch(`/api/admin/jobs?job_id=${jobId}`);
      const data = await response.json();
      setSelectedJob(data);
    } catch (error: any) {
      alert('Error loading job details: ' + error.message);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'queued': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'running': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'succeeded': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'failed': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'canceled': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default: return 'bg-white/10 text-white border-white/20';
    }
  };

  return (
    <div className='min-h-screen p-6 space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-white'>AI Report Jobs Monitor</h1>
          <p className='text-white/60 mt-1'>Monitor and manage AI report generation jobs</p>
        </div>
        <div className='flex gap-3'>
          <label className='flex items-center gap-2 cursor-pointer'>
            <input
              type='checkbox'
              checked={autoRefresh}
              onChange={e => setAutoRefresh(e.target.checked)}
              className='w-4 h-4'
            />
            <span className='text-sm'>Auto-refresh (2s)</span>
          </label>
          <button
            onClick={triggerWorker}
            className='btn btn-primary'
          >
            🔄 Trigger Worker Now
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className='grid grid-cols-1 md:grid-cols-5 gap-4'>
          <div className='card p-4'>
            <div className='text-sm text-white/60'>Total Jobs</div>
            <div className='text-2xl font-bold text-white'>{stats.total}</div>
          </div>
          <div className='card p-4 border-yellow-500/30'>
            <div className='text-sm text-white/60'>Queued</div>
            <div className='text-2xl font-bold text-yellow-400'>{stats.queued}</div>
          </div>
          <div className='card p-4 border-blue-500/30'>
            <div className='text-sm text-white/60'>Running</div>
            <div className='text-2xl font-bold text-blue-400'>{stats.running}</div>
          </div>
          <div className='card p-4 border-green-500/30'>
            <div className='text-sm text-white/60'>Succeeded</div>
            <div className='text-2xl font-bold text-green-400'>{stats.succeeded}</div>
          </div>
          <div className='card p-4 border-red-500/30'>
            <div className='text-sm text-white/60'>Failed</div>
            <div className='text-2xl font-bold text-red-400'>{stats.failed}</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className='card p-4 flex items-center gap-4'>
        <span className='text-sm text-white/60'>Filter:</span>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className='input'
        >
          <option value='all'>All Jobs</option>
          <option value='queued'>Queued</option>
          <option value='running'>Running</option>
          <option value='succeeded'>Succeeded</option>
          <option value='failed'>Failed</option>
          <option value='canceled'>Canceled</option>
        </select>
      </div>

      {/* Jobs Table */}
      <div className='card overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead className='bg-white/5'>
              <tr>
                <th className='text-left p-3 text-sm text-white/60'>Job ID</th>
                <th className='text-left p-3 text-sm text-white/60'>Scope</th>
                <th className='text-left p-3 text-sm text-white/60'>Status</th>
                <th className='text-left p-3 text-sm text-white/60'>Created</th>
                <th className='text-left p-3 text-sm text-white/60'>Duration</th>
                <th className='text-left p-3 text-sm text-white/60'>Reason</th>
                <th className='text-left p-3 text-sm text-white/60'>Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job: any) => (
                <tr key={job.job_id} className='border-t border-white/10 hover:bg-white/5'>
                  <td className='p-3 text-xs font-mono text-white/80'>{job.job_id.substring(0, 8)}...</td>
                  <td className='p-3 text-sm text-white'>
                    {job.scope_type}
                    {job.scope_key && ` / ${job.scope_key}`}
                  </td>
                  <td className='p-3'>
                    <span className={`px-2 py-1 rounded text-xs border ${getStatusColor(job.status)}`}>
                      {job.status}
                    </span>
                  </td>
                  <td className='p-3 text-sm text-white/60'>
                    {new Date(job.created_at).toLocaleString()}
                  </td>
                  <td className='p-3 text-sm text-white/60'>
                    {job.processing_time_seconds ? `${job.processing_time_seconds}s` : '-'}
                  </td>
                  <td className='p-3 text-sm text-white/80 max-w-xs truncate'>
                    {job.reason || '-'}
                  </td>
                  <td className='p-3'>
                    <div className='flex gap-2'>
                      <button
                        onClick={() => loadJobDetails(job.job_id)}
                        className='text-xs px-2 py-1 bg-white/10 hover:bg-white/20 rounded'
                      >
                        Details
                      </button>
                      {(job.status === 'queued' || job.status === 'running') && (
                        <button
                          onClick={() => cancelJob(job.job_id)}
                          className='text-xs px-2 py-1 bg-red-500/20 hover:bg-red-500/30 rounded text-red-400'
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className='flex items-center justify-center gap-3'>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className='btn disabled:opacity-50'
          >
            ← Previous
          </button>
          <span className='text-white/60'>
            Page {page} of {pagination.pages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
            disabled={page >= pagination.pages}
            className='btn disabled:opacity-50'
          >
            Next →
          </button>
        </div>
      )}

      {/* Job Details Modal */}
      {selectedJob && (
        <div className='fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6'>
          <div className='card max-w-4xl w-full max-h-[90vh] overflow-y-auto'>
            <div className='flex items-center justify-between p-6 border-b border-white/10'>
              <h2 className='text-2xl font-bold text-white'>Job Details</h2>
              <button
                onClick={() => setSelectedJob(null)}
                className='text-white/60 hover:text-white'
              >
                ✕
              </button>
            </div>
            
            <div className='p-6 space-y-4'>
              {/* Job Info */}
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <div className='text-sm text-white/60'>Job ID</div>
                  <div className='text-sm font-mono text-white'>{selectedJob.job?.job_id}</div>
                </div>
                <div>
                  <div className='text-sm text-white/60'>Status</div>
                  <div className='text-sm'>
                    <span className={`px-2 py-1 rounded ${getStatusColor(selectedJob.job?.status)}`}>
                      {selectedJob.job?.status}
                    </span>
                  </div>
                </div>
                <div>
                  <div className='text-sm text-white/60'>Scope</div>
                  <div className='text-sm text-white'>
                    {selectedJob.job?.scope_type}
                    {selectedJob.job?.scope_key && ` / ${selectedJob.job?.scope_key}`}
                  </div>
                </div>
                <div>
                  <div className='text-sm text-white/60'>Created At</div>
                  <div className='text-sm text-white'>
                    {selectedJob.job?.created_at ? new Date(selectedJob.job.created_at).toLocaleString() : '-'}
                  </div>
                </div>
                <div>
                  <div className='text-sm text-white/60'>Started At</div>
                  <div className='text-sm text-white'>
                    {selectedJob.job?.started_at ? new Date(selectedJob.job.started_at).toLocaleString() : '-'}
                  </div>
                </div>
                <div>
                  <div className='text-sm text-white/60'>Finished At</div>
                  <div className='text-sm text-white'>
                    {selectedJob.job?.finished_at ? new Date(selectedJob.job.finished_at).toLocaleString() : '-'}
                  </div>
                </div>
                <div>
                  <div className='text-sm text-white/60'>Queue Time</div>
                  <div className='text-sm text-white'>
                    {selectedJob.job?.queue_time_seconds ? `${selectedJob.job.queue_time_seconds}s` : '-'}
                  </div>
                </div>
                <div>
                  <div className='text-sm text-white/60'>Processing Time</div>
                  <div className='text-sm text-white'>
                    {selectedJob.job?.processing_time_seconds ? `${selectedJob.job.processing_time_seconds}s` : '-'}
                  </div>
                </div>
                <div>
                  <div className='text-sm text-white/60'>Created By</div>
                  <div className='text-sm text-white'>{selectedJob.job?.created_by || '-'}</div>
                </div>
                <div>
                  <div className='text-sm text-white/60'>Reason</div>
                  <div className='text-sm text-white'>{selectedJob.job?.reason || '-'}</div>
                </div>
              </div>

              {/* Snapshot Info (if succeeded) */}
              {selectedJob.snapshot && (
                <div className='border-t border-white/10 pt-4 mt-4'>
                  <h3 className='text-lg font-semibold text-white mb-3'>Snapshot Details</h3>
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <div className='text-sm text-white/60'>Created At</div>
                      <div className='text-sm text-white'>
                        {new Date(selectedJob.snapshot.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className='text-sm text-white/60'>Rows Used</div>
                      <div className='text-sm text-white'>{selectedJob.snapshot.rows_used}</div>
                    </div>
                    <div>
                      <div className='text-sm text-white/60'>Model</div>
                      <div className='text-sm text-white'>{selectedJob.snapshot.gen_model}</div>
                    </div>
                    <div>
                      <div className='text-sm text-white/60'>Gen Time</div>
                      <div className='text-sm text-white'>{selectedJob.snapshot.gen_ms}ms</div>
                    </div>
                    <div>
                      <div className='text-sm text-white/60'>JSON Size</div>
                      <div className='text-sm text-white'>{selectedJob.snapshot.json_size} bytes</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Details (if failed) */}
              {selectedJob.job?.status === 'failed' && selectedJob.job?.reason && (
                <div className='border-t border-white/10 pt-4 mt-4'>
                  <div className='text-sm text-red-400 whitespace-pre-wrap'>
                    {selectedJob.job.reason}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

