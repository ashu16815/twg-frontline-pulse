'use client';

import { useEffect, useState } from 'react';

export default function DirectReportsPage() {
  const [snapshot, setSnapshot] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<any>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadSnapshot();
  }, []);

  async function loadSnapshot() {
    try {
      const response = await fetch('/api/exec/snapshot');
      const data = await response.json();
      setSnapshot(data.snapshot);
    } catch (error) {
      console.error('Failed to load snapshot:', error);
    } finally {
      setLoading(false);
    }
  }

  async function generateAI() {
    setGenerating(true);
    try {
      const response = await fetch('/api/exec/job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scope_type: 'network',
          created_by: 'user'
        })
      });
      const data = await response.json();
      setJob(data.job);
      pollJob(data.job.job_id);
    } catch (error) {
      console.error('Failed to create job:', error);
      setGenerating(false);
    }
  }

  async function pollJob(jobId: string) {
    const startTime = Date.now();
    const maxDuration = 60000; // 60 seconds max
    let pollCount = 0;
    
    const interval = setInterval(async () => {
      pollCount++;
      const elapsed = Date.now() - startTime;
      
      // Timeout after 60 seconds
      if (elapsed > maxDuration) {
        clearInterval(interval);
        setGenerating(false);
        alert('Request timed out. The job may still be processing. Please refresh the page in a few moments.');
        return;
      }
      
      try {
        const response = await fetch(`/api/exec/job?job_id=${jobId}`);
        const data = await response.json();
        setJob(data.job);
        
        if (data.job?.status === 'succeeded' || data.job?.status === 'failed') {
          clearInterval(interval);
          setGenerating(false);
          loadSnapshot(); // Reload snapshot
        }
      } catch (error) {
        console.error('Polling error:', error);
        clearInterval(interval);
        setGenerating(false);
      }
    }, 2000);
    
    // Cleanup after max duration
    setTimeout(() => {
      clearInterval(interval);
    }, maxDuration);
  }

  const analysis = snapshot?.analysis_json ? JSON.parse(snapshot.analysis_json) : null;
  const lastUpdated = snapshot?.created_at ? new Date(snapshot.created_at + 'Z').toLocaleString() : 'Never';

  return (
    <div className="min-h-screen bg-[#0b0f13] text-[#e6edf3] p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🚀 Async AI Reports</h1>
        
        {/* Status Bar */}
        <div className="card p-4 mb-6 flex items-center justify-between">
          <div>
            <span className="text-sm opacity-70">Last AI Analysis:</span>
            <span className="font-medium ml-2">{lastUpdated}</span>
          </div>
          <div className="flex items-center gap-3">
            {job?.status && (
              <span className="text-xs px-2 py-1 rounded-full bg-white/10">
                {job.status}
              </span>
            )}
            <button
              onClick={generateAI}
              disabled={generating}
              className="btn bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {generating ? '🔄 Processing...' : '⚡ Generate AI Analysis'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="card p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
            <p>Loading AI analysis...</p>
          </div>
        ) : analysis ? (
          <div className="space-y-6">
            {/* Top Opportunities */}
            <div className="card p-6">
              <h2 className="text-xl font-semibold mb-4">🎯 Top 3 Opportunities</h2>
              <div className="space-y-3">
                {(analysis.top_opportunities || []).slice(0, 3).map((opp: any, i: number) => (
                  <div key={i} className="border-l-4 border-blue-500 pl-4">
                    <div className="font-medium">{opp.theme}</div>
                    <div className="text-sm text-green-400">Impact: ${opp.impact_dollars?.toLocaleString?.()}</div>
                    <div className="text-sm opacity-70">{opp.why}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Actions */}
            <div className="card p-6">
              <h2 className="text-xl font-semibold mb-4">⚡ Top 3 Actions</h2>
              <div className="space-y-3">
                {(analysis.top_actions || []).slice(0, 3).map((action: any, i: number) => (
                  <div key={i} className="border-l-4 border-green-500 pl-4">
                    <div className="font-medium">{action.action}</div>
                    <div className="text-sm">
                      <span className="text-blue-400">Owner:</span> {action.owner} | 
                      <span className="text-yellow-400"> ETA:</span> {action.eta_weeks}w | 
                      <span className="text-green-400"> Impact:</span> +${action.expected_uplift_dollars?.toLocaleString?.()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Risks */}
            {analysis.risks && analysis.risks.length > 0 && (
              <div className="card p-6">
                <h2 className="text-xl font-semibold mb-4">⚠️ Key Risks</h2>
                <div className="space-y-3">
                  {analysis.risks.slice(0, 2).map((risk: any, i: number) => (
                    <div key={i} className="border-l-4 border-red-500 pl-4">
                      <div className="font-medium">{risk.risk}</div>
                      <div className="text-sm opacity-70">{risk.mitigation}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="card p-8 text-center">
            <h2 className="text-xl font-semibold mb-4">No AI Analysis Available</h2>
            <p className="text-sm opacity-70 mb-4">
              Click "Generate AI Analysis" to create insights from your feedback data.
            </p>
            <button
              onClick={generateAI}
              disabled={generating}
              className="btn bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {generating ? '🔄 Processing...' : '⚡ Generate AI Analysis'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
