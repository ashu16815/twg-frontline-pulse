'use client';

import { useState } from 'react';
import VoiceRecorder from '@/components/VoiceRecorder';
import StoreTypeahead from '@/components/StoreTypeahead';

export default function PerformanceForm() {
  const drivers = ['Availability', 'Late Delivery', 'Roster/Sickness', 'Space/Planogram', 'Fitting Rooms', 'Promo On-Shelf', 'Replen Backlog', 'POS Stability', 'Bulky Stock'];
  const [targetResult, setTargetResult] = useState<'hit' | 'miss'>('hit');
  
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
    <form className='card p-6 rounded-xl grid gap-6' action='/api/weekly/performance/submit' method='post' id='perfForm'>
      <div className='space-y-4'>
        <h2 className='text-xl font-semibold'>My Store Performance</h2>
        <p className='text-sm opacity-80'>Take ownership of your store's performance and explain the key drivers behind your results.</p>
      </div>

      <div className='space-y-3'>
        <label className='text-sm font-medium text-slate-700'>Select Your Store</label>
        <StoreTypeahead />
        
        {/* Hidden canonical fields populated by picker */}
        <input type='hidden' name='storeId' />
        <input type='hidden' name='storeName' />
        <input type='hidden' name='region' />
        <input type='hidden' name='regionCode' />
        <input type='hidden' name='storeCode' />
        <input type='hidden' name='banner' />
      </div>
      
      <div className='grid grid-cols-2 gap-3'>
        <input className='input' name='managerEmail' placeholder='Manager Email (optional)' />
        <input className='input' name='managerName' placeholder='Manager Name (optional)' />
      </div>

      <fieldset className='border rounded-lg p-4 space-y-4'>
        <legend className='px-2 text-sm text-slate-600 font-medium'>My Store's Target Performance</legend>
        <div className='grid md:grid-cols-3 gap-3'>
          <select 
            className='input' 
            name='hitTarget' 
            required
            value={targetResult}
            onChange={(e) => setTargetResult(e.target.value as 'hit' | 'miss')}
          >
            <option value='hit'>✓ Met/Beat target</option>
            <option value='miss'>✗ Missed target</option>
          </select>
          <input 
            className='input' 
            name='variancePct' 
            placeholder='% variance vs target (e.g., +5 or -6)' 
            type='number'
            step='0.1'
          />
          <input 
            className='input' 
            name='varianceDollars' 
            placeholder='$ variance (e.g., +12000 or -14500)' 
            type='number'
            step='100'
          />
        </div>
        <div className='text-xs opacity-70'>
          {targetResult === 'hit' 
            ? 'Great work! Help us understand what drove your success.' 
            : 'Let\'s learn from this. What were the main factors affecting performance?'
          }
        </div>
      </fieldset>

      <div className='space-y-3'>
        <h3 className='text-sm font-medium text-slate-700'>Voice Input (speak your 3 key drivers):</h3>
        <VoiceRecorder onText={handleText} />
      </div>

      {[1, 2, 3].map(i => (
        <fieldset key={i} className='border rounded-lg p-4 space-y-3'>
          <legend className='px-2 text-sm text-slate-600 font-medium'>
            Key Driver #{i} - {targetResult === 'hit' ? 'What drove success?' : 'What impacted performance?'}
          </legend>
          <div className='grid md:grid-cols-4 gap-3'>
            <input className='input' name={`r${i}Dept`} placeholder='Department (e.g., Apparel)' required />
            <input className='input' name={`r${i}Subcat`} placeholder='Subcategory (e.g., Womens)' required />
            <select className='input' name={`r${i}Driver`} required>
              {drivers.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <input 
              className='input' 
              name={`r${i}Impact`} 
              placeholder='$ impact (e.g., +8000 or -8000)' 
              type='number'
              step='100'
              required 
            />
          </div>
          <input 
            className='input' 
            name={`r${i}Text`} 
            placeholder={`${targetResult === 'hit' ? 'What went well and why?' : 'What happened and why?'} - be specific`} 
            required 
          />
        </fieldset>
      ))}

      <fieldset className='border rounded-lg p-4 space-y-3'>
        <legend className='px-2 text-sm text-slate-600 font-medium'>My Store's Top Priorities</legend>
        <p className='text-xs opacity-70'>What does your store need to improve performance next period?</p>
        {[1, 2, 3].map(i => (
          <div key={i} className='grid md:grid-cols-2 gap-3'>
            <input 
              className='input' 
              name={`p${i}`} 
              placeholder={`Priority #${i} - What do you need?`} 
              required 
            />
            <select className='input' name={`p${i}H`} required>
              <option value='next-month'>Next Month</option>
              <option value='next-quarter'>Next Quarter</option>
              <option value='next-6-months'>Next 6 Months</option>
            </select>
          </div>
        ))}
      </fieldset>

      <div className='space-y-3'>
        <label className='text-sm font-medium text-slate-700'>Additional Context (optional)</label>
        <textarea 
          className='input min-h-[100px] resize-none' 
          name='additionalContext' 
          placeholder='Any other insights about your store performance, team dynamics, or market conditions...'
        />
      </div>

      <button className='btn btn-primary'>Submit My Store Performance</button>
    </form>
  );
}
