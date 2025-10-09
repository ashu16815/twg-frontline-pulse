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
const schema = await fs.readFile('db/auth-schema.sql', 'utf8');

console.log('📋 Applying auth schema...');

try {
  await pool.request().batch(schema);
  console.log('✅ Auth schema applied successfully');
} catch (e) {
  console.error('❌ Error:', e.message);
  process.exit(1);
}

process.exit(0);

