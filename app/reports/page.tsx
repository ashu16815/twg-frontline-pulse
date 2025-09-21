import { sbAdmin } from '@/lib/supabase-admin';
import { weekKey } from '@/lib/gpt5';

export default async function Reports() {
  const wk = weekKey(new Date());
  const [{ data: rows }, { data: summ }] = await Promise.all([
    sbAdmin.from('store_feedback').select('*').eq('iso_week', wk),
    sbAdmin.from('weekly_summary').select('*').eq('iso_week', wk)
  ]);

  return (
    <main className='max-w-5xl mx-auto p-8 space-y-6'>
      <h1 className='text-2xl font-semibold'>Weekly Report</h1>
      <p className='text-slate-600'>
        Week {wk}. Generate an Azure OpenAI executive report grounded on current submissions and summaries.
      </p>
      <form action='/api/reports/generate' method='post'>
        <button className='btn'>Generate report</button>
      </form>
      <ReportPreview rows={rows || []} summ={summ || []} />
    </main>
  );
}

function ReportPreview({ rows, summ }: { rows: any[]; summ: any[] }) {
  return (
    <section className='card p-6 rounded-xl space-y-4'>
      <h2 className='text-lg font-semibold'>Data snapshot</h2>
      <div className='grid md:grid-cols-3 gap-4'>
        {['North', 'Central', 'South'].map(r => {
          const c = rows.filter(x => x.region === r).length;
          return (
            <div key={r} className='border rounded-lg p-4 bg-white'>
              <div className='text-sm text-slate-500'>{r}</div>
              <div className='text-2xl font-semibold'>{c}</div>
              <div className='text-xs text-slate-500'>submissions</div>
            </div>
          );
        })}
      </div>
      <div className='text-sm text-slate-600'>
        Latest summaries: {(summ || []).length || 0}
      </div>
    </section>
  );
}
