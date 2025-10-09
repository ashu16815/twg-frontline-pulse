import dotenv from 'dotenv';
import sql from 'mssql';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function addMonthKeyColumn() {
  try {
    const pool = await sql.connect(process.env.AZURE_SQL_CONNECTION_STRING);
    
    console.log('🔧 Adding month_key column to store_feedback table...');
    
    // Check if column already exists
    const checkResult = await pool.request().query(`
      SELECT COUNT(*) as cnt 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'store_feedback' 
      AND COLUMN_NAME = 'month_key'
    `);
    
    if (checkResult.recordset[0].cnt > 0) {
      console.log('✅ month_key column already exists');
    } else {
      // Add column
      await pool.request().query(`
        ALTER TABLE dbo.store_feedback 
        ADD month_key nvarchar(7) NULL
      `);
      console.log('✅ Added month_key column');
    }
    
    // Update existing rows to populate month_key from iso_week
    console.log('📝 Updating existing rows with month_key...');
    await pool.request().query(`
      UPDATE dbo.store_feedback
      SET month_key = LEFT(iso_week, 4) + '-' + 
        CASE 
          WHEN CAST(SUBSTRING(iso_week, 7, 2) AS INT) <= 4 THEN '01'
          WHEN CAST(SUBSTRING(iso_week, 7, 2) AS INT) <= 8 THEN '02'
          WHEN CAST(SUBSTRING(iso_week, 7, 2) AS INT) <= 13 THEN '03'
          WHEN CAST(SUBSTRING(iso_week, 7, 2) AS INT) <= 17 THEN '04'
          WHEN CAST(SUBSTRING(iso_week, 7, 2) AS INT) <= 22 THEN '05'
          WHEN CAST(SUBSTRING(iso_week, 7, 2) AS INT) <= 26 THEN '06'
          WHEN CAST(SUBSTRING(iso_week, 7, 2) AS INT) <= 30 THEN '07'
          WHEN CAST(SUBSTRING(iso_week, 7, 2) AS INT) <= 35 THEN '08'
          WHEN CAST(SUBSTRING(iso_week, 7, 2) AS INT) <= 39 THEN '09'
          WHEN CAST(SUBSTRING(iso_week, 7, 2) AS INT) <= 43 THEN '10'
          WHEN CAST(SUBSTRING(iso_week, 7, 2) AS INT) <= 48 THEN '11'
          ELSE '12'
        END
      WHERE month_key IS NULL
    `);
    console.log('✅ Updated existing rows');
    
    // Create index
    console.log('🔧 Creating index on month_key...');
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='ix_store_feedback_month')
      CREATE INDEX ix_store_feedback_month ON dbo.store_feedback(month_key)
    `);
    console.log('✅ Index created');
    
    await pool.close();
    console.log('✅ Migration complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

addMonthKeyColumn();

