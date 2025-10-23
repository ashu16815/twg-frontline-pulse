import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import sql from 'mssql';

export async function GET(req: Request) {
  const u = new URL(req.url);
  const scope_type = u.searchParams.get('scope_type') || 'network';
  const scope_key = u.searchParams.get('scope_key');
  const iso_week = u.searchParams.get('iso_week');
  const month_key = u.searchParams.get('month_key');
  const range = u.searchParams.get('range');  // 'this_week'|'last_7'|''
  const area_code = u.searchParams.get('area_code');
  
  const pool = await getDb();
  const where = ['1=1'];
  const rq = pool.request();
  
  // Time range presets
  if (range === 'this_week') {
    where.push("sf.iso_week = FORMAT(DATEADD(day, 1-DATEPART(weekday, SYSUTCDATETIME())), 'yyyy-\\'W\\'ww')");
  }
  if (range === 'last_7') {
    where.push('sf.created_at >= DATEADD(day,-7,SYSUTCDATETIME())');
  }
  
  // Specific time filters
  if (iso_week) {
    where.push('sf.iso_week=@w');
    rq.input('w', iso_week);
  }
  if (month_key) {
    where.push('sf.month_key=@m');
    rq.input('m', month_key);
  }
  
  // Scope filters
  if (scope_type === 'region' && scope_key) {
    where.push('sf.region_code=@r');
    rq.input('r', scope_key);
  }
  if (scope_type === 'store' && scope_key) {
    where.push('sf.store_id=@s');
    rq.input('s', scope_key);
  }
  
  // Area filter (simple heuristic against misses/comments)
  if (area_code) {
    where.push('(sf.freeform_comments LIKE @a OR sf.miss1 LIKE @a OR sf.miss2 LIKE @a OR sf.miss3 LIKE @a)');
    rq.input('a', `%${area_code}%`);
  }

  const sqlQuery = `SELECT TOP 600 sf.iso_week, sf.region_code, sf.store_id,
                      SUM(ISNULL(sf.miss1_dollars,0)+ISNULL(sf.miss2_dollars,0)+ISNULL(sf.miss3_dollars,0)) AS miss_dollars,
                      AVG(CASE WHEN sf.overall_mood='pos' THEN 1.0 WHEN sf.overall_mood='neg' THEN 0 ELSE 0.5 END) AS mood_index,
                      COUNT_BIG(1) AS feedbacks
               FROM dbo.store_feedback sf
               WHERE ${where.join(' AND ')}
               GROUP BY sf.iso_week, sf.region_code, sf.store_id
               ORDER BY MAX(sf.created_at) DESC`;

  const rs = await rq.query(sqlQuery);

  // Calculate KPIs
  const totalFeedbacks = rs.recordset.reduce((a, r) => a + Number(r.feedbacks || 0), 0);
  const totalMiss = rs.recordset.reduce((a, r) => a + Number(r.miss_dollars || 0), 0);
  const mood = rs.recordset.length ? (rs.recordset.reduce((a, r) => a + Number(r.mood_index || 0), 0) / rs.recordset.length) : null;

  // Region/store tallies for heatmap
  const byRegion = {} as Record<string, { feedbacks: number, miss_dollars: number }>;
  for (const r of rs.recordset) {
    const key = r.region_code || '—';
    if (!byRegion[key]) byRegion[key] = { feedbacks: 0, miss_dollars: 0 };
    byRegion[key].feedbacks += Number(r.feedbacks || 0);
    byRegion[key].miss_dollars += Number(r.miss_dollars || 0);
  }

  return NextResponse.json({ 
    ok: true, 
    kpis: { totalFeedbacks, totalMiss, mood }, 
    regions: byRegion, 
    rows: rs.recordset.length 
  });
}