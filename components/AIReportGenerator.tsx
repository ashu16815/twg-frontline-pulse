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
        <div className='card p-4 rounded-xl bg-red-50 border-red-200'>
          <h3 className='text-red-800 font-medium'>Error</h3>
          <p className='text-red-600 text-sm mt-1'>{error}</p>
        </div>
      )}

      {report && (
        <div className='space-y-6'>
          {/* Executive Summary */}
          <section className='card p-6 rounded-xl'>
            <h2 className='text-xl font-semibold mb-4'>Executive Summary</h2>
            <p className='text-gray-700 leading-relaxed'>{report.narrative}</p>
          </section>

          {/* Key Metrics */}
          <section className='grid md:grid-cols-4 gap-4'>
            <div className='card p-4 rounded-xl text-center'>
              <div className='text-2xl font-bold text-blue-600'>{report.metrics.totalSubmissions}</div>
              <div className='text-sm text-gray-600'>Total Submissions</div>
            </div>
            <div className='card p-4 rounded-xl text-center'>
              <div className='text-2xl font-bold text-purple-600'>{report.metrics.avgMoodScore.toFixed(1)}</div>
              <div className='text-sm text-gray-600'>Avg Mood Score</div>
            </div>
            <div className='card p-4 rounded-xl text-center'>
              <div className='text-2xl font-bold text-green-600'>{report.metrics.topCategory}</div>
              <div className='text-sm text-gray-600'>Top Category</div>
            </div>
            <div className='card p-4 rounded-xl text-center'>
              <div className='text-2xl font-bold text-red-600'>{report.metrics.criticalIssues}</div>
              <div className='text-sm text-gray-600'>Critical Issues</div>
            </div>
          </section>

          {/* Highlights */}
          <section className='card p-6 rounded-xl'>
            <h2 className='text-xl font-semibold mb-4'>Key Highlights</h2>
            <ul className='space-y-2'>
              {report.highlights.map((highlight, index) => (
                <li key={index} className='flex items-start gap-2'>
                  <span className='text-blue-500 mt-1'>•</span>
                  <span className='text-gray-700'>{highlight}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Sentiment Analysis */}
          <section className='card p-6 rounded-xl'>
            <h2 className='text-xl font-semibold mb-4'>Sentiment Analysis</h2>
            <div className='grid md:grid-cols-2 gap-6'>
              <div>
                <h3 className='font-medium mb-2'>Overall Sentiment</h3>
                <div className='flex items-center gap-2'>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSentimentColor(report.sentimentAnalysis.overall)}`}>
                    {report.sentimentAnalysis.overall.toUpperCase()}
                  </span>
                  <span className='text-sm text-gray-600'>Score: {report.sentimentAnalysis.score.toFixed(2)}</span>
                </div>
              </div>
              <div>
                <h3 className='font-medium mb-2'>By Region</h3>
                <div className='space-y-1'>
                  {Object.entries(report.sentimentAnalysis.byRegion).map(([region, sentiment]) => (
                    <div key={region} className='flex items-center justify-between'>
                      <span className='text-sm'>{region}</span>
                      <span className={`px-2 py-1 rounded text-xs ${getSentimentColor(sentiment)}`}>
                        {sentiment.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {report.sentimentAnalysis.trends.length > 0 && (
              <div className='mt-4'>
                <h3 className='font-medium mb-2'>Trends</h3>
                <ul className='space-y-1'>
                  {report.sentimentAnalysis.trends.map((trend, index) => (
                    <li key={index} className='text-sm text-gray-600'>• {trend}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* Themes Analysis */}
          <section className='card p-6 rounded-xl'>
            <h2 className='text-xl font-semibold mb-4'>Theme Analysis</h2>
            <div className='space-y-3'>
              {report.themes.map((theme, index) => (
                <div key={index} className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
                  <div className='flex-1'>
                    <div className='font-medium'>{theme.name}</div>
                    <div className='text-sm text-gray-600'>
                      {theme.regions.join(', ')} • {theme.count} mentions
                    </div>
                  </div>
                  <div className='flex gap-2'>
                    <span className={`px-2 py-1 rounded text-xs ${getSentimentColor(theme.sentiment)}`}>
                      {theme.sentiment.toUpperCase()}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${getImpactColor(theme.impact)}`}>
                      {theme.impact.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Risks and Opportunities */}
          <div className='grid md:grid-cols-2 gap-6'>
            <section className='card p-6 rounded-xl'>
              <h2 className='text-xl font-semibold mb-4 text-red-600'>Risks</h2>
              <ul className='space-y-2'>
                {report.risks.map((risk, index) => (
                  <li key={index} className='flex items-start gap-2'>
                    <span className='text-red-500 mt-1'>⚠</span>
                    <span className='text-gray-700 text-sm'>{risk}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className='card p-6 rounded-xl'>
              <h2 className='text-xl font-semibold mb-4 text-green-600'>Opportunities</h2>
              <ul className='space-y-2'>
                {report.opportunities.map((opportunity, index) => (
                  <li key={index} className='flex items-start gap-2'>
                    <span className='text-green-500 mt-1'>💡</span>
                    <span className='text-gray-700 text-sm'>{opportunity}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* Action Items */}
          <section className='card p-6 rounded-xl'>
            <h2 className='text-xl font-semibold mb-4'>Action Items</h2>
            <div className='space-y-3'>
              {report.actions.map((action, index) => (
                <div key={index} className='flex items-start justify-between p-4 bg-gray-50 rounded-lg'>
                  <div className='flex-1'>
                    <div className='font-medium'>{action.action}</div>
                    <div className='text-sm text-gray-600 mt-1'>
                      Owner: {action.owner} • Due: {action.due}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded text-xs font-medium ${getPriorityColor(action.priority)}`}>
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
