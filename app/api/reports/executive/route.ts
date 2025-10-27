import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { callAzureJSON } from '@/lib/azure';

/**
 * POST /api/reports/executive
 * Generate executive report from last 7 days of feedback using Azure OpenAI
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { region_code, store_id, days = 7 } = body || {};
    
    const pool = await getDb();

    // Build WHERE clause with filters
    let whereClause = `created_at >= DATEADD(day, -${days}, GETDATE())`;
    const params: any = {};
    
    if (region_code) {
      whereClause += ' AND region_code = @region_code';
      params.region_code = region_code;
    }
    
    if (store_id) {
      whereClause += ' AND store_id = @store_id';
      params.store_id = store_id;
    }

    // Fetch feedback with filters
    const request = pool.request();
    if (params.region_code) request.input('region_code', params.region_code);
    if (params.store_id) request.input('store_id', params.store_id);
    
    const feedbackData = await request.query(`
      SELECT TOP 200
        store_id, store_name, region_code, store_code,
        top_positive, top_negative_1, top_negative_2, top_negative_3,
        miss1, miss1_dollars, miss2, miss2_dollars, miss3, miss3_dollars,
        overall_mood, freeform_comments, estimated_dollar_impact,
        created_at
      FROM dbo.store_feedback
      WHERE ${whereClause}
      ORDER BY created_at DESC
    `);

    const feedbacks = feedbackData.recordset;
    console.log(`📊 Found ${feedbacks.length} feedback entries in last ${days} days`);

    if (feedbacks.length === 0) {
        return NextResponse.json({
        ok: true,
        report: {
          executive_summary: `No feedback data available for the last ${days} days. Please encourage stores to submit feedback.`,
          top_opportunities: [],
          top_pain_points: [],
          what_is_working_well: [],
          what_is_not_working: [],
          additional_information: '',
          recommended_actions: []
        }
      });
    }

    // Build structured data for AI
    const painPointsData = feedbacks
      .filter((f: any) => f.top_negative_1 || f.top_negative_2 || f.top_negative_3)
      .flatMap((f: any) => [
        { issue: f.top_negative_1, impact: Number(f.miss1_dollars) || 0 },
        { issue: f.top_negative_2, impact: Number(f.miss2_dollars) || 0 },
        { issue: f.top_negative_3, impact: Number(f.miss3_dollars) || 0 }
      ].filter(item => item.issue));

    const whatsWorking = feedbacks
      .filter((f: any) => f.top_positive)
      .map((f: any) => ({
        theme: f.top_positive,
        store_id: f.store_id,
        store_name: f.store_name,
        region_code: f.region_code
      }))
      .slice(0, 20);

    const whatsNotWorking = painPointsData
      .map((item: any) => ({
        issue: item.issue,
        impact: item.impact
      }))
      .slice(0, 20);

    const additionalInfo = feedbacks
      .filter((f: any) => f.freeform_comments)
      .map((f: any) => ({
        store_id: f.store_id,
        store_name: f.store_name,
        region_code: f.region_code,
        overall_mood: f.overall_mood,
        comment: f.freeform_comments
      }))
      .slice(0, 15);

    const uniqueStores = Array.from(new Set(feedbacks.map((f: any) => f.store_id)));
    
    const structuredData = {
      total_feedbacks: feedbacks.length,
      stores_with_feedback: uniqueStores.length,
      total_estimated_impact: feedbacks.reduce((sum: number, f: any) => 
        sum + (Number(f.estimated_dollar_impact) || 0) + (Number(f.miss1_dollars) || 0) + 
        (Number(f.miss2_dollars) || 0) + (Number(f.miss3_dollars) || 0), 0
      ),
      whats_working_well: whatsWorking,
      whats_not_working: whatsNotWorking,
      additional_information: additionalInfo,
      sample_comments: feedbacks
        .filter((f: any) => f.freeform_comments)
        .map((f: any) => f.freeform_comments)
        .slice(0, 10)
    };

    // Create AI prompt
    const systemPrompt = {
      role: 'system',
      content: `You are a Big Four retail operations analyst.

You analyze weekly feedback from 250 stores of a national retailer.

Your task is to produce a concise executive report that highlights the most important patterns, risks, and opportunities across stores, regions, and categories.

Analyze the feedback data from the last ${days} days and provide a comprehensive executive report.

The data includes:
- What's Working Well: Positive feedback themes from stores
- What's Not Working: Issues and pain points with impact estimates
- Additional Information: Freeform comments and contextual details

Return ONLY valid JSON with this structure:
{
  "executive_summary": "4-5 sentence comprehensive overview of feedback trends",
  "top_opportunities": ["opportunity 1", "opportunity 2", "opportunity 3"],
  "top_pain_points": ["issue 1", "issue 2", "issue 3"],
  "what_is_working_well": ["detailed success 1", "detailed success 2"],
  "what_is_not_working": ["detailed issue 1", "detailed issue 2"],
  "additional_information": "Summary of key comments and context",
  "recommended_actions": ["action 1", "action 2", "action 3"]
}`
    };

    const userPrompt = {
      role: 'user',
      content: JSON.stringify(structuredData, null, 2)
    };

    console.log('🤖 Calling Azure OpenAI to generate executive report...');

    // Call Azure OpenAI
    const aiResponse = await callAzureJSON([systemPrompt, userPrompt], {
      timeout: 30000
    });

    console.log('✅ AI report generated successfully');

    return NextResponse.json({
      ok: true,
      report: aiResponse,
      metadata: {
        feedback_count: structuredData.total_feedbacks,
        stores_count: structuredData.stores_with_feedback,
        estimated_impact: structuredData.total_estimated_impact,
        days_period: days,
        region_filter: region_code || 'All',
        store_filter: store_id || 'All'
      },
      raw_data: {
        whats_working: whatsWorking.slice(0, 15),
        whats_not_working: whatsNotWorking.slice(0, 15),
        additional_info: additionalInfo,
        sample_feedbacks: feedbacks.slice(0, 20).map((f: any) => ({
          store_id: f.store_id,
          store_name: f.store_name,
          region_code: f.region_code,
          overall_mood: f.overall_mood,
          top_positive: f.top_positive,
          top_negative_1: f.top_negative_1,
          top_negative_2: f.top_negative_2,
          top_negative_3: f.top_negative_3,
          miss1_dollars: f.miss1_dollars,
          miss2_dollars: f.miss2_dollars,
          miss3_dollars: f.miss3_dollars,
          freeform_comments: f.freeform_comments
        }))
      }
    });

  } catch (error: any) {
    console.error('❌ Error generating executive report:', error);
    
    // Return fallback report
    return NextResponse.json({
      ok: true,
        report: {
          executive_summary: 'Executive report generation encountered an issue. Please try again.',
          top_opportunities: ['Review data manually', 'Contact stores for updates'],
          top_pain_points: ['Unable to generate analysis'],
          what_is_working_well: ['Data collection system operational'],
          what_is_not_working: ['AI report generation temporarily unavailable'],
          additional_information: 'Please check Azure OpenAI service status',
          recommended_actions: ['Retry report generation', 'Check Azure OpenAI service']
        }
    });
  }
}

/**
 * GET /api/reports/executive
 * Get the last generated executive report
 */
export async function GET(req: Request) {
  try {
    const pool = await getDb();
    
    const result = await pool.request().query(`
      SELECT TOP 1
        narrative as executive_summary,
        JSON_VALUE(whatWorking, '$') as what_is_working_well,
        JSON_VALUE(whatNotWorking, '$') as top_pain_points,
        JSON_VALUE(actions, '$') as recommended_actions
      FROM dbo.executive_report
      ORDER BY created_at DESC
    `);

    if (result.recordset.length === 0) {
      return NextResponse.json({
        ok: true,
        report: null,
        message: 'No executive report found. Generate one first.'
      });
    }

    return NextResponse.json({
      ok: true,
      report: result.recordset[0]
    });

  } catch (error: any) {
    console.error('❌ Error fetching executive report:', error);
    return NextResponse.json({
      ok: false,
      error: error.message
    }, { status: 500 });
  }
}
