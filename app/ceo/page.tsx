import CEOChat from '@/components/CEOChat';
import WeeklyCards from '@/components/WeeklyCards';

export default async function Page() {
  // For server-side rendering, we need to check if we're in production
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://twg-frontline-pulse.vercel.app'
    : 'http://localhost:3000';
    
  const health = await fetch(`${baseUrl}/api/health/db`, { 
    cache: 'no-store' 
  }).then(r => r.json()).catch(() => ({ ok: false }));

  return (
    <main className='max-w-6xl mx-auto p-8 space-y-8'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-semibold'>CEO Office</h1>
        <span className={`text-xs px-2 py-1 rounded ${health.ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {health.ok ? 'DB Connected' : 'DB Issue'}
        </span>
      </div>
      
      <WeeklyCards />
      
      <section className='card p-6 rounded-xl'>
        <h2 className='text-lg font-semibold mb-2'>Ask the data</h2>
        <CEOChat />
      </section>
    </main>
  );
}