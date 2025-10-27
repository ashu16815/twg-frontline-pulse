import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { askCEOWithRAG } from '@/lib/gpt5';

export async function POST(req: Request) {
  try {
    const { question } = await req.json();
    
    const pool = await getDb();
    
    // Fetch last 7 days of feedback with full context for RAG mode
    const feedbackResult = await pool.request().query(`
      SELECT TOP 100
        store_id, 
        store_name,
        store_code,
        region_code, 
        region,
        iso_week,
        top_positive, 
        top_negative_1,
        top_negative_2,
        top_negative_3,
        miss1, 
        miss1_dollars, 
        miss2, 
        miss2_dollars, 
        miss3, 
        miss3_dollars,
        overall_mood, 
        freeform_comments,
        estimated_dollar_impact,
        submitted_by,
        created_at
      FROM dbo.store_feedback 
      WHERE created_at >= DATEADD(day, -7, GETDATE())
      ORDER BY created_at DESC
    `);
    
    const rows = feedbackResult.recordset || [];
    
    console.log(`🤔 CEO Question: "${question}"`);
    console.log(`📊 Data: ${rows.length} feedback entries from last 7 days`);
    
    let ans;
    try {
      ans = await askCEOWithRAG(question, rows);
      console.log(`✅ Answer generated:`, ans.answer?.substring(0, 100));
    } catch (error: any) {
      console.log('⚠️ CEO AI failed, using fallback:', error.message);
      // Provide a fallback answer based on the data
      const totalImpact = rows.reduce((sum, r) => sum + (r.miss1_dollars || 0) + (r.miss2_dollars || 0) + (r.miss3_dollars || 0), 0);
      const positiveCount = rows.filter(r => r.overall_mood === 'pos').length;
      const negativeCount = rows.filter(r => r.overall_mood === 'neg').length;
      
      ans = {
        answer: `Based on ${rows.length} feedback entries from last 7 days: Total impact $${totalImpact.toLocaleString()}, ${positiveCount} positive, ${negativeCount} negative responses. Key themes: ${rows.slice(0, 3).map(r => r.miss1 || r.top_positive).filter(Boolean).join(', ')}.`
      };
    }
    
    // Calculate stores with feedback and unique regions
    const storesWithFeedback = new Set(rows.map(r => r.store_id));
    const regionsWithFeedback = new Set(rows.map(r => r.region_code).filter(Boolean));
    
    // Calculate breakdowns
    const totalImpact = rows.reduce((sum, r) => sum + (r.miss1_dollars || 0) + (r.miss2_dollars || 0) + (r.miss3_dollars || 0), 0);
    const positiveImpact = rows.filter(r => r.overall_mood === 'pos').reduce((sum, r) => sum + (r.miss1_dollars || 0) + (r.miss2_dollars || 0) + (r.miss3_dollars || 0), 0);
    const negativeImpact = rows.filter(r => r.overall_mood === 'neg').reduce((sum, r) => sum + (r.miss1_dollars || 0) + (r.miss2_dollars || 0) + (r.miss3_dollars || 0), 0);
    
    // Create detailed feedback drill-down for executives
    const feedbackDrillDown = rows.map((row, index) => ({
      id: index + 1,
      store_id: row.store_id,
      store_name: row.store_name,
      store_code: row.store_code,
      region_code: row.region_code,
      region: row.region,
      mood: row.overall_mood,
      positive: row.top_positive,
      issues: [
        row.top_negative_1 ? { text: row.top_negative_1, dollars: row.miss1_dollars } : null,
        row.top_negative_2 ? { text: row.top_negative_2, dollars: row.miss2_dollars } : null,
        row.top_negative_3 ? { text: row.top_negative_3, dollars: row.miss3_dollars } : null
      ].filter(Boolean),
      comments: row.freeform_comments,
      totalImpact: (row.miss1_dollars || 0) + (row.miss2_dollars || 0) + (row.miss3_dollars || 0),
      created_at: row.created_at
    }));
    
    return NextResponse.json({ 
      answer: ans.answer,
      feedbackDrillDown: feedbackDrillDown,
      summary: {
        totalEntries: rows.length,
        totalStores: storesWithFeedback.size,
        totalRegions: regionsWithFeedback.size,
        totalImpact: totalImpact,
        positiveImpact: positiveImpact,
        negativeImpact: negativeImpact,
        positiveCount: rows.filter(r => r.overall_mood === 'pos').length,
        negativeCount: rows.filter(r => r.overall_mood === 'neg').length,
        neutralCount: rows.filter(r => r.overall_mood === 'neu').length,
        daysPeriod: 'Last 7 days'
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
