'use client';

import VoiceRecorder from '@/components/VoiceRecorder';

export default function PerformanceForm() {
  const drivers = ['Availability', 'Late Delivery', 'Roster/Sickness', 'Space/Planogram', 'Fitting Rooms', 'Promo On-Shelf', 'Replen Backlog', 'POS Stability', 'Bulky Stock'];
  
  const handleText = (text: string) => {
    const parts = (text || '').split(/;|\.|\n/).filter(Boolean);
    const set = (n: string, v: string) => {
      const el = document.querySelector(`[name="${n}"]`) as HTMLInputElement;
      if (el) el.value = v;
    };
    if (parts[0]) set('r1Text', parts[0].trim());
    if (parts[1]) set('r2Text', parts[1].trim());
    if (parts[2]) set('r3Text', parts[2].trim());
  };

  return (
    <form className='card p-6 rounded-xl grid gap-4' action='/api/weekly/performance/submit' method='post' id='perfForm'>
      <div className='grid grid-cols-2 gap-3'>
        <input className='input' name='storeId' placeholder='Store ID' required />
        <input className='input' name='storeName' placeholder='Store Name' required />
      </div>
      <div className='grid grid-cols-2 gap-3'>
        <input className='input' name='region' placeholder='Region' required />
        <input className='input' name='managerEmail' placeholder='Manager Email (optional)' />
      </div>

      <fieldset className='border rounded-lg p-4'>
        <legend className='px-2 text-sm text-slate-600'>Target result</legend>
        <div className='grid md:grid-cols-3 gap-3'>
          <select className='input' name='hitTarget' required>
            <option value='hit'>Met/Beat target</option>
            <option value='miss'>Missed target</option>
          </select>
          <input className='input' name='variancePct' placeholder='% variance vs target (e.g., -6)' />
          <input className='input' name='varianceDollars' placeholder='$ variance (e.g., -14500)' />
        </div>
      </fieldset>

      <div className='space-y-3'>
        <h3 className='text-sm font-medium text-slate-700'>Voice Input (speak your 3 reasons):</h3>
        <VoiceRecorder onText={handleText} />
      </div>

      {[1, 2, 3].map(i => (
        <fieldset key={i} className='border rounded-lg p-4'>
          <legend className='px-2 text-sm text-slate-600'>Reason #{i}</legend>
          <div className='grid md:grid-cols-4 gap-3'>
            <input className='input' name={`r${i}Dept`} placeholder='Department (e.g., Apparel)' required />
            <input className='input' name={`r${i}Subcat`} placeholder='Subcategory (e.g., Womens)' required />
            <select className='input' name={`r${i}Driver`} required>
              {drivers.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <input className='input' name={`r${i}Impact`} placeholder='$ impact (e.g., -8000)' required />
          </div>
          <input className='input mt-3' name={`r${i}Text`} placeholder='Describe concisely (what/why)' required />
        </fieldset>
      ))}

      <fieldset className='border rounded-lg p-4'>
        <legend className='px-2 text-sm text-slate-600'>Top-3 priorities</legend>
        {[1, 2, 3].map(i => (
          <div key={i} className='grid md:grid-cols-2 gap-3 mb-2'>
            <input className='input' name={`p${i}`} placeholder={`Priority #${i} (what do you need?)`} required />
            <select className='input' name={`p${i}H`} required>
              <option>Next Month</option>
              <option>Next Quarter</option>
            </select>
          </div>
        ))}
      </fieldset>

      <button className='btn'>Submit Check-in</button>
    </form>
  );
}
