import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

/**
 * GET /api/reports/lookups
 * Get lists of regions and stores for filter dropdowns
 */
export async function GET() {
  try {
    const pool = await getDb();

    // Get unique regions
    const regionsResult = await pool.request().query(`
      SELECT DISTINCT region_code
      FROM dbo.store_feedback
      WHERE region_code IS NOT NULL AND region_code != ''
      ORDER BY region_code
    `);

    // Get stores
    const storesResult = await pool.request().query(`
      SELECT DISTINCT store_id, store_name, region_code
      FROM dbo.store_feedback
      WHERE store_id IS NOT NULL
      ORDER BY region_code, store_id
    `);

    return NextResponse.json({
      ok: true,
      regions: regionsResult.recordset.map((r: any) => ({
        code: r.region_code,
        label: r.region_code
      })),
      stores: storesResult.recordset.map((s: any) => ({
        id: s.store_id,
        name: s.store_name,
        region: s.region_code,
        label: `${s.store_id} - ${s.store_name || 'Store'}`
      }))
    });
  } catch (error: any) {
    console.error('Error fetching lookups:', error);
    return NextResponse.json({
      ok: false,
      error: error.message
    }, { status: 500 });
  }
}
