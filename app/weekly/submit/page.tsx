import PasscodeGate from '@/components/PasscodeGate';
import VoiceRecorder from '@/components/VoiceRecorder';

export default function Page() {
  return (
    <PasscodeGate>
      <main className='max-w-3xl mx-auto p-8 space-y-4'>
        <h1 className='text-2xl font-semibold'>Weekly Top-3 Feedback</h1>
        <p className='text-slate-600'>
          Speak or type. Example: "Apparel down 8% due to stockouts; Home down 5% bays not set; Toys down 4% late delivery."
        </p>
        <Form />
      </main>
    </PasscodeGate>
  );
}

function Form() {
  return (
    <form className='card p-6 rounded-xl grid gap-3' action='/api/weekly/submit' method='post' id='weeklyForm'>
      <div className='grid grid-cols-2 gap-3'>
        <input className='input' name='storeId' placeholder='Store ID' required />
        <input className='input' name='storeName' placeholder='Store Name' required />
      </div>
      <div className='grid grid-cols-2 gap-3'>
        <input className='input' name='region' placeholder='Region' required />
        <input className='input' name='managerEmail' placeholder='Manager Email (optional)' />
      </div>
      
      <VoiceRecorder onText={(text) => {
        const parts = (text || '').split(/;|\.|\n/).filter(Boolean);
        const set = (n: string, v: string) => {
          const el = document.querySelector(`[name="${n}"]`) as HTMLInputElement;
          if (el) el.value = v;
        };
        if (parts[0]) set('issue1Text', parts[0].trim());
        if (parts[1]) set('issue2Text', parts[1].trim());
        if (parts[2]) set('issue3Text', parts[2].trim());
      }} />
      
      {[1, 2, 3].map(i => (
        <div key={i} className='grid md:grid-cols-3 gap-3'>
          <input className='input' name={`issue${i}Cat`} placeholder='Category (Apparel/Home/…)' required />
          <input className='input' name={`issue${i}Impact`} placeholder='Impact (Sales/Ops/CX)' />
          <input className='input' name={`issue${i}Text`} placeholder={`Issue #${i}`} required />
        </div>
      ))}
      
      <button className='btn'>Submit Weekly Top-3</button>
      <div id='submitMsg' className='text-sm text-slate-600'></div>
    </form>
  );
}