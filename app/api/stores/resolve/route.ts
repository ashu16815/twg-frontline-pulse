import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = (searchParams.get('id') || '').trim();
    
    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }
    
    const pool = await getDb();
    const result = await pool.request()
      .input('id', id)
      .query(`
        SELECT TOP (1) 
          store_id, 
          store_code, 
          store_name, 
          banner, 
          region, 
          region_code, 
          manager_email
        FROM dbo.store_master 
        WHERE store_id = @id 
          AND active = 1
      `);
    
    if (!result.recordset[0]) {
      return NextResponse.json({ error: 'not found' }, { status: 404 });
    }
    
    return NextResponse.json({ ok: true, store: result.recordset[0] });
    
  } catch (e: any) {
    console.error('Store resolve error:', e.message);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

