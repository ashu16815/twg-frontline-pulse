import { getDb } from '../lib/db.ts';

async function checkData() {
  try {
    const pool = await getDb();
    
    // Check if we have any feedback data
    const feedbackQuery = await pool.request().query(`
      SELECT TOP 5 
        store_id, region_code, iso_week, overall_mood, 
        miss1_dollars, miss2_dollars, miss3_dollars, 
        created_at
      FROM dbo.store_feedback 
      ORDER BY created_at DESC
    `);
    
    console.log('📊 FEEDBACK DATA:');
    console.log(`Found ${feedbackQuery.recordset.length} recent feedback entries`);
    feedbackQuery.recordset.forEach((row, i) => {
      console.log(`${i+1}. Store: ${row.store_id}, Region: ${row.region_code}, Week: ${row.iso_week}, Mood: ${row.overall_mood}, Impact: $${(Number(row.miss1_dollars||0) + Number(row.miss2_dollars||0) + Number(row.miss3_dollars||0)).toFixed(2)}`);
    });
    
    // Check if we have any AI snapshots
    const snapshotQuery = await pool.request().query(`
      SELECT TOP 3 
        snapshot_id, scope_type, scope_key, iso_week, month_key,
        created_at, rows_used, gen_model
      FROM dbo.exec_report_snapshots 
      ORDER BY created_at DESC
    `);
    
    console.log('\n🤖 AI SNAPSHOTS:');
    console.log(`Found ${snapshotQuery.recordset.length} AI snapshots`);
    snapshotQuery.recordset.forEach((row, i) => {
      console.log(`${i+1}. ID: ${row.snapshot_id}, Scope: ${row.scope_type}/${row.scope_key||'all'}, Week: ${row.iso_week||'N/A'}, Rows: ${row.rows_used}, Model: ${row.gen_model}, Created: ${row.created_at}`);
    });
    
    // Check if we have any stock issues
    const issuesQuery = await pool.request().query(`
      SELECT TOP 3 
        issue_id, store_id, region_code, issue_type, 
        short_title, est_impact_dollars, created_at
      FROM dbo.store_stock_issues 
      ORDER BY created_at DESC
    `);
    
    console.log('\n📦 STOCK ISSUES:');
    console.log(`Found ${issuesQuery.recordset.length} stock issues`);
    issuesQuery.recordset.forEach((row, i) => {
      console.log(`${i+1}. Store: ${row.store_id}, Region: ${row.region_code}, Type: ${row.issue_type}, Impact: $${row.est_impact_dollars||0}, Title: ${row.short_title}`);
    });
    
    // Check total counts
    const countsQuery = await pool.request().query(`
      SELECT 
        (SELECT COUNT(*) FROM dbo.store_feedback) as feedback_count,
        (SELECT COUNT(*) FROM dbo.exec_report_snapshots) as snapshot_count,
        (SELECT COUNT(*) FROM dbo.store_stock_issues) as issues_count,
        (SELECT COUNT(*) FROM dbo.exec_report_jobs) as job_count
    `);
    
    console.log('\n📈 SUMMARY COUNTS:');
    const counts = countsQuery.recordset[0];
    console.log(`Total Feedback: ${counts.feedback_count}`);
    console.log(`Total Snapshots: ${counts.snapshot_count}`);
    console.log(`Total Stock Issues: ${counts.issues_count}`);
    console.log(`Total Jobs: ${counts.job_count}`);
    
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
  }
}

checkData();
