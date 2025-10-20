import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: Request){
  const u = new URL(req.url);
  const scope_type = u.searchParams.get('scope_type')||'network';
  const scope_key  = u.searchParams.get('scope_key');
  const iso_week   = u.searchParams.get('iso_week');
  const month_key  = u.searchParams.get('month_key');
  const area_code  = u.searchParams.get('area_code');
  const pool = await getDb();

  // Base where
  const where = ['1=1'];
  const rq = pool.request();
  if(iso_week){ where.push('sf.iso_week=@w'); rq.input('w', iso_week); }
  if(month_key){ where.push('sf.month_key=@m'); rq.input('m', month_key); }
  if(scope_type==='region' && scope_key){ where.push('sf.region_code=@r'); rq.input('r', scope_key); }
  if(scope_type==='store' && scope_key){ where.push('sf.store_id=@s'); rq.input('s', scope_key); }
  
  // area filter: simple heuristic against misses/comments (can be refined)
  if(area_code){
    where.push(`(
      (@a='AVAIL' AND (sf.miss1 LIKE '%avail%' OR sf.miss2 LIKE '%avail%' OR sf.miss3 LIKE '%avail%')) OR
      (@a='SUPPLY' AND (sf.miss1 LIKE '%supply%' OR sf.miss2 LIKE '%container%' OR sf.miss3 LIKE '%freight%' OR sf.freeform_comments LIKE '%container%')) OR
      (@a='ROSTER' AND (sf.miss1 LIKE '%roster%' OR sf.miss2 LIKE '%sick%' OR sf.miss3 LIKE '%staff%')) OR
      (@a='PRICING' AND (sf.miss1 LIKE '%price%' OR sf.miss2 LIKE '%price%' OR sf.miss3 LIKE '%ticket%')) OR
      (@a='MERCH' AND (sf.miss1 LIKE '%merch%' OR sf.miss2 LIKE '%planogram%' OR sf.miss3 LIKE '%space%')) OR
      (@a='SERVICE' AND (sf.miss1 LIKE '%service%' OR sf.miss2 LIKE '%checkout%' OR sf.miss3 LIKE '%queue%'))
    )`);
    rq.input('a', area_code);
  }

  const sql = `SELECT TOP 500 sf.iso_week, sf.region_code, sf.store_id,
                      SUM(ISNULL(sf.miss1_dollars,0)+ISNULL(sf.miss2_dollars,0)+ISNULL(sf.miss3_dollars,0)) AS miss_dollars,
                      AVG(CASE WHEN sf.overall_mood='pos' THEN 1.0 WHEN sf.overall_mood='neg' THEN 0 ELSE 0.5 END) AS mood_index,
                      COUNT_BIG(1) AS feedbacks
               FROM dbo.store_feedback sf
               WHERE ${where.join(' AND ')}
               GROUP BY sf.iso_week, sf.region_code, sf.store_id
               ORDER BY MAX(sf.created_at) DESC`;
  const rs = await rq.query(sql);

  // KPI cards
  const totalFeedbacks = rs.recordset.reduce((a,r)=>a+Number(r.feedbacks||0),0);
  const totalMiss = rs.recordset.reduce((a,r)=>a+Number(r.miss_dollars||0),0);
  const mood = rs.recordset.length? (rs.recordset.reduce((a,r)=>a+Number(r.mood_index||0),0)/rs.recordset.length) : null;

  // region/store tallies for heatmap
  const byRegion = {} as Record<string, {feedbacks:number, miss_dollars:number}>;
  for(const r of rs.recordset){ 
    const key = r.region_code||'—'; 
    if(!byRegion[key]) byRegion[key]={feedbacks:0,miss_dollars:0}; 
    byRegion[key].feedbacks+=Number(r.feedbacks||0); 
    byRegion[key].miss_dollars+=Number(r.miss_dollars||0); 
  }

  return NextResponse.json({ 
    ok:true, 
    kpis:{ totalFeedbacks, totalMiss, mood }, 
    regions: byRegion, 
    rows: rs.recordset.length 
  });
}
