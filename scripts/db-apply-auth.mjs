import 'dotenv/config';
import sql from 'mssql';
import fs from 'fs/promises';

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

