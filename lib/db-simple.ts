import sql, { ConnectionPool } from 'mssql';

let pool: ConnectionPool | null = null;

export async function getDb() { 
  if(pool) return pool; 
  pool = await new sql.ConnectionPool(process.env.AZURE_SQL_CONNECTION_STRING as string).connect(); 
  return pool; 
}
