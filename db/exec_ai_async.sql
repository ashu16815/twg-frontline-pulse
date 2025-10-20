-- Why AI was slow:
-- 1) Generating on-demand during page load causes API waits/timeouts.
-- 2) Large payloads (>100–200 rows) push token + network time; cold starts also add seconds.
-- 3) Missing JSON-mode/response_format leads to longer decoding/sampling.
-- Fix: run AI in background, store snapshots, serve instantly.

BEGIN TRY
BEGIN TRAN;

-- Snapshots of AI analysis (per scope)
IF OBJECT_ID('dbo.exec_report_snapshots','U') IS NULL
CREATE TABLE dbo.exec_report_snapshots(
  snapshot_id       UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  scope_type        NVARCHAR(32) NOT NULL,     -- 'network' | 'region' | 'store'
  scope_key         NVARCHAR(100) NULL,        -- NULL for network, region_code, or store_id
  iso_week          CHAR(8) NULL,              -- e.g. 2025-W41
  month_key         CHAR(7) NULL,              -- e.g. 2025-10
  analysis_json     NVARCHAR(MAX) NOT NULL,    -- compact JSON blob from AOAI
  rows_used         INT NOT NULL,              -- # rows fed to model
  gen_model         NVARCHAR(100) NOT NULL,
  gen_ms            INT NOT NULL,
  created_at        DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='ix_snapshots_lookup')
  CREATE INDEX ix_snapshots_lookup ON dbo.exec_report_snapshots(scope_type, scope_key, iso_week, month_key, created_at DESC);

-- Background jobs
IF OBJECT_ID('dbo.exec_report_jobs','U') IS NULL
CREATE TABLE dbo.exec_report_jobs(
  job_id            UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  scope_type        NVARCHAR(32) NOT NULL,     -- 'network' | 'region' | 'store'
  scope_key         NVARCHAR(100) NULL,
  iso_week          CHAR(8) NULL,
  month_key         CHAR(7) NULL,
  status            NVARCHAR(16) NOT NULL DEFAULT 'queued', -- queued|running|succeeded|failed|canceled
  reason            NVARCHAR(200) NULL,        -- free text (e.g., 'user-request' or error msg)
  started_at        DATETIME2 NULL,
  finished_at       DATETIME2 NULL,
  created_by        NVARCHAR(100) NULL,
  created_at        DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='ix_jobs_status_created')
  CREATE INDEX ix_jobs_status_created ON dbo.exec_report_jobs(status, created_at);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='ix_jobs_scope')
  CREATE INDEX ix_jobs_scope ON dbo.exec_report_jobs(scope_type, scope_key, iso_week, month_key, created_at DESC);

-- Optional hygiene: keep only last 8 per scope/time
;WITH c AS (
  SELECT snapshot_id, scope_type, scope_key, iso_week, month_key, created_at,
         ROW_NUMBER() OVER (PARTITION BY scope_type, scope_key, iso_week, month_key ORDER BY created_at DESC) rn
  FROM dbo.exec_report_snapshots
)
DELETE FROM c WHERE rn > 8;

COMMIT TRAN;
END TRY
BEGIN CATCH
  IF @@TRANCOUNT>0 ROLLBACK TRAN; THROW;
END CATCH;
