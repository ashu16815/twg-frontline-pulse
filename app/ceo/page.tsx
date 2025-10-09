import CEOChat from '@/components/CEOChat';
import WeeklyCards from '@/components/WeeklyCards';
import DBHealthBadge from '@/components/DBHealthBadge';

export default function Page() {
  return (
    <main className='max-w-6xl mx-auto p-8 space-y-8'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-semibold'>Ask Questions</h1>
        <DBHealthBadge />
      </div>
      
      <WeeklyCards />
      
      <section className='card p-6 rounded-xl'>
        <h2 className='text-lg font-semibold mb-2'>Ask the data</h2>
        <CEOChat />
      </section>
    </main>
  );
}