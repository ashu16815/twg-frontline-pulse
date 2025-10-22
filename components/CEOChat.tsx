'use client';

import { useState } from 'react';

interface FeedbackEntry {
  id: number;
  store_id: string;
  region_code: string;
  mood: string;
  positive: string;
  issues: Array<{ text: string; dollars: number }>;
  comments: string;
  totalImpact: number;
}

interface CEOResponse {
  answer: string;
  feedbackDrillDown: FeedbackEntry[];
  summary: {
    totalEntries: number;
    totalImpact: number;
    positiveCount: number;
    negativeCount: number;
    neutralCount: number;
    week: string;
  };
}

export default function CEOChat() {
  const [q, setQ] = useState('What are the top risks in Region North this week?');
  const [a, setA] = useState('');
  const [feedbackData, setFeedbackData] = useState<CEOResponse | null>(null);
  const [showDrillDown, setShowDrillDown] = useState(false);

  async function ask() {
    setA('Thinking…');
    setFeedbackData(null);
    
    try {
      const r = await fetch('/api/ceo/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q })
      });
      
      if (!r.ok) {
        throw new Error(`HTTP error! status: ${r.status}`);
      }
      
      const j = await r.json();
      setA(j.answer || j.error || 'No response received');
      setFeedbackData(j);
    } catch (error) {
      console.error('Error asking question:', error);
      setA('Sorry, I cannot answer questions right now. Please check the system status and try again later.');
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          className="input"
          placeholder="Ask about themes, risks, stores…"
        />
        <button className="btn-primary sheen" onClick={ask}>
          Ask
        </button>
      </div>
      
      <div className="card p-4">
        {a || ' '}
        
        {feedbackData && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">Feedback Analysis Summary</h3>
              <button 
                className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
                onClick={() => setShowDrillDown(!showDrillDown)}
              >
                {showDrillDown ? '🔼 Hide Details' : '🔽 Show Details'}
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded">
                <div className="font-medium text-gray-900 dark:text-gray-100">Total Entries</div>
                <div className="text-lg text-gray-900 dark:text-gray-100">{feedbackData.summary.totalEntries}</div>
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded">
                <div className="font-medium text-gray-900 dark:text-gray-100">Total Impact</div>
                <div className="text-lg text-gray-900 dark:text-gray-100">${feedbackData.summary.totalImpact.toLocaleString()}</div>
              </div>
              <div className="bg-green-100 dark:bg-green-900 p-2 rounded">
                <div className="font-medium text-green-800 dark:text-green-200">Positive</div>
                <div className="text-lg text-green-800 dark:text-green-200">{feedbackData.summary.positiveCount}</div>
              </div>
              <div className="bg-red-100 dark:bg-red-900 p-2 rounded">
                <div className="font-medium text-red-800 dark:text-red-200">Negative</div>
                <div className="text-lg text-red-800 dark:text-red-200">{feedbackData.summary.negativeCount}</div>
              </div>
            </div>
            
            {showDrillDown && (
              <div className="mt-4 space-y-3">
                <h4 className="font-medium text-sm">Individual Feedback Entries</h4>
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {feedbackData.feedbackDrillDown.map((entry) => (
                    <div key={entry.id} className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          #{entry.id} - {entry.store_id} ({entry.region_code})
                        </div>
                        <div className={`px-2 py-1 rounded text-xs ${
                          entry.mood === 'pos' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                          entry.mood === 'neg' ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' :
                          'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                        }`}>
                          {entry.mood === 'pos' ? '😊 Positive' : 
                           entry.mood === 'neg' ? '😞 Negative' : '😐 Neutral'}
                        </div>
                      </div>
                      
                      {entry.positive && (
                        <div className="mb-2">
                          <div className="font-medium text-green-700 dark:text-green-400">✓ What's Working:</div>
                          <div className="text-gray-700 dark:text-gray-300">{entry.positive}</div>
                        </div>
                      )}
                      
                      {entry.issues.length > 0 && (
                        <div className="mb-2">
                          <div className="font-medium text-red-700 dark:text-red-400">⚠️ Issues:</div>
                          {entry.issues.map((issue, i) => (
                            <div key={i} className="text-gray-700 dark:text-gray-300">
                              • {issue.text} {issue.dollars ? `($${issue.dollars.toLocaleString()})` : ''}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {entry.comments && (
                        <div className="mb-2">
                          <div className="font-medium text-blue-700 dark:text-blue-400">💬 Comments:</div>
                          <div className="text-gray-700 dark:text-gray-300">{entry.comments}</div>
                        </div>
                      )}
                      
                      {entry.totalImpact > 0 && (
                        <div className="text-right font-medium text-red-600 dark:text-red-400">
                          Total Impact: ${entry.totalImpact.toLocaleString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="text-xs opacity-60">
        💡 Try asking: "How is Central region performing?" or "What themes are trending?"
      </div>
    </div>
  );
}
