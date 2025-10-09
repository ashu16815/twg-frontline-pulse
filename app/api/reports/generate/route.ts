import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { weekKey, generateExecutiveReport } from '@/lib/gpt5';
import sql from 'mssql';

export async function POST() {
  const wk = weekKey(new Date());
  
  try {
    const pool = await getDb();
    
    // Fetch store feedback and weekly summaries
    const [feedbackResult, summaryResult] = await Promise.all([
      pool.request()
        .input('week', sql.NVarChar(10), wk)
        .query('SELECT * FROM dbo.store_feedback WHERE iso_week = @week'),
      pool.request()
        .input('week', sql.NVarChar(10), wk)
        .query('SELECT * FROM dbo.weekly_summary WHERE iso_week = @week')
    ]);
    
    const rows = feedbackResult.recordset;
    const summ = summaryResult.recordset;
    
    console.log(`📊 Report Generation - Week: ${wk}`);
    console.log(`   Feedback rows: ${rows.length}`);
    console.log(`   Summary rows: ${summ.length}`);
    
    // If no data, return a default report
    if (rows.length === 0) {
      console.log('⚠️  No feedback data found for this week');
      const defaultReport = {
        narrative: `No feedback data available for week ${wk}. Please submit feedback first.`,
        highlights: [],
        themes: [],
        risks: [],
        actions: []
      };
      return NextResponse.json({ ok: true, report: defaultReport, noData: true });
    }
    
    // Generate executive report using AI
    console.log('🤖 Calling AI to generate report...');
    const rep = await generateExecutiveReport(wk, rows || [], summ || []);
    console.log('✅ AI response received:');
    console.log('   Full response:', JSON.stringify(rep, null, 2));
    
    // Ensure all required fields have defaults
    const narrative = rep.narrative || `Executive Summary for Week ${wk}`;
    const highlights = Array.isArray(rep.highlights) ? rep.highlights : [];
    const themes = Array.isArray(rep.themes) ? rep.themes : [];
    const risks = Array.isArray(rep.risks) ? rep.risks : [];
    const actions = Array.isArray(rep.actions) ? rep.actions : [];
    
    // Prepare all fields with defaults
    const whatWorking = Array.isArray(rep.whatWorking) ? rep.whatWorking : [];
    const whatNotWorking = Array.isArray(rep.whatNotWorking) ? rep.whatNotWorking : [];
    const metrics = typeof rep.metrics === 'object' ? rep.metrics : {};
    
    // Insert the report into database
    await pool.request()
      .input('iso_week', sql.NVarChar(10), wk)
      .input('narrative', sql.NVarChar(sql.MAX), narrative)
      .input('highlights', sql.NVarChar(sql.MAX), JSON.stringify(highlights))
      .input('whatWorking', sql.NVarChar(sql.MAX), JSON.stringify(whatWorking))
      .input('whatNotWorking', sql.NVarChar(sql.MAX), JSON.stringify(whatNotWorking))
      .input('themes', sql.NVarChar(sql.MAX), JSON.stringify(themes))
      .input('risks', sql.NVarChar(sql.MAX), JSON.stringify(risks))
      .input('actions', sql.NVarChar(sql.MAX), JSON.stringify(actions))
      .input('metrics', sql.NVarChar(sql.MAX), JSON.stringify(metrics))
      .query(`
        INSERT INTO dbo.executive_report (iso_week, narrative, highlights, whatWorking, whatNotWorking, themes, risks, actions, metrics)
        VALUES (@iso_week, @narrative, @highlights, @whatWorking, @whatNotWorking, @themes, @risks, @actions, @metrics)
      `);
    
    console.log(`✅ Executive report saved to database for week ${wk}`);
    
    return NextResponse.json({ 
      ok: true, 
      message: 'Executive report generated successfully',
      report: {
        narrative,
        highlights,
        whatWorking,
        whatNotWorking,
        themes,
        risks,
        actions,
        metrics
      }
    });
  } catch (e: any) {
    console.error('Generate report error:', e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
