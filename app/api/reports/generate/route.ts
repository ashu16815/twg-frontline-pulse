import { NextResponse } from 'next/server';
import { sbAdmin } from '@/lib/supabase-admin';
import { weekKey, generateExecutiveReport } from '@/lib/gpt5';

export async function POST() {
  const wk = weekKey(new Date());
  const [{ data: rows }, { data: summ }] = await Promise.all([
    sbAdmin.from('store_feedback').select('*').eq('iso_week', wk),
    sbAdmin.from('weekly_summary').select('*').eq('iso_week', wk)
  ]);

  try {
    const rep = await generateExecutiveReport(wk, rows || [], summ || []);
    return NextResponse.json({ ok: true, report: rep });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
