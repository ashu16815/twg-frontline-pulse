import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const pool = await getDb();
    await pool.request().query('SELECT TOP 1 store_id FROM dbo.store_master');
    return Response.json({ ok: true });
  } catch (e: any) {
    return Response.json({ ok: false, error: e.message }, { status: 200 });
  }
}
