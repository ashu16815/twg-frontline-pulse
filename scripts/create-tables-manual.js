import 'dotenv/config';
import { config } from 'dotenv';

config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Creating database tables manually...');
console.log('URL:', url);
console.log('Anon Key:', anonKey ? 'Present' : 'Missing');

if (!url || !anonKey) {
  console.log('Missing environment variables');
  process.exit(1);
}

// SQL to create tables
const createTablesSQL = `
-- Tables (weekly cadence)
create table if not exists store_feedback (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  iso_week text not null,
  store_id text not null,
  store_name text not null,
  region text not null,
  manager_email text,
  issue1_cat text not null,
  issue1_text text not null,
  issue1_impact text,
  issue1_score float8,
  issue1_mood text,
  issue2_cat text not null,
  issue2_text text not null,
  issue2_impact text,
  issue2_score float8,
  issue2_mood text,
  issue3_cat text not null,
  issue3_text text not null,
  issue3_impact text,
  issue3_score float8,
  issue3_mood text,
  overall_score float8,
  overall_mood text,
  themes text[]
);

create table if not exists weekly_summary (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  iso_week text not null,
  region text not null,
  summary text not null,
  top_themes text[]
);

create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  actor text,
  action text,
  meta jsonb
);

-- RLS (demo: open read; tighten later)
alter table store_feedback enable row level security; 
alter table weekly_summary enable row level security; 
alter table audit_log enable row level security;
create policy read_all_sf on store_feedback for select using (true);
create policy read_all_ws on weekly_summary for select using (true);
create policy read_all_audit on audit_log for select using (true);
`;

try {
  // Try to execute SQL using the REST API
  const response = await fetch(`${url}/rest/v1/rpc/execute_sql`, {
    method: 'POST',
    headers: {
      'apikey': anonKey,
      'Authorization': `Bearer ${anonKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ sql: createTablesSQL })
  });

  console.log('Response status:', response.status);
  
  if (response.ok) {
    console.log('✅ Database tables created successfully!');
  } else {
    const errorText = await response.text();
    console.log('❌ Failed to create tables:', errorText);
    console.log('Note: This might require the service role key for table creation.');
  }
} catch (error) {
  console.log('❌ Error:', error.message);
}
