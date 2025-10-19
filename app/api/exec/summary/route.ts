import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { weekKey } from '@/lib/gpt5';
import sql from 'mssql';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const week = searchParams.get('week') || weekKey(new Date());
    const region = searchParams.get('region') || '';

    const pool = await getDb();

    // Build optimized query with TOP clause and specific columns
    let feedbackQuery = `
      SELECT TOP 100 region_code, store_id, store_name, top_positive, top_positive_impact, 
             top_negative_1, top_negative_1_impact, top_negative_2, top_negative_2_impact, 
             top_negative_3, top_negative_3_impact, miss1_dollars, miss2_dollars, miss3_dollars,
             overall_mood, freeform_comments, created_at
      FROM dbo.store_feedback 
      WHERE iso_week = @week
    `;
    
    if (region) {
      feedbackQuery += ` AND region_code = @region`;
    }
    
    feedbackQuery += ` ORDER BY created_at DESC`;

    const request = pool.request()
      .input('week', sql.NVarChar(10), week);
    
    if (region) {
      request.input('region', sql.NVarChar(20), region);
    }

    const [feedbackResult, reportResult] = await Promise.all([
      request.query(feedbackQuery),
      pool.request()
        .input('week', sql.NVarChar(10), week)
        .query('SELECT TOP 1 * FROM dbo.executive_report WHERE iso_week = @week ORDER BY created_at DESC')
    ]);

    const rows = feedbackResult.recordset || [];
    const report = reportResult.recordset?.[0];

    // Calculate base metrics with optimized query
    const totalStores = await pool.request()
      .query('SELECT COUNT(*) as total FROM dbo.store_master WITH (INDEX(ix_store_master_active_region)) WHERE active = 1');
    
    const storeCount = totalStores.recordset[0]?.total || 0;
    const submittedStores = rows.length;
    const coveragePct = storeCount > 0 ? Math.round((submittedStores / storeCount) * 100) : 0;

    // Calculate total impact
    const totalImpact = rows.reduce((acc: number, r: any) => {
      const impact1 = r.top_negative_1_impact || r.miss1_dollars || 0;
      const impact2 = r.top_negative_2_impact || r.miss2_dollars || 0;
      const impact3 = r.top_negative_3_impact || r.miss3_dollars || 0;
      return acc + impact1 + impact2 + impact3;
    }, 0);

    // Sentiment analysis
    const sentiment = {
      pos: rows.filter((r: any) => r.overall_mood === 'positive').length,
      neu: rows.filter((r: any) => r.overall_mood === 'neutral').length,
      neg: rows.filter((r: any) => r.overall_mood === 'negative').length
    };

    // Get unique regions
    const regions = Array.from(new Set(rows.map((r: any) => r.region_code).filter(Boolean)));

    // Parse AI report data
    const parseJSON = (str: string) => {
      try {
        return JSON.parse(str);
      } catch {
        return [];
      }
    };

    const ai = report
      ? {
          narrative: report.narrative || '',
          whatsWorking: parseJSON(report.whatWorking || '[]'),
          whatsNot: parseJSON(report.whatNotWorking || '[]').map((item: any) => ({
            text: typeof item === 'string' ? item : item.text || item,
            impact: typeof item === 'object' ? item.impact || 0 : 0
          })),
          themes: parseJSON(report.themes || '[]').map((t: any) => ({
            name: typeof t === 'string' ? t : t.name || t,
            mentions: typeof t === 'object' ? t.mentions || 1 : 1,
            impact: typeof t === 'object' ? t.impact || 0 : 0,
            trend: typeof t === 'object' ? t.trend || 'flat' : 'flat'
          })),
          actions: parseJSON(report.actions || '[]').map((a: any) => ({
            action: typeof a === 'string' ? a : a.action || a.text || a,
            owner: typeof a === 'object' ? a.owner || 'TBD' : 'TBD',
            due: typeof a === 'object' ? a.due || 'TBD' : 'TBD',
            expectedImpact: typeof a === 'object' ? a.expectedImpact || 0 : 0
          })),
          risks: parseJSON(report.risks || '[]'),
          kpis: {
            stores: submittedStores,
            regions: regions.length,
            coveragePct
          }
        }
      : {
          narrative: `No executive report generated yet for week ${week}.`,
          whatsWorking: [],
          whatsNot: [],
          themes: [],
          actions: [],
          risks: [],
          kpis: {
            stores: submittedStores,
            regions: regions.length,
            coveragePct
          }
        };

    return NextResponse.json({
      ok: true,
      isoWeek: week,
      base: {
        stores: storeCount,
        submittedStores,
        coveragePct,
        totalImpact,
        sentiment
      },
      ai
    });
  } catch (e: any) {
    console.error('Executive summary error:', e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

