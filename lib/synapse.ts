import 'server-only';
import sql from 'mssql';

let pool: any;

export async function getSynapse() {
  if (pool) return pool;
  
  const cfg = {
    server: process.env.SYNAPSE_SQL_ENDPOINT,
    database: process.env.SYNAPSE_DB,
    user: process.env.SYNAPSE_USER,
    password: process.env.SYNAPSE_PASSWORD,
    options: { encrypt: true }
  };
  
  pool = await sql.connect(cfg as any);
  return pool;
}

export async function fetchAgg(query: string) {
  try {
    const p = await getSynapse();
    const r = await p.request().query(query);
    return r.recordset;
  } catch {
    return [];
  }
}
