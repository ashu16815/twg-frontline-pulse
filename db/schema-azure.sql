-- ═══════════════════════════════════════════════════════════════
-- Win In Store - Azure SQL Schema with Smart Store Master
-- ═══════════════════════════════════════════════════════════════

-- Drop existing store_master to recreate with new schema
IF OBJECT_ID('dbo.store_master', 'U') IS NOT NULL
DROP TABLE dbo.store_master;

-- Store Master (canonical source of truth)
CREATE TABLE dbo.store_master (
  store_id nvarchar(20) not null primary key,          -- canonical id (e.g., ST-001)
  store_code int null,                                  -- numeric code when available
  store_name nvarchar(200) not null,
  banner nvarchar(50) null,                             -- e.g., TWL/TWH/Noel/WHSmith
  region nvarchar(100) not null,
  region_code nvarchar(10) not null,                    -- e.g., AUK, BOP, CAN-WTC, OTA-STL
  manager_email nvarchar(200) null,
  active bit not null default(1),
  created_at datetime2 not null default sysutcdatetime(),
  updated_at datetime2 not null default sysutcdatetime()
);

-- Helpful indexes for lookups
if not exists (select * from sys.indexes where name='ix_store_master_name')
create index ix_store_master_name on dbo.store_master(store_name);
if not exists (select * from sys.indexes where name='ix_store_master_code')
create index ix_store_master_code on dbo.store_master(store_code);
if not exists (select * from sys.indexes where name='ix_store_master_region')
create index ix_store_master_region on dbo.store_master(region_code);

-- Feedback now references canonical IDs for reliable queryability
if not exists (select * from sys.tables where name='store_feedback')
create table dbo.store_feedback (
  id uniqueidentifier not null default NEWID() primary key,
  created_at datetime2 not null default sysutcdatetime(),
  iso_week nvarchar(10) not null,
  
  -- Canonical keys captured from store_master at submit time
  store_id nvarchar(20) not null,
  store_code int null,
  store_name nvarchar(200) not null,
  region nvarchar(100) not null,
  region_code nvarchar(10) not null,
  banner nvarchar(50) null,
  manager_email nvarchar(200) null,
  
  -- Performance
  hit_target bit null,
  target_variance_pct float null,
  variance_dollars float null,
  
  -- Positives & misses
  top_positive nvarchar(2000) null,
  top_positive_impact float null,
  top_negative_1 nvarchar(2000) null,
  top_negative_1_impact float null,
  top_negative_2 nvarchar(2000) null,
  top_negative_2_impact float null,
  top_negative_3 nvarchar(2000) null,
  top_negative_3_impact float null,
  next_actions nvarchar(max) null,
  freeform_comments nvarchar(max) null,
  estimated_dollar_impact float null,
  
  -- Legacy issue fields (for compatibility)
  miss1 nvarchar(2000) null,
  miss1_dollars float null,
  miss2 nvarchar(2000) null,
  miss2_dollars float null,
  miss3 nvarchar(2000) null,
  miss3_dollars float null,
  
  -- Priorities
  priority1 nvarchar(1000) null,
  priority1_horizon nvarchar(40) null,
  priority2 nvarchar(1000) null,
  priority2_horizon nvarchar(40) null,
  priority3 nvarchar(1000) null,
  priority3_horizon nvarchar(40) null,
  
  -- AI
  overall_mood nvarchar(16) null,
  themes nvarchar(1000) null,
  
  INDEX ix_store_feedback_week (iso_week),
  INDEX ix_store_feedback_store (store_id),
  INDEX ix_store_feedback_region (region_code)
);

-- Weekly Summary
if not exists (select * from sys.tables where name='weekly_summary')
create table dbo.weekly_summary (
  id uniqueidentifier not null default NEWID() primary key,
  created_at datetime2 not null default sysutcdatetime(),
  iso_week nvarchar(10) not null,
  region nvarchar(100) not null,
  region_code nvarchar(10) not null,
  summary nvarchar(max) not null,
  top_themes nvarchar(1000) null,
  total_reported_impact float null,
  top_drivers nvarchar(max) null,
  
  INDEX ix_weekly_summary_week (iso_week),
  INDEX ix_weekly_summary_region (region_code)
);

-- Executive Report
if not exists (select * from sys.tables where name='executive_report')
create table dbo.executive_report (
  id uniqueidentifier not null default NEWID() primary key,
  created_at datetime2 not null default sysutcdatetime(),
  iso_week nvarchar(10) not null,
  narrative nvarchar(max) not null,
  highlights nvarchar(max) not null,
  themes nvarchar(max) not null,
  risks nvarchar(max) not null,
  actions nvarchar(max) not null,
  
  INDEX ix_executive_report_week (iso_week)
);

-- RAG corpus (demo) - VECTOR column optional
if not exists (select * from sys.tables where name='wis_docs')
create table dbo.wis_docs (
  doc_id uniqueidentifier not null default NEWID() primary key,
  title nvarchar(300) not null,
  region nvarchar(100) null,
  region_code nvarchar(10) null,
  content nvarchar(max) not null,
  created_at datetime2 not null default sysutcdatetime(),
  
  INDEX ix_wis_docs_region (region_code)
);

-- Audit Log
if not exists (select * from sys.tables where name='audit_log')
create table dbo.audit_log (
  id uniqueidentifier not null default NEWID() primary key,
  created_at datetime2 not null default sysutcdatetime(),
  actor nvarchar(200) null,
  action nvarchar(100) not null,
  meta nvarchar(max) null,
  
  INDEX ix_audit_log_action (action),
  INDEX ix_audit_log_created (created_at)
);
