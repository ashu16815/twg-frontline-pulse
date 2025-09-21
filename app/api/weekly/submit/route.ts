import { NextResponse } from 'next/server';
import { z } from 'zod';
import { sbAdmin } from '@/lib/supabase-admin';
import { analyzeIssues, weekKey } from '@/lib/gpt5';

const schema = z.object({
  storeId: z.string(),
  storeName: z.string(),
  region: z.string(),
  managerEmail: z.string().optional().or(z.literal('')),
  issue1Cat: z.string(), issue1Text: z.string(), issue1Impact: z.string().optional().or(z.literal('')),
  issue2Cat: z.string(), issue2Text: z.string(), issue2Impact: z.string().optional().or(z.literal('')),
  issue3Cat: z.string(), issue3Text: z.string(), issue3Impact: z.string().optional().or(z.literal(''))
});

export async function POST(req: Request) {
  const form = await req.formData();
  const body = Object.fromEntries(form.entries());
  const pRes = schema.safeParse(body);
  if (!pRes.success) return NextResponse.json({ error: pRes.error.flatten() }, { status: 400 });
  const p: any = pRes.data;
  const isoWeek = weekKey(new Date());

  try {
    const ai = await analyzeIssues({
      region: p.region,
      isoWeek,
      issues: [
        { rank: 1, category: p.issue1Cat, text: p.issue1Text, impact: p.issue1Impact || '' },
        { rank: 2, category: p.issue2Cat, text: p.issue2Text, impact: p.issue2Impact || '' },
        { rank: 3, category: p.issue3Cat, text: p.issue3Text, impact: p.issue3Impact || '' }
      ]
    });

    const ins = await sbAdmin.from('store_feedback').insert({
      iso_week: isoWeek,
      store_id: p.storeId,
      store_name: p.storeName,
      region: p.region,
      manager_email: p.managerEmail || null,
      issue1_cat: p.issue1Cat,
      issue1_text: p.issue1Text,
      issue1_impact: p.issue1Impact || null,
      issue1_score: ai.issues?.[0]?.score,
      issue1_mood: ai.issues?.[0]?.mood,
      issue2_cat: p.issue2Cat,
      issue2_text: p.issue2Text,
      issue2_impact: p.issue2Impact || null,
      issue2_score: ai.issues?.[1]?.score,
      issue2_mood: ai.issues?.[1]?.mood,
      issue3_cat: p.issue3Cat,
      issue3_text: p.issue3Text,
      issue3_impact: p.issue3Impact || null,
      issue3_score: ai.issues?.[2]?.score,
      issue3_mood: ai.issues?.[2]?.mood,
      overall_score: ai.overallScore,
      overall_mood: ai.overallMood,
      themes: ai.themes || []
    });

    if (ins.error) return NextResponse.json({ error: 'DB insert failed: ' + ins.error.message }, { status: 500 });

    await sbAdmin.from('audit_log').insert({
      actor: 'store-manager',
      action: 'weekly-submit',
      meta: { store: p.storeId, isoWeek }
    });

    return NextResponse.redirect(new URL('/reports', req.url));
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}