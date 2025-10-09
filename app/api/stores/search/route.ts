import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();
    
    if (q.length < 1) {
      return NextResponse.json({ ok: true, results: [] });
    }
    
    const pool = await getDb();
    const isNum = /^\d+$/.test(q);
    
    let results;
    
    if (isNum) {
      // Search by numeric code
      const result = await pool.request()
        .input('code', q)
        .query(`
          SELECT TOP (10) 
            store_id, 
            store_code, 
            store_name, 
            banner, 
            region, 
            region_code,
            manager_email
          FROM dbo.store_master 
          WHERE active = 1 
            AND (
              store_code = @code 
              OR store_id LIKE '%' + @code + '%'
              OR store_code LIKE '%' + @code + '%'
            )
          ORDER BY 
            CASE WHEN store_code = @code THEN 0 ELSE 1 END,
            store_name
        `);
      results = result.recordset;
    } else {
      // Search by name or ID
      const result = await pool.request()
        .input('like', `%${q}%`)
        .query(`
          SELECT TOP (10) 
            store_id, 
            store_code, 
            store_name, 
            banner, 
            region, 
            region_code,
            manager_email
          FROM dbo.store_master 
          WHERE active = 1 
            AND (
              store_name LIKE @like 
              OR store_id LIKE @like
            )
          ORDER BY 
            CASE WHEN store_name LIKE @like THEN 0 ELSE 1 END,
            store_name
        `);
      results = result.recordset;
    }
    
    return NextResponse.json({ ok: true, results });
    
  } catch (e: any) {
    console.error('Store search error:', e.message);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

