import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const pool = await getDb();
    const result = await pool.request()
      .query('SELECT id, store_id as code, store_name, region FROM dbo.store_master WHERE active = 1 ORDER BY store_name');
    
    // Transform to match expected format
    const stores = result.recordset.map((store: any) => ({
      id: store.id,
      code: store.code,
      store_name: store.store_name,
      display_name: store.store_name,
      region: store.region
    }));
    
    return NextResponse.json(stores);
  } catch (error: any) {
    console.error('Error fetching stores:', error.message);
    return NextResponse.json({ error: 'Failed to fetch stores' }, { status: 500 });
  }
}
