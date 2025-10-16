import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { callAzureJSON } from '@/lib/azure';
import { callAzureML } from '@/lib/azure-ml';
import { getFinancialYearWeek } from '@/lib/timezone';

function financialWeekKey(d = new Date()) {
  return getFinancialYearWeek(d);
}

function monthKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

const SYS = {
  role: 'system',
  content: `You are a Big-4 style executive reporting analyst. Produce crisp JSON only.

Inputs: store-manager weekly submissions with $ impacts and comments. Tasks:
- Executive summary (2-4 bullets) emphasising business implications.
- What's working / What's not (ranked by materiality).
- Top 3 opportunities (network-wide) and Top 3 actions (owner + expected impact).
- Risk assessment (max 5) and opportunity map across regions.
- Mark outputs as DIRECTIONAL if coverage < 70%.

Schema:
{
  "summary": string[],
  "whatsWorking": string[],
  "whatsNot": [{"text":string,"impact":number}],
  "opportunities": [{"text":string,"theme":string,"impact":number}],
  "actions": [{"action":string,"owner":string,"expectedImpact":number}],
  "risks": string[],
  "oppByRegion": [{"region":string,"impact":number,"mentions":number}]
}`
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const scope = (searchParams.get('scope') || 'week').toLowerCase(); // 'week'|'month'
  const week = searchParams.get('week') || financialWeekKey();
  const month = searchParams.get('month') || monthKey();
  const region = searchParams.get('region') || '';
  const storeId = searchParams.get('storeId') || '';
  const useCache = (searchParams.get('cache') || '1') === '1';

  try {
    const pool = await getDb();
    const scope_key = scope === 'week' ? week : month;

    // 1) try cache (fast page loads)
    if (useCache) {
      const c = (await pool.request()
        .input('sc', scope)
        .input('sk', scope_key)
        .query`select top(1) payload from dbo.exec_report_cache where report_scope=@sc and scope_key=@sk order by created_at desc`)
        .recordset?.[0]?.payload;
      
      if (c) {
        return NextResponse.json({ 
          ok: true, 
          scope, 
          scope_key, 
          cached: true, 
          ...JSON.parse(c) 
        });
      }
    }

    // 2) fetch data rows
    const where = [scope === 'week' ? 'iso_week = @wk' : 'month_key = @mk'];
    if (region) where.push('region_code=@rg');
    if (storeId) where.push('store_id=@st');
    
    const q = `select region_code, store_id, top_positive, miss1, miss1_dollars, miss2, miss2_dollars, miss3, miss3_dollars, overall_mood, freeform_comments from dbo.store_feedback where ${where.join(' and ')}`;
    
    const rows = (await pool.request()
      .input('wk', week)
      .input('mk', month)
      .input('rg', region)
      .input('st', storeId)
      .query(q)).recordset;

    const totalStores = (await pool.request()
      .query`select count(*) as c from dbo.store_master where active=1`)
      .recordset?.[0]?.c || 0;
    
    const responded = rows.length;
    const coveragePct = totalStores ? Math.round((responded / totalStores) * 100) : 0;
    const regions = new Set(rows.map((r: any) => r.region_code)).size;
    const totalImpact = rows.reduce((a: any, r: any) => a + (r.miss1_dollars || 0) + (r.miss2_dollars || 0) + (r.miss3_dollars || 0), 0);

    // 3) compact payload for GPT (RAG-style)
    const packed = rows.map((r: any) => ({
      region: r.region_code,
      store: r.store_id,
      pos: r.top_positive,
      miss1: r.miss1,
      miss1_d: r.miss1_dollars || 0,
      miss2: r.miss2,
      miss2_d: r.miss2_dollars || 0,
      miss3: r.miss3,
      miss3_d: r.miss3_dollars || 0,
      comment: r.freeform_comments || ''
    }));
    
    const user = {
      role: 'user',
      content: JSON.stringify({ scope, scope_key, coveragePct, rows: packed })
    } as any;
    
    const ai = await callAzureJSON([SYS, user], { timeout: 20000, maxRetries: 1 });

    // 4) predictive stub (optional)
    const pred = await callAzureML({ 
      scope, 
      scope_key, 
      features: { regions, totalImpact, submissions: responded } 
    });

    const payload = {
      ok: true,
      scope,
      scope_key,
      base: { coveragePct, regions, responded, totalImpact },
      ai,
      predictive: pred.ok ? pred.data : null
    };

    // 5) cache
    await pool.request()
      .input('sc', scope)
      .input('sk', scope_key)
      .input('p', JSON.stringify(payload))
      .query`insert into dbo.exec_report_cache(report_scope,scope_key,payload) values(@sc,@sk,@p)`;

    return NextResponse.json(payload);
  } catch (e: any) {
    console.error('❌ Executive report error:', e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
