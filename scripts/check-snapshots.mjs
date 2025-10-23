import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function checkSnapshots() {
  try {
    console.log('🔍 Checking AI snapshots...');
    
    const pool = await new sql.ConnectionPool(process.env.AZURE_SQL_CONNECTION_STRING).connect();
    
    // Get latest snapshots
    const snapshotsResult = await pool.request().query(`
      SELECT TOP 5 
        snapshot_id, scope_type, scope_key, iso_week, month_key,
        created_at, rows_used, gen_model,
        LEFT(analysis_json, 200) as analysis_preview
      FROM dbo.exec_report_snapshots 
      ORDER BY created_at DESC
    `);
    
    console.log(`📊 Latest AI Snapshots:`);
    snapshotsResult.recordset.forEach((row, i) => {
      console.log(`\n${i+1}. Snapshot ID: ${row.snapshot_id}`);
      console.log(`   Scope: ${row.scope_type}/${row.scope_key || 'all'}`);
      console.log(`   Week: ${row.iso_week || 'N/A'}, Month: ${row.month_key || 'N/A'}`);
      console.log(`   Rows: ${row.rows_used}, Model: ${row.gen_model}`);
      console.log(`   Created: ${row.created_at}`);
      console.log(`   Preview: ${row.analysis_preview}...`);
    });
    
    await pool.close();
    
    console.log('\n✅ Snapshot check complete');
    
  } catch (error) {
    console.error('❌ Snapshot check failed:', error.message);
  }
}

checkSnapshots();
