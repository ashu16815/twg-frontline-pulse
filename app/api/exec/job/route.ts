import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(req: Request) {
  const b = await req.json();
  const { scope_type='network', scope_key=null, iso_week=null, month_key=null, created_by=null } = b||{};
  const pool = await getDb();
  const q = `INSERT INTO dbo.exec_report_jobs(scope_type,scope_key,iso_week,month_key,status,reason,created_by)
             OUTPUT inserted.job_id, inserted.status, inserted.created_at
             VALUES(@t,@k,@w,@m,'queued','user-request',@u);`;
  const rs = await pool.request()
    .input('t', scope_type).input('k', scope_key)
    .input('w', iso_week).input('m', month_key)
    .input('u', created_by)
    .query(q);
  return NextResponse.json({ ok:true, job: rs.recordset?.[0] });
}

export async function GET(req: Request) {
  const u = new URL(req.url);
  const job_id = u.searchParams.get('job_id');
  const pool = await getDb();
  const r = await pool.request().input('id', job_id).query('SELECT * FROM dbo.exec_report_jobs WHERE job_id=@id');
  return NextResponse.json({ ok: !!r.recordset?.length, job: r.recordset?.[0]||null });
}
