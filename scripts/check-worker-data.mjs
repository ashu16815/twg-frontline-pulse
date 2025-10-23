import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function checkWorkerData() {
  try {
    console.log('🔍 Checking worker data...');
    
    const pool = await new sql.ConnectionPool(process.env.AZURE_SQL_CONNECTION_STRING).connect();
    
    // Check what data the worker would process
    const feedbackQuery = await pool.request().query(`
      SELECT TOP 5 
        sf.store_id, sf.region_code, sf.iso_week, sf.month_key, 
        sf.overall_mood, sf.miss1, sf.miss1_dollars, sf.miss2, sf.miss2_dollars, 
        sf.miss3, sf.miss3_dollars, sf.freeform_comments, sm.store_name
      FROM dbo.store_feedback sf 
      JOIN dbo.store_master sm ON sf.store_id=sm.store_id
      ORDER BY sf.created_at DESC
    `);
    
    console.log(`📊 Feedback data for worker:`);
    console.log(`Found ${feedbackQuery.recordset.length} feedback entries`);
    feedbackQuery.recordset.forEach((row, i) => {
      console.log(`${i+1}. Store: ${row.store_id}, Region: ${row.region_code}, Mood: ${row.overall_mood}`);
      console.log(`   Miss1: ${row.miss1} ($${row.miss1_dollars})`);
      console.log(`   Miss2: ${row.miss2} ($${row.miss2_dollars})`);
      console.log(`   Miss3: ${row.miss3} ($${row.miss3_dollars})`);
      console.log(`   Comments: ${row.freeform_comments?.substring(0, 50)}...`);
    });
    
    // Check stock issues data
    const issuesQuery = await pool.request().query(`
      SELECT TOP 3 
        issue_type, COUNT(*) cnt, SUM(ISNULL(est_impact_dollars,0)) dollars
      FROM dbo.store_stock_issues
      WHERE issue_date >= DATEADD(day,-7, CONVERT(date,SYSUTCDATETIME()))
      GROUP BY issue_type 
      ORDER BY dollars DESC
    `);
    
    console.log(`\n📦 Stock issues data for worker:`);
    console.log(`Found ${issuesQuery.recordset.length} issue types`);
    issuesQuery.recordset.forEach((row, i) => {
      console.log(`${i+1}. Type: ${row.issue_type}, Count: ${row.cnt}, Dollars: $${row.dollars}`);
    });
    
    // Check if there are any queued jobs
    const jobsQuery = await pool.request().query(`
      SELECT TOP 3 
        job_id, scope_type, scope_key, iso_week, month_key, status, created_at
      FROM dbo.exec_report_jobs 
      ORDER BY created_at DESC
    `);
    
    console.log(`\n🤖 Recent jobs:`);
    console.log(`Found ${jobsQuery.recordset.length} jobs`);
    jobsQuery.recordset.forEach((row, i) => {
      console.log(`${i+1}. Job: ${row.job_id}, Scope: ${row.scope_type}/${row.scope_key||'all'}, Status: ${row.status}, Created: ${row.created_at}`);
    });
    
    await pool.close();
    
    console.log('\n✅ Worker data check complete');
    
  } catch (error) {
    console.error('❌ Worker data check failed:', error.message);
  }
}

checkWorkerData();
