import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/db';
import { analyzeFrontlineFeedback, weekKey } from '@/lib/gpt5';

const schema = z.object({
  storeId: z.string(),
  storeName: z.string(),
  region: z.string(),
  regionCode: z.string().optional().or(z.literal('')),
  storeCode: z.string().optional().or(z.literal('')),
  banner: z.string().optional().or(z.literal('')),
  managerEmail: z.string().optional().or(z.literal('')),
  managerName: z.string().optional().or(z.literal('')),
  
  // Positive feedback (up to 3)
  top_positive: z.string().optional().or(z.literal('')),
  top_positive_impact: z.string().optional().or(z.literal('')),
  top_positive_2: z.string().optional().or(z.literal('')),
  top_positive_2_impact: z.string().optional().or(z.literal('')),
  top_positive_3: z.string().optional().or(z.literal('')),
  top_positive_3_impact: z.string().optional().or(z.literal('')),
  
  // Negative feedback (up to 3)
  top_negative_1: z.string().optional().or(z.literal('')),
  top_negative_1_impact: z.string().optional().or(z.literal('')),
  top_negative_2: z.string().optional().or(z.literal('')),
  top_negative_2_impact: z.string().optional().or(z.literal('')),
  top_negative_3: z.string().optional().or(z.literal('')),
  top_negative_3_impact: z.string().optional().or(z.literal('')),
  
  // Additional fields
  next_actions: z.string().optional().or(z.literal('')),
  freeform_comments: z.string().optional().or(z.literal('')),
  estimated_dollar_impact: z.string().optional().or(z.literal(''))
});

export async function POST(req: Request) {
  const form = await req.formData();
  const body = Object.fromEntries(form.entries());
  const pRes = schema.safeParse(body);

  if (!pRes.success) {
    return NextResponse.json({ error: 'Invalid form data', details: pRes.error.issues }, { status: 400 });
  }

  const p = pRes.data;
  const isoWeek = weekKey(new Date());

  try {
    // Prepare feedback data for AI analysis
    const feedbackData = {
      region: p.region,
      isoWeek,
      positive: p.top_positive ? {
        text: p.top_positive,
        impact: p.top_positive_impact ? parseFloat(p.top_positive_impact) : 0
      } : null,
      negatives: [
        p.top_negative_1 ? {
          text: p.top_negative_1,
          impact: p.top_negative_1_impact ? parseFloat(p.top_negative_1_impact) : 0
        } : null,
        p.top_negative_2 ? {
          text: p.top_negative_2,
          impact: p.top_negative_2_impact ? parseFloat(p.top_negative_2_impact) : 0
        } : null,
        p.top_negative_3 ? {
          text: p.top_negative_3,
          impact: p.top_negative_3_impact ? parseFloat(p.top_negative_3_impact) : 0
        } : null
      ].filter((item): item is { text: string; impact: number } => item !== null),
      nextActions: p.next_actions || '',
      freeformComments: p.freeform_comments || '',
      estimatedDollarImpact: p.estimated_dollar_impact ? parseFloat(p.estimated_dollar_impact) : 0
    };

    // Analyze feedback with AI
    const ai = await analyzeFrontlineFeedback(feedbackData);

    // Insert into Azure SQL database
    const pool = await getDb();
    const toNum = (x?: string) => x ? Number(x) : null;
    
    await pool.request().query`
      INSERT INTO dbo.store_feedback (
        iso_week, store_id, store_code, store_name, region, region_code, banner, manager_email,
        top_positive, top_positive_impact,
        top_positive_2, top_positive_2_impact,
        top_positive_3, top_positive_3_impact,
        miss1, miss1_dollars, miss2, miss2_dollars, miss3, miss3_dollars,
        overall_mood, themes
      ) VALUES (
        ${isoWeek},
        ${p.storeId},
        ${toNum(p.storeCode)},
        ${p.storeName},
        ${p.region},
        ${p.regionCode || null},
        ${p.banner || null},
        ${p.managerEmail || null},
        ${p.top_positive || null},
        ${toNum(p.top_positive_impact)},
        ${p.top_positive_2 || null},
        ${toNum(p.top_positive_2_impact)},
        ${p.top_positive_3 || null},
        ${toNum(p.top_positive_3_impact)},
        ${p.top_negative_1 || null},
        ${toNum(p.top_negative_1_impact)},
        ${p.top_negative_2 || null},
        ${toNum(p.top_negative_2_impact)},
        ${p.top_negative_3 || null},
        ${toNum(p.top_negative_3_impact)},
        ${ai.overallMood || null},
        ${Array.isArray(ai.themes) ? ai.themes.join(',') : null}
      )
    `;

    // Log the submission
    await pool.request().query`
      INSERT INTO dbo.audit_log (actor, action, meta)
      VALUES ('store-manager', 'frontline-submit', ${JSON.stringify({ store: p.storeId, isoWeek, type: 'frontline' })})
    `;

    return NextResponse.redirect(new URL('/reports', req.url));
  } catch (e: any) {
    console.error('Frontline submission error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
