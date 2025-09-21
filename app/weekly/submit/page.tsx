import PasscodeGate from '@/components/PasscodeGate';
import StorePicker from '@/components/StorePicker';

export default function Page() {
  return (
    <PasscodeGate>
      <main className='max-w-5xl mx-auto px-6 py-10'>
        <h1 className='text-2xl font-semibold mb-2'>Weekly Top-3 Feedback</h1>
        <p className='opacity-70 mb-6'>Pick your store below. We'll auto-fill details. Then add this week's Top-3.</p>
        <form className='card rounded-3xl grid gap-4' action='/api/weekly/submit' method='post'>
          {/* Auto-filled after store selection */}
          <StorePicker />
          <input className='input' name='managerEmail' placeholder='Manager Email (optional)'/>
          {[1,2,3].map(i => (
            <div key={i} className='grid md:grid-cols-3 gap-3'>
              <input className='input' name={`issue${i}Cat`} placeholder={`Issue ${i} Category (Apparel/Home/Toys/…)`} required/>
              <input className='input' name={`issue${i}Impact`} placeholder={`Issue ${i} Impact (Sales/Ops/CX)`}/>
              <input className='input' name={`issue${i}Text`} placeholder={`Issue ${i} — description`} required/>
            </div>
          ))}
          <div className='flex gap-3 pt-2'>
            <button className='btn'>Save draft</button>
            <button className='btn-primary sheen'>Submit weekly Top-3</button>
          </div>
        </form>
      </main>
    </PasscodeGate>
  );
}
