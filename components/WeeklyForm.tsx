'use client';

import { useState } from 'react';
import VoiceRecorder from '@/components/VoiceRecorder';
import WebSpeechRecorder from '@/components/WebSpeechRecorder';
import StoreTypeahead from '@/components/StoreTypeahead';
import LoadingButton from '@/components/LoadingButton';

export default function WeeklyForm() {
  const [feedbackItems, setFeedbackItems] = useState([{ id: 1, type: 'positive' }]);
  const [nextId, setNextId] = useState(2);

  const handleText = (text: string) => {
    const parts = (text || '').split(/;|\.|\n/).filter(Boolean);
    const set = (n: string, v: string) => {
      const el = document.querySelector(`[name="${n}"]`) as HTMLInputElement;
      if (el) el.value = v;
    };
    parts.forEach((part, index) => {
      if (index < feedbackItems.length) {
        set(`feedback${index + 1}Text`, part.trim());
      }
    });
  };

  const addFeedbackItem = () => {
    setFeedbackItems([...feedbackItems, { id: nextId, type: 'positive' }]);
    setNextId(nextId + 1);
  };

  const removeFeedbackItem = (id: number) => {
    if (feedbackItems.length > 1) {
      setFeedbackItems(feedbackItems.filter(item => item.id !== id));
    }
  };

  const updateFeedbackType = (id: number, type: 'positive' | 'negative') => {
    setFeedbackItems(feedbackItems.map(item => 
      item.id === id ? { ...item, type } : item
    ));
  };

  return (
    <form className='card p-6 rounded-xl grid gap-4' action='/api/weekly/submit' method='post' id='weeklyForm'>
      <div className='space-y-4'>
        <h2 className='text-xl font-semibold'>Store Feedback</h2>
        <p className='text-sm opacity-80'>Share what's working well and what needs attention in your store.</p>
      </div>

      <div className='space-y-3'>
        <label className='text-sm font-medium'>Select Your Store</label>
        <StoreTypeahead />
        
        {/* Hidden canonical fields populated by typeahead */}
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
      
      {/* Voice Input - Hidden for now, will be added later */}
      {/* <div className='space-y-3'>
        <h3 className='text-sm font-medium text-slate-700'>Voice Input Options:</h3>
        <VoiceRecorder onText={handleText} />
        <WebSpeechRecorder onText={handleText} />
      </div> */}
      
      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <h3 className='text-sm font-medium text-slate-700'>Feedback Items (at least 1 required)</h3>
          <button 
            type='button' 
            onClick={addFeedbackItem}
            className='btn text-sm px-3 py-1'
          >
            + Add Item
          </button>
        </div>
        
        {feedbackItems.map((item, index) => (
          <div key={item.id} className='border rounded-lg p-4 space-y-3'>
            <div className='flex items-center justify-between'>
              <div className='flex gap-2'>
                <button
                  type='button'
                  onClick={() => updateFeedbackType(item.id, 'positive')}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    item.type === 'positive' 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                      : 'bg-white/5 text-white/60 border border-white/10'
                  }`}
                >
                  ✓ Positive
                </button>
                <button
                  type='button'
                  onClick={() => updateFeedbackType(item.id, 'negative')}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    item.type === 'negative' 
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                      : 'bg-white/5 text-white/60 border border-white/10'
                  }`}
                >
                  ✗ Challenge
                </button>
              </div>
              {feedbackItems.length > 1 && (
                <button
                  type='button'
                  onClick={() => removeFeedbackItem(item.id)}
                  className='text-red-400 hover:text-red-300 text-sm'
                >
                  Remove
                </button>
              )}
            </div>
            
            <div className='grid md:grid-cols-3 gap-3'>
              <input 
                className='input' 
                name={`feedback${index + 1}Category`} 
                placeholder='Category (Apparel/Home/Operations/…)' 
                required 
              />
              <input 
                className='input' 
                name={`feedback${index + 1}Impact`} 
                placeholder='Impact (Sales/Customer/Team/…)' 
              />
              <input 
                className='input' 
                name={`feedback${index + 1}DollarImpact`} 
                placeholder='$ Impact (optional)' 
              />
            </div>
            <input 
              className='input' 
              name={`feedback${index + 1}Text`} 
              placeholder={`${item.type === 'positive' ? 'What went well' : 'What needs attention'} - describe concisely`} 
              required 
            />
            <input type='hidden' name={`feedback${index + 1}Type`} value={item.type} />
          </div>
        ))}
      </div>

      <div className='space-y-3'>
        <label className='text-sm font-medium text-slate-700'>Additional Insights (optional)</label>
        <textarea 
          className='input min-h-[100px] resize-none' 
          name='additionalInsights' 
          placeholder='Competitor insights, team feedback, or any other commentary...'
        />
      </div>
      
      <LoadingButton type="submit" busyText="Submitting..." className='btn-primary'>
        Submit Store Feedback
      </LoadingButton>
      <div id='submitMsg' className='text-sm text-slate-600'></div>
    </form>
  );
}
