import MockCEOChat from '@/components/MockCEOChat';
import MockWeeklyCards from '@/components/MockWeeklyCards';

export default function Page() {
  return (
    <main className="max-w-6xl mx-auto p-8 space-y-8">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold text-blue-800 mb-2">🎯 Demo Mode</h2>
        <p className="text-blue-700 text-sm">
          This is a demonstration of the CEO dashboard with mock data. 
          Once the database is set up with the service role key, this will show real data from your Supabase database.
        </p>
      </div>
      
      <h1 className="text-2xl font-semibold">CEO Office</h1>
      
      <MockWeeklyCards />
      
      <section className="card p-6 rounded-xl">
        <h2 className="text-lg font-semibold mb-2">Ask the data</h2>
        <p className="text-slate-600 mb-4">Ask about this week's themes, risks, regions, stores, or actions.</p>
        <MockCEOChat />
      </section>
    </main>
  );
}
