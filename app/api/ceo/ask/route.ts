import { NextResponse } from 'next/server';
import { sbAdmin } from '@/lib/supabase-admin';
import { weekKey, askCEO } from '@/lib/gpt5';

export async function POST(req: Request) {
  const { question } = await req.json();
  const isoWeek = weekKey(new Date());
  const [{ data: rows }, { data: summ }] = await Promise.all([
    sbAdmin.from('store_feedback').select('*').eq('iso_week', isoWeek),
    sbAdmin.from('weekly_summary').select('*').eq('iso_week', isoWeek)
  ]);

  const ans = await askCEO(question, isoWeek, rows || [], summ || []);
  return NextResponse.json({ answer: ans.answer });
}
