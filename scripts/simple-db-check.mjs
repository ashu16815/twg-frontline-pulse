import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function checkDatabase() {
  try {
    console.log('🔍 Checking database data...');
    
    const pool = await new sql.ConnectionPool(process.env.AZURE_SQL_CONNECTION_STRING).connect();
    
    // Check store_master
    const storesResult = await pool.request().query('SELECT COUNT(*) as count FROM dbo.store_master');
    console.log(`📦 Store Master: ${storesResult.recordset[0].count} stores`);
    
    // Check store_feedback
    const feedbackResult = await pool.request().query('SELECT COUNT(*) as count FROM dbo.store_feedback');
    console.log(`📝 Store Feedback: ${feedbackResult.recordset[0].count} entries`);
    
    // Check recent feedback
    const recentFeedback = await pool.request().query(`
      SELECT TOP 3 store_id, region_code, overall_mood, created_at 
      FROM dbo.store_feedback 
      ORDER BY created_at DESC
    `);
    console.log(`📊 Recent Feedback:`);
    recentFeedback.recordset.forEach((row, i) => {
      console.log(`   ${i+1}. Store: ${row.store_id}, Region: ${row.region_code}, Mood: ${row.overall_mood}, Date: ${row.created_at}`);
    });
    
    // Check AI snapshots
    const snapshotsResult = await pool.request().query('SELECT COUNT(*) as count FROM dbo.exec_report_snapshots');
    console.log(`🤖 AI Snapshots: ${snapshotsResult.recordset[0].count} snapshots`);
    
    // Check stock issues
    const issuesResult = await pool.request().query('SELECT COUNT(*) as count FROM dbo.store_stock_issues');
    console.log(`📦 Stock Issues: ${issuesResult.recordset[0].count} issues`);
    
    await pool.close();
    
    console.log('\n✅ Database check complete');
    
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
  }
}

checkDatabase();
