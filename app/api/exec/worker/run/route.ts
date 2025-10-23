import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { callAzureJSON } from '@/lib/azure';

const SYS = { 
  role: 'system', 
  content: `You are an executive analyst. Analyze the provided store feedback and stock issues data to generate insights.

Return ONLY a JSON object with this exact structure:
{
  "narrative": "Executive summary based on actual data provided",
  "top_opportunities": [{"theme": "specific theme", "impact_dollars": number, "why": "reasoning"}],
  "top_actions": [{"action": "specific action", "owner": "role/team", "eta_weeks": number, "expected_uplift_dollars": number}],
  "risks": [{"risk": "specific risk", "mitigation": "mitigation strategy"}],
  "volume_series": [{"week": "week identifier", "count": number}],
  "stock_issues_summary": [{"issue_type": "type", "count": number, "est_dollars": number}]
}

Base your analysis ONLY on the actual data provided. Do not use placeholder or mock data.` 
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

    const q1 = `SELECT TOP 50 sf.store_id, sf.region_code, sf.iso_week, sf.month_key, sf.overall_mood, sf.miss1, sf.miss1_dollars, sf.miss2, sf.miss2_dollars, sf.miss3, sf.miss3_dollars, sf.freeform_comments, sm.store_name
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

    const q2 = `SELECT TOP 20 issue_type, COUNT(*) cnt, SUM(ISNULL(est_impact_dollars,0)) dollars
               FROM dbo.store_stock_issues
               WHERE issue_date >= DATEADD(day,-7, CONVERT(date,SYSUTCDATETIME()))
                 ${sw.length ? ' AND ' + sw.join(' AND ') : ''}
               GROUP BY issue_type ORDER BY dollars DESC`;

    const rs2 = await rq2.query(q2);

    // 5) Call Azure OpenAI
    const payload = JSON.stringify({ 
      feedback: rs1.recordset, 
      stock_issues: rs2.recordset 
    }).slice(0, 80000); // Reduced from 140000 to 80000

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