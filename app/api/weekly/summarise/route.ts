import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { summariseWeeklyFinance, weekKey } from '@/lib/gpt5';
import sql from 'mssql';

export async function POST() {
  try {
    const isoWeek = weekKey(new Date());
    const pool = await getDb();
    
    // Fetch feedback for current week
    const result = await pool.request()
      .input('week', sql.NVarChar(10), isoWeek)
      .query('SELECT * FROM dbo.store_feedback WHERE iso_week = @week');
    
    const rows = result.recordset || [];
    const regions = Array.from(new Set(rows.map((r: any) => r.region)));
    let created = 0;

    console.log(`📊 Summarizing ${rows.length} feedback entries across ${regions.length} regions`);

    for (const region of regions) {
      const regionRows = rows.filter((r: any) => r.region === region);
      console.log(`   Processing ${region}: ${regionRows.length} entries`);
      
      const ai = await summariseWeeklyFinance(isoWeek, region as string, regionRows);
      
      await pool.request()
        .input('iso_week', sql.NVarChar(10), isoWeek)
        .input('region', sql.NVarChar(100), region)
        .input('summary', sql.NVarChar(sql.MAX), ai.summary || '')
        .input('top_themes', sql.NVarChar(1000), JSON.stringify(ai.topThemes || []))
        .input('total_reported_impact', sql.Float, ai.totalImpact || 0)
        .input('top_drivers', sql.NVarChar(sql.MAX), JSON.stringify(ai.topDrivers || []))
        .query(`
          INSERT INTO dbo.weekly_summary (iso_week, region, summary, top_themes, total_reported_impact, top_drivers)
          VALUES (@iso_week, @region, @summary, @top_themes, @total_reported_impact, @top_drivers)
        `);
      
      created++;
      console.log(`   ✅ Summary created for ${region}`);
    }

    console.log(`✅ Created ${created} weekly summaries`);
    return NextResponse.json({ ok: true, created });
    
  } catch (e: any) {
    console.error('❌ Summarize error:', e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}