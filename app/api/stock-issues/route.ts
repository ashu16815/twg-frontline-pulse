import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import sql from 'mssql';

export async function POST(req: Request) {
  const b = await req.json();
  const { 
    store_id, 
    region_code, 
    issue_date, 
    issue_type, 
    severity = 2, 
    est_impact_dollars, 
    short_title, 
    details, 
    tags, 
    reported_by 
  } = b || {};

  if (!store_id || !issue_date || !issue_type || !short_title) {
    return NextResponse.json({ ok: false, error: 'missing required fields' }, { status: 400 });
  }

  const pool = await getDb();
  const q = `INSERT INTO dbo.store_stock_issues(store_id, region_code, issue_date, issue_type, severity, est_impact_dollars, short_title, details, tags, reported_by)
             OUTPUT inserted.issue_id, inserted.created_at
             VALUES(@s,@r,@d,@t,@v,@$,@h,@x,@g,@u)`;

  const rs = await pool.request()
    .input('s', store_id)
    .input('r', region_code)
    .input('d', issue_date)
    .input('t', issue_type)
    .input('v', severity)
    .input('$', est_impact_dollars)
    .input('h', short_title)
    .input('x', details)
    .input('g', tags)
    .input('u', reported_by)
    .query(q);

  return NextResponse.json({ ok: true, issue: rs.recordset?.[0] });
}

export async function GET(req: Request) {
  const u = new URL(req.url);
  const lookbackDays = Number(u.searchParams.get('days') || '7');
  const region_code = u.searchParams.get('region_code');
  const store_id = u.searchParams.get('store_id');

  const pool = await getDb();
  const where = ['issue_date >= DATEADD(day, @lb * -1, CONVERT(date, SYSUTCDATETIME()))'];
  const rq = pool.request().input('lb', lookbackDays);

  if (region_code) {
    where.push('region_code=@r');
    rq.input('r', region_code);
  }
  if (store_id) {
    where.push('store_id=@s');
    rq.input('s', store_id);
  }

  const q = `SELECT TOP 200 * FROM dbo.store_stock_issues WHERE ${where.join(' AND ')} ORDER BY issue_date DESC, created_at DESC`;
  const rs = await rq.query(q);

  return NextResponse.json({ ok: true, items: rs.recordset });
}
