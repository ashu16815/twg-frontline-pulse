import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { callAzureJSON } from '@/lib/azure';
import { getFinancialYearWeek } from '@/lib/timezone';

function financialWeekKey(d = new Date()) {
  return getFinancialYearWeek(d);
}

function monthKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

const SYS = {
  role: 'system',
  content: `You are an enterprise retail analyst. Return STRICT JSON matching the schema below. Use the input rows (store manager weekly submissions) to:

1) Identify Top 3 Opportunities for the period (network-wide), selecting items that are both HIGH MATERIALITY (by $ impact or prevalence) and ACTIONABLE.
2) Suggest Top 3 Actions for the period (network-wide). Actions must be concrete, owner-suggested (function/team), and include expected $ impact and rationale.
3) Provide very brief narrative.

If coverage < 70%, mark outputs as DIRECTIONAL. DO NOT hallucinate $ amounts; if unknown, estimate conservatively using available fields.

JSON Schema:
{
  "kpis": { "coveragePct": number, "stores": number, "responded": number, "regions": number, "totalImpact": number },
  "narrative": string,
  "topOpportunities": { 
    "week": [{"text": string, "impact": number, "theme": string}], 
    "month": [{"text": string, "impact": number, "theme": string}] 
  },
  "topActions": { 
    "week": [{"action": string, "owner": string, "expectedImpact": number}], 
    "month": [{"action": string, "owner": string, "expectedImpact": number}] 
  }
}`
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const period = (searchParams.get('period') || 'week').toLowerCase(); // 'week' | 'month'
  const week = searchParams.get('week') || financialWeekKey();
  const month = searchParams.get('month') || monthKey();
  const region = searchParams.get('region') || '';
  const storeId = searchParams.get('storeId') || '';
  const forceAI = searchParams.get('force_ai') === 'true';

  try {
    const pool = await getDb();
    
    // Total active stores for coverage
    const totalStoresResult = await pool.request().query`
      select count(*) as c from dbo.store_master where active=1
    `;
    const totalStores = totalStoresResult.recordset?.[0]?.c || 0;

    // Build filters
    const whereWeek = ['iso_week = @w'];
    const whereMonth = ['month_key = @m'];
    
    if (region) {
      whereWeek.push('region_code = @r');
      whereMonth.push('region_code = @r');
    }
    
    if (storeId) {
      whereWeek.push('store_id = @s');
      whereMonth.push('store_id = @s');
    }

    // Fetch rows for this week and this month
    const qWeek = `select * from dbo.store_feedback where ${whereWeek.join(' and ')}`;
    const qMonth = `select * from dbo.store_feedback where ${whereMonth.join(' and ')}`;
    
    const request = pool.request()
      .input('w', week)
      .input('m', month);
    
    if (region) request.input('r', region);
    if (storeId) request.input('s', storeId);
    
    const rq = await request.query(`${qWeek}; ${qMonth}`);
    
    const weekRows = (rq.recordsets && Array.isArray(rq.recordsets) && rq.recordsets[0]) || [];
    const monthRows = (rq.recordsets && Array.isArray(rq.recordsets) && rq.recordsets[1]) || [];

    const responded = period === 'week' ? weekRows.length : monthRows.length;
    const coveragePct = totalStores ? Math.round((responded / totalStores) * 100) : 0;
    const regions = new Set((period === 'week' ? weekRows : monthRows).map((r: any) => r.region_code)).size;
    const totalImpact = (period === 'week' ? weekRows : monthRows).reduce(
      (a: any, r: any) => a + (r.miss1_dollars || 0) + (r.miss2_dollars || 0) + (r.miss3_dollars || 0),
      0
    );

    // Compose AI prompt input (compact and optimized)
    const pack = (rows: any[]) =>
      rows.map((r: any) => ({
        region: r.region_code,
        store: r.store_id,
        pos: r.top_positive,
        miss1: r.miss1,
        miss1_dollars: r.miss1_dollars,
        miss2: r.miss2,
        miss2_dollars: r.miss2_dollars,
        miss3: r.miss3,
        miss3_dollars: r.miss3_dollars,
        mood: r.overall_mood,
        comments: r.freeform_comments
      }));

    // Limit data size to prevent timeout - sample if too large
    const maxRows = 50; // Limit to prevent large payloads
    const sampledWeekRows = weekRows.length > maxRows ? weekRows.slice(0, maxRows) : weekRows;
    const sampledMonthRows = monthRows.length > maxRows ? monthRows.slice(0, maxRows) : monthRows;
    
    const user = {
      role: 'user',
      content: JSON.stringify({
        period,
        filters: { week, month, region, storeId },
        coveragePct,
        totalStores,
        week: pack(sampledWeekRows),
        month: pack(sampledMonthRows),
        dataNote: weekRows.length > maxRows || monthRows.length > maxRows 
          ? `Data sampled to ${maxRows} rows for performance. Full dataset: ${weekRows.length} week, ${monthRows.length} month rows.`
          : undefined
      })
    } as any;

    console.log('🤖 Calling Azure OpenAI for reports summary...', {
      weekRows: sampledWeekRows.length,
      monthRows: sampledMonthRows.length,
      totalStores,
      coveragePct,
      forceAI,
      period,
      week,
      month
    });
    
    try {
      const ai = await callAzureJSON([SYS, user], { 
        timeout: 30000, // 30 seconds for this endpoint
        maxRetries: 2   // More retries for better success rate
      });
      console.log('✅ AI response received:', Object.keys(ai));
      
      // Validate AI response structure
      if (!ai || typeof ai !== 'object') {
        throw new Error('Invalid AI response structure');
      }
      
      // Ensure required fields exist
      if (!ai.topOpportunities) ai.topOpportunities = { week: [], month: [] };
      if (!ai.topActions) ai.topActions = { week: [], month: [] };
      if (!ai.narrative) ai.narrative = 'AI analysis completed successfully.';
      
      return NextResponse.json({
        ok: true,
        period,
        week,
        month,
        region,
        storeId,
        base: {
          coveragePct,
          stores: totalStores,
          responded,
          regions,
          totalImpact
        },
        ai,
        rawData: {
          weekRows: sampledWeekRows,
          monthRows: sampledMonthRows,
          totalWeekRows: weekRows.length,
          totalMonthRows: monthRows.length
        }
      });
      
    } catch (aiError: any) {
      console.error('❌ AI processing failed:', aiError.message);
      
      // Return fallback response when AI fails
      const fallbackResponse = {
        kpis: {
          coveragePct,
          stores: totalStores,
          responded,
          regions,
          totalImpact
        },
        narrative: `Data summary for ${period} period. Coverage: ${coveragePct}% (${responded}/${totalStores} stores). Total impact: $${totalImpact.toLocaleString()}.`,
        topOpportunities: {
          week: [],
          month: []
        },
        topActions: {
          week: [],
          month: []
        }
      };
      
      return NextResponse.json({
        ok: true,
        period,
        week,
        month,
        region,
        storeId,
        base: {
          coveragePct,
          stores: totalStores,
          responded,
          regions,
          totalImpact
        },
        ai: fallbackResponse,
        warning: 'AI processing failed, returning basic summary',
        rawData: {
          weekRows: sampledWeekRows,
          monthRows: sampledMonthRows,
          totalWeekRows: weekRows.length,
          totalMonthRows: monthRows.length
        }
      });
    }
  } catch (e: any) {
    console.error('❌ Reports summary error:', e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

