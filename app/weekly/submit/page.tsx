import PasscodeGate from '@/components/PasscodeGate';
import PerformanceForm from '@/components/PerformanceForm';

export default function Page() {
  return (
    <PasscodeGate>
      <main className='max-w-3xl mx-auto p-8 space-y-4'>
        <h1 className='text-2xl font-semibold'>Weekly Performance Check-in</h1>
        <p className='text-slate-600'>On Monday, tell us why you hit/missed target and the $ impact. Set Top-3 priorities.</p>
        <PerformanceForm />
      </main>
    </PasscodeGate>
  );
}