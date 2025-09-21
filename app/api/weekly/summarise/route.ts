import { NextResponse } from 'next/server';
import { sbAdmin } from '@/lib/supabase-admin';
import { summariseWeekly, weekKey } from '@/lib/gpt5';

export async function POST() {
  const isoWeek = weekKey(new Date());
  const { data: rows } = await sbAdmin.from('store_feedback').select('*').eq('iso_week', isoWeek);
  const regions = Array.from(new Set((rows || []).map((r: any) => r.region)));
  let created = 0;

  for (const region of regions) {
    const regionRows = (rows || []).filter((r: any) => r.region === region);
    const ai = await summariseWeekly(region as string, isoWeek, regionRows);
    const ins = await sbAdmin.from('weekly_summary').insert({
      iso_week: isoWeek,
      region: region as string,
      summary: ai.summary,
      top_themes: ai.topThemes
    });
    if (!ins.error) created++;
  }

  return NextResponse.json({ ok: true, created });
}