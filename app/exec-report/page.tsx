import ExecutiveReport from '@/components/exec/ExecutiveReport';

export default function Page() {
  return (
    <main className='max-w-7xl mx-auto p-6 space-y-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-semibold'>Executive Report</h1>
      </div>
      <ExecutiveReport />
    </main>
  );
}
