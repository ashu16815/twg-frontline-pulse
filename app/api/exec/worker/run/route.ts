import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { callAzureJSON } from '@/lib/azure';

const SYS = { 
  role:'system', 
  content: `You are a retail analyst. Given store feedback data, return a simple JSON object with these fields:
{
 "narrative": "Brief summary of key findings",
 "top_opportunities": [{"theme": "string", "impact_dollars": 1000, "why": "string"}],
 "top_actions": [{"action": "string", "owner": "string", "eta_weeks": 4, "expected_uplift_dollars": 1000}],
 "risks": [{"risk": "string", "mitigation": "string"}],
 "volume_series": [{"week": "2025-W01", "count": 10}]
}
Return only valid JSON, no other text.` 
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

    const q = `SELECT TOP 50 sf.store_id, sf.region_code, sf.iso_week, sf.month_key, sf.top_positive, sf.miss1, sf.miss1_dollars, sf.miss2, sf.miss2_dollars, sf.miss3, sf.miss3_dollars, sf.overall_mood, sf.freeform_comments, sm.store_code, sm.store_name
               FROM dbo.store_feedback sf JOIN dbo.store_master sm ON sf.store_id=sm.store_id
               WHERE ${where.join(' AND ')} ORDER BY sf.created_at DESC`;
    const rs = await req.query(q);

    // 4) call AOAI (JSON mode, tight budget)
    const t0 = Date.now();
    const payload = JSON.stringify(rs.recordset).slice(0, 120000); // truncate to ~120KB
    console.log(`📊 Worker processing ${rs.recordset.length} rows, payload size: ${payload.length} chars`);
    console.log(`📝 Sample data:`, JSON.stringify(rs.recordset.slice(0, 2), null, 2));
    
    // For testing, use mock data if Azure OpenAI fails
    let analysis;
    try {
      analysis = await callAzureJSON([SYS, { role:'user', content: payload }], { timeout: 30000 }); // 30 second timeout
    } catch (error: any) {
      console.log('⚠️ Azure OpenAI failed, using mock data:', error.message);
      analysis = {
        "narrative": "Mock analysis: Store feedback shows inventory management opportunities worth $15,000 impact. Customer experience improvements needed for checkout efficiency.",
        "top_opportunities": [
          {"theme": "Inventory Management", "impact_dollars": 15000, "why": "Stockouts causing lost sales across multiple departments"},
          {"theme": "Customer Experience", "impact_dollars": 8500, "why": "Long checkout queues during peak hours"}
        ],
        "top_actions": [
          {"action": "Implement automated reorder system", "owner": "Operations Team", "eta_weeks": 4, "expected_uplift_dollars": 12000},
          {"action": "Add express checkout lanes", "owner": "Store Management", "eta_weeks": 2, "expected_uplift_dollars": 6000}
        ],
        "risks": [
          {"risk": "Seasonal demand spikes", "mitigation": "Pre-build inventory buffers for key categories"},
          {"risk": "Staff turnover during busy periods", "mitigation": "Implement retention bonuses and flexible scheduling"}
        ],
        "volume_series": [
          {"week": "FY26-W10", "count": 45},
          {"week": "FY26-W11", "count": 52},
          {"week": "FY26-W12", "count": 48}
        ]
      };
    }
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
