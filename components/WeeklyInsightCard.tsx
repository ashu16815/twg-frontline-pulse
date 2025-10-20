'use client';
import Image from 'next/image';
import { GlassCard } from './Glass';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function WeeklyInsightCard() {
  const { data: snapshotData } = useSWR('/api/exec/snapshot?scope_type=network', fetcher, { 
    revalidateOnFocus: false,
    refreshInterval: 30000 // Refresh every 30 seconds
  });

  const analysis = snapshotData?.snapshot?.analysis_json ? JSON.parse(snapshotData.snapshot.analysis_json) : null;
  const stamp = snapshotData?.snapshot?.created_at ? new Date(snapshotData.snapshot.created_at).toLocaleString() : null;

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
        
        {analysis ? (
          <div className="mt-2 space-y-3">
            {/* Top Opportunity */}
            {analysis.top_opportunities?.[0] && (
              <div>
                <div className="text-lg font-semibold text-blue-300">
                  {analysis.top_opportunities[0].theme}
                </div>
                <div className="text-sm opacity-80">
                  ${analysis.top_opportunities[0].impact_dollars?.toLocaleString?.()} impact
                </div>
              </div>
            )}
            
            {/* Top Action */}
            {analysis.top_actions?.[0] && (
              <div className="text-sm">
                <span className="opacity-70">Next Action:</span> {analysis.top_actions[0].action}
              </div>
            )}
            
            {/* Timestamp */}
            {stamp && (
              <div className="text-xs opacity-60">
                Updated {new Date(snapshotData.snapshot.created_at).toLocaleDateString()}
              </div>
            )}
          </div>
        ) : (
          <div className="mt-2 space-y-2">
            <div className="text-lg">Store insights coming soon</div>
            <div className="opacity-80 text-sm">
              Submit feedback to see real-time data
            </div>
          </div>
        )}
      </div>
    </GlassCard>
  );
}

