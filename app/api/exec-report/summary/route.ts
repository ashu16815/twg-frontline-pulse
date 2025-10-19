import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { callAzureJSON } from '@/lib/azure-simple';
import { weekKey } from '@/lib/db';

const SYS = {
  role: 'system',
  content: `You are a Big-4 style analyst. Given rows of store feedback, produce JSON only:
{
 "week": string,
 "top_opportunities": [ {"theme": string, "impact_dollars": number, "why": string } ],
 "top_actions": [ {"action": string, "owner": string, "eta_weeks": number, "expected_uplift_dollars": number } ],
 "risks": [ {"risk": string, "mitigation": string } ],
 "notes": string
}
Be concise, business-focused, no fluff. Return only valid JSON.`
};

export async function GET(req: Request) {
  try {
    const u = new URL(req.url);
    const week = u.searchParams.get('iso_week') || weekKey(new Date());
    const month = u.searchParams.get('month');
    const region = u.searchParams.get('region_code') || '';
    const store = u.searchParams.get('store_id') || '';
    const pool = await getDb();

    const where = ['1=1'];
    if (week) where.push('sf.iso_week = @week');
    if (month) where.push('sf.month_key = @month');
    if (region) where.push('sf.region_code = @region');
    if (store) where.push('sf.store_id = @store');

    const q = `SELECT TOP 500 sf.store_id, sf.region_code, sf.iso_week, sf.month_key, sf.top_positive, 
              sf.miss1, sf.miss1_dollars, sf.miss2, sf.miss2_dollars, sf.miss3, sf.miss3_dollars, 
              sf.overall_mood, sf.freeform_comments, sm.store_code, sm.store_name
              FROM dbo.store_feedback sf 
              JOIN dbo.store_master sm ON sf.store_id=sm.store_id 
              WHERE ${where.join(' AND ')} 
              ORDER BY sf.created_at DESC;`;

    const reqst = pool.request();
    if (week) reqst.input('week', week);
    if (month) reqst.input('month', month);
    if (region) reqst.input('region', region);
    if (store) reqst.input('store', store);

    const rs = await reqst.query(q);
    
    // If no data, return empty analysis
    if (rs.recordset.length === 0) {
      return NextResponse.json({ 
        ok: true, 
        analysis: {
          week: week,
          top_opportunities: [],
          top_actions: [],
          risks: [],
          notes: "No feedback data available for this period."
        }, 
        rows: 0 
      });
    }
    
    // Limit data size for AI processing to prevent timeouts
    const limitedData = rs.recordset.slice(0, 50); // Process max 50 records
    const messages = [SYS, { role: 'user', content: JSON.stringify(limitedData).slice(0, 80000) }];
    
    try {
      const analysis = await callAzureJSON(messages);
      return NextResponse.json({ ok: true, analysis, rows: rs.recordset.length });
    } catch (aiError: any) {
      // Fallback if AI processing fails
      console.error('AI processing failed, using fallback:', aiError.message);
      return NextResponse.json({ 
        ok: true, 
        analysis: {
          week: week,
          top_opportunities: [
            {
              theme: "Data processing in progress",
              impact_dollars: 0,
              why: "AI analysis temporarily unavailable, manual review recommended"
            }
          ],
          top_actions: [
            {
              action: "Review feedback data manually",
              owner: "Management",
              eta_weeks: 1,
              expected_uplift_dollars: 0
            }
          ],
          risks: [
            {
              risk: "AI processing timeout",
              mitigation: "Manual data review and analysis"
            }
          ],
          notes: `Found ${rs.recordset.length} feedback records. AI analysis timed out, please review data manually.`
        }, 
        rows: rs.recordset.length 
      });
    }
  } catch (e: any) {
    console.error('New executive summary error:', e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}