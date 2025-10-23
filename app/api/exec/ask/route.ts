import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { callAzureJSON } from '@/lib/azure';
import sql from 'mssql';

const SYS = { 
  role: 'system', 
  content: 'Executive analyst. Answer in <=120 words, bullet points. Require a time window.' 
};

export async function POST(req: Request) {
  if (String(process.env.ASK_API_ENABLED) !== 'true') {
    return NextResponse.json({ ok: false, error: 'ASK disabled' }, { status: 403 });
  }

  const { q, range = 'last_7', scope_type = 'network', scope_key = null } = await req.json();
  
  if (!q) {
    return NextResponse.json({ ok: false, error: 'Missing q' }, { status: 400 });
  }

  const pool = await getDb();
  const where = ['1=1'];
  const rq = pool.request();

  // Time range filters
  if (range === 'this_week') {
    where.push("sf.iso_week = FORMAT(DATEADD(day, 1-DATEPART(weekday, SYSUTCDATETIME())), 'yyyy-\\'W\\'ww')");
  }
  if (range === 'last_7') {
    where.push('sf.created_at >= DATEADD(day,-7,SYSUTCDATETIME())');
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

  const sqlQuery = `SELECT TOP 200 sf.store_id, sf.region_code, sf.iso_week, sf.month_key, sf.miss1, sf.miss1_dollars, sf.miss2, sf.miss2_dollars, sf.miss3, sf.miss3_dollars, sf.freeform_comments 
                    FROM dbo.store_feedback sf 
                    WHERE ${where.join(' AND ')} 
                    ORDER BY sf.created_at DESC`;

  const rs = await rq.query(sqlQuery);
  const payload = JSON.stringify(rs.recordset).slice(0, 90000);
  
  const a = await callAzureJSON([SYS, { role: 'user', content: `Question: ${q}\nData: ${payload}` }]);
  
  return NextResponse.json({ ok: true, answer: a });
}
