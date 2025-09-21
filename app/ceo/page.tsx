import CEOChat from '@/components/CEOChat';
import WeeklyCards from '@/components/WeeklyCards';

export default async function Page() {
  const health = await fetch(
    process.env.NEXT_PUBLIC_BASE_URL 
      ? process.env.NEXT_PUBLIC_BASE_URL + '/api/health/db' 
      : '/api/health/db',
    { cache: 'no-store' }
  ).then(r => r.json()).catch(() => ({ ok: false }));

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