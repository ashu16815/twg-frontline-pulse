// Mock version of WeeklyCards for demonstration
export default function MockWeeklyCards() {
  const thisWeek = 'FY26-W11'; // Mock current week (financial year format)
  const mockSummaries = [
    {
      region: 'North',
      summary: 'Late deliveries impacting Apparel; stockroom congestion limiting flow to floor. Toys promo delays noted. Actions: supplier escalation; surge labour; planogram check.',
      top_themes: ['Late Delivery', 'Stockroom Ops', 'Promo On-Shelf']
    },
    {
      region: 'Central', 
      summary: 'Availability strong in Electronics; staffing gaps in Apparel fitting rooms; Outdoor bulky stock constraining space. Actions: roster adjust; overflow plan; weekend coverage.',
      top_themes: ['Availability', 'Staffing Shortfall', 'Bulky Stock']
    },
    {
      region: 'South',
      summary: 'Promo execution delayed in Toys; planogram reset slippage; replen lag on fast movers. Actions: tighten promo ETA; reset cadence; replen SLAs.',
      top_themes: ['Promo On-Shelf', 'Planogram Compliance', 'Replen Backlog']
    }
  ];

  return (
    <section className="grid md:grid-cols-3 gap-4">
      {mockSummaries.map(s => (
        <div key={s.region} className="card p-5 rounded-xl space-y-2">
          <div className="text-xs text-slate-500">{thisWeek} • {s.region}</div>
          <div className="font-medium">{s.summary}</div>
          <div className="text-sm text-slate-600">
            Themes: {s.top_themes.join(', ')}
          </div>
        </div>
      ))}
    </section>
  );
}
