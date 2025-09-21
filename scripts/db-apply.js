import fs from 'fs';
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.log('Missing Supabase env; skip db apply.');
  process.exit(0);
}

const sql = fs.readFileSync('db/schema.sql', 'utf8');
const sb = createClient(url, key, { auth: { persistSession: false } });

async function apply() {
  // Create a helper function once (idempotent)
  await sb.rpc('create_sql_helper').catch(() => {});
  
  // Try to call the helper; if missing, create it.
  let fn = await sb.rpc('execute_sql', { sql });
  if (fn.error) {
    // Create the function (requires running this once in SQL editor if PostgREST blocks function creation)
    const createFn = `create or replace function public.execute_sql(sql text) returns void language plpgsql security definer as $$ begin execute sql; end; $$;`;
    await sb.rpc('execute_sql', { sql: createFn }).catch(() => {});
    fn = await sb.rpc('execute_sql', { sql });
  }
  
  if (fn.error) {
    console.error('DB apply error:', fn.error.message);
    process.exit(1);
  }
  console.log('DB schema applied.');
}

apply();
