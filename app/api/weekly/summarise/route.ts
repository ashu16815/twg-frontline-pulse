import { NextResponse } from 'next/server';
import { sbAdmin } from '@/lib/supabase-admin';
import { summariseWeekly, weekKey } from '@/lib/gpt5';

export async function POST() {
  const isoWeek = weekKey(new Date());
  const { data: rows } = await sbAdmin.from('store_feedback').select('*').eq('iso_week', isoWeek);
  const regions = Array.from(new Set((rows || []).map((r: any) => r.region)));

  const out = [] as any[];

  for (const region of regions) {
    const regionRows = (rows || []).filter((r: any) => r.region === region);
    const ai = await summariseWeekly(region, isoWeek, regionRows);
    
    const { data, error } = await sbAdmin.from('weekly_summary').insert({
      iso_week: isoWeek,
      region,
      summary: ai.summary,
      top_themes: ai.topThemes
    }).select();

    if (!error && data) {
      out.push(data[0]);
    }
  }

  return NextResponse.json({ ok: true, created: out.length });
}
