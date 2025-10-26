-- ═══════════════════════════════════════════════════════════════
-- Fix text column sizes in store_feedback table
-- This fixes the truncation error for longer feedback submissions
-- ═══════════════════════════════════════════════════════════════

BEGIN TRY
  BEGIN TRAN;

  -- Increase size of positive/negative feedback columns from 400 to 2000 chars
  ALTER TABLE dbo.store_feedback 
    ALTER COLUMN top_positive NVARCHAR(2000) NULL;

  ALTER TABLE dbo.store_feedback 
    ALTER COLUMN top_negative_1 NVARCHAR(2000) NULL;

  ALTER TABLE dbo.store_feedback 
    ALTER COLUMN top_negative_2 NVARCHAR(2000) NULL;

  ALTER TABLE dbo.store_feedback 
    ALTER COLUMN top_negative_3 NVARCHAR(2000) NULL;

  -- Increase size of miss fields from 400 to 2000 chars
  ALTER TABLE dbo.store_feedback 
    ALTER COLUMN miss1 NVARCHAR(2000) NULL;

  ALTER TABLE dbo.store_feedback 
    ALTER COLUMN miss2 NVARCHAR(2000) NULL;

  ALTER TABLE dbo.store_feedback 
    ALTER COLUMN miss3 NVARCHAR(2000) NULL;

  -- Also increase priority fields from 300 to 1000 chars
  ALTER TABLE dbo.store_feedback 
    ALTER COLUMN priority1 NVARCHAR(1000) NULL;

  ALTER TABLE dbo.store_feedback 
    ALTER COLUMN priority2 NVARCHAR(1000) NULL;

  ALTER TABLE dbo.store_feedback 
    ALTER COLUMN priority3 NVARCHAR(1000) NULL;

  COMMIT TRAN;
  PRINT '✅ Successfully updated text column sizes in store_feedback table';
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0 ROLLBACK TRAN;
  DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
  DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
  DECLARE @ErrorState INT = ERROR_STATE();
  PRINT '❌ Error updating text column sizes: ' + @ErrorMsg;
  THROW;
END CATCH;

