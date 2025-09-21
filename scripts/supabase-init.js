import fs from 'fs';
import 'dotenv/config';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.log('Skip db push (env missing).');
  process.exit(0);
}

const sql = fs.readFileSync('db/schema.sql', 'utf8');
const fetchFn = global.fetch || ((await import('node-fetch')).default);

(async () => {
  const res = await fetchFn(`${url}/rest/v1/rpc/execute_sql`, {
    method: 'POST',
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ sql })
  });
  
  if (!res.ok) {
    console.error('DB init failed', await res.text());
    process.exit(1);
  }
  
  console.log('DB init OK');
})();
