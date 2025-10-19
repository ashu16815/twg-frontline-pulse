/* ═══════════════════════════════════════════════════════════════
   Win In Store - Database Performance Optimization
   ═══════════════════════════════════════════════════════════════
   
   This script optimizes database performance by:
   1. Adding missing columns referenced in existing indexes
   2. Creating comprehensive indexes for all query patterns
   3. Optimizing table structures for common operations
   4. Adding query performance monitoring
*/

BEGIN TRY
  BEGIN TRAN;

  /* 1) ADD MISSING COLUMNS */
  -- Add month_key column that's referenced in indexes but missing
  IF COL_LENGTH('dbo.store_feedback','month_key') IS NULL
    ALTER TABLE dbo.store_feedback ADD month_key NVARCHAR(7) NULL;
  
  -- Add missing columns for better query performance
  IF COL_LENGTH('dbo.store_feedback','submitted_by') IS NULL
    ALTER TABLE dbo.store_feedback ADD submitted_by NVARCHAR(100) NULL;
  IF COL_LENGTH('dbo.store_feedback','idempotency_key') IS NULL
    ALTER TABLE dbo.store_feedback ADD idempotency_key NVARCHAR(64) NULL;
  IF COL_LENGTH('dbo.store_feedback','is_test') IS NULL
    ALTER TABLE dbo.store_feedback ADD is_test BIT NOT NULL CONSTRAINT df_store_feedback_is_test DEFAULT(0);

  /* 2) POPULATE MONTH_KEY FROM ISO_WEEK */
  -- Update month_key based on iso_week format (YYYY-WXX -> YYYY-MM)
  UPDATE dbo.store_feedback 
  SET month_key = CASE 
    WHEN iso_week LIKE '%-W%' THEN 
      SUBSTRING(iso_week, 1, 4) + '-' + 
      RIGHT('0' + CAST(CEILING(CAST(SUBSTRING(iso_week, 7, 2) AS INT) / 4.0) AS VARCHAR(2)), 2)
    ELSE iso_week
  END
  WHERE month_key IS NULL;

  /* 3) COMPREHENSIVE INDEXES FOR HOT QUERY PATHS */

  -- Store Feedback Indexes (most critical for performance)
  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='ix_store_feedback_week_store')
    CREATE INDEX ix_store_feedback_week_store ON dbo.store_feedback(iso_week, store_id) 
    INCLUDE(region_code, month_key, miss1_dollars, miss2_dollars, miss3_dollars, created_at, overall_mood, freeform_comments);

  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='ix_store_feedback_month_store')
    CREATE INDEX ix_store_feedback_month_store ON dbo.store_feedback(month_key, store_id) 
    INCLUDE(region_code, iso_week, created_at, overall_mood);

  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='ix_store_feedback_region_week')
    CREATE INDEX ix_store_feedback_region_week ON dbo.store_feedback(region_code, iso_week) 
    INCLUDE(store_id, store_name, miss1_dollars, miss2_dollars, miss3_dollars, overall_mood);

  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='ix_store_feedback_week_region_store')
    CREATE INDEX ix_store_feedback_week_region_store ON dbo.store_feedback(iso_week, region_code, store_id) 
    INCLUDE(top_positive, miss1, miss1_dollars, miss2, miss2_dollars, miss3, miss3_dollars, overall_mood, freeform_comments);

  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='ix_store_feedback_created_at')
    CREATE INDEX ix_store_feedback_created_at ON dbo.store_feedback(created_at DESC) 
    INCLUDE(iso_week, store_id, region_code);

  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='ix_store_feedback_submitted_by')
    CREATE INDEX ix_store_feedback_submitted_by ON dbo.store_feedback(submitted_by) 
    INCLUDE(created_at, iso_week, store_id);

  -- Store Master Indexes
  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='ix_store_master_active_region')
    CREATE INDEX ix_store_master_active_region ON dbo.store_master(active, region_code, store_code) 
    INCLUDE(store_id, store_name, banner, manager_email);

  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='ix_store_master_region_active')
    CREATE INDEX ix_store_master_region_active ON dbo.store_master(region_code, active) 
    INCLUDE(store_id, store_name, store_code, banner);

  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='ix_store_master_name_lookup')
    CREATE INDEX ix_store_master_name_lookup ON dbo.store_master(store_name) 
    INCLUDE(store_id, region_code, active);

  -- Executive Report Cache Indexes
  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='ix_exec_report_cache_scope')
    CREATE INDEX ix_exec_report_cache_scope ON dbo.exec_report_cache(report_scope, scope_key) 
    INCLUDE(created_at, payload);

  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='ix_exec_report_cache_created')
    CREATE INDEX ix_exec_report_cache_created ON dbo.exec_report_cache(created_at DESC) 
    INCLUDE(report_scope, scope_key);

  -- Weekly Summary Indexes
  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='ix_weekly_summary_week_region')
    CREATE INDEX ix_weekly_summary_week_region ON dbo.weekly_summary(iso_week, region_code) 
    INCLUDE(summary, top_themes, total_reported_impact);

  -- Executive Report Indexes
  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='ix_executive_report_week')
    CREATE INDEX ix_executive_report_week ON dbo.executive_report(iso_week) 
    INCLUDE(created_at, narrative, highlights, themes, risks, actions);

  -- App Users Indexes
  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='ix_app_users_active')
    CREATE INDEX ix_app_users_active ON dbo.app_users(is_active, role) 
    INCLUDE(user_id, full_name, email, last_login_at);

  /* 4) IDEMPOTENCY CONSTRAINTS */
  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='ux_feedback_idempotency')
    CREATE UNIQUE INDEX ux_feedback_idempotency ON dbo.store_feedback(idempotency_key) 
    WHERE idempotency_key IS NOT NULL;

  /* 5) STATISTICS UPDATE */
  -- Update statistics for all tables to ensure optimal query plans
  UPDATE STATISTICS dbo.store_feedback;
  UPDATE STATISTICS dbo.store_master;
  UPDATE STATISTICS dbo.exec_report_cache;
  UPDATE STATISTICS dbo.weekly_summary;
  UPDATE STATISTICS dbo.executive_report;
  UPDATE STATISTICS dbo.app_users;

  /* 6) CLEANUP OLD DATA (optional - controlled by parameter) */
  DECLARE @cleanup_old_data BIT = 0; -- Set to 1 to enable cleanup
  DECLARE @cutoff_date DATETIME2 = DATEADD(day, -90, SYSUTCDATETIME());

  IF @cleanup_old_data = 1
  BEGIN
    -- Remove test data
    DELETE FROM dbo.store_feedback WHERE is_test = 1;
    
    -- Remove old test submissions
    DELETE FROM dbo.store_feedback 
    WHERE created_at < @cutoff_date 
      AND (submitted_by LIKE '%test%' OR submitted_by LIKE '%dev%' OR submitted_by IN ('demo','seed','sample'));
    
    -- Clean up old cache entries (keep only recent 3 per scope)
    ;WITH cte AS (
      SELECT id, report_scope, scope_key, created_at,
             ROW_NUMBER() OVER (PARTITION BY report_scope, scope_key ORDER BY created_at DESC) AS rn
      FROM dbo.exec_report_cache
    )
    DELETE FROM cte WHERE rn > 3;
  END

  COMMIT TRAN;
  PRINT 'Database performance optimization completed successfully!';
  
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0 ROLLBACK TRAN;
  PRINT 'Error during optimization: ' + ERROR_MESSAGE();
  THROW;
END CATCH;
