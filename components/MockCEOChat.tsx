'use client';

import { useState } from 'react';

export default function MockCEOChat() {
  const [q, setQ] = useState('What are the top risks in Region North this week?');
  const [a, setA] = useState('');

  // Mock responses for demonstration
  const mockResponses: { [key: string]: string } = {
    'What are the top risks in Region North this week?': 'Region North faces three critical risks: 1) Late container arrivals causing 10% Apparel decline at Albany, 2) Stockroom congestion limiting floor flow, and 3) Toys promo delays. Immediate actions needed: supplier escalation, surge labor deployment, and planogram verification.',
    'How is Central region performing?': 'Central region shows mixed performance. Electronics up 3% with strong availability, but Apparel fitting rooms are understaffed causing customer queues. Outdoor bulky stock is blocking aisles. Recommended actions: roster adjustments, overflow planning, and weekend coverage.',
    'What themes are trending across all regions?': 'Top trending themes: 1) Staffing Shortfall (3 regions), 2) Late Delivery (2 regions), 3) Stockroom Ops (2 regions). These themes represent 60% of all reported issues this week.',
    'Which stores need immediate attention?': 'Priority stores: ST-001 Albany (North) - late deliveries, ST-033 Riccarton (South) - POS issues and staffing gaps, ST-027 Dunedin (South) - promo execution delays. All three show negative overall mood and require immediate intervention.',
    'What are the key action items?': 'Critical actions: 1) Supplier escalation for late deliveries (Ops), 2) Roster adjustments for staffing gaps (HR), 3) Overflow planning for bulky stock (Merchandising), 4) POS stability review (IT), 5) Promo execution process tightening (Marketing).'
  };

  async function ask() {
    setA('Thinking…');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Find best matching response
    const response = mockResponses[q] || 
      mockResponses[Object.keys(mockResponses).find(key => 
        q.toLowerCase().includes(key.toLowerCase().split(' ')[0])
      ) || ''] || 
      'I need more specific information about the data you\'re asking about. Try asking about specific regions, stores, themes, or performance metrics.';
    
    setA(response);
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
