import 'dotenv/config';
import sql from 'mssql';
import fs from 'fs/promises';

async function applyProdHardening() {
  try {
    console.log('🔧 Applying production hardening...');
    
    const connectionString = process.env.AZURE_SQL_CONNECTION_STRING;
    if (!connectionString) {
      console.error('❌ AZURE_SQL_CONNECTION_STRING environment variable is required');
      process.exit(1);
    }

    console.log('📡 Connecting to database...');
    const pool = await sql.connect(connectionString);
    console.log('✅ Connected successfully');

    // Read and apply the hardening script
    const hardeningScript = await fs.readFile('db/prod_hardening.sql', 'utf8');
    console.log('📝 Applying database optimizations...');
    
    await pool.request().batch(hardeningScript);
    console.log('✅ Production hardening applied successfully');

    await pool.close();
    console.log('🎉 Database optimization complete!');
    
  } catch (error) {
    console.error('❌ Production hardening failed:', error.message);
    process.exit(1);
  }
}

applyProdHardening();
