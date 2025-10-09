'use client';

import { useState } from 'react';
import VoiceRecorder from '@/components/VoiceRecorder';
import WebSpeechRecorder from '@/components/WebSpeechRecorder';
import StoreTypeahead from '@/components/StoreTypeahead';

export default function FrontlineForm() {
  const [positiveItems, setPositiveItems] = useState([{ id: 1 }]);
  const [negativeItems, setNegativeItems] = useState([{ id: 1 }]);
  const [nextPositiveId, setNextPositiveId] = useState(2);
  const [nextNegativeId, setNextNegativeId] = useState(2);

  const handleText = (text: string) => {
    const parts = (text || '').split(/;|\.|\n/).filter(Boolean);
    const set = (n: string, v: string) => {
      const el = document.querySelector(`[name="${n}"]`) as HTMLInputElement;
      if (el) el.value = v;
    };
    
    // Auto-populate feedback items
    parts.forEach((part, index) => {
      if (index < positiveItems.length) {
        set(`top_positive${index === 0 ? '' : '_' + (index + 1)}`, part.trim());
      }
    });
  };

  const addPositiveItem = () => {
    if (positiveItems.length < 3) {
      setPositiveItems([...positiveItems, { id: nextPositiveId }]);
      setNextPositiveId(nextPositiveId + 1);
    }
  };

  const removePositiveItem = (id: number) => {
    if (positiveItems.length > 1) {
      setPositiveItems(positiveItems.filter(item => item.id !== id));
    }
  };

  const addNegativeItem = () => {
    if (negativeItems.length < 3) {
      setNegativeItems([...negativeItems, { id: nextNegativeId }]);
      setNextNegativeId(nextNegativeId + 1);
    }
  };

  const removeNegativeItem = (id: number) => {
    if (negativeItems.length > 1) {
      setNegativeItems(negativeItems.filter(item => item.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <h1 className="text-3xl font-bold">Frontline Feedback</h1>
          </div>
          <p className="text-gray-300 text-lg">Share your store's performance insights</p>
          <p className="text-sm text-gray-400">Help us understand what's working and what needs attention</p>
        </div>

        <form className="space-y-8" action="/api/frontline/submit" method="post" id="frontlineForm">
          {/* Store Selection */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h2 className="text-xl font-semibold mb-4 text-white">Store Information</h2>
            <StoreTypeahead />
            
            {/* Hidden canonical fields populated by typeahead */}
            <input type="hidden" name="storeId" />
            <input type="hidden" name="storeName" />
            <input type="hidden" name="region" />
            <input type="hidden" name="regionCode" />
            <input type="hidden" name="storeCode" />
            <input type="hidden" name="banner" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <input 
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-red-500 focus:ring-1 focus:ring-red-500" 
                name="managerEmail" 
                placeholder="Manager Email (optional)" 
                type="email"
              />
              <input 
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-red-500 focus:ring-1 focus:ring-red-500" 
                name="managerName" 
                placeholder="Manager Name (optional)" 
              />
            </div>
          </div>

          {/* Voice Input */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h3 className="text-lg font-semibold mb-4 text-white">Voice Input (Optional)</h3>
            <p className="text-sm text-gray-400 mb-4">Speak your feedback and we'll transcribe it for you</p>
            <div className="space-y-3">
              <VoiceRecorder onText={handleText} />
              <WebSpeechRecorder onText={handleText} />
            </div>
          </div>

          {/* Positive Feedback - Multiple Items */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">✓ Top Performing Areas</h3>
              <span className="text-sm text-gray-400">Up to 3 items</span>
            </div>
            <p className="text-sm text-gray-400 mb-4">What went really well this week? (Optional but encouraged)</p>
            
            <div className="space-y-4">
              {positiveItems.map((item, index) => (
                <div key={item.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-green-400">Success #{index + 1}</span>
                    {positiveItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePositiveItem(item.id)}
                        className="text-gray-400 hover:text-gray-300 text-sm px-2 py-1 rounded hover:bg-gray-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="space-y-3">
                    <input 
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-green-500 focus:ring-1 focus:ring-green-500" 
                      name={index === 0 ? 'top_positive' : `top_positive_${index + 1}`}
                      placeholder="e.g., Apparel sales exceeded target by 15% due to new display layout" 
                    />
                    <input 
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-green-500 focus:ring-1 focus:ring-green-500" 
                      name={index === 0 ? 'top_positive_impact' : `top_positive_${index + 1}_impact`}
                      placeholder="Estimated $ impact (optional)" 
                      type="number"
                      step="0.01"
                    />
                  </div>
                </div>
              ))}
              
              {positiveItems.length < 3 && (
                <button
                  type="button"
                  onClick={addPositiveItem}
                  className="w-full border-2 border-dashed border-gray-600 rounded-lg px-4 py-3 text-gray-400 hover:text-green-400 hover:border-green-500 transition-colors"
                >
                  + Add Another Success
                </button>
              )}
            </div>
          </div>

          {/* Negative Feedback */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">✗ Top Performance Misses</h3>
              <span className="text-sm text-gray-400">Up to 3 items</span>
            </div>
            <p className="text-sm text-gray-400 mb-4">What are the key challenges impacting your store's performance?</p>
            
            <div className="space-y-4">
              {negativeItems.map((item, index) => (
                <div key={item.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-300">Issue #{index + 1}</span>
                    {negativeItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeNegativeItem(item.id)}
                        className="text-red-400 hover:text-red-300 text-sm px-2 py-1 rounded hover:bg-red-500/10"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="space-y-3">
                    <input 
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-red-500 focus:ring-1 focus:ring-red-500" 
                      name={`top_negative_${index + 1}`} 
                      placeholder="Describe the challenge concisely" 
                      required={index === 0}
                    />
                    <input 
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-red-500 focus:ring-1 focus:ring-red-500" 
                      name={`top_negative_${index + 1}_impact`} 
                      placeholder="Estimated $ impact (optional)" 
                      type="number"
                      step="0.01"
                    />
                  </div>
                </div>
              ))}
              
              {negativeItems.length < 3 && (
                <button
                  type="button"
                  onClick={addNegativeItem}
                  className="w-full border-2 border-dashed border-gray-600 rounded-lg p-4 text-gray-400 hover:text-white hover:border-red-500 transition-colors"
                >
                  + Add Another Challenge
                </button>
              )}
            </div>
          </div>

          {/* Next Actions */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h3 className="text-lg font-semibold mb-4 text-white">Next Month/Quarter Priorities</h3>
            <p className="text-sm text-gray-400 mb-4">What do you need to win in the coming period?</p>
            <textarea 
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 min-h-[100px] resize-none" 
              name="next_actions" 
              placeholder="e.g., Need additional staff for peak hours, better inventory management system, improved supplier communication..."
            />
          </div>

          {/* Additional Insights */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h3 className="text-lg font-semibold mb-4 text-white">Additional Insights</h3>
            <p className="text-sm text-gray-400 mb-4">Competitor observations, local context, team feedback, or other commentary</p>
            <textarea 
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 min-h-[100px] resize-none" 
              name="freeform_comments" 
              placeholder="e.g., Competitor opened new store nearby, local events affecting foot traffic, team morale insights..."
            />
          </div>

          {/* Overall Impact */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h3 className="text-lg font-semibold mb-4 text-white">Overall Impact Estimate</h3>
            <p className="text-sm text-gray-400 mb-4">What's the total estimated dollar impact of this week's performance?</p>
            <input 
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-red-500 focus:ring-1 focus:ring-red-500" 
              name="estimated_dollar_impact" 
              placeholder="e.g., -5000 (negative impact) or +3000 (positive impact)" 
              type="number"
              step="0.01"
            />
          </div>

          {/* Submit Button */}
          <div className="text-center">
            <button 
              type="submit"
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Submit My Store Report
            </button>
            <p className="text-sm text-gray-400 mt-3">Your feedback helps us improve store performance</p>
          </div>
        </form>
      </div>
    </div>
  );
}

