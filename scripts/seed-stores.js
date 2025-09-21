import 'dotenv/config';
const url=process.env.NEXT_PUBLIC_SUPABASE_URL;const key=process.env.SUPABASE_SERVICE_ROLE_KEY;const fetchFn=global.fetch||((await import('node-fetch')).default);

// TWL = Red Store, WSL = Blue Store
const rows = [
  // Store Name, TWL code, WSL code  (subset from SWAS list)
  ['Airport','209','338'],
  ['Ashburton','176','363'],
  ['Blenheim','173','332'],
  ['Fraser Cove','163','341'],
  ['Glenfield','210','307'],
  ['Matamata','154','377'],
  ['Masterton','136','336'],
  ['Rangiora','180','371'],
  ['Levin','137','367'],
  ['Rolleston','122','308'],
  ['Silverdale','191','374'],
  ['Sth Dunedin','183','369'],
  ['Tauranga Crossing','222','392'],
  ['Te Rapa (w/ The Base)','185','372'],
  ['Thames','149','343'],
  ['Lyall Bay (w/ Kilbirne)','170','325'],
  ['Oamaru','125','379'],
  ['Wanganui','145','326'],
  ['Riccarton','220','366'],
  ['Rotorua','142','312'],
  ['Northlands (/w Papanui)','120','342'],
  ['Lunn Ave','190','390'],
  ['Ormiston','195','391'],
  ['Te Awamutu','110','368'],
  ['Bell Block (w/ NP The Valley)','167','354'],
  ['Hawera','', '']
];

function toRows(){
  const out=[]; for(const [name,twl, wsl] of rows){
    if(twl) out.push({brand:'TWL',brand_color:'Red Store',code: String(twl),store_name:name});
    if(wsl) out.push({brand:'WSL',brand_color:'Blue Store',code: String(wsl),store_name:name});
  } return out;
}

async function post(table,data){
  const r=await fetchFn(`${url}/rest/v1/${table}`,{method:'POST',headers:{'apikey':key,'Authorization':`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify(data)});
  if(!r.ok) throw new Error(await r.text());
}

(async()=>{
  if(!url||!key){console.log('Missing Supabase env; abort.');process.exit(1)}
  const data=toRows();
  console.log('Inserting stores…',data.length);
  await post('stores',data);
  console.log('Done.');
})();
