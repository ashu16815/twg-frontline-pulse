import 'dotenv/config';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const fetchFn = global.fetch || ((await import('node-fetch')).default);

function wk(d) {
  const t = new Date(d);
  t.setHours(0, 0, 0, 0);
  const onejan = new Date(t.getFullYear(), 0, 1);
  const w = Math.ceil((((t - onejan) / 86400000) + onejan.getDay() + 1) / 7);
  return `${t.getFullYear()}-W${w}`;
}

const isoWeek = wk(new Date());

const rows = [
  {
    store_id: 'ST-001',
    store_name: 'TWG Albany',
    region: 'North',
    issue1_cat: 'Apparel',
    issue1_text: 'Apparel down 10% due to late container arrival',
    issue1_impact: 'Sales',
    issue2_cat: 'Home',
    issue2_text: 'Home down 7% due to stockroom congestion',
    issue2_impact: 'Ops',
    issue3_cat: 'Toys',
    issue3_text: 'Toys down 5% due to supplier delay on promo lines',
    issue3_impact: 'Sales',
    overall_mood: 'neg',
    themes: ['Late Delivery', 'Stockroom Ops', 'Supplier Delay']
  },
  {
    store_id: 'ST-014',
    store_name: 'TWG Manukau',
    region: 'Central',
    issue1_cat: 'Electronics',
    issue1_text: 'Electronics up 3% with strong availability',
    issue1_impact: 'Sales',
    issue2_cat: 'Apparel',
    issue2_text: 'Fitting rooms understaffed causing queues',
    issue2_impact: 'CX',
    issue3_cat: 'Outdoor',
    issue3_text: 'Bulky stock overflow blocking aisles',
    issue3_impact: 'Ops',
    overall_mood: 'neu',
    themes: ['Availability', 'Staffing Shortfall', 'Bulky Stock']
  },
  {
    store_id: 'ST-027',
    store_name: 'TWG Dunedin',
    region: 'South',
    issue1_cat: 'Toys',
    issue1_text: 'Promo not on shelf by Saturday',
    issue1_impact: 'Sales',
    issue2_cat: 'Home',
    issue2_text: 'Planogram reset delayed',
    issue2_impact: 'Ops',
    issue3_cat: 'Replen',
    issue3_text: 'Replenishment lag on fast movers',
    issue3_impact: 'Ops',
    overall_mood: 'neg',
    themes: ['Promo On-Shelf', 'Planogram Compliance', 'Replen Backlog']
  },
  {
    store_id: 'ST-033',
    store_name: 'TWG Riccarton',
    region: 'South',
    issue1_cat: 'Apparel',
    issue1_text: 'Sizes missing on key lines',
    issue1_impact: 'Sales',
    issue2_cat: 'People',
    issue2_text: 'Two sick leaves on Saturday shift',
    issue2_impact: 'Ops',
    issue3_cat: 'Systems',
    issue3_text: 'POS freeze during peak hour',
    issue3_impact: 'Ops',
    overall_mood: 'neg',
    themes: ['Size Gaps', 'Staffing Shortfall', 'POS Stability']
  }
];

async function post(table, data) {
  const r = await fetchFn(`${url}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  if (!r.ok) throw new Error(await r.text());
}

async function main() {
  console.log('Seeding store_feedback…');
  await post('store_feedback', rows.map(r => ({ ...r, iso_week: isoWeek })));
  
  console.log('Creating weekly_summary…');
  const summaries = [
    {
      iso_week: isoWeek,
      region: 'North',
      summary: 'Late deliveries impacting Apparel; stockroom congestion limiting flow to floor. Toys promo delays noted. Actions: supplier escalation; surge labour; planogram check.',
      top_themes: ['Late Delivery', 'Stockroom Ops', 'Promo On-Shelf']
    },
    {
      iso_week: isoWeek,
      region: 'Central',
      summary: 'Availability strong in Electronics; staffing gaps in Apparel fitting rooms; Outdoor bulky stock constraining space. Actions: roster adjust; overflow plan; weekend coverage.',
      top_themes: ['Availability', 'Staffing Shortfall', 'Bulky Stock']
    },
    {
      iso_week: isoWeek,
      region: 'South',
      summary: 'Promo execution delayed in Toys; planogram reset slippage; replen lag on fast movers. Actions: tighten promo ETA; reset cadence; replen SLAs.',
      top_themes: ['Promo On-Shelf', 'Planogram Compliance', 'Replen Backlog']
    }
  ];
  await post('weekly_summary', summaries);
  
  console.log('Seed complete.');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
