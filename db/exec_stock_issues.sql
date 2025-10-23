BEGIN TRY
BEGIN TRAN;

IF OBJECT_ID('dbo.store_stock_issues','U') IS NULL
CREATE TABLE dbo.store_stock_issues(
  issue_id        UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  created_at      DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  store_id        NVARCHAR(40) NOT NULL,
  region_code     NVARCHAR(16) NULL,
  issue_date      DATE NOT NULL,
  issue_type      NVARCHAR(40) NOT NULL,        -- delivery|presentation|frequency|out_of_stock|overstock|cancelled_load|double_load|other
  severity        TINYINT NOT NULL DEFAULT 2,    -- 1=low,2=med,3=high
  est_impact_dollars DECIMAL(18,2) NULL,
  short_title     NVARCHAR(120) NOT NULL,
  details         NVARCHAR(MAX) NULL,
  tags            NVARCHAR(200) NULL,
  reported_by     NVARCHAR(120) NULL
);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='ix_stock_issues_time')
  CREATE INDEX ix_stock_issues_time ON dbo.store_stock_issues(issue_date DESC, region_code, store_id, issue_type, severity);

COMMIT TRAN;
END TRY
BEGIN CATCH IF @@TRANCOUNT>0 ROLLBACK TRAN; THROW; END CATCH;
