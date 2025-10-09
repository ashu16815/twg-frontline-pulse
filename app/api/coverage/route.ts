import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

function weekKey(d: Date) {
  const t = new Date(d);
  t.setUTCHours(0, 0, 0, 0);
  const onejan = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const w = Math.ceil((((t.getTime() - onejan.getTime()) / 86400000) + onejan.getUTCDay() + 1) / 7);
  return `${t.getUTCFullYear()}-W${w}`;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const iso = searchParams.get('week') || weekKey(new Date());
    
    const pool = await getDb();
    
    // Get all active stores
    const storesResult = await pool.request()
      .query('SELECT store_id, store_name, region, manager_email FROM dbo.store_master WHERE active = 1');
    const stores = storesResult.recordset;
    
    // Get submissions for the week
    const subsResult = await pool.request()
      .input('week', iso)
      .query('SELECT store_id, store_name, region, created_at FROM dbo.store_feedback WHERE iso_week = @week');
    const subs = subsResult.recordset;
    
    // Calculate coverage
    const responded = new Set(subs.map((s: any) => s.store_id));
    const responders = subs;
    const nonresponders = stores.filter((s: any) => !responded.has(s.store_id));
    
    // Group by region
    const byRegion: any = {};
    for (const s of stores) {
      if (!byRegion[s.region]) {
        byRegion[s.region] = { total: 0, responded: 0, responders: [], nonresponders: [] };
      }
      byRegion[s.region].total++;
      
      if (responded.has(s.store_id)) {
        byRegion[s.region].responded++;
        byRegion[s.region].responders.push(subs.find((x: any) => x.store_id === s.store_id));
      } else {
        byRegion[s.region].nonresponders.push(s);
      }
    }
    
    return NextResponse.json({
      ok: true,
      isoWeek: iso,
      total: stores.length,
      responded: responders.length,
      nonresponded: nonresponders.length,
      coveragePct: stores.length ? Math.round((responders.length / stores.length) * 100) : 0,
      responders,
      nonresponders,
      byRegion
    });
    
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

