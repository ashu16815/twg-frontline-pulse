import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/admin';
import sql from 'mssql';

export async function GET() {
  try {
    requireAdmin();
    const pool = await getDb();
    const r = await pool.request().query`
      select id, user_id, full_name, email, role, is_active, created_at, last_login_at 
      from dbo.app_users 
      order by created_at desc
    `;
    return NextResponse.json({ ok: true, users: r.recordset });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: e.statusCode || 500 });
  }
}

export async function POST(req: Request) {
  try {
    requireAdmin();
    const body = await req.json();
    const { user_id, full_name, email = null, role = 'StoreManager' } = body;
    
    if (!user_id || !full_name) {
      return NextResponse.json(
        { ok: false, error: 'user_id and full_name are required' },
        { status: 400 }
      );
    }
    
    const pool = await getDb();
    await pool.request()
      .input('user_id', sql.NVarChar(32), user_id)
      .input('full_name', sql.NVarChar(150), full_name)
      .input('email', sql.NVarChar(200), email)
      .input('role', sql.NVarChar(50), role)
      .query`
        insert into dbo.app_users(user_id, full_name, email, role, password_hash, is_active) 
        values(@user_id, @full_name, @email, @role, '__TEMP__', 1)
      `;
    
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: e.statusCode || 500 });
  }
}

