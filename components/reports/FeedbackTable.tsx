'use client';

import { useState } from 'react';

interface FeedbackRow {
  store_id: string;
  store_name?: string;
  region_code: string;
  top_positive?: string;
  miss1?: string;
  miss1_dollars?: number;
  miss2?: string;
  miss2_dollars?: number;
  miss3?: string;
  miss3_dollars?: number;
  overall_mood?: string;
  freeform_comments?: string;
  created_at?: string;
}

interface FeedbackTableProps {
  data: FeedbackRow[];
  title: string;
  totalCount: number;
}

function Money(n: number) {
  return `$${Math.round(n || 0).toLocaleString()}`;
}

function formatDate(dateString?: string) {
  if (!dateString) return '—';
  try {
    return new Date(dateString).toLocaleDateString('en-NZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return '—';
  }
}

function getMoodEmoji(mood?: string) {
  switch (mood?.toLowerCase()) {
    case 'positive': return '😊';
    case 'negative': return '😞';
    case 'neutral': return '😐';
    default: return '—';
  }
}

export default function FeedbackTable({ data, title, totalCount }: FeedbackTableProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAll, setShowAll] = useState(false);

  if (!data || data.length === 0) {
    return (
      <div className='card'>
        <h3 className='font-semibold mb-3'>{title}</h3>
        <div className='text-sm text-white/60'>
          No feedback data available for this period.
        </div>
      </div>
    );
  }

  const displayData = showAll ? data : data.slice(0, 5);
  const hasMore = data.length > 5;

  return (
    <div className='card'>
      <div className='flex items-center justify-between mb-3'>
        <h3 className='font-semibold'>{title}</h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className='btn btn-sm text-xs'
        >
          {isExpanded ? '▼ Hide Details' : '▶ Show Details'}
          <span className='ml-2 text-white/60'>({data.length} of {totalCount})</span>
        </button>
      </div>

      {isExpanded && (
        <div className='space-y-4'>
          {/* Summary Stats */}
          <div className='grid grid-cols-2 md:grid-cols-4 gap-3 text-xs'>
            <div className='bg-white/5 rounded p-2'>
              <div className='text-white/60'>Total Stores</div>
              <div className='font-medium'>{data.length}</div>
            </div>
            <div className='bg-white/5 rounded p-2'>
              <div className='text-white/60'>Total Impact</div>
              <div className='font-medium'>
                {Money(data.reduce((sum, row) => 
                  sum + (row.miss1_dollars || 0) + (row.miss2_dollars || 0) + (row.miss3_dollars || 0), 0
                ))}
              </div>
            </div>
            <div className='bg-white/5 rounded p-2'>
              <div className='text-white/60'>Regions</div>
              <div className='font-medium'>
                {new Set(data.map(row => row.region_code)).size}
              </div>
            </div>
            <div className='bg-white/5 rounded p-2'>
              <div className='text-white/60'>Avg Mood</div>
              <div className='font-medium'>
                {getMoodEmoji(
                  data.filter(row => row.overall_mood).length > 0 
                    ? data.filter(row => row.overall_mood)[0].overall_mood 
                    : undefined
                )}
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className='overflow-x-auto'>
            <table className='w-full text-xs'>
              <thead>
                <tr className='border-b border-white/20'>
                  <th className='text-left p-2 font-medium'>Store</th>
                  <th className='text-left p-2 font-medium'>Region</th>
                  <th className='text-left p-2 font-medium'>Positive</th>
                  <th className='text-left p-2 font-medium'>Issues</th>
                  <th className='text-left p-2 font-medium'>Impact</th>
                  <th className='text-left p-2 font-medium'>Mood</th>
                  <th className='text-left p-2 font-medium'>Date</th>
                </tr>
              </thead>
              <tbody>
                {displayData.map((row, index) => (
                  <tr key={index} className='border-b border-white/10 hover:bg-white/5'>
                    <td className='p-2'>
                      <div className='font-medium'>{row.store_id}</div>
                      {row.store_name && (
                        <div className='text-white/60 text-xs'>{row.store_name}</div>
                      )}
                    </td>
                    <td className='p-2'>{row.region_code}</td>
                    <td className='p-2 max-w-xs'>
                      <div className='truncate' title={row.top_positive}>
                        {row.top_positive || '—'}
                      </div>
                    </td>
                    <td className='p-2 max-w-xs'>
                      <div className='space-y-1'>
                        {row.miss1 && (
                          <div className='text-red-300 truncate' title={row.miss1}>
                            • {row.miss1}
                          </div>
                        )}
                        {row.miss2 && (
                          <div className='text-red-300 truncate' title={row.miss2}>
                            • {row.miss2}
                          </div>
                        )}
                        {row.miss3 && (
                          <div className='text-red-300 truncate' title={row.miss3}>
                            • {row.miss3}
                          </div>
                        )}
                        {!row.miss1 && !row.miss2 && !row.miss3 && '—'}
                      </div>
                    </td>
                    <td className='p-2'>
                      <div className='space-y-1'>
                        {(row.miss1_dollars || 0) > 0 && (
                          <div className='text-red-300'>
                            {Money(row.miss1_dollars || 0)}
                          </div>
                        )}
                        {(row.miss2_dollars || 0) > 0 && (
                          <div className='text-red-300'>
                            {Money(row.miss2_dollars || 0)}
                          </div>
                        )}
                        {(row.miss3_dollars || 0) > 0 && (
                          <div className='text-red-300'>
                            {Money(row.miss3_dollars || 0)}
                          </div>
                        )}
                        {(row.miss1_dollars || 0) === 0 && (row.miss2_dollars || 0) === 0 && (row.miss3_dollars || 0) === 0 && '—'}
                      </div>
                    </td>
                    <td className='p-2 text-center'>
                      {getMoodEmoji(row.overall_mood)}
                    </td>
                    <td className='p-2 text-white/60'>
                      {formatDate(row.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Load More Button */}
          {hasMore && !showAll && (
            <div className='text-center'>
              <button
                onClick={() => setShowAll(true)}
                className='btn btn-sm'
              >
                Show All {data.length} Entries
              </button>
            </div>
          )}

          {/* Comments Section */}
          <div className='mt-4'>
            <h4 className='font-medium mb-2 text-sm'>Recent Comments</h4>
            <div className='space-y-2 max-h-32 overflow-y-auto'>
              {data
                .filter(row => row.freeform_comments)
                .slice(0, 3)
                .map((row, index) => (
                  <div key={index} className='bg-white/5 rounded p-2 text-xs'>
                    <div className='font-medium text-white/80'>{row.store_id}</div>
                    <div className='text-white/60 mt-1'>{row.freeform_comments}</div>
                  </div>
                ))}
              {data.filter(row => row.freeform_comments).length === 0 && (
                <div className='text-xs text-white/60'>No comments available</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
