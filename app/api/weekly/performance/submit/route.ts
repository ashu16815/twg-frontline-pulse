import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/db';
import { analyzePerformance, weekKey } from '@/lib/gpt5';
import sql from 'mssql';

const schema = z.object({
  storeId: z.string(),
  storeName: z.string(),
  region: z.string(),
  managerEmail: z.string().optional().or(z.literal('')),
  hitTarget: z.enum(['hit', 'miss']),
  variancePct: z.string().optional().or(z.literal('')),
  varianceDollars: z.string().optional().or(z.literal('')),
  r1Dept: z.string(),
  r1Subcat: z.string(),
  r1Driver: z.string(),
  r1Text: z.string(),
  r1Impact: z.string(),
  r2Dept: z.string(),
  r2Subcat: z.string(),
  r2Driver: z.string(),
  r2Text: z.string(),
  r2Impact: z.string(),
  r3Dept: z.string(),
  r3Subcat: z.string(),
  r3Driver: z.string(),
  r3Text: z.string(),
  r3Impact: z.string(),
  p1: z.string(),
  p1H: z.enum(['Next Month', 'Next Quarter']),
  p2: z.string(),
  p2H: z.enum(['Next Month', 'Next Quarter']),
  p3: z.string(),
  p3H: z.enum(['Next Month', 'Next Quarter'])
});

export async function POST(req: Request) {
  const form = await req.formData();
  const body = Object.fromEntries(form.entries());
  const v = schema.safeParse(body);
  if (!v.success) return NextResponse.json({ error: v.error.flatten() }, { status: 400 });
  const p: any = v.data;
  const isoWeek = weekKey(new Date());
  const toNum = (s?: string) => (s ? Number(s) : undefined);
  const reasons = [
    { rank: 1, dept: p.r1Dept, subcat: p.r1Subcat, driver: p.r1Driver, text: p.r1Text, dollarImpact: toNum(p.r1Impact) || 0 },
    { rank: 2, dept: p.r2Dept, subcat: p.r2Subcat, driver: p.r2Driver, text: p.r2Text, dollarImpact: toNum(p.r2Impact) || 0 },
    { rank: 3, dept: p.r3Dept, subcat: p.r3Subcat, driver: p.r3Driver, text: p.r3Text, dollarImpact: toNum(p.r3Impact) || 0 }
  ];
  const priorities = [
    { rank: 1, text: p.p1, horizon: p.p1H },
    { rank: 2, text: p.p2, horizon: p.p2H },
    { rank: 3, text: p.p3, horizon: p.p3H }
  ];
  try {
    const ai = await analyzePerformance({
      isoWeek,
      region: p.region,
      hitTarget: p.hitTarget === 'hit',
      variancePct: toNum(p.variancePct),
      varianceDollars: toNum(p.varianceDollars),
      reasons,
      priorities
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
