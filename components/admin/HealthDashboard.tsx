'use client';

import { useState, useEffect } from 'react';
import LoadingButton from '@/components/LoadingButton';
import Spinner from '@/components/Spinner';

interface HealthCheck {
  name: string;
  status: 'healthy' | 'unhealthy' | 'warning';
  message: string;
  details?: any;
  duration?: number;
}

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'skip';
  message: string;
  duration?: number;
  details?: any;
}

export default function HealthDashboard() {
  const [health, setHealth] = useState<any>(null);
  const [tests, setTests] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [testRunning, setTestRunning] = useState(false);
  const [error, setError] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);

  async function loadHealth() {
    setLoading(true);
    setError('');
    
    try {
      const r = await fetch('/api/admin/health', { cache: 'no-store' });
      const data = await r.json();
      setHealth(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function runTests(suite: string = 'all') {
    setTestRunning(true);
    setError('');

    try {
      const r = await fetch('/api/admin/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suite })
      });
      
      const data = await r.json();
      setTests(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setTestRunning(false);
    }
  }

  useEffect(() => {
    loadHealth();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(loadHealth, 10000); // Refresh every 10s
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const statusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'pass':
        return 'text-green-400 bg-green-900/20 border-green-500/30';
      case 'warning':
      case 'skip':
        return 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30';
      case 'unhealthy':
      case 'fail':
        return 'text-red-400 bg-red-900/20 border-red-500/30';
      default:
        return 'text-white/60 bg-white/5 border-white/10';
    }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'pass':
        return '✅';
      case 'warning':
      case 'skip':
        return '⚠️';
      case 'unhealthy':
      case 'fail':
        return '❌';
      default:
        return '⚪';
    }
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <header className='flex items-center justify-between gap-3'>
        <div>
          <h1 className='text-2xl font-semibold'>System Health & Diagnostics</h1>
          <div className='text-xs text-white/60 mt-1'>
            Monitor connections, run tests, and diagnose issues
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <label className='flex items-center gap-2 text-sm'>
            <input
              type='checkbox'
              checked={autoRefresh}
              onChange={e => setAutoRefresh(e.target.checked)}
              className='rounded'
            />
            Auto-refresh (10s)
          </label>
          <LoadingButton onClick={loadHealth} className='btn'>
            🔄 Refresh
          </LoadingButton>
        </div>
      </header>

      {error && (
        <div className='text-sm text-red-400 bg-red-900/20 border border-red-500/30 rounded-lg p-4'>
          {error}
        </div>
      )}

      {/* Overall Status */}
      {health && (
        <div className={`card border-2 ${statusColor(health.status)}`}>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='text-4xl'>{statusIcon(health.status)}</div>
              <div>
                <div className='text-xl font-semibold capitalize'>
                  System {health.status}
                </div>
                <div className='text-sm text-white/60'>
                  {health.summary.healthy}/{health.summary.total} checks passed
                  {health.summary.warning > 0 && ` • ${health.summary.warning} warnings`}
                  {health.summary.unhealthy > 0 && ` • ${health.summary.unhealthy} failures`}
                </div>
              </div>
            </div>
            <div className='text-right text-sm text-white/60'>
              <div>Last checked: {new Date(health.timestamp).toLocaleTimeString()}</div>
              <div>Duration: {health.duration}</div>
            </div>
          </div>
        </div>
      )}

      {/* Health Checks */}
      {loading ? (
        <div className='card flex items-center gap-3'>
          <Spinner />
          <span className='text-sm'>Running health checks...</span>
        </div>
      ) : health ? (
        <div className='space-y-4'>
          <h2 className='text-lg font-semibold'>Health Checks</h2>
          <div className='grid gap-4 md:grid-cols-2'>
            {health.checks.map((check: HealthCheck, i: number) => (
              <div key={i} className={`card border ${statusColor(check.status)}`}>
                <div className='flex items-start justify-between mb-3'>
                  <div className='flex items-center gap-2'>
                    <span className='text-xl'>{statusIcon(check.status)}</span>
                    <div>
                      <div className='font-semibold'>{check.name}</div>
                      <div className='text-xs text-white/60'>{check.message}</div>
                    </div>
                  </div>
                  {check.duration && (
                    <div className='text-xs text-white/40'>{check.duration}ms</div>
                  )}
                </div>
                
                {check.details && Object.keys(check.details).length > 0 && (
                  <details className='text-xs'>
                    <summary className='cursor-pointer text-white/60 hover:text-white/90 mb-2'>
                      View details
                    </summary>
                    <pre className='bg-white/5 p-3 rounded overflow-x-auto text-[10px] leading-relaxed'>
                      {JSON.stringify(check.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Test Suite */}
      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <h2 className='text-lg font-semibold'>Functionality Tests</h2>
          <div className='flex gap-2 flex-wrap'>
            <LoadingButton
              onClick={() => runTests('database')}
              className='btn'
              busyText='Testing...'
            >
              Test Database
            </LoadingButton>
            <LoadingButton
              onClick={() => runTests('api')}
              className='btn'
              busyText='Testing...'
            >
              Test APIs
            </LoadingButton>
            <LoadingButton
              onClick={() => runTests('ai')}
              className='btn'
              busyText='Testing...'
            >
              Test AI
            </LoadingButton>
            <LoadingButton
              onClick={() => runTests('voice')}
              className='btn'
              busyText='Testing...'
            >
              Test Voice
            </LoadingButton>
            <LoadingButton
              onClick={() => runTests('executive')}
              className='btn'
              busyText='Testing...'
            >
              Test Executive
            </LoadingButton>
            <LoadingButton
              onClick={() => runTests('performance')}
              className='btn'
              busyText='Testing...'
            >
              Test Performance
            </LoadingButton>
            <LoadingButton
              onClick={() => runTests('all')}
              className='btn btn-liquid'
              busyText='Running...'
            >
              🧪 Run All Tests
            </LoadingButton>
          </div>
        </div>

        {testRunning && (
          <div className='card flex items-center gap-3'>
            <Spinner />
            <span className='text-sm'>Running test suite...</span>
          </div>
        )}

        {tests && (
          <div className='space-y-4'>
            <div className={`card border-2 ${statusColor(tests.status)}`}>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <div className='text-3xl'>{statusIcon(tests.status)}</div>
                  <div>
                    <div className='text-lg font-semibold'>
                      Test Suite: {tests.suite}
                    </div>
                    <div className='text-sm text-white/60'>
                      {tests.summary.passed}/{tests.summary.total} passed
                      {tests.summary.failed > 0 && ` • ${tests.summary.failed} failed`}
                      {tests.summary.skipped > 0 && ` • ${tests.summary.skipped} skipped`}
                    </div>
                  </div>
                </div>
                <div className='text-right text-sm text-white/60'>
                  <div>Completed: {new Date(tests.timestamp).toLocaleTimeString()}</div>
                  <div>Duration: {tests.duration}</div>
                </div>
              </div>
            </div>

            <div className='space-y-2'>
              {tests.results.map((result: TestResult, i: number) => (
                <div
                  key={i}
                  className={`card border ${statusColor(result.status)}`}
                >
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-3'>
                      <span className='text-lg'>{statusIcon(result.status)}</span>
                      <div>
                        <div className='font-medium text-sm'>{result.name}</div>
                        <div className='text-xs text-white/60'>{result.message}</div>
                      </div>
                    </div>
                    {result.duration && (
                      <div className='text-xs text-white/40'>{result.duration}ms</div>
                    )}
                  </div>
                  
                  {result.details && Object.keys(result.details).length > 0 && (
                    <details className='text-xs mt-2'>
                      <summary className='cursor-pointer text-white/60 hover:text-white/90 mb-1'>
                        Details
                      </summary>
                      <pre className='bg-white/5 p-2 rounded overflow-x-auto text-[10px]'>
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className='card'>
        <h3 className='font-semibold mb-3'>Production System Status & Tips</h3>
        <div className='space-y-2 text-sm'>
          <div className='flex items-start gap-2'>
            <span className='text-white/40'>🎙️</span>
            <div>
              <div className='font-medium'>Voice-to-Form Integration</div>
              <div className='text-xs text-white/60'>
                Test voice capture at <code className='bg-white/10 px-1 rounded'>/feedback</code> - AI extracts structured data from speech
              </div>
            </div>
          </div>
          <div className='flex items-start gap-2'>
            <span className='text-white/40'>📊</span>
            <div>
              <div className='font-medium'>Executive Dashboard</div>
              <div className='text-xs text-white/60'>
                Access AI insights at <code className='bg-white/10 px-1 rounded'>/exec</code> - Big-4 style analysis with charts
              </div>
            </div>
          </div>
          <div className='flex items-start gap-2'>
            <span className='text-white/40'>🔒</span>
            <div>
              <div className='font-medium'>Idempotent Submissions</div>
              <div className='text-xs text-white/60'>
                Duplicate prevention enabled - test with same idempotency key
              </div>
            </div>
          </div>
          <div className='flex items-start gap-2'>
            <span className='text-white/40'>⚡</span>
            <div>
              <div className='font-medium'>Database Performance</div>
              <div className='text-xs text-white/60'>
                Optimized with indexes - queries should complete in &lt;3s
              </div>
            </div>
          </div>
          <div className='flex items-start gap-2'>
            <span className='text-white/40'>🏥</span>
            <div>
              <div className='font-medium'>Health Monitoring</div>
              <div className='text-xs text-white/60'>
                Real-time status at <code className='bg-white/10 px-1 rounded'>/api/health</code> - SQL + OpenAI + version tracking
              </div>
            </div>
          </div>
          <div className='flex items-start gap-2'>
            <span className='text-white/40'>💡</span>
            <div>
              <div className='font-medium'>Troubleshooting</div>
              <div className='text-xs text-white/60'>
                Database issues: Check Azure SQL firewall • AI issues: Verify OpenAI keys • Performance: Check indexes
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

