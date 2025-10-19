/* --- SAFETY: tune indexes, add idempotency + soft cleanup --- */
-- 0. Guard rails: wrap in explicit transaction
BEGIN TRY
  BEGIN TRAN;

  /* 1) INDEXES for hot paths */
  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='ix_store_feedback_week_store')
    CREATE INDEX ix_store_feedback_week_store ON dbo.store_feedback(iso_week, store_id) INCLUDE(region_code, month_key, miss1_dollars, miss2_dollars, miss3_dollars, created_at);
  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='ix_store_feedback_month_store')
    CREATE INDEX ix_store_feedback_month_store ON dbo.store_feedback(month_key, store_id) INCLUDE(region_code, iso_week, created_at);
  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='ix_store_feedback_region_week')
    CREATE INDEX ix_store_feedback_region_week ON dbo.store_feedback(region_code, iso_week) INCLUDE(store_id);
  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='ix_exec_report_cache_scope')
    CREATE INDEX ix_exec_report_cache_scope ON dbo.exec_report_cache(report_scope, scope_key) INCLUDE(created_at);
  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='ix_store_master_active_region')
    CREATE INDEX ix_store_master_active_region ON dbo.store_master(active, region_code, store_code);

  /* 2) ID EMPOTENCY for feedback submissions */
  -- Add a client-provided key to prevent duplicates
  IF COL_LENGTH('dbo.store_feedback','idempotency_key') IS NULL
    ALTER TABLE dbo.store_feedback ADD idempotency_key NVARCHAR(64) NULL;
  IF COL_LENGTH('dbo.store_feedback','submitted_by') IS NULL
    ALTER TABLE dbo.store_feedback ADD submitted_by NVARCHAR(100) NULL;
  
  -- Create unique index for idempotency
  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='ux_feedback_idempotency')
    CREATE UNIQUE INDEX ux_feedback_idempotency ON dbo.store_feedback(idempotency_key) WHERE idempotency_key IS NOT NULL;

  /* 3) TEST DATA hygiene (soft rules) */
  -- Mark tables with is_test and then purge in a controlled way
  IF COL_LENGTH('dbo.store_feedback','is_test') IS NULL
    ALTER TABLE dbo.store_feedback ADD is_test BIT NOT NULL CONSTRAINT df_store_feedback_is_test DEFAULT(0);
  IF COL_LENGTH('dbo.exec_report_feedback','is_test') IS NULL
    ALTER TABLE dbo.exec_report_feedback ADD is_test BIT NOT NULL CONSTRAINT df_exec_report_feedback_is_test DEFAULT(0);

  /* 4) CLEANUP SCRIPT (parameterized) */
  -- Use variables to control cleanup, keep users & masters intact
  DECLARE @confirm BIT = 1;          -- set to 1 to proceed
  DECLARE @cutoff DATETIME2 = DATEADD(day, -90, SYSUTCDATETIME()); -- older than 90d

  IF @confirm = 1
  BEGIN
    -- Remove explicit test rows first
    DELETE FROM dbo.exec_report_feedback WHERE is_test = 1;
    DELETE FROM dbo.store_feedback WHERE is_test = 1;

    -- Remove old dev spam by submitted_by patterns
    DELETE FROM dbo.store_feedback
      WHERE created_at < @cutoff
        AND (submitted_by LIKE '%test%' OR submitted_by LIKE '%dev%' OR submitted_by IN ('demo','seed','sample'));

    -- Optional: clear stale cache (keeps most recent per scope)
    ;WITH cte AS (
      SELECT id, report_scope, scope_key, created_at,
             ROW_NUMBER() OVER (PARTITION BY report_scope, scope_key ORDER BY created_at DESC) AS rn
      FROM dbo.exec_report_cache
    )
    DELETE FROM cte WHERE rn > 3; -- keep top 3 cache entries per key
  END

  COMMIT TRAN;
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0 ROLLBACK TRAN;
  THROW;
END CATCH;
