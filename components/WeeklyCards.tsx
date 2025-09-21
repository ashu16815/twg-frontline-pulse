import { sbAdmin } from '@/lib/supabase-admin';

export default async function WeeklyCards() {
  const thisWeek = await import('@/lib/gpt5').then(m => m.weekKey(new Date()));
  
  const [{ data: summary }, { data: rows }] = await Promise.all([
    sbAdmin.from('weekly_summary').select('*').eq('iso_week', thisWeek).order('created_at', { ascending: false }),
    sbAdmin.from('store_feedback').select('*').eq('iso_week', thisWeek)
  ]);

  const regions = Array.from(new Set((rows || []).map((r: any) => r.region)));

  return (
    <section className="grid md:grid-cols-3 gap-4">
      {regions.map(r => {
        const s = (summary || []).find((x: any) => x.region === r);
        return (
          <div key={r} className="card p-5 rounded-xl space-y-2">
            <div className="text-xs text-slate-500">{thisWeek} • {r}</div>
            <div className="font-medium">{s?.summary || 'No summary yet.'}</div>
            <div className="text-sm text-slate-600">
              Themes: {(s?.top_themes || []).join(', ') || '—'}
            </div>
          </div>
        );
      })}
    </section>
  );
}
