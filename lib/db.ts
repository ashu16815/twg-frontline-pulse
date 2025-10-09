import sql from 'mssql';

let poolPromise: Promise<sql.ConnectionPool> | null = null;

export function getDb() {
  if (!poolPromise) {
    const connectionString = process.env.AZURE_SQL_CONNECTION_STRING;
    
    if (!connectionString) {
      throw new Error('AZURE_SQL_CONNECTION_STRING environment variable is not set');
    }
    
    poolPromise = sql.connect(connectionString);
  }
  
  return poolPromise;
}

export async function closeDb() {
  if (poolPromise) {
    const pool = await poolPromise;
    await pool.close();
    poolPromise = null;
  }
}

// Helper function for safe query execution
export async function query<T = any>(queryText: string, params?: Record<string, any>): Promise<sql.IResult<T>> {
  const pool = await getDb();
  const request = pool.request();
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      request.input(key, value);
    });
  }
  
  return request.query(queryText);
}

// Helper function to get week key in ISO format
export function weekKey(d: Date): string {
  const t = new Date(d.getTime());
  t.setHours(0, 0, 0, 0);
  const onejan = new Date(t.getFullYear(), 0, 1);
  const week = Math.ceil((((t.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7);
  return `${t.getFullYear()}-W${week}`;
}

