import Image from 'next/image';
import { GlassCard } from './Glass';
import { getDb } from '@/lib/db';
import { weekKey } from '@/lib/gpt5';
import sql from 'mssql';

export default async function WeeklyInsightCard() {
  const wk = weekKey(new Date());
  
  try {
    const pool = await getDb();
    
    // Get this week's data
    const [feedbackResult, reportResult] = await Promise.all([
      pool.request()
        .input('week', sql.NVarChar(10), wk)
        .query('SELECT TOP 10 * FROM dbo.store_feedback WHERE iso_week = @week ORDER BY created_at DESC'),
      pool.request()
        .input('week', sql.NVarChar(10), wk)
        .query('SELECT TOP 1 * FROM dbo.executive_report WHERE iso_week = @week ORDER BY created_at DESC')
    ]);
    
    const rows = feedbackResult.recordset || [];
    const report = reportResult.recordset?.[0];
    
    // Extract themes from feedback
    const themeSet = new Set<string>();
    rows.forEach((row: any) => {
      if (row.themes) {
        row.themes.split(',').forEach((theme: string) => {
          themeSet.add(theme.trim());
        });
      }
    });
    
    const topThemes = Array.from(themeSet).slice(0, 3);
    
    // Get region with most activity
    const regionCounts = new Map<string, number>();
    rows.forEach((row: any) => {
      const region = row.region || 'Unknown';
      regionCounts.set(region, (regionCounts.get(region) || 0) + 1);
    });
    
    const topRegion = Array.from(regionCounts.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'All Regions';
    
    // Get top actions from executive report
    let topActions: string[] = [];
    if (report && report.actions) {
      try {
        const actions = JSON.parse(report.actions);
        topActions = Array.isArray(actions) 
          ? actions.slice(0, 3).map((a: any) => a.action || a) 
          : [];
      } catch (e) {
        // Fallback
      }
    }
    
    // Fallback if no data
    if (rows.length === 0) {
      return (
        <GlassCard className="p-0 overflow-hidden">
          <Image 
            src="https://images.unsplash.com/photo-1557821552-17105176677c?q=80&w=1600&auto=format&fit=crop" 
            alt="store" 
            width={1600} 
            height={1066} 
            className="w-full h-64 object-cover"
          />
          <div className="p-6">
            <div className="text-sm opacity-70">This week • {wk}</div>
            <div className="mt-2 text-lg">No feedback yet this week</div>
            <div className="opacity-80 mt-2 text-sm">
              Be the first to submit feedback and help drive change!
            </div>
          </div>
        </GlassCard>
      );
    }
    
    return (
      <GlassCard className="p-0 overflow-hidden">
        <Image 
          src="https://images.unsplash.com/photo-1557821552-17105176677c?q=80&w=1600&auto=format&fit=crop" 
          alt="store" 
          width={1600} 
          height={1066} 
          className="w-full h-64 object-cover"
        />
        <div className="p-6">
          <div className="text-sm opacity-70">
            This week • {topRegion}
          </div>
          
          {topThemes.length > 0 && (
            <div className="mt-2 text-lg">
              Top themes: {topThemes.join(', ')}
            </div>
          )}
          
          {topActions.length > 0 && (
            <div className="opacity-80 mt-2 text-sm">
              Actions: {topActions.join(' • ')}
            </div>
          )}
          
          <div className="mt-3 text-xs opacity-60">
            Based on {rows.length} store{rows.length !== 1 ? 's' : ''} reporting
          </div>
        </div>
      </GlassCard>
    );
    
  } catch (error) {
    console.error('Error loading weekly insight:', error);
    
    // Fallback card on error
    return (
      <GlassCard className="p-0 overflow-hidden">
        <Image 
          src="https://images.unsplash.com/photo-1557821552-17105176677c?q=80&w=1600&auto=format&fit=crop" 
          alt="store" 
          width={1600} 
          height={1066} 
          className="w-full h-64 object-cover"
        />
        <div className="p-6">
          <div className="text-sm opacity-70">This week • {wk}</div>
          <div className="mt-2 text-lg">Loading insights...</div>
          <div className="opacity-80 mt-2 text-sm">
            Real-time data from your stores
          </div>
        </div>
      </GlassCard>
    );
  }
}

