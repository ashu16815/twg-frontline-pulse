import { sbAdmin } from '@/lib/supabase-admin';
import { weekKey } from '@/lib/gpt5';

export default async function Page() {
  const wk = weekKey(new Date());
  const { data } = await sbAdmin
    .from('store_feedback')
    .select('*')
    .eq('iso_week', wk)
    .order('created_at', { ascending: false })
    .limit(20);

  return (
    <main className='max-w-5xl mx-auto p-8 space-y-6'>
      <h1 className='text-2xl font-semibold'>My Performance — Week {wk}</h1>
      <p className='text-slate-600'>Your submissions and reasons with $ impact.</p>
      <div className='grid gap-4'>
        {(data || []).map((r: any) => (
          <div key={r.id} className='card p-5 rounded-xl'>
            <div className='text-sm text-slate-500'>{r.store_id} — {r.store_name} • {r.region}</div>
            <div className='mt-1'>
              <b>{r.hit_target ? 'Met/Beat target' : 'Missed target'}</b> {r.target_variance_pct != null ? `(${r.target_variance_pct}%)` : ''} {r.variance_dollars != null ? ` • $${r.variance_dollars}` : ''}
            </div>
            <ul className='mt-3 text-sm list-disc pl-6'>
              <li>{r.r1_dept} › {r.r1_subcat} — {r.r1_driver}: {r.r1_text} ({r.r1_dollar_impact != null ? `$${r.r1_dollar_impact}` : '$0'})</li>
              <li>{r.r2_dept} › {r.r2_subcat} — {r.r2_driver}: {r.r2_text} ({r.r2_dollar_impact != null ? `$${r.r2_dollar_impact}` : '$0'})</li>
              <li>{r.r3_dept} › {r.r3_subcat} — {r.r3_driver}: {r.r3_text} ({r.r3_dollar_impact != null ? `$${r.r3_dollar_impact}` : '$0'})</li>
            </ul>
            <div className='mt-3 text-sm'>
              <b>Priorities:</b> {r.priority1} ({r.priority1_horizon}); {r.priority2} ({r.priority2_horizon}); {r.priority3} ({r.priority3_horizon})
            </div>
            <div className='mt-2 text-xs text-slate-500'>Themes: {(r.themes || []).join(', ') || '—'}</div>
          </div>
        ))}
      </div>
    </main>
  );
}
