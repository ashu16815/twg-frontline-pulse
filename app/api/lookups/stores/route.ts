import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const p = await getDb();
    const r = await p.request()
      .query`select store_id, store_name, region_code from dbo.store_master where active=1 order by region_code, store_id`;
    
    return NextResponse.json({ ok: true, stores: r.recordset });
  } catch (e: any) {
    console.error('❌ Stores lookup error:', e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}