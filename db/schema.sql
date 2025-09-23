-- STORES MASTER
create table if not exists stores (
  id uuid primary key default gen_random_uuid(),
  brand text not null check (brand in ('TWL','WSL')),
  brand_color text not null, -- 'Red Store' or 'Blue Store'
  code text not null,        -- numeric code as text (e.g., '209')
  store_name text not null,
  display_name text generated always as ((brand||' '||store_name)) stored
);

-- Store feedback (existing) + new performance columns
create table if not exists store_feedback (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  iso_week text not null,
  store_id text not null,
  store_name text not null,
  region text not null,
  manager_email text,

  -- Performance check-in (NEW)
  hit_target boolean,                      -- true=above/at target; false=missed
  target_variance_pct numeric,             -- +/- % vs target (optional)
  variance_dollars numeric,                -- +/- $ vs target (optional)

  -- Three quantified reasons (NEW)
  r1_dept text, r1_subcat text, r1_driver text, r1_text text, r1_dollar_impact numeric,
  r2_dept text, r2_subcat text, r2_driver text, r2_text text, r2_dollar_impact numeric,
  r3_dept text, r3_subcat text, r3_driver text, r3_text text, r3_dollar_impact numeric,

  -- Existing issue fields kept for compatibility
  issue1_cat text, issue1_text text, issue1_impact text, issue1_score float8, issue1_mood text,
  issue2_cat text, issue2_text text, issue2_impact text, issue2_score float8, issue2_mood text,
  issue3_cat text, issue3_text text, issue3_impact text, issue3_score float8, issue3_mood text,

  overall_score float8,
  overall_mood text,
  themes text[],

  -- Forward plan (NEW)
  priority1 text, priority1_horizon text,  -- horizon: 'Next Month'|'Next Quarter'
  priority2 text, priority2_horizon text,
  priority3 text, priority3_horizon text
);

create table if not exists weekly_summary (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  iso_week text not null,
  region text not null,
  summary text not null,
  top_themes text[],
  -- NEW: finance-aware rollups
  total_reported_impact numeric,           -- sum of $ impact from stores (signed)
  top_drivers jsonb                        -- [{driver, dollars, count}]
);

create table if not exists executive_report (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  iso_week text not null,
  narrative text not null,
  highlights jsonb not null,
  themes jsonb not null,
  risks jsonb not null,
  actions jsonb not null
);

create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  actor text,
  action text,
  meta jsonb
);

-- RLS (demo)
alter table stores enable row level security;
alter table store_feedback enable row level security; 
alter table weekly_summary enable row level security; 
alter table executive_report enable row level security; 
alter table audit_log enable row level security;
create policy read_all_stores on stores for select using (true);
create policy read_all_sf on store_feedback for select using (true);
create policy read_all_ws on weekly_summary for select using (true);
create policy read_all_er on executive_report for select using (true);
create policy read_all_audit on audit_log for select using (true);
