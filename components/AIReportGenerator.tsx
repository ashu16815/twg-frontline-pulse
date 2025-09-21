'use client';

import { useState } from 'react';

interface AIReport {
  highlights: string[];
  themes: Array<{
    name: string;
    count: number;
    regions: string[];
    sentiment: 'pos' | 'neg' | 'neu';
    impact: 'high' | 'medium' | 'low';
  }>;
  sentimentAnalysis: {
    overall: 'pos' | 'neg' | 'neu';
    score: number;
    byRegion: Record<string, 'pos' | 'neg' | 'neu'>;
    trends: string[];
  };
  risks: string[];
  opportunities: string[];
  actions: Array<{
    owner: string;
    action: string;
    due: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  narrative: string;
  metrics: {
    totalSubmissions: number;
    avgMoodScore: number;
    topCategory: string;
    criticalIssues: number;
  };
}

export default function AIReportGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState<AIReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateReport = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.ok) {
        setReport(data.report);
      } else {
        setError(data.error || 'Failed to generate report');
      }
    } catch (err) {
      setError('Network error: ' + (err as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  const getSentimentColor = (sentiment: 'pos' | 'neg' | 'neu') => {
    switch (sentiment) {
      case 'pos': return 'text-green-600 bg-green-100';
      case 'neg': return 'text-red-600 bg-red-100';
      default: return 'text-yellow-600 bg-yellow-100';
    }
  };

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-green-600 bg-green-100';
    }
  };

  const getImpactColor = (impact: 'high' | 'medium' | 'low') => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-green-600 bg-green-100';
    }
  };

  return (
    <div className='space-y-6'>
      <button
        onClick={generateReport}
        disabled={isGenerating}
        className='btn-primary sheen disabled:opacity-50 disabled:cursor-not-allowed'
      >
        {isGenerating ? 'Generating AI Report...' : 'Generate AI Report'}
      </button>

      {error && (
        <div className='card p-4 rounded-xl bg-red-50 border border-red-200'>
          <h3 className='text-red-800 font-semibold text-base'>Error</h3>
          <p className='text-red-700 text-sm mt-2 leading-relaxed'>{error}</p>
        </div>
      )}

      {report && (
        <div className='space-y-6'>
          {/* Executive Summary */}
          <section className='card p-6 rounded-xl bg-white border border-gray-200'>
            <h2 className='text-xl font-semibold mb-4 text-gray-900'>Executive Summary</h2>
            <p className='text-gray-800 leading-relaxed text-base'>{report.narrative}</p>
          </section>

          {/* Key Metrics */}
          <section className='grid md:grid-cols-4 gap-4'>
            <div className='card p-4 rounded-xl text-center bg-white border border-gray-200'>
              <div className='text-2xl font-bold text-blue-600'>{report.metrics.totalSubmissions}</div>
              <div className='text-sm text-gray-700 font-medium'>Total Submissions</div>
            </div>
            <div className='card p-4 rounded-xl text-center bg-white border border-gray-200'>
              <div className='text-2xl font-bold text-purple-600'>{report.metrics.avgMoodScore.toFixed(1)}</div>
              <div className='text-sm text-gray-700 font-medium'>Avg Mood Score</div>
            </div>
            <div className='card p-4 rounded-xl text-center bg-white border border-gray-200'>
              <div className='text-2xl font-bold text-green-600'>{report.metrics.topCategory}</div>
              <div className='text-sm text-gray-700 font-medium'>Top Category</div>
            </div>
            <div className='card p-4 rounded-xl text-center bg-white border border-gray-200'>
              <div className='text-2xl font-bold text-red-600'>{report.metrics.criticalIssues}</div>
              <div className='text-sm text-gray-700 font-medium'>Critical Issues</div>
            </div>
          </section>

          {/* Highlights */}
          <section className='card p-6 rounded-xl bg-white border border-gray-200'>
            <h2 className='text-xl font-semibold mb-4 text-gray-900'>Key Highlights</h2>
            <ul className='space-y-3'>
              {report.highlights.map((highlight, index) => (
                <li key={index} className='flex items-start gap-3'>
                  <span className='text-blue-500 mt-1 text-lg font-bold'>•</span>
                  <span className='text-gray-800 text-base leading-relaxed'>{highlight}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Sentiment Analysis */}
          <section className='card p-6 rounded-xl bg-white border border-gray-200'>
            <h2 className='text-xl font-semibold mb-4 text-gray-900'>Sentiment Analysis</h2>
            <div className='grid md:grid-cols-2 gap-6'>
              <div>
                <h3 className='font-semibold mb-3 text-gray-800'>Overall Sentiment</h3>
                <div className='flex items-center gap-3'>
                  <span className={`px-4 py-2 rounded-full text-sm font-bold ${getSentimentColor(report.sentimentAnalysis.overall)}`}>
                    {report.sentimentAnalysis.overall.toUpperCase()}
                  </span>
                  <span className='text-sm text-gray-700 font-medium'>Score: {report.sentimentAnalysis.score.toFixed(2)}</span>
                </div>
              </div>
              <div>
                <h3 className='font-semibold mb-3 text-gray-800'>By Region</h3>
                <div className='space-y-2'>
                  {Object.entries(report.sentimentAnalysis.byRegion).map(([region, sentiment]) => (
                    <div key={region} className='flex items-center justify-between'>
                      <span className='text-sm font-medium text-gray-700'>{region}</span>
                      <span className={`px-3 py-1 rounded text-xs font-bold ${getSentimentColor(sentiment)}`}>
                        {sentiment.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {report.sentimentAnalysis.trends.length > 0 && (
              <div className='mt-6'>
                <h3 className='font-semibold mb-3 text-gray-800'>Trends</h3>
                <ul className='space-y-2'>
                  {report.sentimentAnalysis.trends.map((trend, index) => (
                    <li key={index} className='text-sm text-gray-700 flex items-start gap-2'>
                      <span className='text-gray-500 mt-1'>•</span>
                      <span>{trend}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* Themes Analysis */}
          <section className='card p-6 rounded-xl bg-white border border-gray-200'>
            <h2 className='text-xl font-semibold mb-4 text-gray-900'>Theme Analysis</h2>
            <div className='space-y-4'>
              {report.themes.map((theme, index) => (
                <div key={index} className='flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200'>
                  <div className='flex-1'>
                    <div className='font-semibold text-gray-900 text-base'>{theme.name}</div>
                    <div className='text-sm text-gray-600 mt-1'>
                      {theme.regions.join(', ')} • {theme.count} mentions
                    </div>
                  </div>
                  <div className='flex gap-2'>
                    <span className={`px-3 py-1 rounded text-xs font-bold ${getSentimentColor(theme.sentiment)}`}>
                      {theme.sentiment.toUpperCase()}
                    </span>
                    <span className={`px-3 py-1 rounded text-xs font-bold ${getImpactColor(theme.impact)}`}>
                      {theme.impact.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Risks and Opportunities */}
          <div className='grid md:grid-cols-2 gap-6'>
            <section className='card p-6 rounded-xl bg-white border border-gray-200'>
              <h2 className='text-xl font-semibold mb-4 text-red-600'>Risks</h2>
              <ul className='space-y-3'>
                {report.risks.map((risk, index) => (
                  <li key={index} className='flex items-start gap-3'>
                    <span className='text-red-500 mt-1 text-lg'>⚠</span>
                    <span className='text-gray-800 text-base leading-relaxed'>{risk}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className='card p-6 rounded-xl bg-white border border-gray-200'>
              <h2 className='text-xl font-semibold mb-4 text-green-600'>Opportunities</h2>
              <ul className='space-y-3'>
                {report.opportunities.map((opportunity, index) => (
                  <li key={index} className='flex items-start gap-3'>
                    <span className='text-green-500 mt-1 text-lg'>💡</span>
                    <span className='text-gray-800 text-base leading-relaxed'>{opportunity}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* Action Items */}
          <section className='card p-6 rounded-xl bg-white border border-gray-200'>
            <h2 className='text-xl font-semibold mb-4 text-gray-900'>Action Items</h2>
            <div className='space-y-4'>
              {report.actions.map((action, index) => (
                <div key={index} className='flex items-start justify-between p-4 bg-gray-50 rounded-lg border border-gray-200'>
                  <div className='flex-1'>
                    <div className='font-semibold text-gray-900 text-base'>{action.action}</div>
                    <div className='text-sm text-gray-600 mt-1'>
                      Owner: {action.owner} • Due: {action.due}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded text-xs font-bold ${getPriorityColor(action.priority)}`}>
                    {action.priority.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
