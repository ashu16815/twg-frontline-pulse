import { NextResponse } from 'next/server';
import { sbAdmin } from '@/lib/supabase-admin';
import { weekKey, askCEO } from '@/lib/gpt5';

export async function POST(req: Request) {
  try {
    const { question } = await req.json();
    const isoWeek = weekKey(new Date());
    
    const [{ data: rows }, { data: summ }] = await Promise.all([
      sbAdmin.from('store_feedback').select('*').eq('iso_week', isoWeek),
      sbAdmin.from('weekly_summary').select('*').eq('iso_week', isoWeek)
    ]);

    const answer = await askCEO(question, isoWeek, rows || [], summ || []);
    return NextResponse.json({ answer });
  } catch (error) {
    console.error('CEO ask API error:', error);
    return NextResponse.json({ 
      error: 'Database not initialized. Please set up the Supabase service role key to enable AI-powered Q&A.' 
    }, { status: 500 });
  }
}
