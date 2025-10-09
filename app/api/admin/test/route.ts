import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/admin';

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'skip';
  message: string;
  duration?: number;
  details?: any;
}

export async function POST(req: Request) {
  try {
    requireAdmin();

    const body = await req.json();
    const testSuite = body.suite || 'all'; // 'all', 'database', 'api', 'ai'

    const results: TestResult[] = [];
    const startTime = Date.now();

    // Database Tests
    if (testSuite === 'all' || testSuite === 'database') {
      // Test 1: Connection
      const connStart = Date.now();
      try {
        const pool = await getDb();
        await pool.request().query('SELECT 1 as test');
        results.push({
          name: 'DB Connection',
          status: 'pass',
          message: 'Successfully connected',
          duration: Date.now() - connStart
        });
      } catch (error: any) {
        results.push({
          name: 'DB Connection',
          status: 'fail',
          message: error.message,
          duration: Date.now() - connStart
        });
      }

      // Test 2: Read Users
      try {
        const pool = await getDb();
        const r = await pool.request().query('SELECT COUNT(*) as cnt FROM dbo.app_users');
        results.push({
          name: 'Read Users Table',
          status: 'pass',
          message: `Found ${r.recordset[0].cnt} users`,
          details: { count: r.recordset[0].cnt }
        });
      } catch (error: any) {
        results.push({
          name: 'Read Users Table',
          status: 'fail',
          message: error.message
        });
      }

      // Test 3: Read Store Master
      try {
        const pool = await getDb();
        const r = await pool.request().query('SELECT COUNT(*) as cnt FROM dbo.store_master');
        results.push({
          name: 'Read Store Master',
          status: 'pass',
          message: `Found ${r.recordset[0].cnt} stores`,
          details: { count: r.recordset[0].cnt }
        });
      } catch (error: any) {
        results.push({
          name: 'Read Store Master',
          status: 'fail',
          message: error.message
        });
      }

      // Test 4: Read Feedback
      try {
        const pool = await getDb();
        const r = await pool.request().query('SELECT COUNT(*) as cnt FROM dbo.store_feedback');
        results.push({
          name: 'Read Feedback Table',
          status: 'pass',
          message: `Found ${r.recordset[0].cnt} feedback entries`,
          details: { count: r.recordset[0].cnt }
        });
      } catch (error: any) {
        results.push({
          name: 'Read Feedback Table',
          status: 'fail',
          message: error.message
        });
      }

      // Test 5: Read Reports
      try {
        const pool = await getDb();
        const r = await pool.request().query('SELECT COUNT(*) as cnt FROM dbo.executive_reports');
        results.push({
          name: 'Read Reports Table',
          status: 'pass',
          message: `Found ${r.recordset[0].cnt} reports`,
          details: { count: r.recordset[0].cnt }
        });
      } catch (error: any) {
        results.push({
          name: 'Read Reports Table',
          status: 'fail',
          message: error.message
        });
      }
    }

    // API Tests
    if (testSuite === 'all' || testSuite === 'api') {
      // Test 6: Store Search API
      try {
        const apiStart = Date.now();
        const r = await fetch(`${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'http://localhost:3000'}/api/stores/search?q=auckland`, {
          method: 'GET'
        });
        
        if (r.ok) {
          const data = await r.json();
          results.push({
            name: 'Store Search API',
            status: 'pass',
            message: `Found ${data.stores?.length || 0} stores`,
            duration: Date.now() - apiStart
          });
        } else {
          results.push({
            name: 'Store Search API',
            status: 'fail',
            message: `HTTP ${r.status}: ${r.statusText}`
          });
        }
      } catch (error: any) {
        results.push({
          name: 'Store Search API',
          status: 'fail',
          message: error.message
        });
      }

      // Test 7: Coverage API
      try {
        const apiStart = Date.now();
        const pool = await getDb();
        const r = await pool.request().query(`
          SELECT TOP 1 iso_week 
          FROM dbo.store_feedback 
          ORDER BY created_at DESC
        `);
        
        if (r.recordset.length > 0) {
          const week = r.recordset[0].iso_week;
          results.push({
            name: 'Weekly Coverage Check',
            status: 'pass',
            message: `Latest feedback: ${week}`,
            duration: Date.now() - apiStart,
            details: { latest_week: week }
          });
        } else {
          results.push({
            name: 'Weekly Coverage Check',
            status: 'skip',
            message: 'No feedback data yet'
          });
        }
      } catch (error: any) {
        results.push({
          name: 'Weekly Coverage Check',
          status: 'fail',
          message: error.message
        });
      }
    }

    // AI Tests
    if (testSuite === 'all' || testSuite === 'ai') {
      // Test 8: Azure OpenAI Config
      const hasEndpoint = !!process.env.AZURE_OPENAI_ENDPOINT;
      const hasKey = !!process.env.AZURE_OPENAI_API_KEY;
      const hasGPT5 = !!process.env.AZURE_OPENAI_DEPLOYMENT_GPT5;
      const hasTranscribe = !!process.env.AZURE_OPENAI_DEPLOYMENT_TRANSCRIBE;

      if (hasEndpoint && hasKey && hasGPT5 && hasTranscribe) {
        results.push({
          name: 'Azure OpenAI Configuration',
          status: 'pass',
          message: 'All AI deployments configured',
          details: {
            endpoint: process.env.AZURE_OPENAI_ENDPOINT,
            gpt5: process.env.AZURE_OPENAI_DEPLOYMENT_GPT5,
            transcribe: process.env.AZURE_OPENAI_DEPLOYMENT_TRANSCRIBE
          }
        });
      } else {
        const missing = [];
        if (!hasEndpoint) missing.push('AZURE_OPENAI_ENDPOINT');
        if (!hasKey) missing.push('AZURE_OPENAI_API_KEY');
        if (!hasGPT5) missing.push('AZURE_OPENAI_DEPLOYMENT_GPT5');
        if (!hasTranscribe) missing.push('AZURE_OPENAI_DEPLOYMENT_TRANSCRIBE');

        results.push({
          name: 'Azure OpenAI Configuration',
          status: 'fail',
          message: `Missing: ${missing.join(', ')}`
        });
      }

      // Test 9: Report Generation (smoke test)
      try {
        const pool = await getDb();
        const r = await pool.request().query(`
          SELECT TOP 1 id, iso_week, report_json 
          FROM dbo.executive_reports 
          ORDER BY created_at DESC
        `);

        if (r.recordset.length > 0) {
          const report = r.recordset[0];
          const parsed = typeof report.report_json === 'string' 
            ? JSON.parse(report.report_json) 
            : report.report_json;

          results.push({
            name: 'Report Generation',
            status: 'pass',
            message: `Latest report: ${report.iso_week}`,
            details: {
              week: report.iso_week,
              has_narrative: !!parsed?.ai?.narrative,
              has_themes: !!parsed?.ai?.themes,
              has_actions: !!parsed?.ai?.actions
            }
          });
        } else {
          results.push({
            name: 'Report Generation',
            status: 'skip',
            message: 'No reports generated yet'
          });
        }
      } catch (error: any) {
        results.push({
          name: 'Report Generation',
          status: 'fail',
          message: error.message
        });
      }
    }

    // Summary
    const totalDuration = Date.now() - startTime;
    const summary = {
      total: results.length,
      passed: results.filter(r => r.status === 'pass').length,
      failed: results.filter(r => r.status === 'fail').length,
      skipped: results.filter(r => r.status === 'skip').length
    };

    const overallStatus = summary.failed === 0 ? 'pass' : 'fail';

    return NextResponse.json({
      status: overallStatus,
      suite: testSuite,
      duration: `${totalDuration}ms`,
      timestamp: new Date().toISOString(),
      summary,
      results
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Test execution failed' },
      { status: error.statusCode || 500 }
    );
  }
}

