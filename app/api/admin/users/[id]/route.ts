import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/admin';
import bcrypt from 'bcryptjs';
import sql from 'mssql';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    const id = params.id;
    const body = await req.json();
    const pool = await getDb();
    
    // Reset password
    if (body.reset_password) {
      const hash = await bcrypt.hash(body.reset_password, 12);
      await pool.request()
        .input('id', sql.UniqueIdentifier, id)
        .input('hash', sql.NVarChar(200), hash)
        .query`update dbo.app_users set password_hash=@hash where id=@id`;
      return NextResponse.json({ ok: true });
    }
    
    // Update role
    if (body.role) {
      await pool.request()
        .input('id', sql.UniqueIdentifier, id)
        .input('role', sql.NVarChar(50), body.role)
        .query`update dbo.app_users set role=@role where id=@id`;
    }
    
    // Update active status
    if (typeof body.is_active === 'boolean') {
      await pool.request()
        .input('id', sql.UniqueIdentifier, id)
        .input('active', sql.Bit, body.is_active ? 1 : 0)
        .query`update dbo.app_users set is_active=@active where id=@id`;
    }
    
    // Update name/email
    if (body.full_name || body.email !== undefined) {
      await pool.request()
        .input('id', sql.UniqueIdentifier, id)
        .input('name', sql.NVarChar(150), body.full_name)
        .input('email', sql.NVarChar(200), body.email)
        .query`update dbo.app_users set full_name=@name, email=@email where id=@id`;
    }
    
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: e.statusCode || 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    const id = params.id;
    const pool = await getDb();
    await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .query`delete from dbo.app_users where id=@id`;
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: e.statusCode || 500 });
  }
}

