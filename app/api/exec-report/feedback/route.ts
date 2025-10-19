import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const s = await getSession();
    const b = await req.json();
    const pool = await getDb();
    
    await pool.request()
      .input('user_id', s?.user_id || null)
      .input('scope', b.scope)
      .input('scope_key', b.scope_key)
      .input('region', b.region || null)
      .input('store_id', b.storeId || null)
      .input('section', b.section)
      .input('rating', b.rating || null)
      .input('comment', b.comment || null)
      .query`insert into dbo.exec_report_feedback(user_id,report_scope,scope_key,region_code,store_id,section,rating,comment) values(@user_id,@scope,@scope_key,@region,@store_id,@section,@rating,@comment)`;
    
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('❌ Feedback submission error:', e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
