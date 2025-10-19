/* ═══════════════════════════════════════════════════════════════
   Win In Store - Database Performance Optimization (Simplified)
   ═══════════════════════════════════════════════════════════════
   
   This script creates essential indexes for performance optimization
*/

BEGIN TRY
  BEGIN TRAN;

  /* 1) CRITICAL INDEXES FOR HOT QUERY PATHS */

  -- Store Feedback - Week + Store (most common query pattern)
  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='ix_store_feedback_week_store')
    CREATE INDEX ix_store_feedback_week_store ON dbo.store_feedback(iso_week, store_id) 
    INCLUDE(region_code, month_key, miss1_dollars, miss2_dollars, miss3_dollars, created_at, overall_mood, freeform_comments);

  -- Store Feedback - Region + Week (for regional queries)
  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='ix_store_feedback_region_week')
    CREATE INDEX ix_store_feedback_region_week ON dbo.store_feedback(region_code, iso_week) 
    INCLUDE(store_id, store_name, miss1_dollars, miss2_dollars, miss3_dollars, overall_mood);

  -- Store Feedback - Month + Store (for monthly queries)
  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='ix_store_feedback_month_store')
    CREATE INDEX ix_store_feedback_month_store ON dbo.store_feedback(month_key, store_id) 
    INCLUDE(region_code, iso_week, created_at, overall_mood);

  -- Store Feedback - Created At (for recent data queries)
  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='ix_store_feedback_created_at')
    CREATE INDEX ix_store_feedback_created_at ON dbo.store_feedback(created_at DESC) 
    INCLUDE(iso_week, store_id, region_code);

  -- Store Master - Active + Region (for store counts)
  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='ix_store_master_active_region')
    CREATE INDEX ix_store_master_active_region ON dbo.store_master(active, region_code, store_code) 
    INCLUDE(store_id, store_name, banner, manager_email);

  -- Executive Report Cache - Scope + Key (for caching)
  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='ix_exec_report_cache_scope')
    CREATE INDEX ix_exec_report_cache_scope ON dbo.exec_report_cache(report_scope, scope_key) 
    INCLUDE(created_at, payload);

  -- Weekly Summary - Week + Region
  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='ix_weekly_summary_week_region')
    CREATE INDEX ix_weekly_summary_week_region ON dbo.weekly_summary(iso_week, region_code) 
    INCLUDE(summary, top_themes, total_reported_impact);

  -- Executive Report - Week
  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='ix_executive_report_week')
    CREATE INDEX ix_executive_report_week ON dbo.executive_report(iso_week) 
    INCLUDE(created_at, narrative, highlights, themes, risks, actions);

  /* 2) IDEMPOTENCY CONSTRAINTS */
  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='ux_feedback_idempotency')
    CREATE UNIQUE INDEX ux_feedback_idempotency ON dbo.store_feedback(idempotency_key) 
    WHERE idempotency_key IS NOT NULL;

  /* 3) STATISTICS UPDATE */
  UPDATE STATISTICS dbo.store_feedback;
  UPDATE STATISTICS dbo.store_master;
  UPDATE STATISTICS dbo.exec_report_cache;
  UPDATE STATISTICS dbo.weekly_summary;
  UPDATE STATISTICS dbo.executive_report;

  COMMIT TRAN;
  PRINT 'Database performance optimization completed successfully!';
  
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0 ROLLBACK TRAN;
  PRINT 'Error during optimization: ' + ERROR_MESSAGE();
  THROW;
END CATCH;
