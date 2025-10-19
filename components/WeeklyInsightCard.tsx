import Image from 'next/image';
import { GlassCard } from './Glass';

export default function WeeklyInsightCard() {
  // Simplified static component to prevent database errors
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
        <div className="mt-2 text-lg">Store insights coming soon</div>
        <div className="opacity-80 mt-2 text-sm">
          Submit feedback to see real-time data
        </div>
      </div>
    </GlassCard>
  );
}

