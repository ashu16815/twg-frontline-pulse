import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-middleware';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const authCheck = await requireAdmin(req);
  if (authCheck.error) return authCheck.response!;

  try {
    const pool = await getDb();
    const result = await pool.request().query(`
      SELECT 
        store_id,
        store_code,
        store_name,
        region,
        region_code,
        banner,
        manager_email,
        active,
        created_at,
        updated_at
      FROM dbo.store_master
      ORDER BY store_name
    `);

    // Generate CSV
    const csvHeader = 'Store ID,Store Code,Store Name,Region,Region Code,Banner,Manager Email,Active,Created At,Updated At\n';
    const csvRows = result.recordset.map((row: any) => {
      return [
        row.store_id,
        row.store_code || '',
        row.store_name,
        row.region,
        row.region_code,
        row.banner || '',
        row.manager_email || '',
        row.active ? 'Yes' : 'No',
        new Date(row.created_at).toISOString(),
        new Date(row.updated_at).toISOString()
      ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
    }).join('\n');

    const csv = csvHeader + csvRows;

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="store_master_export.csv"'
      }
    });

  } catch (error: any) {
    console.error('❌ Error exporting stores:', error);
    return NextResponse.json(
      { error: 'Failed to export stores' },
      { status: 500 }
    );
  }
}

