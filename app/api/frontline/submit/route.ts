import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/db';
import { analyzeFrontlineFeedback, weekKey } from '@/lib/gpt5';
import crypto from 'crypto';

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
  estimated_dollar_impact: z.string().optional().or(z.literal('')),
  
  // Idempotency and session recovery
  idempotency_key: z.string().optional(),
  session_id: z.string().optional()
});

export async function POST(req: Request) {
  const form = await req.formData();
  const body = Object.fromEntries(form.entries());
  const pRes = schema.safeParse(body);

  if (!pRes.success) {
    console.error('❌ Form validation failed:', {
      receivedFields: Object.keys(body),
      validationErrors: pRes.error.issues,
      formData: body
    });
    return NextResponse.json({ 
      error: 'Invalid form data', 
      details: pRes.error.issues,
      receivedFields: Object.keys(body)
    }, { status: 400 });
  }

  const p = pRes.data;
  const isoWeek = weekKey(new Date());

  try {
    const pool = await getDb();
    const toNum = (x?: string) => x ? Number(x) : null;
    
    // Generate idempotency key if not provided
    const idempotencyKey = p.idempotency_key || crypto.createHash('sha256')
      .update(JSON.stringify({ storeId: p.storeId, isoWeek, timestamp: Date.now() }))
      .digest('hex').slice(0, 32);

    // Check for duplicate submission
    const existing = await pool.request()
      .input('key', idempotencyKey)
      .query`SELECT id FROM dbo.store_feedback WHERE idempotency_key = @key`;
    
    if (existing.recordset.length > 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'Submission already received',
        redirect: '/reports'
      });
    }

    // Save data immediately (without AI analysis to prevent timeout)
    await pool.request().query`
      INSERT INTO dbo.store_feedback (
        iso_week, store_id, store_code, store_name, region, region_code, banner, manager_email,
        top_positive, top_positive_impact,
        top_positive_2, top_positive_2_impact,
        top_positive_3, top_positive_3_impact,
        miss1, miss1_dollars, miss2, miss2_dollars, miss3, miss3_dollars,
        overall_mood, themes, idempotency_key, submitted_by
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
        'neu', -- Default mood, will be updated by background AI
        'Pending Analysis', -- Default themes, will be updated by background AI
        ${idempotencyKey},
        ${p.managerEmail || 'store-manager'}
      )
    `;

    // Log the submission
    await pool.request().query`
      INSERT INTO dbo.audit_log (actor, action, meta)
      VALUES ('store-manager', 'frontline-submit', ${JSON.stringify({ store: p.storeId, isoWeek, type: 'frontline', idempotencyKey })})
    `;

    // Start background AI analysis (non-blocking) with timeout protection
    setImmediate(async () => {
      try {
        // Only run AI analysis if there's meaningful content
        const hasContent = p.top_positive || p.top_negative_1 || p.top_negative_2 || p.top_negative_3 || p.next_actions || p.freeform_comments;
        
        if (!hasContent) {
          console.log(`⏭️ Skipping AI analysis for submission ${idempotencyKey} - no content`);
          return;
        }

        const feedbackData = {
          region: p.region,
          isoWeek,
          positive: p.top_positive ? {
            text: p.top_positive.substring(0, 200), // Limit text length
            impact: p.top_positive_impact ? parseFloat(p.top_positive_impact) : 0
          } : null,
          negatives: [
            p.top_negative_1 ? {
              text: p.top_negative_1.substring(0, 200), // Limit text length
              impact: p.top_negative_1_impact ? parseFloat(p.top_negative_1_impact) : 0
            } : null,
            p.top_negative_2 ? {
              text: p.top_negative_2.substring(0, 200), // Limit text length
              impact: p.top_negative_2_impact ? parseFloat(p.top_negative_2_impact) : 0
            } : null,
            p.top_negative_3 ? {
              text: p.top_negative_3.substring(0, 200), // Limit text length
              impact: p.top_negative_3_impact ? parseFloat(p.top_negative_3_impact) : 0
            } : null
          ].filter((item): item is { text: string; impact: number } => item !== null),
          nextActions: (p.next_actions || '').substring(0, 200), // Limit text length
          freeformComments: (p.freeform_comments || '').substring(0, 200), // Limit text length
          estimatedDollarImpact: p.estimated_dollar_impact ? parseFloat(p.estimated_dollar_impact) : 0
        };

        // Add timeout wrapper for AI analysis
        const aiAnalysisPromise = analyzeFrontlineFeedback(feedbackData);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('AI analysis timeout')), 15000) // 15 second timeout
        );

        const ai = await Promise.race([aiAnalysisPromise, timeoutPromise]);
        
        // Update the record with AI analysis
        await pool.request().query`
          UPDATE dbo.store_feedback 
          SET overall_mood = ${ai.overallMood || 'neu'}, 
              themes = ${Array.isArray(ai.themes) ? ai.themes.join(',') : 'General'}
          WHERE idempotency_key = ${idempotencyKey}
        `;
        
        console.log(`✅ AI analysis completed for submission ${idempotencyKey}`);
      } catch (aiError: any) {
        console.error(`❌ AI analysis failed for submission ${idempotencyKey}:`, aiError.message || aiError);
        // Data is still saved, just without AI analysis
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Feedback submitted successfully! AI analysis will be completed in the background.',
      redirect: '/reports',
      idempotencyKey
    });

  } catch (e: any) {
    console.error('Frontline submission error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}