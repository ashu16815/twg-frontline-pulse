import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { callAzureJSON } from '@/lib/azure';

const SYS = { 
  role: 'system', 
  content: `Return executive JSON:
{
  "narrative": string,
  "top_opportunities": [{"theme": string, "impact_dollars": number, "why": string}],
  "top_actions": [{"action": string, "owner": string, "eta_weeks": number, "expected_uplift_dollars": number}],
  "risks": [{"risk": string, "mitigation": string}],
  "volume_series": [{"week": string, "count": number}],
  "stock_issues_summary": [{"issue_type": string, "count": number, "est_dollars": number}]
}
No prose.` 
};

export async function POST() {
  const pool = await getDb();
  
  // 1) Pick a queued job
  const j = await pool.request().query(`SELECT TOP 1 * FROM dbo.exec_report_jobs WHERE status='queued' ORDER BY created_at`);
  const job = j.recordset?.[0];
  if (!job) return NextResponse.json({ ok: true, processed: 0 });

  // 2) Mark running
  await pool.request().input('id', job.job_id).query(`UPDATE dbo.exec_report_jobs SET status='running', started_at=SYSUTCDATETIME() WHERE job_id=@id`);

  try {
    // 3) Gather feedback data
    const where = ['1=1'];
    const rq = pool.request();
    if (job.iso_week) {
      where.push('sf.iso_week=@w');
      rq.input('w', job.iso_week);
    }
    if (job.month_key) {
      where.push('sf.month_key=@m');
      rq.input('m', job.month_key);
    }
    if (job.scope_type === 'region') {
      where.push('sf.region_code=@r');
      rq.input('r', job.scope_key);
    }
    if (job.scope_type === 'store') {
      where.push('sf.store_id=@s');
      rq.input('s', job.scope_key);
    }

    const q1 = `SELECT TOP 400 sf.store_id, sf.region_code, sf.iso_week, sf.month_key, sf.overall_mood, sf.miss1, sf.miss1_dollars, sf.miss2, sf.miss2_dollars, sf.miss3, sf.miss3_dollars, sf.freeform_comments, sm.store_name
                FROM dbo.store_feedback sf JOIN dbo.store_master sm ON sf.store_id=sm.store_id
                WHERE ${where.join(' AND ')} ORDER BY sf.created_at DESC`;

    const rs1 = await rq.query(q1);

    // 4) Gather stock issues data
    const rq2 = pool.request();
    const sw = [] as string[];
    if (job.scope_type === 'region') {
      sw.push('region_code=@r');
      rq2.input('r', job.scope_key);
    }
    if (job.scope_type === 'store') {
      sw.push('store_id=@s');
      rq2.input('s', job.scope_key);
    }

    const q2 = `SELECT TOP 200 issue_type, COUNT(*) cnt, SUM(ISNULL(est_impact_dollars,0)) dollars
               FROM dbo.store_stock_issues
               WHERE issue_date >= DATEADD(day,-7, CONVERT(date,SYSUTCDATETIME()))
                 ${sw.length ? ' AND ' + sw.join(' AND ') : ''}
               GROUP BY issue_type ORDER BY dollars DESC`;

    const rs2 = await rq2.query(q2);

    // 5) Call Azure OpenAI
    const payload = JSON.stringify({ 
      feedback: rs1.recordset, 
      stock_issues: rs2.recordset 
    }).slice(0, 140000);

    const t0 = Date.now();
    const analysis = await callAzureJSON([SYS, { role: 'user', content: payload }]);
    const gen_ms = Date.now() - t0;

    // 6) Store snapshot
    const ins = `INSERT INTO dbo.exec_report_snapshots(scope_type,scope_key,iso_week,month_key,analysis_json,rows_used,gen_model,gen_ms)
                 VALUES(@t,@k,@w,@m,@j,@n,@model,@ms)`;

    await pool.request()
      .input('t', job.scope_type)
      .input('k', job.scope_key)
      .input('w', job.iso_week)
      .input('m', job.month_key)
      .input('j', JSON.stringify(analysis))
      .input('n', (rs1.recordset?.length || 0))
      .input('model', process.env.AZURE_OPENAI_DEPLOYMENT_GPT5 || 'gpt-4o-mini')
      .input('ms', gen_ms)
      .query(ins);

    // 7) Complete job
    await pool.request().input('id', job.job_id).query(`UPDATE dbo.exec_report_jobs SET status='succeeded', finished_at=SYSUTCDATETIME(), reason='ok' WHERE job_id=@id`);

    return NextResponse.json({ ok: true, processed: 1, gen_ms });
  } catch (e: any) {
    await pool.request().input('id', job.job_id).input('r', String(e.message || 'error')).query(`UPDATE dbo.exec_report_jobs SET status='failed', finished_at=SYSUTCDATETIME(), reason=@r WHERE job_id=@id`);
    return NextResponse.json({ ok: false, error: String(e.message || 'error') }, { status: 500 });
  }
}