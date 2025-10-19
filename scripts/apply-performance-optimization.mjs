import 'dotenv/config';
import sql from 'mssql';
import fs from 'fs/promises';

async function applyPerformanceOptimization() {
  let pool;
  
  try {
    console.log('🚀 Starting database performance optimization...');
    
    // Connect to database
    pool = await sql.connect(process.env.AZURE_SQL_CONNECTION_STRING);
    console.log('✅ Connected to database');
    
    // Read and execute the optimization script
    const script = await fs.readFile('db/performance-optimization-simple.sql', 'utf8');
    
    console.log('📊 Applying performance optimizations...');
    await pool.request().batch(script);
    
    console.log('✅ Performance optimization completed successfully!');
    
    // Show current index status
    console.log('\n📈 Current indexes:');
    const indexResult = await pool.request().query(`
      SELECT 
        t.name AS table_name,
        i.name AS index_name,
        i.type_desc AS index_type,
        c.name AS column_name
      FROM sys.tables t
      INNER JOIN sys.indexes i ON t.object_id = i.object_id
      INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
      INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
      WHERE i.name IS NOT NULL
      ORDER BY t.name, i.name, ic.key_ordinal
    `);
    
    console.table(indexResult.recordset);
    
    // Show table row counts
    console.log('\n📊 Table row counts:');
    const countResult = await pool.request().query(`
      SELECT 
        'store_feedback' AS table_name, COUNT(*) AS row_count FROM dbo.store_feedback
      UNION ALL
      SELECT 'store_master', COUNT(*) FROM dbo.store_master
      UNION ALL
      SELECT 'exec_report_cache', COUNT(*) FROM dbo.exec_report_cache
      UNION ALL
      SELECT 'weekly_summary', COUNT(*) FROM dbo.weekly_summary
      UNION ALL
      SELECT 'executive_report', COUNT(*) FROM dbo.executive_report
      UNION ALL
      SELECT 'app_users', COUNT(*) FROM dbo.app_users
    `);
    
    console.table(countResult.recordset);
    
  } catch (error) {
    console.error('❌ Performance optimization failed:', error.message);
    throw error;
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

applyPerformanceOptimization()
  .then(() => {
    console.log('🎉 Database optimization completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Optimization failed:', error);
    process.exit(1);
  });
