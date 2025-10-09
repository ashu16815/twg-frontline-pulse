import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import sql from 'mssql';

interface HealthCheck {
  name: string;
  status: 'healthy' | 'unhealthy' | 'warning';
  message: string;
  details?: any;
  duration?: number;
}

export async function GET() {
  const checks: HealthCheck[] = [];
  const startTime = Date.now();

  // 1. Environment Variables Check
  const envCheck: HealthCheck = {
    name: 'Environment Variables',
    status: 'healthy',
    message: 'All required environment variables are present',
    details: {}
  };

  const requiredEnvVars = [
    'AZURE_SQL_CONNECTION_STRING',
    'AZURE_OPENAI_ENDPOINT',
    'AZURE_OPENAI_API_KEY',
    'AZURE_OPENAI_DEPLOYMENT_GPT5',
    'AZURE_OPENAI_DEPLOYMENT_TRANSCRIBE',
    'AUTH_JWT_SECRET'
  ];

  const missingVars: string[] = [];
  requiredEnvVars.forEach(varName => {
    const exists = !!process.env[varName];
    envCheck.details[varName] = exists ? '✅ Set' : '❌ Missing';
    if (!exists) missingVars.push(varName);
  });

  if (missingVars.length > 0) {
    envCheck.status = 'unhealthy';
    envCheck.message = `Missing: ${missingVars.join(', ')}`;
  }

  checks.push(envCheck);

  // 2. Database Connection Check
  const dbCheckStart = Date.now();
  const dbCheck: HealthCheck = {
    name: 'Azure SQL Database',
    status: 'healthy',
    message: 'Connected successfully',
    details: {}
  };

  try {
    const pool = await getDb();
    const result = await pool.request().query('SELECT @@VERSION as version, DB_NAME() as database, GETUTCDATE() as server_time');
    
    dbCheck.duration = Date.now() - dbCheckStart;
    
    // Extract server name from connection string
    const connStr = process.env.AZURE_SQL_CONNECTION_STRING || '';
    const serverMatch = connStr.match(/Server=([^;,]+)/i);
    const serverName = serverMatch ? serverMatch[1] : 'Azure SQL Database';
    
    dbCheck.details = {
      connected: true,
      server: serverName,
      database: result.recordset[0].database,
      version: result.recordset[0].version.split('\n')[0],
      server_time: result.recordset[0].server_time,
      response_time: `${dbCheck.duration}ms`
    };

    if (dbCheck.duration > 5000) {
      dbCheck.status = 'warning';
      dbCheck.message = `Connected but slow (${dbCheck.duration}ms)`;
    }
  } catch (error: any) {
    dbCheck.status = 'unhealthy';
    dbCheck.message = error.message || 'Connection failed';
    dbCheck.duration = Date.now() - dbCheckStart;
    dbCheck.details = {
      connected: false,
      error_code: error.code,
      error_type: error.name,
      timeout: error.timeout,
      suggestion: getSuggestion(error)
    };
  }

  checks.push(dbCheck);

  // 3. Database Schema Check
  const schemaCheck: HealthCheck = {
    name: 'Database Schema',
    status: 'healthy',
    message: 'All tables present',
    details: {}
  };

  if (dbCheck.status === 'healthy') {
    try {
      const pool = await getDb();
      const tables = await pool.request().query(`
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_SCHEMA = 'dbo'
        ORDER BY TABLE_NAME
      `);

      const expectedTables = ['app_users', 'store_master', 'store_feedback', 'frontline_feedback', 'executive_reports'];
      const actualTables = tables.recordset.map((t: any) => t.TABLE_NAME);

      schemaCheck.details = {
        tables: actualTables,
        expected: expectedTables.length,
        actual: actualTables.length
      };

      const missingTables = expectedTables.filter(t => !actualTables.includes(t));
      if (missingTables.length > 0) {
        schemaCheck.status = 'warning';
        schemaCheck.message = `Missing tables: ${missingTables.join(', ')}`;
        schemaCheck.details.missing = missingTables;
      }
    } catch (error: any) {
      schemaCheck.status = 'unhealthy';
      schemaCheck.message = error.message;
    }
  } else {
    schemaCheck.status = 'unhealthy';
    schemaCheck.message = 'Cannot check schema (DB connection failed)';
  }

  checks.push(schemaCheck);

  // 4. Azure OpenAI Check
  const openaiCheckStart = Date.now();
  const openaiCheck: HealthCheck = {
    name: 'Azure OpenAI',
    status: 'healthy',
    message: 'Endpoint configured',
    details: {}
  };

  try {
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    
    if (!endpoint || !apiKey) {
      openaiCheck.status = 'unhealthy';
      openaiCheck.message = 'Missing endpoint or API key';
    } else {
      openaiCheck.details = {
        endpoint: endpoint.replace(/\/+$/, ''),
        api_key: apiKey.substring(0, 8) + '...' + apiKey.substring(apiKey.length - 4),
        gpt5_deployment: process.env.AZURE_OPENAI_DEPLOYMENT_GPT5 || 'Not set',
        transcribe_deployment: process.env.AZURE_OPENAI_DEPLOYMENT_TRANSCRIBE || 'Not set'
      };

      // Simple connectivity test (without making an actual AI call)
      openaiCheck.duration = Date.now() - openaiCheckStart;
      openaiCheck.message = 'Configured (test connection via test suite)';
    }
  } catch (error: any) {
    openaiCheck.status = 'unhealthy';
    openaiCheck.message = error.message;
  }

  checks.push(openaiCheck);

  // 5. System Info
  const systemCheck: HealthCheck = {
    name: 'System Information',
    status: 'healthy',
    message: 'System operational',
    details: {
      node_version: process.version,
      platform: process.platform,
      arch: process.arch,
      uptime: `${Math.floor(process.uptime())}s`,
      memory_usage: {
        rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`
      },
      environment: process.env.NODE_ENV || 'development',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }
  };

  checks.push(systemCheck);

  // 6. Network Info
  const networkCheck: HealthCheck = {
    name: 'Network Information',
    status: 'healthy',
    message: 'Network info retrieved',
    details: {}
  };

  try {
    // Get public IP from request headers (if behind proxy)
    const publicIP = await fetch('https://api.ipify.org?format=json')
      .then(r => r.json())
      .then(d => d.ip)
      .catch(() => 'Unable to detect');

    networkCheck.details = {
      public_ip: publicIP,
      note: 'Add this IP to Azure SQL firewall if connection fails'
    };
  } catch (error) {
    networkCheck.details = {
      public_ip: 'Unable to detect',
      error: 'Could not reach ipify.org'
    };
  }

  checks.push(networkCheck);

  // Overall health
  const hasUnhealthy = checks.some(c => c.status === 'unhealthy');
  const hasWarning = checks.some(c => c.status === 'warning');
  
  const overallStatus = hasUnhealthy ? 'unhealthy' : hasWarning ? 'warning' : 'healthy';
  const totalDuration = Date.now() - startTime;

  return NextResponse.json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    duration: `${totalDuration}ms`,
    checks,
    summary: {
      total: checks.length,
      healthy: checks.filter(c => c.status === 'healthy').length,
      warning: checks.filter(c => c.status === 'warning').length,
      unhealthy: checks.filter(c => c.status === 'unhealthy').length
    }
  });
}

function getSuggestion(error: any): string {
  if (error.code === 'ETIMEOUT' || error.message?.includes('timeout')) {
    return 'Add your IP to Azure SQL firewall rules in Azure Portal';
  } else if (error.code === 'ELOGIN') {
    return 'Check your database credentials in AZURE_SQL_CONNECTION_STRING';
  } else if (error.message?.includes('firewall')) {
    return 'Configure Azure SQL firewall to allow your IP address';
  } else {
    return 'Check your network connection and Azure SQL server status';
  }
}

