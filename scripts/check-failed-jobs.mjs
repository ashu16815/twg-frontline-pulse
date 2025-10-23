import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function checkFailedJobs() {
  try {
    console.log('🔍 Checking failed jobs...');
    
    const pool = await new sql.ConnectionPool(process.env.AZURE_SQL_CONNECTION_STRING).connect();
    
    // Check failed jobs
    const failedJobsQuery = await pool.request().query(`
      SELECT TOP 5 
        job_id, scope_type, scope_key, iso_week, month_key, status, 
        reason, created_at, started_at, finished_at
      FROM dbo.exec_report_jobs 
      WHERE status = 'failed'
      ORDER BY created_at DESC
    `);
    
    console.log(`❌ Failed jobs:`);
    console.log(`Found ${failedJobsQuery.recordset.length} failed jobs`);
    failedJobsQuery.recordset.forEach((row, i) => {
      console.log(`${i+1}. Job: ${row.job_id}`);
      console.log(`   Scope: ${row.scope_type}/${row.scope_key||'all'}`);
      console.log(`   Status: ${row.status}`);
      console.log(`   Reason: ${row.reason}`);
      console.log(`   Created: ${row.created_at}`);
      console.log(`   Started: ${row.started_at}`);
      console.log(`   Finished: ${row.finished_at}`);
      console.log('');
    });
    
    // Check successful jobs
    const successJobsQuery = await pool.request().query(`
      SELECT TOP 3 
        job_id, scope_type, scope_key, iso_week, month_key, status, 
        reason, created_at, started_at, finished_at
      FROM dbo.exec_report_jobs 
      WHERE status = 'succeeded'
      ORDER BY created_at DESC
    `);
    
    console.log(`✅ Successful jobs:`);
    console.log(`Found ${successJobsQuery.recordset.length} successful jobs`);
    successJobsQuery.recordset.forEach((row, i) => {
      console.log(`${i+1}. Job: ${row.job_id}`);
      console.log(`   Scope: ${row.scope_type}/${row.scope_key||'all'}`);
      console.log(`   Status: ${row.status}`);
      console.log(`   Reason: ${row.reason}`);
      console.log(`   Created: ${row.created_at}`);
      console.log(`   Started: ${row.started_at}`);
      console.log(`   Finished: ${row.finished_at}`);
      console.log('');
    });
    
    await pool.close();
    
    console.log('✅ Job status check complete');
    
  } catch (error) {
    console.error('❌ Job status check failed:', error.message);
  }
}

checkFailedJobs();
