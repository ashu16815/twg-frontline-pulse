import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db-simple';

export async function GET(req: Request) {
  const u = new URL(req.url);
  const q = (u.searchParams.get('q') || '').trim();
  const pool = await getDb();
  
  const res = await pool.request()
    .input('q', '%' + q + '%')
    .query(`SELECT TOP 20 store_id, store_code, store_name, region, region_code, banner 
            FROM dbo.store_master 
            WHERE active=1 AND (store_code LIKE @q OR store_name LIKE @q) 
            ORDER BY store_code`);
  
  return NextResponse.json({ results: res.recordset });
}