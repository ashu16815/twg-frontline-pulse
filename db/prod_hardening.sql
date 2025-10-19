BEGIN TRY
BEGIN TRAN;
/* Indexes for hot queries */
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='ix_store_feedback_week_store')
  CREATE INDEX ix_store_feedback_week_store ON dbo.store_feedback(iso_week, store_id) INCLUDE(region_code, month_key, created_at);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='ix_store_feedback_region_week')
  CREATE INDEX ix_store_feedback_region_week ON dbo.store_feedback(region_code, iso_week) INCLUDE(store_id, created_at);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='ix_store_master_active_region')
  CREATE INDEX ix_store_master_active_region ON dbo.store_master(active, region_code, store_code);
/* Idempotency columns + unique guards */
IF COL_LENGTH('dbo.store_feedback','idempotency_key') IS NULL
  ALTER TABLE dbo.store_feedback ADD idempotency_key NVARCHAR(64) NULL;
IF COL_LENGTH('dbo.store_feedback','server_fingerprint') IS NULL
  ALTER TABLE dbo.store_feedback ADD server_fingerprint AS (CONVERT(NVARCHAR(200), store_id)+'|'+ISNULL(iso_week,'')+'|'+ISNULL(CAST(DATEFROMPARTS(YEAR(created_at),MONTH(created_at),DAY(created_at)) AS NVARCHAR(10)),'') ) PERSISTED;
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='ux_feedback_idempotency')
  CREATE UNIQUE INDEX ux_feedback_idempotency ON dbo.store_feedback(idempotency_key) WHERE idempotency_key IS NOT NULL;
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='ux_feedback_server_fp')
  CREATE UNIQUE INDEX ux_feedback_server_fp ON dbo.store_feedback(server_fingerprint, submitted_by) WHERE submitted_by IS NOT NULL;
COMMIT TRAN;
END TRY
BEGIN CATCH
  IF @@TRANCOUNT>0 ROLLBACK TRAN; THROW;
END CATCH;