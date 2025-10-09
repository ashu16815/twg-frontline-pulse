import { getDb } from '@/lib/db';
import { weekKey } from '@/lib/gpt5';
import sql from 'mssql';
import GenerateReportButton from '@/components/GenerateReportButton';

export const dynamic = 'force-dynamic';

export default async function Reports() {
  const wk = weekKey(new Date());
  
  const pool = await getDb();
  
  const [feedbackResult, summaryResult, reportResult] = await Promise.all([
    pool.request()
      .input('week', sql.NVarChar(10), wk)
      .query('SELECT * FROM dbo.store_feedback WHERE iso_week = @week'),
    pool.request()
      .input('week', sql.NVarChar(10), wk)
      .query('SELECT * FROM dbo.weekly_summary WHERE iso_week = @week'),
    pool.request()
      .input('week', sql.NVarChar(10), wk)
      .query('SELECT TOP 1 * FROM dbo.executive_report WHERE iso_week = @week ORDER BY created_at DESC')
  ]);
  
  const rows = feedbackResult.recordset || [];
  const summ = summaryResult.recordset || [];
  const execReport = reportResult.recordset?.[0];
  
  // Calculate total dollar impact from negative feedback
  const totalImpact = rows.reduce((acc: number, r: any) => {
    const impact1 = r.top_negative_1_impact || r.miss1_dollars || 0;
    const impact2 = r.top_negative_2_impact || r.miss2_dollars || 0;
    const impact3 = r.top_negative_3_impact || r.miss3_dollars || 0;
    return acc + impact1 + impact2 + impact3;
  }, 0);

  return (
    <main className='max-w-6xl mx-auto p-8 space-y-6'>
      <h1 className='text-2xl font-semibold'>Weekly Report — {wk}</h1>
      
      <div className='grid md:grid-cols-3 gap-4'>
        <Card title='Total reported impact' value={`$${Math.abs(totalImpact).toLocaleString()}`} />
        <Card title='Stores submitted' value={rows.length} />
        <Card title='Regions summarised' value={Array.from(new Set(summ.map((s: any) => s.region))).length} />
      </div>
      
      <div className='flex items-center gap-4'>
        <GenerateReportButton />
        {execReport && (
          <span className='text-sm text-green-400'>
            ✓ Report generated {new Date(execReport.created_at).toLocaleString()}
          </span>
        )}
      </div>
      
      {execReport ? (
        <ExecReportSection report={execReport} />
      ) : (
        <div className='card p-8 rounded-xl text-center'>
          <div className='text-6xl mb-4'>📊</div>
          <h3 className='text-xl font-semibold mb-2'>No Executive Report Yet</h3>
          <p className='text-slate-400 mb-4'>
            Click "Generate Executive Report" above to create an AI-powered analysis of this week's feedback
          </p>
          <p className='text-sm text-slate-500'>
            The report will include: executive summary, what's working, what's not working, key themes, risks, and recommended actions
          </p>
        </div>
      )}
      
      <FeedbackList rows={rows} />
      <ThemeTable rows={rows} />
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

function ExecReportSection({ report }: { report: any }) {
  const parseJSON = (str: string) => {
    try {
      return JSON.parse(str);
    } catch {
      return [];
    }
  };
  
  const highlights = parseJSON(report.highlights || '[]');
  const whatWorking = parseJSON(report.whatWorking || '[]');
  const whatNotWorking = parseJSON(report.whatNotWorking || '[]');
  const themes = parseJSON(report.themes || '[]');
  const risks = parseJSON(report.risks || '[]');
  const actions = parseJSON(report.actions || '[]');
  const metrics = parseJSON(report.metrics || '{}');
  
  return (
    <section className='space-y-6'>
      {/* Header with Metrics */}
      <div className='card p-6 rounded-xl'>
        <div className='flex items-center justify-between mb-4'>
          <h2 className='text-2xl font-bold'>📊 Executive Report</h2>
          <span className='text-sm text-slate-400'>AI-Generated Insights</span>
        </div>
        
        {/* Key Metrics */}
        {metrics.totalStores && (
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-white/5 rounded-lg'>
            <div>
              <div className='text-xs text-slate-500'>Stores Reporting</div>
              <div className='text-2xl font-bold'>{metrics.totalStores}</div>
            </div>
            <div>
              <div className='text-xs text-slate-500'>Positive Impact</div>
              <div className='text-2xl font-bold text-green-400'>
                ${(metrics.positiveImpact || 0).toLocaleString()}
              </div>
            </div>
            <div>
              <div className='text-xs text-slate-500'>Issues Impact</div>
              <div className='text-2xl font-bold text-red-400'>
                -${Math.abs(metrics.negativeImpact || 0).toLocaleString()}
              </div>
            </div>
            <div>
              <div className='text-xs text-slate-500'>Net Impact</div>
              <div className={`text-2xl font-bold ${(metrics.netImpact || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {(metrics.netImpact || 0) >= 0 ? '+' : ''}${(metrics.netImpact || 0).toLocaleString()}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Executive Summary */}
      <div className='card p-6 rounded-xl'>
        <h3 className='text-lg font-semibold mb-3 flex items-center gap-2'>
          <span className='text-2xl'>📝</span> Executive Summary
        </h3>
        <div className='text-slate-200 leading-relaxed whitespace-pre-line'>
          {report.narrative}
        </div>
      </div>
      
      {/* What's Working vs What's Not - Side by Side */}
      <div className='grid md:grid-cols-2 gap-6'>
        {/* What's Working */}
        <div className='card p-6 rounded-xl border-l-4 border-green-500'>
          <h3 className='text-lg font-semibold mb-4 flex items-center gap-2 text-green-400'>
            <span className='text-2xl'>✅</span> What's Working
          </h3>
          <ul className='space-y-3'>
            {whatWorking.map((item: string, i: number) => (
              <li key={i} className='flex gap-3'>
                <span className='text-green-400 mt-1'>•</span>
                <span className='text-slate-200 flex-1'>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        
        {/* What's Not Working */}
        <div className='card p-6 rounded-xl border-l-4 border-red-500'>
          <h3 className='text-lg font-semibold mb-4 flex items-center gap-2 text-red-400'>
            <span className='text-2xl'>⚠️</span> What's Not Working
          </h3>
          <ul className='space-y-3'>
            {whatNotWorking.map((item: string, i: number) => (
              <li key={i} className='flex gap-3'>
                <span className='text-red-400 mt-1'>•</span>
                <span className='text-slate-200 flex-1'>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      {/* Key Themes */}
      {themes.length > 0 && (
        <div className='card p-6 rounded-xl'>
          <h3 className='text-lg font-semibold mb-4 flex items-center gap-2'>
            <span className='text-2xl'>🎯</span> Key Themes Across Stores
          </h3>
          <div className='grid gap-3'>
            {themes.map((t: any, i: number) => (
              <div key={i} className='bg-white/5 rounded-lg p-4 flex items-center justify-between'>
                <div className='flex-1'>
                  <div className='font-medium'>{t.name}</div>
                  <div className='text-sm text-slate-400 mt-1'>
                    {t.count} store{t.count !== 1 ? 's' : ''} reporting
                  </div>
                </div>
                <div className='text-right'>
                  <div className={`text-xl font-bold ${t.type === 'positive' ? 'text-green-400' : 'text-red-400'}`}>
                    {t.type === 'positive' ? '+' : '-'}${Math.abs(t.impact || 0).toLocaleString()}
                  </div>
                  <div className='text-xs text-slate-500'>{t.type}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Risks */}
      {risks.length > 0 && (
        <div className='card p-6 rounded-xl border-l-4 border-orange-500'>
          <h3 className='text-lg font-semibold mb-4 flex items-center gap-2 text-orange-400'>
            <span className='text-2xl'>⚡</span> Risks & Concerns
          </h3>
          <ul className='space-y-3'>
            {risks.map((r: string, i: number) => (
              <li key={i} className='flex gap-3'>
                <span className='text-orange-400 mt-1'>▸</span>
                <span className='text-slate-200 flex-1'>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Action Items */}
      {actions.length > 0 && (
        <div className='card p-6 rounded-xl border-l-4 border-blue-500'>
          <h3 className='text-lg font-semibold mb-4 flex items-center gap-2 text-blue-400'>
            <span className='text-2xl'>🎯</span> Recommended Actions for Ops Team
          </h3>
          <div className='space-y-3'>
            {actions.map((a: any, i: number) => (
              <div key={i} className='bg-white/5 rounded-lg p-4'>
                <div className='flex items-start justify-between gap-4 mb-2'>
                  <div className='flex-1'>
                    <div className='font-medium text-slate-100'>{a.action}</div>
                  </div>
                  <div className='flex gap-2'>
                    {a.priority && (
                      <span className={`text-xs px-2 py-1 rounded ${
                        a.priority === 'High' ? 'bg-red-500/20 text-red-400' :
                        a.priority === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {a.priority}
                      </span>
                    )}
                  </div>
                </div>
                <div className='flex gap-4 text-sm text-slate-400'>
                  <span>👤 {a.owner}</span>
                  <span>📅 {a.due}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Highlights */}
      {highlights.length > 0 && (
        <div className='card p-6 rounded-xl bg-gradient-to-br from-green-500/10 to-blue-500/10'>
          <h3 className='text-lg font-semibold mb-4 flex items-center gap-2'>
            <span className='text-2xl'>⭐</span> Key Highlights
          </h3>
          <ul className='space-y-2'>
            {highlights.map((h: string, i: number) => (
              <li key={i} className='flex gap-3'>
                <span className='text-blue-400 mt-1'>✓</span>
                <span className='text-slate-200'>{h}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function FeedbackList({ rows }: { rows: any[] }) {
  if (rows.length === 0) {
    return (
      <section className='card p-6 rounded-xl'>
        <h2 className='text-lg font-semibold mb-4'>Store Feedback</h2>
        <p className='text-slate-400'>No feedback submitted for this week yet.</p>
      </section>
    );
  }
  
  return (
    <section className='card p-6 rounded-xl'>
      <h2 className='text-lg font-semibold mb-4'>Store Feedback ({rows.length})</h2>
      <div className='space-y-3'>
        {rows.map((row: any) => (
          <div key={row.id} className='bg-white/5 rounded-lg p-4 space-y-2'>
            <div className='flex justify-between items-start'>
              <div>
                <span className='font-medium'>{row.store_name}</span>
                <span className='text-sm text-slate-400 ml-2'>({row.region})</span>
              </div>
              <span className='text-xs text-slate-500'>
                {new Date(row.created_at).toLocaleDateString()}
              </span>
            </div>
            
            {/* Positive feedback items */}
            {row.top_positive && (
              <div className='text-sm'>
                <span className='text-green-400'>✓ Success:</span> {row.top_positive}
                {row.top_positive_impact && (
                  <span className='text-slate-400 ml-2'>
                    (+${Math.abs(row.top_positive_impact).toLocaleString()})
                  </span>
                )}
              </div>
            )}
            {row.top_positive_2 && (
              <div className='text-sm'>
                <span className='text-green-400'>✓ Success:</span> {row.top_positive_2}
                {row.top_positive_2_impact && (
                  <span className='text-slate-400 ml-2'>
                    (+${Math.abs(row.top_positive_2_impact).toLocaleString()})
                  </span>
                )}
              </div>
            )}
            {row.top_positive_3 && (
              <div className='text-sm'>
                <span className='text-green-400'>✓ Success:</span> {row.top_positive_3}
                {row.top_positive_3_impact && (
                  <span className='text-slate-400 ml-2'>
                    (+${Math.abs(row.top_positive_3_impact).toLocaleString()})
                  </span>
                )}
              </div>
            )}
            
            {/* Negative feedback items */}
            {(row.top_negative_1 || row.miss1) && (
              <div className='text-sm'>
                <span className='text-red-400'>✗ Issue:</span> {row.top_negative_1 || row.miss1}
                {(row.top_negative_1_impact || row.miss1_dollars) && (
                  <span className='text-slate-400 ml-2'>
                    (-${Math.abs(row.top_negative_1_impact || row.miss1_dollars).toLocaleString()})
                  </span>
                )}
              </div>
            )}
            {row.top_negative_2 && (
              <div className='text-sm'>
                <span className='text-red-400'>✗ Issue:</span> {row.top_negative_2}
                {row.top_negative_2_impact && (
                  <span className='text-slate-400 ml-2'>
                    (-${Math.abs(row.top_negative_2_impact).toLocaleString()})
                  </span>
                )}
              </div>
            )}
            {row.top_negative_3 && (
              <div className='text-sm'>
                <span className='text-red-400'>✗ Issue:</span> {row.top_negative_3}
                {row.top_negative_3_impact && (
                  <span className='text-slate-400 ml-2'>
                    (-${Math.abs(row.top_negative_3_impact).toLocaleString()})
                  </span>
                )}
              </div>
            )}
            
            {row.overall_mood && (
              <div className='text-xs text-slate-500'>
                Mood: {row.overall_mood}
                {row.themes && ` • Themes: ${row.themes}`}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function ThemeTable({ rows }: { rows: any[] }) {
  // Extract themes from feedback
  const themeMap = new Map<string, { count: number; impact: number }>();
  
  rows.forEach(r => {
    if (r.themes) {
      const themes = r.themes.split(',').map((t: string) => t.trim());
      themes.forEach((theme: string) => {
        if (!themeMap.has(theme)) {
          themeMap.set(theme, { count: 0, impact: 0 });
        }
        const entry = themeMap.get(theme)!;
        entry.count += 1;
        
        const impact1 = r.top_negative_1_impact || r.miss1_dollars || 0;
        const impact2 = r.top_negative_2_impact || r.miss2_dollars || 0;
        const impact3 = r.top_negative_3_impact || r.miss3_dollars || 0;
        entry.impact += Math.abs(impact1 + impact2 + impact3);
      });
    }
  });
  
  const themeArray = Array.from(themeMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.impact - a.impact);
  
  if (themeArray.length === 0) {
    return null;
  }

  return (
    <section className='card p-5 rounded-xl'>
      <h2 className='text-lg font-semibold mb-4'>Themes & $ Impact</h2>
      <div className='overflow-x-auto'>
        <table className='w-full text-sm'>
          <thead>
            <tr className='text-left text-slate-500'>
              <th className='pb-2'>Theme</th>
              <th className='pb-2'>Mentions</th>
              <th className='pb-2 text-right'>Total $ Impact</th>
            </tr>
          </thead>
          <tbody>
            {themeArray.map((theme, i) => (
              <tr key={i} className='border-t border-white/10'>
                <td className='py-2'>{theme.name}</td>
                <td className='py-2'>{theme.count}</td>
                <td className='py-2 text-right'>${theme.impact.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
