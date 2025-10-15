'use client';

import { useState } from 'react';

export default function CEOChat() {
  const [q, setQ] = useState('What are the top risks in Region North this week?');
  const [a, setA] = useState('');

  async function ask() {
    setA('Thinking…');
    
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
      </div>
      <div className="text-xs opacity-60">
        💡 Try asking: "How is Central region performing?" or "What themes are trending?"
      </div>
    </div>
  );
}
