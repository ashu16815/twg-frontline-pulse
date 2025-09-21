import { NextResponse } from "next/server";
import { sbAdmin } from "@/lib/supabase-admin";
import { summariseWeeklyChat } from "@/lib/ai-chat";
import { weekKey } from "@/lib/gpt5";

export async function POST() {
  try {
    const isoWeek = weekKey(new Date());
    const { data: rows } = await sbAdmin.from("store_feedback").select("*").eq("iso_week", isoWeek);
    const regions = Array.from(new Set((rows || []).map((r: any) => r.region)));
    let created = 0;

    for (const region of regions) {
      const regionRows = (rows || []).filter((r: any) => r.region === region);
      
      let ai;
      try {
        ai = await summariseWeeklyChat({ region, isoWeek, rows: regionRows });
      } catch (error) {
        console.log('Azure OpenAI not available, using mock AI summary');
        const { mockSummariseWeekly } = await import('@/lib/mock-ai');
        ai = mockSummariseWeekly(region, isoWeek, regionRows);
      }
      
      const { error } = await sbAdmin.from("weekly_summary").insert({
        iso_week: isoWeek, 
        region, 
        summary: ai.summary, 
        top_themes: ai.topThemes
      });
      if (!error) created++;
    }

    return NextResponse.json({ ok: true, created });
  } catch (error) {
    console.error('Weekly summarise error:', error);
    return NextResponse.json({ error: 'Failed to generate summaries' }, { status: 500 });
  }
}