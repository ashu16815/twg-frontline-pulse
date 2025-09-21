import { NextResponse } from 'next/server';
import { sbAdmin } from '@/lib/supabase-admin';
import { weekKey, askCEO } from '@/lib/gpt5';
import demoData from '@/scripts/demo-data';

export async function POST(req: Request) {
  try {
    const { question } = await req.json();
    const isoWeek = weekKey(new Date());
    
    let rows, summ;
    try {
      const [{ data: rowsData }, { data: summData }] = await Promise.all([
        sbAdmin.from('store_feedback').select('*').eq('iso_week', isoWeek),
        sbAdmin.from('weekly_summary').select('*').eq('iso_week', isoWeek)
      ]);
      
      // Check if we have data, if not use demo data
      if (!rowsData || rowsData.length === 0 || !summData || summData.length === 0) {
        console.log('No database data found, using demo data for CEO Q&A');
        rows = demoData.feedback;
        summ = demoData.summaries;
      } else {
        rows = rowsData;
        summ = summData;
      }
    } catch (error) {
      console.log('Database not available, using demo data for CEO Q&A');
      rows = demoData.feedback;
      summ = demoData.summaries;
    }

    const answer = await askCEO(question, isoWeek, rows || [], summ || []);
    return NextResponse.json({ answer });
  } catch (error) {
    console.error('CEO ask API error:', error);
    return NextResponse.json({ 
      error: 'AI service not available. Please check your Azure OpenAI configuration.' 
    }, { status: 500 });
  }
}
