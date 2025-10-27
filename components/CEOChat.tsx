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
    totalStores: number;
    totalRegions: number;
    totalImpact: number;
    positiveImpact: number;
    negativeImpact: number;
    positiveCount: number;
    negativeCount: number;
    neutralCount: number;
    daysPeriod: string;
  };
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function CEOChat() {
  const [q, setQ] = useState('What are the top risks in Auckland based stores?');
  const [tone, setTone] = useState<'concise' | 'narrative'>('concise');
  const [conversation, setConversation] = useState<Message[]>([]);
  const [feedbackData, setFeedbackData] = useState<CEOResponse | null>(null);
  const [showDrillDown, setShowDrillDown] = useState(false);
  const [loading, setLoading] = useState(false);

  async function ask() {
    // Don't allow empty questions
    if (!q.trim()) {
      return;
    }
    
    setLoading(true);
    
    // Add user message to conversation
    const userMessage: Message = { role: 'user', content: q };
    const updatedConversation = [...conversation, userMessage];
    setConversation(updatedConversation);
    
    try {
      const r = await fetch('/api/ceo/ask', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify({ 
          question: q,
          conversationHistory: updatedConversation.slice(0, -1), // Send previous messages
          tone,
          timestamp: Date.now() 
        })
      });
      
      if (!r.ok) {
        throw new Error(`HTTP error! status: ${r.status}`);
      }
      
      const j = await r.json();
      const assistantMessage: Message = { role: 'assistant', content: j.answer || j.error || 'No response received' };
      setConversation([...updatedConversation, assistantMessage]);
      setFeedbackData(j);
    } catch (error) {
      console.error('Error asking question:', error);
      const errorMessage: Message = { role: 'assistant', content: 'Sorry, I cannot answer questions right now. Please check the system status and try again later.' };
      setConversation([...updatedConversation, errorMessage]);
    } finally {
      setLoading(false);
      setQ(''); // Clear input
    }
  }

  function clearConversation() {
    setConversation([]);
    setFeedbackData(null);
    setShowDrillDown(false);
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-center flex-wrap">
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && !loading && q.trim() && ask()}
          className="input flex-1"
          placeholder="Ask about themes, risks, stores…"
          disabled={loading}
        />
        <select
          value={tone}
          onChange={e => setTone(e.target.value as 'concise' | 'narrative')}
          className="btn text-xs"
          disabled={loading}
        >
          <option value="concise">🎯 Concise</option>
          <option value="narrative">📝 Narrative</option>
        </select>
        <button 
          className="btn-primary sheen" 
          onClick={ask}
          disabled={loading || !q.trim()}
        >
          {loading ? '⏳' : 'Ask'}
        </button>
        {conversation.length > 0 && (
          <button 
            className="btn text-xs px-3 py-2"
            onClick={clearConversation}
          >
            Clear Chat
          </button>
        )}
      </div>
      
      {/* Conversation History */}
      {conversation.length > 0 && (
        <div className="card p-4 space-y-4 max-h-96 overflow-y-auto">
          {conversation.map((msg, idx) => (
            <div key={idx} className={`${msg.role === 'user' ? 'bg-blue-500/10 border-blue-500/20' : 'bg-gray-500/10 border-gray-500/20'} border rounded-lg p-3`}>
              <div className="text-xs font-semibold mb-1 opacity-70">
                {msg.role === 'user' ? '👤 You' : '🤖 Assistant'}
              </div>
              <div className="text-sm whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.content) }} />
            </div>
          ))}
          {loading && (
            <div className="bg-gray-500/10 border-gray-500/20 border rounded-lg p-3">
              <div className="text-xs font-semibold mb-1 opacity-70">🤖 Assistant</div>
              <div className="text-sm">Thinking…</div>
            </div>
          )}
        </div>
      )}
      
      {/* Show feedback data summary for the latest answer */}
      <div className="card p-4">
        {conversation.length === 0 && !loading && (
          <div className="text-xs opacity-70 italic">Ask a question to start the conversation...</div>
        )}
        
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
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
              <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded">
                <div className="font-medium text-gray-900 dark:text-gray-100">Stores</div>
                <div className="text-lg text-gray-900 dark:text-gray-100">{feedbackData.summary.totalStores}</div>
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded">
                <div className="font-medium text-gray-900 dark:text-gray-100">Regions</div>
                <div className="text-lg text-gray-900 dark:text-gray-100">{feedbackData.summary.totalRegions}</div>
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded">
                <div className="font-medium text-gray-900 dark:text-gray-100">Impact</div>
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

// Format markdown for display
function formatMarkdown(md: string) {
  return md
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/^\- (.+)$/gm, '<div class="ml-4">• $1</div>')
    .replace(/^# (.+)$/gm, '<div class="font-bold text-lg">$1</div>')
    .replace(/^## (.+)$/gm, '<div class="font-bold">$1</div>');
}
