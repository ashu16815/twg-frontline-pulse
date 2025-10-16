import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const pool = await getDb();
    const result = await pool.request().query`
      SELECT value_bit 
      FROM dbo.app_maintenance 
      WHERE key_name = 'store_reload'
    `;
    
    return NextResponse.json({
      ok: true, 
      active: !!result.recordset?.[0]?.value_bit
    });
  } catch (error: any) {
    console.error('❌ Maintenance check failed:', error.message);
    return NextResponse.json({
      ok: false,
      active: false,
      error: error.message
    }, { status: 500 });
  }
}
