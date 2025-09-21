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
