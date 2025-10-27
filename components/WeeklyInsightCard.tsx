'use client';
import Image from 'next/image';
import { GlassCard } from './Glass';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function WeeklyInsightCard() {
  const { data: insightData } = useSWR('/api/reports/executive-summary', fetcher, { 
    revalidateOnFocus: false,
    refreshInterval: 60000 // Refresh every minute
  });

  const insight = insightData?.insight;
  const timestamp = insightData?.timestamp;

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
        <div className="text-sm opacity-70">This week</div>
        
        {insight ? (
          <div className="mt-2 space-y-3">
            {/* Top Opportunity/Pain Point */}
            {insight.title && (
              <div>
                <div className="text-lg font-semibold text-blue-300">
                  {insight.title}
                </div>
                <div className="text-sm opacity-80">
                  ${insight.impact?.toLocaleString?.()} impact
                </div>
              </div>
            )}
            
            {/* Next Action */}
            {insight.next_action && (
              <div className="text-sm">
                <span className="opacity-70">Next Action:</span> {insight.next_action}
              </div>
            )}
            
            {/* Timestamp */}
            {timestamp && (
              <div className="text-xs opacity-60">
                Updated {new Date(timestamp).toLocaleDateString('en-NZ')}
              </div>
            )}
          </div>
        ) : (
          <div className="mt-2 space-y-2">
            <div className="text-lg">Store insights loading...</div>
            <div className="opacity-80 text-sm">
              Generating AI summary from last 7 days feedback
            </div>
          </div>
        )}
      </div>
    </GlassCard>
  );
}

