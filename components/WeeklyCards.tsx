import { getDb } from '@/lib/db';
import { weekKey } from '@/lib/gpt5';
import sql from 'mssql';

export default async function WeeklyCards() {
  try {
    const wk = weekKey(new Date());
    const pool = await getDb();
    
    const [summaryResult, rowsResult] = await Promise.all([
      pool.request()
        .input('week', sql.NVarChar(10), wk)
        .query('SELECT TOP 3 * FROM dbo.weekly_summary WHERE iso_week = @week ORDER BY created_at DESC'),
      pool.request()
        .input('week', sql.NVarChar(10), wk)
        .query(`
          SELECT DISTINCT sf.region_code, 
                 COUNT(*) as feedback_count,
                 SUM(ISNULL(sf.miss1_dollars,0) + ISNULL(sf.miss2_dollars,0) + ISNULL(sf.miss3_dollars,0)) as total_impact,
                 AVG(CASE WHEN sf.overall_mood='pos' THEN 1.0 WHEN sf.overall_mood='neg' THEN 0.0 ELSE 0.5 END) as mood_index
          FROM dbo.store_feedback sf 
          WHERE sf.iso_week = @week 
          GROUP BY sf.region_code
          ORDER BY sf.region_code
        `)
    ]);

    const summary = summaryResult.recordset || [];
    const rows = rowsResult.recordset || [];
    const regions = rows.map((r: any) => r.region_code).filter(Boolean);

    return (
      <section className='grid md:grid-cols-3 gap-4'>
        {regions.length > 0 ? regions.map(r => {
          const s = summary.find((x: any) => x.region === r);
          const regionData = rows.find((x: any) => x.region_code === r);
          return (
            <div key={r as string} className='card p-5 rounded-xl space-y-2'>
              <div className='text-xs text-slate-500'>{wk} • {r as string}</div>
              <div className='font-medium whitespace-pre-wrap'>
                {s?.summary || `Region ${r} Performance: ${regionData?.feedback_count || 0} feedback entries, $${(regionData?.total_impact || 0).toLocaleString()} impact`}
              </div>
              <div className='text-sm text-slate-600'>
                <div>Themes: {(s?.top_themes || []).join(', ') || '—'}</div>
                <div className='mt-1 text-xs'>
                  📊 {regionData?.feedback_count || 0} entries • 
                  💰 ${(regionData?.total_impact || 0).toLocaleString()} impact • 
                  😊 {(regionData?.mood_index || 0).toFixed(1)} mood
                </div>
              </div>
            </div>
          );
        }) : (
          <div className='card p-5 rounded-xl space-y-2 col-span-3'>
            <div className='text-xs text-slate-500'>{wk}</div>
            <div className='font-medium'>No regional data available for this week.</div>
            <div className='text-sm text-slate-600'>Submit feedback to see regional summaries.</div>
          </div>
        )}
      </section>
    );
  } catch (error) {
    console.error('WeeklyCards error:', error);
    return (
      <section className='grid md:grid-cols-3 gap-4'>
        <div className='card p-5 rounded-xl space-y-2 col-span-3'>
          <div className='text-xs text-slate-500'>Error</div>
          <div className='font-medium'>Unable to load weekly data.</div>
          <div className='text-sm text-slate-600'>Please check system status.</div>
        </div>
      </section>
    );
  }
}