import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: Request) {
  const u = new URL(req.url);
  const scope_type = u.searchParams.get('scope_type')||'network';
  const scope_key  = u.searchParams.get('scope_key');
  const iso_week   = u.searchParams.get('iso_week');
  const month_key  = u.searchParams.get('month_key');
  const pool = await getDb();
  const where = [ 'scope_type=@t' ];
  if(scope_key) where.push('ISNULL(scope_key,\'\')=ISNULL(@k,\'\')'); else where.push('ISNULL(scope_key,\'\')=\'\'');
  if(iso_week) where.push('ISNULL(iso_week,\'\')=ISNULL(@w,\'\')');
  if(month_key) where.push('ISNULL(month_key,\'\')=ISNULL(@m,\'\')');
  const q = `SELECT TOP 1 * FROM dbo.exec_report_snapshots WHERE ${where.join(' AND ')} ORDER BY created_at DESC`;
  const r = await pool.request().input('t', scope_type).input('k', scope_key).input('w', iso_week).input('m', month_key).query(q);
  return NextResponse.json({ ok:true, snapshot: r.recordset?.[0]||null });
}
