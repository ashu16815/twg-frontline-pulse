import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import sql from 'mssql';

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get('file');
    
    if (!(file instanceof Blob)) {
      return NextResponse.json({ ok: false, error: 'No file provided' }, { status: 400 });
    }
    
    const text = await file.text();
    const lines = text.trim().split(/\r?\n/);
    const headers = lines.shift();
    
    if (!headers) {
      return NextResponse.json({ ok: false, error: 'Empty CSV' }, { status: 400 });
    }
    
    const cols = headers.split(',').map(c => c.trim().toLowerCase());
    const idx = (name: string) => cols.findIndex(c => c === name);
    
    const i_id = idx('store_id');
    const i_code = idx('store_code');
    const i_name = idx('store_name');
    const i_banner = idx('banner');
    const i_region = idx('region');
    const i_rc = idx('region_code');
    const i_mgr = idx('manager_email');
    const i_act = idx('active');
    
    const pool = await getDb();
    let count = 0;
    const errors: string[] = [];
    
    for (const line of lines) {
      if (!line.trim()) continue;
      
      const c = line.split(',');
      const store_id = c[i_id]?.trim();
      const store_code = c[i_code]?.trim() ? Number(c[i_code].trim()) : null;
      const store_name = c[i_name]?.trim();
      const banner = c[i_banner]?.trim() || null;
      const region = c[i_region]?.trim();
      const region_code = c[i_rc]?.trim();
      const manager_email = c[i_mgr]?.trim() || null;
      const active = (c[i_act]?.trim() || '1') === '1' ? 1 : 0;
      
      if (!store_id || !store_name || !region || !region_code) {
        errors.push(`Incomplete row: ${line.substring(0, 50)}...`);
        continue;
      }
      
      try {
        await pool.request()
          .input('store_id', sql.NVarChar(20), store_id)
          .input('store_code', sql.Int, store_code)
          .input('store_name', sql.NVarChar(200), store_name)
          .input('banner', sql.NVarChar(50), banner)
          .input('region', sql.NVarChar(100), region)
          .input('region_code', sql.NVarChar(10), region_code)
          .input('manager_email', sql.NVarChar(200), manager_email)
          .input('active', sql.Bit, active)
          .query(`
            MERGE dbo.store_master AS t
            USING (SELECT @store_id AS sid) AS s
            ON t.store_id = s.sid
            WHEN MATCHED THEN
              UPDATE SET 
                store_code = @store_code,
                store_name = @store_name,
                banner = @banner,
                region = @region,
                region_code = @region_code,
                manager_email = @manager_email,
                active = @active,
                updated_at = SYSUTCDATETIME()
            WHEN NOT MATCHED THEN
              INSERT (store_id, store_code, store_name, banner, region, region_code, manager_email, active)
              VALUES (@store_id, @store_code, @store_name, @banner, @region, @region_code, @manager_email, @active);
          `);
        count++;
      } catch (err: any) {
        errors.push(`Error importing ${store_id}: ${err.message}`);
      }
    }
    
    return NextResponse.json({ 
      ok: true, 
      count, 
      errors: errors.length > 0 ? errors : undefined 
    });
    
  } catch (e: any) {
    console.error('CSV import error:', e.message);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

