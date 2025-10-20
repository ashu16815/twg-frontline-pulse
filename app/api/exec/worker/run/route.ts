import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { callAzureJSON } from '@/lib/azure';

const SYS = { 
  role:'system', 
  content: `You are a Big-4 analyst. Given store feedback rows, return compact JSON:
{
 "narrative": "Brief executive summary of key findings and trends",
 "top_opportunities":[{"theme":string,"impact_dollars":number,"why":string}],
 "top_actions":[{"action":string,"owner":string,"eta_weeks":number,"expected_uplift_dollars":number}],
 "risks":[{"risk":string,"mitigation":string}],
 "volume_series":[{"week":string,"count":number}]
}
No prose.` 
};

export async function POST() {
  const pool = await getDb();
  
  // 1) pick a queued job
  const jsel = await pool.request().query(`SELECT TOP 1 * FROM dbo.exec_report_jobs WHERE status='queued' ORDER BY created_at`);
  const job = jsel.recordset?.[0];
  if(!job) return NextResponse.json({ ok:true, processed: 0 });

  // 2) mark running
  await pool.request().input('id', job.job_id).query(`UPDATE dbo.exec_report_jobs SET status='running', started_at=SYSUTCDATETIME() WHERE job_id=@id`);

  try {
    // 3) gather data (cap rows to keep latency < 10s)
    const where = ['1=1'];
    const req = pool.request();
    if(job.iso_week){ where.push('sf.iso_week=@w'); req.input('w', job.iso_week); }
    if(job.month_key){ where.push('sf.month_key=@m'); req.input('m', job.month_key); }
    if(job.scope_type==='region'){ where.push('sf.region_code=@r'); req.input('r', job.scope_key); }
    if(job.scope_type==='store'){ where.push('sf.store_id=@s'); req.input('s', job.scope_key); }

    const q = `SELECT TOP 300 sf.store_id, sf.region_code, sf.iso_week, sf.month_key, sf.top_positive, sf.miss1, sf.miss1_dollars, sf.miss2, sf.miss2_dollars, sf.miss3, sf.miss3_dollars, sf.overall_mood, sf.freeform_comments, sm.store_code, sm.store_name
               FROM dbo.store_feedback sf JOIN dbo.store_master sm ON sf.store_id=sm.store_id
               WHERE ${where.join(' AND ')} ORDER BY sf.created_at DESC`;
    const rs = await req.query(q);

    // 4) call AOAI (JSON mode, tight budget)
    const t0 = Date.now();
    const payload = JSON.stringify(rs.recordset).slice(0, 120000); // truncate to ~120KB
    const analysis = await callAzureJSON([SYS, { role:'user', content: payload }]);
    const gen_ms = Date.now() - t0;

    // 5) store snapshot
    const ins = `INSERT INTO dbo.exec_report_snapshots(scope_type,scope_key,iso_week,month_key,analysis_json,rows_used,gen_model,gen_ms)
                 VALUES(@t,@k,@w,@m,@j,@n,@model,@ms)`;
    await pool.request()
      .input('t', job.scope_type).input('k', job.scope_key)
      .input('w', job.iso_week).input('m', job.month_key)
      .input('j', JSON.stringify(analysis)).input('n', rs.recordset.length)
      .input('model', process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o-mini').input('ms', gen_ms)
      .query(ins);

    // 6) complete job
    await pool.request().input('id', job.job_id).query(`UPDATE dbo.exec_report_jobs SET status='succeeded', finished_at=SYSUTCDATETIME(), reason='ok' WHERE job_id=@id`);
    return NextResponse.json({ ok:true, processed: 1, gen_ms });
  } catch(e:any) {
    await pool.request().input('id', job.job_id).input('r', String(e.message||'error')).query(`UPDATE dbo.exec_report_jobs SET status='failed', finished_at=SYSUTCDATETIME(), reason=@r WHERE job_id=@id`);
    return NextResponse.json({ ok:false, error: String(e.message||'error') }, { status: 500 });
  }
}
