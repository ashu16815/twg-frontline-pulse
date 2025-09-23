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
    hit_target: false,
    target_variance_pct: -6,
    variance_dollars: -14500,
    r1_dept: 'Apparel',
    r1_subcat: 'Womens',
    r1_driver: 'Availability',
    r1_text: 'Core sizes missing on promo lines',
    r1_dollar_impact: -8000,
    r2_dept: 'Apparel',
    r2_subcat: 'Womens',
    r2_driver: 'Roster/Sickness',
    r2_text: 'Sat shift short-staffed (2 sick)',
    r2_dollar_impact: -4000,
    r3_dept: 'Toys',
    r3_subcat: 'Promo',
    r3_driver: 'Late Delivery',
    r3_text: 'Key promo arrived Sunday',
    r3_dollar_impact: -2500,
    priority1: 'Lock supplier ETA for Toy promo',
    priority1_horizon: 'Next Month',
    priority2: 'Backfill Sat roster with flex pool',
    priority2_horizon: 'Next Month',
    priority3: 'Size depth fix on Womens denim',
    priority3_horizon: 'Next Quarter',
    themes: ['Availability', 'Roster/Sickness', 'Late Delivery']
  },
  {
    store_id: 'ST-014',
    store_name: 'TWG Manukau',
    region: 'Central',
    hit_target: true,
    target_variance_pct: 3,
    variance_dollars: 7200,
    r1_dept: 'Electronics',
    r1_subcat: 'Audio',
    r1_driver: 'Availability',
    r1_text: 'Great availability on promo SKUs',
    r1_dollar_impact: 5000,
    r2_dept: 'Apparel',
    r2_subcat: 'Womens',
    r2_driver: 'Fitting Rooms',
    r2_text: 'Queues at peak times',
    r2_dollar_impact: -1200,
    r3_dept: 'Outdoor',
    r3_subcat: 'Bulky',
    r3_driver: 'Space/Planogram',
    r3_text: 'Overflow in stockroom limiting shelf',
    r3_dollar_impact: -1000,
    priority1: 'Add weekend FR coverage',
    priority1_horizon: 'Next Month',
    priority2: 'Bulky overflow plan with DC',
    priority2_horizon: 'Next Quarter',
      priority3: 'Womens FR process tweak',
    priority3_horizon: 'Next Month',
    themes: ['Availability', 'Fitting Rooms', 'Bulky Stock']
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
      summary: 'Missed target driven by Womens Apparel availability and Sat roster gaps; Toy promo late.',
      top_themes: ['Availability', 'Roster/Sickness', 'Late Delivery'],
      total_reported_impact: -14500,
      top_drivers: [
        { driver: 'Availability', dollars: -8000, count: 1 },
        { driver: 'Roster/Sickness', dollars: -4000, count: 1 },
        { driver: 'Late Delivery', dollars: -2500, count: 1 }
      ]
    },
    {
      iso_week: isoWeek,
      region: 'Central',
      summary: 'Met target with Electronics availability; negatives from FR queues and bulky overflow.',
      top_themes: ['Availability', 'Fitting Rooms', 'Bulky Stock'],
      total_reported_impact: 7200,
      top_drivers: [
        { driver: 'Availability', dollars: 5000, count: 1 },
        { driver: 'Fitting Rooms', dollars: -1200, count: 1 },
        { driver: 'Bulky Stock', dollars: -1000, count: 1 }
      ]
    }
  ];
  await post('weekly_summary', summaries);
  
  console.log('Seed complete.');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
