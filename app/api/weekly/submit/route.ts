import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/db';
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

    // TODO: Migrate to Azure SQL - this route is not currently used
    // Using frontline/submit instead
    return NextResponse.json({ 
      error: 'This route is deprecated. Please use /api/frontline/submit instead.' 
    }, { status: 410 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}