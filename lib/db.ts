import sql from 'mssql';

let poolPromise: Promise<sql.ConnectionPool> | null = null;

// Database error with user-friendly messages
export class DatabaseError extends Error {
  statusCode: number;
  userMessage: string;
  technicalDetails: string;

  constructor(error: any) {
    super(error.message || 'Database error occurred');
    this.name = 'DatabaseError';
    this.statusCode = 503;

    // Parse specific error types
    if (error.code === 'ETIMEOUT' || error.message?.includes('timeout')) {
      this.userMessage = 'Database connection timeout. Please check your network or firewall settings.';
      this.technicalDetails = `Connection to ${error.server || 'database'} timed out after ${error.timeout || '30'}s`;
    } else if (error.code === 'ELOGIN' || error.message?.includes('login')) {
      this.userMessage = 'Database authentication failed. Please check your credentials.';
      this.technicalDetails = error.message;
    } else if (error.message?.includes('firewall') || error.message?.includes('not allowed')) {
      this.userMessage = 'Database firewall is blocking your connection. Please add your IP to the Azure SQL firewall.';
      this.technicalDetails = error.message;
    } else if (error.message?.includes('Invalid column')) {
      this.userMessage = 'Database schema error. Please run database migrations.';
      this.technicalDetails = error.message;
    } else {
      this.userMessage = 'A database error occurred. Please try again or contact support.';
      this.technicalDetails = error.message || 'Unknown error';
    }
  }
}

export function getDb() {
  if (!poolPromise) {
    const connectionString = process.env.AZURE_SQL_CONNECTION_STRING;
    
    if (!connectionString) {
      throw new Error('AZURE_SQL_CONNECTION_STRING environment variable is not set');
    }
    
    poolPromise = sql.connect(connectionString).catch((err) => {
      poolPromise = null; // Reset so next call can retry
      throw new DatabaseError(err);
    });
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
  try {
    const pool = await getDb();
    const request = pool.request();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        request.input(key, value);
      });
    }
    
    return await request.query(queryText);
  } catch (error: any) {
    throw new DatabaseError(error);
  }
}

// Helper function to get week key in ISO format
export function weekKey(d: Date): string {
  const t = new Date(d.getTime());
  t.setHours(0, 0, 0, 0);
  const onejan = new Date(t.getFullYear(), 0, 1);
  const week = Math.ceil((((t.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7);
  return `${t.getFullYear()}-W${week}`;
}

