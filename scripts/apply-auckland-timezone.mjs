import dotenv from 'dotenv';
import sql from 'mssql';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const pool = await sql.connect(process.env.AZURE_SQL_CONNECTION_STRING);
const schema = await fs.readFile('scripts/set-auckland-timezone.sql', 'utf8');

console.log('🌏 Setting up Auckland timezone views...');

try {
  // Split by GO statements and execute each batch
  const batches = schema.split(/\nGO\n/gi).filter(b => b.trim());
  
  for (const batch of batches) {
    if (batch.trim()) {
      await pool.request().batch(batch);
    }
  }
  
  console.log('✅ Auckland timezone views created successfully!');
  console.log('');
  console.log('You can now use:');
  console.log('  - vw_feedback_auckland (feedback with NZ times)');
  console.log('  - vw_app_users_auckland (users with NZ times)');
  console.log('');
  console.log('Example query:');
  console.log('  SELECT * FROM vw_feedback_auckland WHERE iso_week = \'2025-W41\'');
  
  process.exit(0);
} catch (e) {
  console.error('❌ Error:', e.message);
  process.exit(1);
}

