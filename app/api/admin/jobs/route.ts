import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// GET /api/admin/jobs - Get all AI report jobs
export async function GET(req: Request) {
  try {
    const pool = await getDb();
    const url = new URL(req.url);
    const jobId = url.searchParams.get('job_id');
    
    if (jobId) {
      // Get specific job details
      const jobResult = await pool.request()
        .input('id', jobId)
        .query(`
          SELECT 
            job_id,
            scope_type,
            scope_key,
            iso_week,
            month_key,
            status,
            reason,
            created_at,
            started_at,
            finished_at,
            created_by,
            DATEDIFF(second, created_at, started_at) as queue_time_seconds,
            DATEDIFF(second, started_at, finished_at) as processing_time_seconds,
            DATEDIFF(second, created_at, ISNULL(finished_at, GETDATE())) as total_time_seconds
          FROM dbo.exec_report_jobs 
          WHERE job_id = @id
        `);
      
      const job = jobResult.recordset[0];
      
      if (!job) {
        return NextResponse.json({ ok: false, error: 'Job not found' }, { status: 404 });
      }
      
      // Get corresponding snapshot if job succeeded
      let snapshot = null;
      if (job.status === 'succeeded') {
        const snapshotResult = await pool.request()
          .input('t', job.scope_type)
          .input('k', job.scope_key)
          .input('w', job.iso_week)
          .input('m', job.month_key)
          .query(`
            SELECT TOP 1
              created_at,
              rows_used,
              gen_model,
              gen_ms,
              LEN(analysis_json) as json_size
            FROM dbo.exec_report_snapshots
            WHERE scope_type = @t 
              AND (scope_key = @k OR @k IS NULL)
              AND (iso_week = @w OR @w IS NULL)
              AND (month_key = @m OR @m IS NULL)
            ORDER BY created_at DESC
          `);
        
        snapshot = snapshotResult.recordset[0];
      }
      
      return NextResponse.json({ ok: true, job, snapshot });
    }
    
    // Get all jobs with pagination
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const status = url.searchParams.get('status');
    const offset = (page - 1) * limit;
    
    let whereClause = '1=1';
    if (status && status !== 'all') {
      whereClause += ` AND status = '${status}'`;
    }
    
    const countResult = await pool.request().query(`
      SELECT COUNT(*) as total 
      FROM dbo.exec_report_jobs 
      WHERE ${whereClause}
    `);
    
    const jobsResult = await pool.request().query(`
      SELECT TOP ${limit}
        job_id,
        scope_type,
        scope_key,
        iso_week,
        month_key,
        status,
        reason,
        created_at,
        started_at,
        finished_at,
        created_by,
        DATEDIFF(second, created_at, ISNULL(started_at, GETDATE())) as queue_time_seconds,
        DATEDIFF(second, started_at, finished_at) as processing_time_seconds
      FROM (
        SELECT *, ROW_NUMBER() OVER (ORDER BY created_at DESC) as rn
        FROM dbo.exec_report_jobs
        WHERE ${whereClause}
      ) t
      WHERE rn > ${offset}
      ORDER BY created_at DESC
    `);
    
    const total = countResult.recordset[0].total;
    const jobs = jobsResult.recordset;
    
    // Get summary stats
    const statsResult = await pool.request().query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'queued' THEN 1 ELSE 0 END) as queued,
        SUM(CASE WHEN status = 'running' THEN 1 ELSE 0 END) as running,
        SUM(CASE WHEN status = 'succeeded' THEN 1 ELSE 0 END) as succeeded,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
      FROM dbo.exec_report_jobs
    `);
    
    return NextResponse.json({
      ok: true,
      jobs,
      stats: statsResult.recordset[0],
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('Admin jobs API error:', error);
    return NextResponse.json({ 
      ok: false, 
      error: error.message 
    }, { status: 500 });
  }
}

// POST /api/admin/jobs - Create or trigger worker
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, job_id } = body;
    
    if (action === 'trigger_worker') {
      // Manually trigger the worker
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/exec/worker/run`, {
        method: 'POST'
      });
      const data = await response.json();
      return NextResponse.json({ ok: true, data });
    }
    
    if (action === 'cancel_job' && job_id) {
      const pool = await getDb();
      await pool.request()
        .input('id', job_id)
        .query(`
          UPDATE dbo.exec_report_jobs 
          SET status = 'canceled', 
              finished_at = SYSUTCDATETIME(),
              reason = 'Canceled by admin'
          WHERE job_id = @id AND status IN ('queued', 'running')
        `);
      return NextResponse.json({ ok: true, message: 'Job canceled' });
    }
    
    return NextResponse.json({ ok: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ 
      ok: false, 
      error: error.message 
    }, { status: 500 });
  }
}

