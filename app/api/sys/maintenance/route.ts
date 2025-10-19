import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const pool = await getDb();
    
    // Check if maintenance table exists first
    const tableCheck = await pool.request().query`
      SELECT COUNT(*) as table_exists 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'app_maintenance' AND TABLE_SCHEMA = 'dbo'
    `;
    
    if (!tableCheck.recordset?.[0]?.table_exists) {
      // Table doesn't exist, return inactive
      return NextResponse.json({
        ok: true, 
        active: false,
        message: 'Maintenance table not found'
      });
    }
    
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
    // Return inactive on any error to prevent UI issues
    return NextResponse.json({
      ok: true,
      active: false,
      error: error.message
    });
  }
}
