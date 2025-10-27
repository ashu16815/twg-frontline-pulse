import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { callAzureJSON } from '@/lib/azure';

/**
 * GET /api/reports/executive-summary
 * Generate a concise weekly insight for the home page highlight card
 */
export async function GET() {
  try {
    const pool = await getDb();

    // Fetch last 7 days of feedback
    const feedbackData = await pool.request().query(`
      SELECT TOP 100
        store_id, store_name, region_code, store_code,
        top_positive, top_negative_1, top_negative_2, top_negative_3,
        miss1, miss1_dollars, miss2, miss2_dollars, miss3, miss3_dollars,
        overall_mood, freeform_comments, estimated_dollar_impact,
        created_at
      FROM dbo.store_feedback
      WHERE created_at >= DATEADD(day, -7, GETDATE())
      ORDER BY created_at DESC
    `);

    const feedbacks = feedbackData.recordset;

    if (feedbacks.length === 0) {
      return NextResponse.json({
        ok: true,
        insight: {
          title: 'No recent feedback',
          impact: 0,
          next_action: 'Submit store reports to see insights',
          summary: 'Waiting for feedback data from stores'
        },
        timestamp: new Date().toISOString()
      });
    }

    // Calculate impact
    const totalImpact = feedbacks.reduce((sum: number, f: any) => 
      sum + (Number(f.estimated_dollar_impact) || 0) + 
      (Number(f.miss1_dollars) || 0) + (Number(f.miss2_dollars) || 0) + 
      (Number(f.miss3_dollars) || 0), 0
    );

    // Get top pain points with impact
    const painPoints = feedbacks
      .filter((f: any) => f.top_negative_1 || f.top_negative_2 || f.top_negative_3)
      .flatMap((f: any) => [
        { issue: f.top_negative_1, impact: Number(f.miss1_dollars) || 0 },
        { issue: f.top_negative_2, impact: Number(f.miss2_dollars) || 0 },
        { issue: f.top_negative_3, impact: Number(f.miss3_dollars) || 0 }
      ].filter(item => item.issue))
      .sort((a, b) => b.impact - a.impact)
      .slice(0, 5);

    // Get top opportunities (positive themes)
    const opportunities = feedbacks
      .filter((f: any) => f.top_positive)
      .map((f: any) => f.top_positive)
      .slice(0, 10);

    // Build structured data for AI
    const uniqueStores = Array.from(new Set(feedbacks.map((f: any) => f.store_id)));
    
    const structuredData = {
      total_feedbacks: feedbacks.length,
      stores_with_feedback: uniqueStores.length,
      total_impact: totalImpact,
      top_pain_points: painPoints.slice(0, 3),
      top_opportunities: opportunities.slice(0, 5),
      sample_comments: feedbacks
        .filter((f: any) => f.freeform_comments)
        .map((f: any) => f.freeform_comments)
        .slice(0, 5)
    };

    // Create AI prompt for concise insight
    const systemPrompt = {
      role: 'system',
      content: `You are a Big Four retail operations analyst. Generate a single concise insight card for a retail executive dashboard.

Analyze the feedback and provide ONE key insight with the highest impact. Return ONLY valid JSON:
{
  "title": "Concise 3-5 word insight topic (e.g. 'Inventory Management')",
  "impact": estimated_dollar_impact_number,
  "next_action": "One actionable recommendation in 5-10 words",
  "summary": "1 sentence explanation of why this matters"
}

Keep it executive-friendly and impactful.`
    };

    const userPrompt = {
      role: 'user',
      content: JSON.stringify(structuredData, null, 2)
    };

    console.log('🤖 Calling Azure OpenAI for weekly insight...');

    // Call Azure OpenAI
    const aiResponse = await callAzureJSON([systemPrompt, userPrompt], {
      timeout: 15000
    });

    console.log('✅ Weekly insight generated successfully');

    return NextResponse.json({
      ok: true,
      insight: {
        title: aiResponse.title || 'Store Operations',
        impact: aiResponse.impact || totalImpact,
        next_action: aiResponse.next_action || 'Review feedback details',
        summary: aiResponse.summary || 'Weekly operations insight'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Error generating weekly insight:', error);
    
    // Return fallback
    return NextResponse.json({
      ok: true,
      insight: {
        title: 'Store Insights',
        impact: 0,
        next_action: 'Contact stores for updates',
        summary: 'AI analysis temporarily unavailable'
      },
      timestamp: new Date().toISOString()
    });
  }
}

