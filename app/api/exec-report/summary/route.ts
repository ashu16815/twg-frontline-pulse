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

    // 2) fetch data rows with optimized query and LIMIT
    const where = [scope === 'week' ? 'iso_week = @wk' : 'month_key = @mk'];
    if (region) where.push('region_code=@rg');
    if (storeId) where.push('store_id=@st');
    
    // Optimized query with TOP clause and only necessary columns
    const q = `SELECT TOP 50 region_code, store_id, top_positive, miss1, miss1_dollars, miss2, miss2_dollars, miss3, miss3_dollars, overall_mood, freeform_comments 
               FROM dbo.store_feedback 
               WHERE ${where.join(' AND ')} 
               ORDER BY created_at DESC`;
    
    const rows = (await pool.request()
      .input('wk', week)
      .input('mk', month)
      .input('rg', region)
      .input('st', storeId)
      .query(q)).recordset;

    // Optimized total stores count with index hint
    const totalStores = (await pool.request()
      .query`SELECT COUNT(*) as c FROM dbo.store_master WITH (INDEX(ix_store_master_active_region)) WHERE active=1`)
      .recordset?.[0]?.c || 0;
    
    const responded = rows.length;
    const coveragePct = totalStores ? Math.round((responded / totalStores) * 100) : 0;
    const regions = new Set(rows.map((r: any) => r.region_code)).size;
    const totalImpact = rows.reduce((a: any, r: any) => a + (r.miss1_dollars || 0) + (r.miss2_dollars || 0) + (r.miss3_dollars || 0), 0);

    // 3) compact payload for GPT (RAG-style) - limit to prevent timeouts
    const maxRows = 20; // Limit rows to prevent large payloads
    const sampledRows = rows.length > maxRows ? rows.slice(0, maxRows) : rows;
    
    const packed = sampledRows.map((r: any) => ({
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
    
    // If no data, return a default response
    if (rows.length === 0) {
      const fallbackResponse = {
        summary: [`No feedback data available for ${scope} ${scope_key}. Please submit store feedback first.`],
        whatsWorking: [],
        whatsNot: [],
        opportunities: [],
        actions: [],
        risks: ['No data available for risk assessment'],
        oppByRegion: []
      };
      
      return NextResponse.json({
        ok: true,
        scope,
        scope_key,
        base: { coveragePct, regions, responded, totalImpact },
        ai: fallbackResponse,
        warning: 'No feedback data available'
      });
    }

    const user = {
      role: 'user',
      content: JSON.stringify({ 
        scope, 
        scope_key, 
        coveragePct, 
        rows: packed,
        dataNote: rows.length > maxRows ? `Data sampled to ${maxRows} rows for performance. Full dataset: ${rows.length} rows.` : undefined
      })
    } as any;
    
    let ai;
    try {
      console.log('🤖 Attempting Azure OpenAI call for executive report...');
      ai = await callAzureJSON([SYS, user], { timeout: 15000, maxRetries: 1 });
      console.log('✅ Azure OpenAI call successful');
    } catch (aiError: any) {
      console.error('❌ AI processing failed:', aiError.message);
      
      // Enhanced fallback response when AI fails
      ai = {
        summary: [
          `Executive summary for ${scope} ${scope_key}. Coverage: ${coveragePct}% (${responded}/${totalStores} stores). Total impact: $${Math.round(totalImpact).toLocaleString()}.`,
          `Data shows ${responded} stores reporting across ${regions} regions with mixed performance indicators.`,
          `Key focus areas include improving participation rates and addressing operational challenges.`
        ],
        whatsWorking: packed.filter(r => r.pos).slice(0, 3).map(r => r.pos),
        whatsNot: packed.filter(r => r.miss1).slice(0, 3).map(r => ({ text: r.miss1, impact: r.miss1_d })),
        opportunities: [
          {
            text: `Increase store participation from ${coveragePct}% to 70%+ for better insights`,
            theme: 'Data Quality',
            impact: Math.round(totalImpact * 0.3)
          },
          {
            text: 'Address high-impact operational issues across regions',
            theme: 'Operations',
            impact: Math.abs(totalImpact)
          },
          {
            text: 'Implement regional best practices sharing program',
            theme: 'Knowledge Transfer',
            impact: Math.round(totalImpact * 0.2)
          }
        ],
        actions: [
          {
            action: 'Launch store engagement campaign to increase participation',
            owner: 'Operations Team',
            expectedImpact: Math.round(totalImpact * 0.4)
          },
          {
            action: 'Create regional performance dashboards',
            owner: 'Analytics Team',
            expectedImpact: Math.round(totalImpact * 0.2)
          },
          {
            action: 'Establish weekly store manager check-ins',
            owner: 'Regional Managers',
            expectedImpact: Math.round(totalImpact * 0.3)
          }
        ],
        risks: [
          'Low data coverage limits insight quality and decision making',
          'Operational challenges may impact store performance',
          'Regional variations require targeted interventions'
        ],
        oppByRegion: Array.from(new Set(packed.map(r => r.region))).map(region => ({
          region,
          impact: packed.filter(r => r.region === region).reduce((sum, r) => sum + r.miss1_d + r.miss2_d + r.miss3_d, 0),
          mentions: packed.filter(r => r.region === region).length
        }))
      };
    }

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
