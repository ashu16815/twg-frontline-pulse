import { sbAdmin } from '@/lib/supabase-admin';

export async function GET() {
  try {
    const { error } = await sbAdmin.from('store_feedback').select('id').limit(1);
    if (error) return Response.json({ ok: false, error: error.message }, { status: 200 });
    return Response.json({ ok: true });
  } catch (e: any) {
    return Response.json({ ok: false, error: e.message }, { status: 200 });
  }
}
