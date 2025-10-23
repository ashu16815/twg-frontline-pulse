import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { weekKey, askCEO } from '@/lib/gpt5';
import sql from 'mssql';

export async function POST(req: Request) {
  try {
    const { question } = await req.json();
    const isoWeek = weekKey(new Date());
    
    const pool = await getDb();
    
    // Fetch data from Azure SQL (limit to recent data to avoid large payloads)
    const [feedbackResult, summaryResult] = await Promise.all([
      pool.request()
        .input('week', sql.NVarChar(10), isoWeek)
        .query('SELECT TOP 20 store_id, region_code, iso_week, top_positive, miss1, miss1_dollars, miss2, miss2_dollars, miss3, miss3_dollars, overall_mood, freeform_comments FROM dbo.store_feedback WHERE iso_week = @week ORDER BY created_at DESC'),
      pool.request()
        .input('week', sql.NVarChar(10), isoWeek)
        .query('SELECT TOP 10 * FROM dbo.weekly_summary WHERE iso_week = @week ORDER BY created_at DESC')
    ]);
    
    const rows = feedbackResult.recordset || [];
    const summ = summaryResult.recordset || [];
    
    console.log(`🤔 CEO Question: "${question}"`);
    console.log(`📊 Data: ${rows.length} feedback rows, ${summ.length} summaries`);
    
    let ans;
    try {
      ans = await askCEO(question, isoWeek, rows, summ);
      console.log(`✅ Answer generated:`, ans.answer?.substring(0, 100));
    } catch (error: any) {
      console.log('⚠️ CEO AI failed, using fallback:', error.message);
      // Provide a fallback answer based on the data
      const totalImpact = rows.reduce((sum, r) => sum + (r.miss1_dollars || 0) + (r.miss2_dollars || 0) + (r.miss3_dollars || 0), 0);
      const positiveCount = rows.filter(r => r.overall_mood === 'pos').length;
      const negativeCount = rows.filter(r => r.overall_mood === 'neg').length;
      
      ans = {
        answer: `Based on ${rows.length} feedback entries for ${isoWeek}: Total impact $${totalImpact.toLocaleString()}, ${positiveCount} positive, ${negativeCount} negative responses. Key themes: ${rows.slice(0, 3).map(r => r.miss1 || r.top_positive).filter(Boolean).join(', ')}.`
      };
    }
    
    // Create detailed feedback drill-down for executives
    const feedbackDrillDown = rows.map((row, index) => ({
      id: index + 1,
      store_id: row.store_id,
      region_code: row.region_code,
      mood: row.overall_mood,
      positive: row.top_positive,
      issues: [
        row.miss1 ? { text: row.miss1, dollars: row.miss1_dollars } : null,
        row.miss2 ? { text: row.miss2, dollars: row.miss2_dollars } : null,
        row.miss3 ? { text: row.miss3, dollars: row.miss3_dollars } : null
      ].filter(Boolean),
      comments: row.freeform_comments,
      totalImpact: (row.miss1_dollars || 0) + (row.miss2_dollars || 0) + (row.miss3_dollars || 0)
    }));
    
    return NextResponse.json({ 
      answer: ans.answer,
      feedbackDrillDown: feedbackDrillDown,
      summary: {
        totalEntries: rows.length,
        totalImpact: rows.reduce((sum, r) => sum + (r.miss1_dollars || 0) + (r.miss2_dollars || 0) + (r.miss3_dollars || 0), 0),
        positiveCount: rows.filter(r => r.overall_mood === 'pos').length,
        negativeCount: rows.filter(r => r.overall_mood === 'neg').length,
        neutralCount: rows.filter(r => r.overall_mood === 'neu').length,
        week: isoWeek
      }
    });
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
