import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db-simple';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const pool = await getDb();
    const hdrKey = (req.headers.get('x-idempotency-key') || '').trim();
    const idempotency_key = hdrKey || crypto.createHash('sha256').update(JSON.stringify({
      store_id: body.store_id,
      iso_week: body.iso_week,
      submitted_by: body.submitted_by,
      items: body.items || []
    })).digest('hex').slice(0, 64);

    const q = `INSERT INTO dbo.store_feedback(
      store_id, region_code, iso_week, month_key, top_positive,
      miss1, miss1_dollars, miss2, miss2_dollars, miss3, miss3_dollars,
      overall_mood, freeform_comments, submitted_by, idempotency_key,
      store_name, region, store_code, banner, manager_email
    ) VALUES(@store_id,@region_code,@iso_week,@month_key,@top_positive,
      @miss1,@miss1_dollars,@miss2,@miss2_dollars,@miss3,@miss3_dollars,
      @overall_mood,@freeform_comments,@submitted_by,@idempotency_key,
      @store_name,@region,@store_code,@banner,@manager_email);`;

    await pool.request()
      .input('store_id', body.store_id)
      .input('region_code', body.region_code)
      .input('iso_week', body.iso_week)
      .input('month_key', body.month_key)
      .input('top_positive', body.top_positive || null)
      .input('miss1', body.miss1 || null)
      .input('miss1_dollars', body.miss1_dollars || 0)
      .input('miss2', body.miss2 || null)
      .input('miss2_dollars', body.miss2_dollars || 0)
      .input('miss3', body.miss3 || null)
      .input('miss3_dollars', body.miss3_dollars || 0)
      .input('overall_mood', body.overall_mood || null)
      .input('freeform_comments', body.freeform_comments || null)
      .input('submitted_by', body.submitted_by || null)
      .input('idempotency_key', idempotency_key)
      .input('store_name', body.store_name || null)
      .input('region', body.region || null)
      .input('store_code', body.store_code || null)
      .input('banner', body.banner || null)
      .input('manager_email', body.manager_email || null)
      .query(q);

    return NextResponse.json({ ok: true, idempotency_key });
  } catch (e: any) {
    const msg = String(e.message || '');
    if (/duplicate|unique|conflict/i.test(msg)) {
      return NextResponse.json({ ok: true, duplicate: true });
    }
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}