import { sbAdmin } from '@/lib/supabase-admin';
import { weekKey } from '@/lib/gpt5';

export default async function Reports() {
  const wk = weekKey(new Date());
  const [{ data: rows }, { data: summ }] = await Promise.all([
    sbAdmin.from('store_feedback').select('*').eq('iso_week', wk),
    sbAdmin.from('weekly_summary').select('*').eq('iso_week', wk)
  ]);

  return (
    <main className='max-w-6xl mx-auto p-8 space-y-6'>
      <h1 className='text-2xl font-semibold'>Weekly Report — {wk}</h1>
      <div className='grid md:grid-cols-3 gap-4'>
        <Card title='Total reported impact' value={`$${(rows || []).reduce((a: number, r: any) => a + (r.r1_dollar_impact || 0) + (r.r2_dollar_impact || 0) + (r.r3_dollar_impact || 0), 0).toLocaleString()}`} />
        <Card title='Stores submitted' value={(rows || []).length} />
        <Card title='Regions summarised' value={Array.from(new Set((summ || []).map((s: any) => s.region))).length} />
      </div>
      <form action='/api/reports/generate' method='post'>
        <button className='btn'>Generate Exec Report (Azure OpenAI)</button>
      </form>
      <ThemeTable rows={rows || []} />
    </main>
  );
}

function Card({ title, value }: { title: string; value: any }) {
  return (
    <div className='card p-5 rounded-xl'>
      <div className='text-sm text-slate-500'>{title}</div>
      <div className='text-2xl font-semibold mt-1'>{value}</div>
    </div>
  );
}

function ThemeTable({ rows }: { rows: any[] }) {
  const flatten = [
    { d: 'Availability', sum: 0, c: 0 },
    { d: 'Late Delivery', sum: 0, c: 0 },
    { d: 'Roster/Sickness', sum: 0, c: 0 },
    { d: 'Space/Planogram', sum: 0, c: 0 },
    { d: 'Fitting Rooms', sum: 0, c: 0 },
    { d: 'Promo On-Shelf', sum: 0, c: 0 },
    { d: 'Replen Backlog', sum: 0, c: 0 },
    { d: 'POS Stability', sum: 0, c: 0 },
    { d: 'Bulky Stock', sum: 0, c: 0 }
  ];
  
  rows.forEach(r => {
    [['r1_driver', 'r1_dollar_impact'], ['r2_driver', 'r2_dollar_impact'], ['r3_driver', 'r3_dollar_impact']].forEach(([k, v]) => {
      const idx = flatten.findIndex(x => x.d === r[k]);
      if (idx >= 0) {
        flatten[idx].sum += (r[v] || 0);
        flatten[idx].c += 1;
      }
    });
  });

  return (
    <section className='card p-5 rounded-xl'>
      <h2 className='text-lg font-semibold mb-2'>Themes & $ impact</h2>
      <div className='overflow-x-auto'>
        <table className='w-full text-sm'>
          <thead>
            <tr className='text-left text-slate-500'>
              <th>Driver</th>
              <th>Mentions</th>
              <th>Total $ Impact</th>
            </tr>
          </thead>
          <tbody>
            {flatten.map(x => (
              <tr key={x.d} className='border-t'>
                <td>{x.d}</td>
                <td>{x.c}</td>
                <td>${x.sum.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
