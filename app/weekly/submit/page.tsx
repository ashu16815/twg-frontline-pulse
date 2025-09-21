import PasscodeGate from '@/components/PasscodeGate';

export default function Page() {
  return (
    <PasscodeGate>
      <main className='max-w-5xl mx-auto px-6 py-10'>
        <h1 className='text-2xl font-semibold mb-2'>Weekly Top-3 Feedback</h1>
        <p className='opacity-70 mb-6'>Example: "Apparel down 8% due to stockouts of Y; Home down 5% due to bays not set; Toys down 4% due to late delivery."</p>
        <form className='card rounded-3xl grid gap-4' action='/api/weekly/submit' method='post'>
          <div className='grid md:grid-cols-3 gap-3'>
            <input className='input' name='storeId' placeholder='Store ID' required/>
            <input className='input' name='storeName' placeholder='Store Name' required/>
            <input className='input' name='region' placeholder='Region' required/>
          </div>
          <div className='grid md:grid-cols-3 gap-3'>
            <input className='input' name='managerEmail' placeholder='Manager Email (optional)'/>
            <input className='input' name='issue1Cat' placeholder='Issue 1 Category' required/>
            <input className='input' name='issue1Impact' placeholder='Issue 1 Impact (Sales/Ops/CX)'/>
          </div>
          <input className='input' name='issue1Text' placeholder='Issue 1 — description' required/>
          <div className='grid md:grid-cols-2 gap-3'>
            <input className='input' name='issue2Cat' placeholder='Issue 2 Category' required/>
            <input className='input' name='issue2Impact' placeholder='Issue 2 Impact'/>
          </div>
          <input className='input' name='issue2Text' placeholder='Issue 2 — description' required/>
          <div className='grid md:grid-cols-2 gap-3'>
            <input className='input' name='issue3Cat' placeholder='Issue 3 Category' required/>
            <input className='input' name='issue3Impact' placeholder='Issue 3 Impact'/>
          </div>
          <input className='input' name='issue3Text' placeholder='Issue 3 — description' required/>
          <div className='flex gap-3 pt-2'>
            <button className='btn'>Save draft</button>
            <button className='btn-primary sheen'>Submit weekly Top-3</button>
          </div>
        </form>
      </main>
    </PasscodeGate>
  );
}
