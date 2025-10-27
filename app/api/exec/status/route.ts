import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// GET /api/exec/status
// Returns current status of AI report generation system
export async function GET() {
  try {
    const pool = await getDb();
    
    // Check recent jobs
    const jobsResult = await pool.request().query(`
      SELECT TOP 10
        job_id,
        scope_type,
        scope_key,
        status,
        created_at,
        started_at,
        finished_at,
        DATEDIFF(second, created_at, ISNULL(finished_at, GETDATE())) as duration_seconds,
        reason
      FROM dbo.exec_report_jobs 
      ORDER BY created_at DESC
    `);
    
    // Check recent snapshots
    const snapshotsResult = await pool.request().query(`
      SELECT TOP 10
        scope_type,
        scope_key,
        iso_week,
        created_at,
        rows_used,
        gen_model,
        gen_ms
      FROM dbo.exec_report_snapshots 
      ORDER BY created_at DESC
    `);
    
    // Count queued jobs
    const queuedResult = await pool.request().query(`
      SELECT COUNT(*) as queued_count 
      FROM dbo.exec_report_jobs 
      WHERE status = 'queued'
    `);
    
    // Count running jobs
    const runningResult = await pool.request().query(`
      SELECT COUNT(*) as running_count 
      FROM dbo.exec_report_jobs 
      WHERE status = 'running'
    `);
    
    const recentJobs = jobsResult.recordset;
    const recentSnapshots = snapshotsResult.recordset;
    const queuedCount = queuedResult.recordset[0].queued_count;
    const runningCount = runningResult.recordset[0].running_count;
    
    // Determine overall health
    let health = 'healthy';
    let message = 'System is operating normally';
    
    if (queuedCount > 5) {
      health = 'warning';
      message = `${queuedCount} jobs queued - worker may not be running`;
    }
    
    if (recentJobs.some(j => {
      const jobDate = new Date(j.created_at);
      const now = new Date();
      const diffMinutes = (now.getTime() - jobDate.getTime()) / (1000 * 60);
      return j.status === 'failed' && diffMinutes < 5;
    })) {
      health = 'error';
      message = 'Recent job failures detected - check Azure OpenAI configuration';
    }
    
    return NextResponse.json({
      ok: true,
      health,
      message,
      summary: {
        queued_jobs: queuedCount,
        running_jobs: runningCount,
        recent_jobs: recentJobs.length,
        recent_snapshots: recentSnapshots.length
      },
      recent_jobs: recentJobs.map(j => ({
        job_id: j.job_id,
        scope: `${j.scope_type}${j.scope_key ? '/' + j.scope_key : ''}`,
        status: j.status,
        created: j.created_at,
        duration: j.duration_seconds,
        reason: j.reason
      })),
      recent_snapshots: recentSnapshots.map(s => ({
        scope: `${s.scope_type}${s.scope_key ? '/' + s.scope_key : ''}`,
        iso_week: s.iso_week,
        created: s.created_at,
        rows: s.rows_used,
        model: s.gen_model,
        gen_time_ms: s.gen_ms
      }))
    });
  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      health: 'error',
      message: 'Failed to check status: ' + error.message,
      error: error.message
    }, { status: 500 });
  }
}

