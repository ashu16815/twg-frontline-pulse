'use client';

import { useState } from 'react';

interface ReportsDashboardProps {
  rows: any[];
  summaries: any[];
  currentWeek: string;
}

export default function ReportsDashboard({ rows, summaries, currentWeek }: ReportsDashboardProps) {
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [viewType, setViewType] = useState<'company' | 'regional'>('company');
  
  // Calculate metrics
  const totalSubmissions = rows.length;
  const regions = Array.from(new Set(rows.map(r => r.region))).filter(Boolean);
  const filteredRows = selectedRegion === 'All' ? rows : rows.filter(r => r.region === selectedRegion);
  
  // Enhanced feedback analysis for new Frontline Feedback structure
  const feedbackAnalysis = filteredRows.reduce((acc, row) => {
    // Handle new Frontline Feedback structure
    if (row.top_positive) {
      if (!acc.positive) {
        acc.positive = { count: 0, totalDollarImpact: 0, items: [] };
      }
      acc.positive.count++;
      acc.positive.totalDollarImpact += row.top_positive_impact || 0;
      acc.positive.items.push({
        text: row.top_positive,
        impact: row.top_positive_impact || 0,
        store: row.store_name
      });
    }

    // Handle negative feedback (up to 3 items)
    [row.top_negative_1, row.top_negative_2, row.top_negative_3].forEach((negative, index) => {
      if (negative) {
        if (!acc.negative) {
          acc.negative = { count: 0, totalDollarImpact: 0, items: [] };
        }
        acc.negative.count++;
        const impactField = `top_negative_${index + 1}_impact`;
        const impact = row[impactField] || 0;
        acc.negative.totalDollarImpact += impact;
        acc.negative.items.push({
          text: negative,
          impact: impact,
          store: row.store_name
        });
      }
    });

    // Legacy feedback structure (for backward compatibility)
    for (let i = 1; i <= 3; i++) {
      const type = row[`feedback${i}Type`];
      const category = row[`feedback${i}Category`];
      const impact = row[`feedback${i}Impact`];
      const dollarImpact = row[`feedback${i}DollarImpact`];
      
      if (type && category) {
        if (!acc[type]) {
          acc[type] = { count: 0, categories: {}, impacts: {}, totalDollarImpact: 0 };
        }
        acc[type].count++;
        acc[type].categories[category] = (acc[type].categories[category] || 0) + 1;
        if (impact) {
          acc[type].impacts[impact] = (acc[type].impacts[impact] || 0) + 1;
        }
        if (dollarImpact && !isNaN(parseFloat(dollarImpact))) {
          acc[type].totalDollarImpact += parseFloat(dollarImpact);
        }
      }
    }
    return acc;
  }, {} as Record<string, any>);
  
  // Legacy theme analysis (for backward compatibility)
  const allThemes = filteredRows.flatMap(r => r.themes || []).filter(Boolean);
  const themeCounts = allThemes.reduce((acc: Record<string, number>, theme: string) => {
    acc[theme] = (acc[theme] || 0) + 1;
    return acc;
  }, {});
  const topThemes = Object.entries(themeCounts)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 5);
  
  // Mood analysis
  const moodCounts = filteredRows.reduce((acc: Record<string, number>, row) => {
    const mood = row.overall_mood || 'unknown';
    acc[mood] = (acc[mood] || 0) + 1;
    return acc;
  }, {});
  
  // Category analysis
  const categoryCounts = filteredRows.reduce((acc: Record<string, number>, row) => {
    [row.issue1_cat, row.issue2_cat, row.issue3_cat].forEach(cat => {
      if (cat) acc[cat] = (acc[cat] || 0) + 1;
    });
    return acc;
  }, {});
  
  // Impact analysis
  const impactCounts = filteredRows.reduce((acc: Record<string, number>, row) => {
    [row.issue1_impact, row.issue2_impact, row.issue3_impact].forEach(impact => {
      if (impact) acc[impact] = (acc[impact] || 0) + 1;
    });
    return acc;
  }, {});

  return (
    <div className='space-y-8'>
      {/* View Type Toggle */}
      <section className='card p-6 rounded-xl'>
        <div className='flex items-center justify-between mb-4'>
          <h2 className='text-lg font-semibold'>Report View</h2>
          <div className='flex gap-2'>
            <button
              onClick={() => setViewType('company')}
              className={`btn ${viewType === 'company' ? 'btn-primary' : ''}`}
            >
              Company-Wide
            </button>
            <button
              onClick={() => setViewType('regional')}
              className={`btn ${viewType === 'regional' ? 'btn-primary' : ''}`}
            >
              Regional Focus
            </button>
          </div>
        </div>
        <p className='text-sm opacity-70'>
          {viewType === 'company' 
            ? 'Overview of all feedback across TWG stores' 
            : 'Detailed view of selected region performance'
          }
        </p>
      </section>

      {/* Key Metrics */}
      <section className='grid md:grid-cols-4 gap-6'>
        <MetricCard
          title="Total Submissions"
          value={totalSubmissions}
          subtitle={`Week ${currentWeek}`}
          trend="up"
        />
        <MetricCard
          title="Active Regions"
          value={regions.length}
          subtitle={regions.join(', ')}
          trend="stable"
        />
        <MetricCard
          title="Positive Feedback"
          value={feedbackAnalysis.positive?.count || 0}
          subtitle={`${Math.round(((feedbackAnalysis.positive?.count || 0) / Math.max(1, (feedbackAnalysis.positive?.count || 0) + (feedbackAnalysis.negative?.count || 0))) * 100)}% of total`}
          trend="up"
        />
        <MetricCard
          title="Challenges Identified"
          value={feedbackAnalysis.negative?.count || 0}
          subtitle={`${Math.round(((feedbackAnalysis.negative?.count || 0) / Math.max(1, (feedbackAnalysis.positive?.count || 0) + (feedbackAnalysis.negative?.count || 0))) * 100)}% of total`}
          trend="stable"
        />
        <MetricCard
          title="Total Positive Impact"
          value={`$${(feedbackAnalysis.positive?.totalDollarImpact || 0).toLocaleString()}`}
          subtitle="Estimated value created"
          trend="up"
        />
        <MetricCard
          title="Total Challenge Impact"
          value={`$${(feedbackAnalysis.negative?.totalDollarImpact || 0).toLocaleString()}`}
          subtitle="Estimated value at risk"
          trend="down"
        />
      </section>

      {/* Region Filter */}
      <section className='card p-6 rounded-xl'>
        <h2 className='text-lg font-semibold mb-4'>Filter by Region</h2>
        <div className='flex gap-2 flex-wrap'>
          <button
            onClick={() => setSelectedRegion('All')}
            className={`btn ${selectedRegion === 'All' ? 'btn-primary' : ''}`}
          >
            All Regions ({totalSubmissions})
          </button>
          {regions.map(region => {
            const count = rows.filter(r => r.region === region).length;
            return (
              <button
                key={region}
                onClick={() => setSelectedRegion(region)}
                className={`btn ${selectedRegion === region ? 'btn-primary' : ''}`}
              >
                {region} ({count})
              </button>
            );
          })}
        </div>
      </section>

      {/* Positive vs Negative Balance */}
      <section className='card p-6 rounded-xl'>
        <h2 className='text-lg font-semibold mb-4'>Frontline Feedback Balance</h2>
        <div className='grid md:grid-cols-2 gap-6'>
          <div className='space-y-4'>
            <h3 className='text-md font-medium text-green-400'>✓ Positive Performance</h3>
            <div className='space-y-3'>
              {feedbackAnalysis.positive?.items?.slice(0, 5).map((item: any, index: number) => (
                <div key={index} className='bg-green-50 p-3 rounded-lg border border-green-200'>
                  <div className='flex items-start justify-between mb-1'>
                    <span className='text-sm font-medium text-green-800'>{item.store}</span>
                    {item.impact > 0 && (
                      <span className='text-xs text-green-600 font-medium'>+${item.impact.toLocaleString()}</span>
                    )}
                  </div>
                  <p className='text-sm text-green-700'>{item.text}</p>
                </div>
              ))}
              {(!feedbackAnalysis.positive?.items || feedbackAnalysis.positive.items.length === 0) && (
                <p className='text-sm text-gray-500 italic'>No positive feedback recorded</p>
              )}
            </div>
            {feedbackAnalysis.positive?.totalDollarImpact > 0 && (
              <div className='mt-4 p-3 bg-green-500/10 rounded-lg border border-green-500/20'>
                <span className='text-sm text-green-400 font-medium'>
                  Total Positive Impact: ${feedbackAnalysis.positive.totalDollarImpact.toLocaleString()}
                </span>
              </div>
            )}
          </div>
          
          <div className='space-y-4'>
            <h3 className='text-md font-medium text-red-400'>✗ Performance Challenges</h3>
            <div className='space-y-3'>
              {feedbackAnalysis.negative?.items?.slice(0, 5).map((item: any, index: number) => (
                <div key={index} className='bg-red-50 p-3 rounded-lg border border-red-200'>
                  <div className='flex items-start justify-between mb-1'>
                    <span className='text-sm font-medium text-red-800'>{item.store}</span>
                    {item.impact > 0 && (
                      <span className='text-xs text-red-600 font-medium'>-${item.impact.toLocaleString()}</span>
                    )}
                  </div>
                  <p className='text-sm text-red-700'>{item.text}</p>
                </div>
              ))}
              {(!feedbackAnalysis.negative?.items || feedbackAnalysis.negative.items.length === 0) && (
                <p className='text-sm text-gray-500 italic'>No challenges recorded</p>
              )}
            </div>
            {feedbackAnalysis.negative?.totalDollarImpact > 0 && (
              <div className='mt-4 p-3 bg-red-500/10 rounded-lg border border-red-500/20'>
                <span className='text-sm text-red-400 font-medium'>
                  Total Challenge Impact: ${feedbackAnalysis.negative.totalDollarImpact.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Charts Grid */}
      <div className='grid lg:grid-cols-2 gap-8'>
        {/* Themes Chart */}
        <section className='card p-6 rounded-xl'>
          <h2 className='text-lg font-semibold mb-4'>Top Themes</h2>
          <div className='space-y-3'>
            {topThemes.map(([theme, count]) => (
              <div key={theme} className='flex items-center justify-between'>
                <span className='text-sm font-medium'>{theme}</span>
                <div className='flex items-center gap-2'>
                  <div className='w-32 bg-gray-200 rounded-full h-2'>
                    <div 
                      className='bg-blue-500 h-2 rounded-full' 
                      style={{ width: `${((count as number) / Math.max(...Object.values(themeCounts).map(v => v as number))) * 100}%` }}
                    />
                  </div>
                  <span className='text-sm text-gray-600'>{count as number}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Mood Distribution */}
        <section className='card p-6 rounded-xl'>
          <h2 className='text-lg font-semibold mb-4'>Mood Distribution</h2>
          <div className='space-y-3'>
            {Object.entries(moodCounts).map(([mood, count]) => {
              const percentage = ((count as number) / filteredRows.length) * 100;
              const color = mood === 'pos' ? 'bg-green-500' : mood === 'neg' ? 'bg-red-500' : 'bg-yellow-500';
              return (
                <div key={mood} className='flex items-center justify-between'>
                  <span className='text-sm font-medium capitalize'>{mood === 'pos' ? 'Positive' : mood === 'neg' ? 'Negative' : 'Neutral'}</span>
                  <div className='flex items-center gap-2'>
                    <div className='w-32 bg-gray-200 rounded-full h-2'>
                      <div 
                        className={`${color} h-2 rounded-full`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className='text-sm text-gray-600'>{count} ({percentage.toFixed(1)}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Category Analysis */}
        <section className='card p-6 rounded-xl'>
          <h2 className='text-lg font-semibold mb-4'>Issue Categories</h2>
          <div className='space-y-3'>
            {Object.entries(categoryCounts)
              .sort(([,a], [,b]) => (b as number) - (a as number))
              .map(([category, count]) => (
                <div key={category} className='flex items-center justify-between'>
                  <span className='text-sm font-medium'>{category}</span>
                  <div className='flex items-center gap-2'>
                    <div className='w-32 bg-gray-200 rounded-full h-2'>
                      <div 
                        className='bg-purple-500 h-2 rounded-full'
                        style={{ width: `${((count as number) / Math.max(...Object.values(categoryCounts).map(v => v as number))) * 100}%` }}
                      />
                    </div>
                    <span className='text-sm text-gray-600'>{count as number}</span>
                  </div>
                </div>
              ))}
          </div>
        </section>

        {/* Impact Analysis */}
        <section className='card p-6 rounded-xl'>
          <h2 className='text-lg font-semibold mb-4'>Impact Types</h2>
          <div className='space-y-3'>
            {Object.entries(impactCounts)
              .sort(([,a], [,b]) => (b as number) - (a as number))
              .map(([impact, count]) => (
                <div key={impact} className='flex items-center justify-between'>
                  <span className='text-sm font-medium'>{impact}</span>
                  <div className='flex items-center gap-2'>
                    <div className='w-32 bg-gray-200 rounded-full h-2'>
                      <div 
                        className='bg-orange-500 h-2 rounded-full'
                        style={{ width: `${((count as number) / Math.max(...Object.values(impactCounts).map(v => v as number))) * 100}%` }}
                      />
                    </div>
                    <span className='text-sm text-gray-600'>{count as number}</span>
                  </div>
                </div>
              ))}
          </div>
        </section>
      </div>

      {/* Recent Submissions */}
      <section className='card p-6 rounded-xl'>
        <h2 className='text-lg font-semibold mb-4'>Recent Submissions</h2>
        <div className='space-y-4'>
          {filteredRows.slice(0, 5).map((row, index) => (
            <div key={row.id || index} className='border rounded-lg p-4 bg-white/50'>
              <div className='flex items-start justify-between mb-2'>
                <div>
                  <h3 className='font-medium'>{row.store_name}</h3>
                  <p className='text-sm text-gray-600'>{row.region} • {row.iso_week}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${
                  row.overall_mood === 'pos' ? 'bg-green-100 text-green-700' :
                  row.overall_mood === 'neg' ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {row.overall_mood === 'pos' ? 'Positive' : row.overall_mood === 'neg' ? 'Negative' : 'Neutral'}
                </span>
              </div>
              <div className='space-y-1 text-sm'>
                <p><strong>{row.issue1_cat}:</strong> {row.issue1_text}</p>
                <p><strong>{row.issue2_cat}:</strong> {row.issue2_text}</p>
                <p><strong>{row.issue3_cat}:</strong> {row.issue3_text}</p>
              </div>
              {row.themes && row.themes.length > 0 && (
                <div className='mt-2 flex flex-wrap gap-1'>
                  {row.themes.map((theme: string, i: number) => (
                    <span key={i} className='text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded'>
                      {theme}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* AI Summaries */}
      {summaries.length > 0 && (
        <section className='card p-6 rounded-xl'>
          <h2 className='text-lg font-semibold mb-4'>AI-Generated Summaries</h2>
          <div className='space-y-4'>
            {summaries.map((summary, index) => (
              <div key={summary.id || index} className='border rounded-lg p-4 bg-white/50'>
                <div className='flex items-center justify-between mb-2'>
                  <h3 className='font-medium'>{summary.region} Region</h3>
                  <span className='text-sm text-gray-600'>{summary.iso_week}</span>
                </div>
                <p className='text-sm text-gray-700 mb-3'>{summary.summary}</p>
                {summary.top_themes && summary.top_themes.length > 0 && (
                  <div className='flex flex-wrap gap-1'>
                    {summary.top_themes.map((theme: string, i: number) => (
                      <span key={i} className='text-xs bg-green-100 text-green-700 px-2 py-1 rounded'>
                        {theme}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function MetricCard({ title, value, subtitle, trend }: {
  title: string;
  value: string | number;
  subtitle: string;
  trend: 'up' | 'down' | 'stable';
}) {
  const trendIcon = trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→';
  const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600';
  
  return (
    <div className='card p-6 rounded-xl'>
      <div className='flex items-center justify-between mb-2'>
        <h3 className='text-sm font-medium text-gray-600'>{title}</h3>
        <span className={`text-lg ${trendColor}`}>{trendIcon}</span>
      </div>
      <div className='text-2xl font-bold'>{value}</div>
      <div className='text-xs text-gray-500'>{subtitle}</div>
    </div>
  );
}
