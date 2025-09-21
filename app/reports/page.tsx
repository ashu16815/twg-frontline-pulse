import { sbAdmin } from '@/lib/supabase-admin';
import { weekKey } from '@/lib/gpt5';
import ReportsDashboard from '@/components/ReportsDashboard';
import AIReportGenerator from '@/components/AIReportGenerator';

export default async function Reports() {
  const wk = weekKey(new Date());
  const [{ data: rows }, { data: summ }] = await Promise.all([
    sbAdmin.from('store_feedback').select('*').eq('iso_week', wk),
    sbAdmin.from('weekly_summary').select('*').eq('iso_week', wk)
  ]);

  return (
    <main className='max-w-7xl mx-auto p-8 space-y-8'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-semibold'>Executive Reports</h1>
          <p className='text-slate-600 mt-2'>
            Week {wk} • Comprehensive analysis of frontline feedback and performance metrics
          </p>
        </div>
        <AIReportGenerator />
      </div>
      
      <ReportsDashboard rows={rows || []} summaries={summ || []} currentWeek={wk} />
    </main>
  );
}
