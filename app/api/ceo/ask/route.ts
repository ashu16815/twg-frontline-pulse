import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { weekKey, askCEO } from '@/lib/gpt5';
import sql from 'mssql';

export async function POST(req: Request) {
  try {
    const { question } = await req.json();
    const isoWeek = weekKey(new Date());
    
    const pool = await getDb();
    
    // Fetch data from Azure SQL
    const [feedbackResult, summaryResult] = await Promise.all([
      pool.request()
        .input('week', sql.NVarChar(10), isoWeek)
        .query('SELECT * FROM dbo.store_feedback WHERE iso_week = @week'),
      pool.request()
        .input('week', sql.NVarChar(10), isoWeek)
        .query('SELECT * FROM dbo.weekly_summary WHERE iso_week = @week')
    ]);
    
    const rows = feedbackResult.recordset || [];
    const summ = summaryResult.recordset || [];
    
    console.log(`🤔 CEO Question: "${question}"`);
    console.log(`📊 Data: ${rows.length} feedback rows, ${summ.length} summaries`);
    
    const ans = await askCEO(question, isoWeek, rows, summ);
    
    console.log(`✅ Answer generated:`, ans.answer?.substring(0, 100));
    
    return NextResponse.json({ answer: ans.answer });
  } catch (e: any) {
    console.error('❌ CEO ask error:', e);
    
    // Provide more specific error messages
    let errorMessage = 'Unable to process your question right now.';
    
    if (e.message?.includes('Azure OpenAI')) {
      errorMessage = 'AI service is temporarily unavailable. Please try again in a few moments.';
    } else if (e.message?.includes('database') || e.message?.includes('connection')) {
      errorMessage = 'Database connection issue. Please check system status.';
    } else if (e.message?.includes('timeout')) {
      errorMessage = 'Request timed out. Please try again with a simpler question.';
    }
    
    return NextResponse.json({ 
      answer: errorMessage,
      error: e.message 
    }, { status: 500 });
  }
}
