import SmartFeedbackForm from '@/components/feedback/SmartFeedbackForm';
import SubmitFeedbackForm from '@/components/feedback/SubmitFeedbackForm';
export default function Page(){
  return (
    <main className='max-w-3xl mx-auto p-6 space-y-6'>
      <SmartFeedbackForm />
      <SubmitFeedbackForm />
    </main>
  );
}
