import Overview from '@/components/exec/Overview';

export const dynamic = 'force-dynamic';

export default function Page({ searchParams }: { searchParams: { week?: string; region?: string } }) {
  return (
    <main className='max-w-7xl mx-auto p-8'>
      <Overview searchParams={searchParams} />
    </main>
  );
}

