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

    // Build query with optional region filter
    let feedbackQuery = `
      SELECT * FROM dbo.store_feedback 
      WHERE iso_week = @week
    `;
    
    if (region) {
      feedbackQuery += ` AND region_code = @region`;
    }

    const request = pool.request()
      .input('week', sql.NVarChar(10), week);
    
    if (region) {
      request.input('region', sql.NVarChar(20), region);
    }

    const feedbackResult = await request.query(feedbackQuery);
    const rows = feedbackResult.recordset || [];

    // Extract and aggregate themes
    const themeMap = new Map<string, { mentions: number; impact: number; region_code: string; stores: Set<string> }>();

    rows.forEach((r: any) => {
      const themesStr = r.themes || '';
      const themes = themesStr.split(',').map((t: string) => t.trim()).filter(Boolean);
      
      const impact1 = r.top_negative_1_impact || r.miss1_dollars || 0;
      const impact2 = r.top_negative_2_impact || r.miss2_dollars || 0;
      const impact3 = r.top_negative_3_impact || r.miss3_dollars || 0;
      const totalImpact = impact1 + impact2 + impact3;

      themes.forEach((theme: string) => {
        if (!themeMap.has(theme)) {
          themeMap.set(theme, {
            mentions: 0,
            impact: 0,
            region_code: r.region_code || r.region || 'Unknown',
            stores: new Set()
          });
        }

        const existing = themeMap.get(theme)!;
        existing.mentions += 1;
        existing.impact += totalImpact / themes.length; // Distribute impact across themes
        existing.stores.add(r.store_id);
      });
    });

    // Convert to array and sort by impact
    const themes = Array.from(themeMap.entries())
      .map(([name, data]) => ({
        name,
        mentions: data.mentions,
        impact: Math.round(data.impact),
        region_code: data.region_code,
        stores: data.stores.size,
        trend: 'flat' as 'flat' // TODO: Calculate trend from previous weeks
      }))
      .sort((a, b) => b.impact - a.impact)
      .slice(0, 20); // Top 20 themes

    return NextResponse.json({
      ok: true,
      isoWeek: week,
      themes
    });
  } catch (e: any) {
    console.error('Executive themes error:', e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

