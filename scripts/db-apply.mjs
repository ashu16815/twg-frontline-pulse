import 'dotenv/config';
import sql from 'mssql';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const connectionString = process.env.AZURE_SQL_CONNECTION_STRING;

if (!connectionString) {
  console.error('❌ AZURE_SQL_CONNECTION_STRING environment variable is required');
  process.exit(1);
}

async function applySchema() {
  console.log('🔄 Applying Azure SQL schema...\n');
  
  try {
    // Read the schema file
    const schemaPath = path.join(__dirname, '../db/schema-azure.sql');
    const schema = await fs.readFile(schemaPath, 'utf8');
    
    console.log('📄 Schema file loaded');
    console.log(`   Path: ${schemaPath}\n`);
    
    // Connect to database
    console.log('⏳ Connecting to Azure SQL Database...');
    const pool = await sql.connect(connectionString);
    console.log('✅ Connected successfully\n');
    
    // Split schema into individual statements
    // Azure SQL doesn't support GO in batch, so we need to execute separately
    const statements = schema
      .split(/\n\s*GO\s*\n/gi)
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.match(/^\/\*/));
    
    console.log(`📋 Executing ${statements.length} SQL statement(s)...\n`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          await pool.request().batch(statement);
          console.log(`   ✓ Statement ${i + 1}/${statements.length} executed`);
        } catch (err) {
          // Some errors are expected (like "table already exists")
          if (err.message && !err.message.includes('already exists')) {
            console.warn(`   ⚠ Warning on statement ${i + 1}: ${err.message}`);
          }
        }
      }
    }
    
    console.log('\n✅ Azure SQL schema applied successfully!');
    
    // Verify tables were created
    const tables = await pool.request().query`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE' 
        AND TABLE_NAME IN ('store_master', 'store_feedback', 'weekly_summary', 'executive_report', 'wis_docs', 'audit_log')
      ORDER BY TABLE_NAME
    `;
    
    console.log('\n📊 Created tables:');
    tables.recordset.forEach(t => {
      console.log(`   - ${t.TABLE_NAME}`);
    });
    
    await pool.close();
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error applying schema:');
    console.error(`   ${error.message}`);
    
    if (error.code) {
      console.error(`   Code: ${error.code}`);
    }
    
    console.error('\n💡 Troubleshooting:');
    console.error('   - Verify AZURE_SQL_CONNECTION_STRING is correct');
    console.error('   - Check if your IP is allowed in Azure SQL firewall rules');
    console.error('   - Ensure the user has CREATE TABLE permissions');
    
    process.exit(1);
  }
}

applySchema();

