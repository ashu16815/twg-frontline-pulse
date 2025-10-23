import 'dotenv/config';
import fs from 'fs/promises';
import sql from 'mssql';

const file = process.argv[2];
if(!file){ 
  console.error('Usage: node scripts/apply-sql.mjs <sqlfile>'); 
  process.exit(1); 
}

const text = await fs.readFile(file,'utf8');
const pool = await new sql.ConnectionPool(process.env.AZURE_SQL_CONNECTION_STRING).connect();

await pool.request().batch(text);
console.log('Applied', file);
process.exit(0);