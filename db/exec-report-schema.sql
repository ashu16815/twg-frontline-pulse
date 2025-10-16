if not exists (select * from sys.tables where name='exec_report_feedback')
create table dbo.exec_report_feedback (
  id uniqueidentifier not null default newid() primary key,
  user_id nvarchar(64) null,
  report_scope nvarchar(20) not null,      -- 'week' | 'month'
  scope_key nvarchar(16) not null,         -- 'FY26-W11' | '2025-10'
  region_code nvarchar(16) null,
  store_id nvarchar(16) null,
  section nvarchar(40) not null,           -- 'summary'|'insights'|'actions'|'predictive'
  rating tinyint null,                     -- 1=thumbs down, 2=neutral, 3=up
  comment nvarchar(max) null,
  created_at datetime2 not null default sysutcdatetime()
);

if not exists (select * from sys.tables where name='exec_report_cache')
create table dbo.exec_report_cache (
  id uniqueidentifier not null default newid() primary key,
  report_scope nvarchar(20) not null,
  scope_key nvarchar(16) not null,
  region_code nvarchar(16) null,
  store_id nvarchar(16) null,
  payload nvarchar(max) not null,          -- cached AI JSON
  created_at datetime2 not null default sysutcdatetime()
);

if not exists (select * from sys.indexes where name='ix_erc_scope')
create index ix_erc_scope on dbo.exec_report_cache(report_scope, scope_key);
