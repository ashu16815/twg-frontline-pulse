BEGIN TRY
BEGIN TRAN;
/* Soft-clean test/dev rows while preserving users & masters */
IF COL_LENGTH('dbo.store_feedback','is_test') IS NULL
  ALTER TABLE dbo.store_feedback ADD is_test BIT NOT NULL CONSTRAINT df_store_feedback_is_test DEFAULT(0);
IF COL_LENGTH('dbo.exec_report_feedback','is_test') IS NULL
  ALTER TABLE dbo.exec_report_feedback ADD is_test BIT NOT NULL CONSTRAINT df_exec_report_feedback_is_test DEFAULT(0);
DECLARE @cutoff DATETIME2 = DATEADD(day,-90,SYSUTCDATETIME());
DELETE FROM dbo.exec_report_feedback WHERE is_test=1;
DELETE FROM dbo.store_feedback WHERE is_test=1 OR (created_at<@cutoff AND (submitted_by LIKE '%test%' OR submitted_by LIKE '%dev%' OR submitted_by IN ('demo','seed','sample')));
;WITH cte AS (
  SELECT id, report_scope, scope_key, created_at, ROW_NUMBER() OVER(PARTITION BY report_scope, scope_key ORDER BY created_at DESC) rn
  FROM dbo.exec_report_cache)
DELETE FROM cte WHERE rn>3;
COMMIT TRAN;
END TRY
BEGIN CATCH
  IF @@TRANCOUNT>0 ROLLBACK TRAN; THROW;
END CATCH;
