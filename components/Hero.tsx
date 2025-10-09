import Image from 'next/image';
import { SheenButton, GlassCard } from './Glass';

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute -inset-40 opacity-[.18]">
        <Image 
          src="https://images.unsplash.com/photo-1531973968078-9bb02785f13d?q=80&w=2400&auto=format&fit=crop" 
          alt="bg" 
          fill 
          priority 
          className="object-cover"
        />
      </div>
      <div className="relative max-w-7xl mx-auto px-6 py-24 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <h1 className="display font-semibold">
            Frontline Feedback: Your Store's Voice
          </h1>
          <p className="subtitle mt-4">
            Share what's working and what needs attention. Simple, fast, and designed to drive real change across TWG stores.
          </p>
          <div className="mt-8 flex gap-3">
            <a className="btn bg-red-600 hover:bg-red-700 text-white" href="/frontline/submit">
              Submit Store Report
            </a>
            <a className="btn" href="/weekly/submit">
              Performance Check-in
            </a>
            <a className="btn" href="/reports">
              View Reports
            </a>
            <SheenButton>
              <a href="/ceo">CEO Office</a>
            </SheenButton>
          </div>
        </div>
        <GlassCard className="p-0 overflow-hidden">
          <Image 
            src="https://images.unsplash.com/photo-1557821552-17105176677c?q=80&w=1600&auto=format&fit=crop" 
            alt="store" 
            width={1600} 
            height={1066} 
            className="w-full h-64 object-cover"
          />
          <div className="p-6">
            <div className="text-sm opacity-70">This week • Region North</div>
            <div className="mt-2 text-lg">Top themes: Late Delivery, Stockroom Ops, Promo On-Shelf</div>
            <div className="opacity-80 mt-2 text-sm">Actions: Supplier escalation • Surge labour • Planogram check</div>
          </div>
        </GlassCard>
      </div>
    </section>
  );
}
