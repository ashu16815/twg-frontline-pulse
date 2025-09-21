import 'dotenv/config';
const url=process.env.NEXT_PUBLIC_SUPABASE_URL;const key=process.env.SUPABASE_SERVICE_ROLE_KEY;const fetchFn=global.fetch||((await import('node-fetch')).default);

function wk(d){const t=new Date(d);t.setHours(0,0,0,0);const j=new Date(t.getFullYear(),0,1);const w=Math.ceil((((t-j)/86400000)+j.getDay()+1)/7);return `${t.getFullYear()}-W${w}`}
const isoWeek = wk(new Date());

const demos = [
  {brand:'TWL',code:'209',store_id:'ST-001',store_name:'TWL Airport',region:'North', issues:[['Apparel','late container arrival','Sales','Apparel down 9% due to late container'],['Home','stockroom congestion','Ops','Bays blocked by bulky stock'],['Toys','supplier delay','Sales','Promo lines missed launch'] ]},
  {brand:'WSL',code:'338',store_id:'ST-338',store_name:'WSL Airport',region:'North', issues:[['Electronics','good availability','Sales','TVs strong, up 3%'],['Apparel','fitting room staffing','CX','Queues at peak'],['Outdoor','bulky overflow','Ops','Pallets in aisle Sat PM']]},
  {brand:'TWL',code:'220',store_id:'ST-220',store_name:'TWL Riccarton',region:'South', issues:[['Apparel','size gaps','Sales','Sizes 10/12 missing on key lines'],['People','sick leave','Ops','Two sick on Sat'],['Systems','POS freeze','Ops','POS froze at 3:05pm']]}
];

async function post(table,data){
  const r=await fetchFn(`${url}/rest/v1/${table}`,{method:'POST',headers:{'apikey':key,'Authorization':`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify(data)});
  if(!r.ok) throw new Error(await r.text());
}

(async()=>{
  if(!url||!key){console.log('Missing Supabase env; abort.');process.exit(1)}
  const rows = demos.map(x=>({
    iso_week: isoWeek,
    store_id: x.store_id,
    store_name: x.store_name,
    region: x.region,
    issue1_cat: x.issues[0][0], issue1_text: x.issues[0][3], issue1_impact: x.issues[0][2],
    issue2_cat: x.issues[1][0], issue2_text: x.issues[1][3], issue2_impact: x.issues[1][2],
    issue3_cat: x.issues[2][0], issue3_text: x.issues[2][3], issue3_impact: x.issues[2][2],
    overall_mood: 'neg', themes: ['Late Delivery','Stockroom Ops','Promo On-Shelf']
  }));
  console.log('Seeding feedback…');
  await post('store_feedback', rows);
  console.log('Seeding summaries…');
  await post('weekly_summary', [
    {iso_week: isoWeek, region:'North', summary:'Late deliveries hitting Apparel; stockroom congestion; Toys promo delays.', top_themes:['Late Delivery','Stockroom Ops','Promo On-Shelf']},
    {iso_week: isoWeek, region:'South', summary:'Size gaps in Apparel; staffing gaps Sat; POS stability concerns.', top_themes:['Size Gaps','Staffing Shortfall','POS Stability']}
  ]);
  console.log('Done.');
})();
