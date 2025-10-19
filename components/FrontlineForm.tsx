'use client';

import { useState, useEffect, useCallback } from 'react';
import VoiceRecorder from '@/components/VoiceRecorder';
import WebSpeechRecorder from '@/components/WebSpeechRecorder';
import StoreTypeahead from '@/components/StoreTypeahead';
import LoadingButton from '@/components/LoadingButton';

export default function FrontlineForm() {
  const [positiveItems, setPositiveItems] = useState([{ id: 1 }]);
  const [negativeItems, setNegativeItems] = useState([{ id: 1 }]);
  const [nextPositiveId, setNextPositiveId] = useState(2);
  const [nextNegativeId, setNextNegativeId] = useState(2);
  const [selectedStore, setSelectedStore] = useState<any>(null);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  // Auto-save functionality
  const autoSave = useCallback(async () => {
    if (!selectedStore) return;

    try {
      const formData = new FormData();
      const form = document.querySelector('form') as HTMLFormElement;
      if (!form) return;

      // Collect all form data
      const data: Record<string, string> = {};
      const formElements = form.querySelectorAll('input, textarea, select');
      formElements.forEach((element: any) => {
        if (element.name && element.value) {
          data[element.name] = element.value;
        }
      });

      // Add store information
      data.storeId = selectedStore.store_id;
      data.storeName = selectedStore.store_name;
      data.region = selectedStore.region;
      data.regionCode = selectedStore.region_code;

      const response = await fetch('/api/frontline/autosave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          storeId: selectedStore.store_id,
          formData: data
        })
      });

      if (response.ok) {
        setLastSaved(new Date());
        console.log('✅ Form auto-saved');
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }, [selectedStore, sessionId]);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!selectedStore) return;

    const interval = setInterval(autoSave, 30000);
    return () => clearInterval(interval);
  }, [autoSave, selectedStore]);

  // Auto-save on form changes (debounced)
  useEffect(() => {
    if (!selectedStore) return;

    const timeoutId = setTimeout(autoSave, 2000); // 2 second delay
    return () => clearTimeout(timeoutId);
  }, [positiveItems, negativeItems, selectedStore, autoSave]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const form = e.target as HTMLFormElement;
      const formData = new FormData(form);

      // Add idempotency key and session info
      formData.append('idempotency_key', `frontline_${sessionId}_${Date.now()}`);
      formData.append('session_id', sessionId);

      const response = await fetch('/api/frontline/submit', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        setSubmitMessage('✅ Feedback submitted successfully! AI analysis will be completed in the background.');
        // Clear form after successful submission
        form.reset();
        setPositiveItems([{ id: 1 }]);
        setNegativeItems([{ id: 1 }]);
        
        // Redirect after a short delay
        setTimeout(() => {
          window.location.href = result.redirect || '/reports';
        }, 2000);
      } else {
        setSubmitMessage(`❌ Error: ${result.error || 'Submission failed'}`);
      }
    } catch (error: any) {
      setSubmitMessage(`❌ Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Auto-save status */}
      <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>Auto-save enabled</span>
          </div>
          {lastSaved && (
            <span className="text-blue-300">
              Last saved: {lastSaved.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Store Selection */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Store Information</h2>
          <StoreTypeahead onSelect={setSelectedStore} />
          {selectedStore && (
            <div className="mt-2 p-2 bg-green-500/10 border border-green-500/20 rounded">
              <p className="text-sm text-green-300">
                Selected: {selectedStore.store_name} ({selectedStore.store_id}) - {selectedStore.region}
              </p>
            </div>
          )}
        </div>

        {/* Voice Recording */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Voice Recording</h2>
          <div className="flex gap-4">
            <VoiceRecorder onText={handleText} />
            <WebSpeechRecorder onText={handleText} />
          </div>
        </div>

        {/* Positive Feedback */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">What's Working Well</h2>
            {positiveItems.length < 3 && (
              <button
                type="button"
                onClick={addPositiveItem}
                className="btn btn-sm"
              >
                + Add Positive
              </button>
            )}
          </div>
          {positiveItems.map((item, index) => (
            <div key={item.id} className="mb-4 p-4 border border-white/10 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">
                  Positive Feedback #{index + 1}
                </label>
                {positiveItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePositiveItem(item.id)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
              <textarea
                name={`top_positive${index === 0 ? '' : '_' + (index + 1)}`}
                placeholder="Describe what's working well..."
                className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50"
                rows={3}
              />
              <div className="mt-2">
                <label className="text-sm text-white/70">Estimated Impact ($)</label>
                <input
                  type="number"
                  name={`top_positive${index === 0 ? '' : '_' + (index + 1)}_impact`}
                  placeholder="0"
                  className="w-full p-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Negative Feedback */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">What's Not Working</h2>
            {negativeItems.length < 3 && (
              <button
                type="button"
                onClick={addNegativeItem}
                className="btn btn-sm"
              >
                + Add Issue
              </button>
            )}
          </div>
          {negativeItems.map((item, index) => (
            <div key={item.id} className="mb-4 p-4 border border-white/10 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">
                  Issue #{index + 1}
                </label>
                {negativeItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeNegativeItem(item.id)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
              <textarea
                name={`top_negative_${index + 1}`}
                placeholder="Describe the issue..."
                className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50"
                rows={3}
              />
              <div className="mt-2">
                <label className="text-sm text-white/70">Estimated Impact ($)</label>
                <input
                  type="number"
                  name={`top_negative_${index + 1}_impact`}
                  placeholder="0"
                  className="w-full p-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Additional Information */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Additional Information</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-white/70">Next Actions</label>
              <textarea
                name="next_actions"
                placeholder="What actions will you take next week?"
                className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50"
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm text-white/70">Additional Comments</label>
              <textarea
                name="freeform_comments"
                placeholder="Any other feedback or comments..."
                className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50"
                rows={4}
              />
            </div>
            <div>
              <label className="text-sm text-white/70">Total Estimated Dollar Impact</label>
              <input
                type="number"
                name="estimated_dollar_impact"
                placeholder="0"
                className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="card">
          <LoadingButton
            onClick={() => {}}
            className="btn-primary w-full"
            disabled={!selectedStore || isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </LoadingButton>
          
          {submitMessage && (
            <div className={`mt-4 p-3 rounded-lg text-sm ${
              submitMessage.includes('✅') 
                ? 'bg-green-500/10 border border-green-500/20 text-green-300'
                : 'bg-red-500/10 border border-red-500/20 text-red-300'
            }`}>
              {submitMessage}
            </div>
          )}
        </div>
      </form>
    </div>
  );
}