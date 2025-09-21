import PasscodeGate from '@/components/PasscodeGate';
import WeeklyForm from '@/components/WeeklyForm';

export default function Page() {
  return (
    <PasscodeGate>
      <main className='max-w-3xl mx-auto p-8 space-y-4'>
        <h1 className='text-2xl font-semibold'>Weekly Top-3 Feedback</h1>
        <p className='text-slate-600'>
          Speak or type. Example: "Apparel down 8% due to stockouts; Home down 5% bays not set; Toys down 4% late delivery."
        </p>
        <WeeklyForm />
      </main>
    </PasscodeGate>
  );
}