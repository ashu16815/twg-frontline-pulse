import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { createSessionToken, setSessionCookie } from '@/lib/auth';
import sql from 'mssql';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const user_id = (body.user_id || '').trim();
    const password = body.password || '';

    if (!user_id || !password) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
    }

    const pool = await getDb();
    const r = await pool
      .request()
      .input('uid', sql.NVarChar(32), user_id)
      .query`select top(1) * from dbo.app_users where user_id=@uid and is_active=1`;

    const u = r.recordset[0];
    if (!u) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, u.password_hash);
    if (!ok) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Update last login
    await pool
      .request()
      .input('id', sql.UniqueIdentifier, u.id)
      .query`update dbo.app_users set last_login_at=sysutcdatetime() where id=@id`;

    // Create session
    const token = createSessionToken({
      sub: u.id,
      user_id: u.user_id,
      name: u.full_name,
      role: u.role || undefined
    });

    setSessionCookie(token);

    return NextResponse.json({
      ok: true,
      user: {
        user_id: u.user_id,
        name: u.full_name,
        role: u.role
      }
    });
  } catch (e: any) {
    console.error('Login error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

