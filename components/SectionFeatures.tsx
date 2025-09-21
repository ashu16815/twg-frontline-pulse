import { GlassCard } from './Glass';
import { Activity, Mic, Sparkles } from 'lucide-react';

function Feature({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <GlassCard>
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-2xl bg-white/10">
          <Icon size={20} />
        </div>
        <div>
          <div className="font-medium">{title}</div>
          <div className="opacity-70 text-sm mt-1">{desc}</div>
        </div>
      </div>
    </GlassCard>
  );
}

export default function SectionFeatures() {
  return (
    <section className="max-w-7xl mx-auto px-6 mt-10 grid md:grid-cols-3 gap-4">
      <Feature 
        icon={Mic} 
        title="Voice-first" 
        desc="Tap the mic to speak your weekly Top-3. Edit before you submit."
      />
      <Feature 
        icon={Sparkles} 
        title="AI summaries" 
        desc="Azure OpenAI tags themes & crafts a concise CEO brief by region."
      />
      <Feature 
        icon={Activity} 
        title="Insight dashboard" 
        desc="See themes, sentiment, and trace to stores — ready for action."
      />
    </section>
  );
}
