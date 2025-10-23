BEGIN TRY
BEGIN TRAN;

IF OBJECT_ID('dbo.exec_areas','U') IS NULL
CREATE TABLE dbo.exec_areas(
  area_code  VARCHAR(24) NOT NULL PRIMARY KEY,
  area_name  NVARCHAR(80) NOT NULL,
  is_active  BIT NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

IF NOT EXISTS(SELECT 1 FROM dbo.exec_areas)
INSERT INTO dbo.exec_areas(area_code, area_name, sort_order) VALUES
 ('AVAIL','Availability',10),('SUPPLY','Supply Chain',20),('ROSTER','Rosters',30),('PRICING','Pricing',40),('MERCH','Merchandising',50),('SERVICE','Service',60);

IF OBJECT_ID('dbo.exec_kpi_targets','U') IS NULL
CREATE TABLE dbo.exec_kpi_targets(
  target_id     INT IDENTITY(1,1) PRIMARY KEY,
  kpi_code      VARCHAR(32) NOT NULL,
  scope_type    VARCHAR(16) NOT NULL,
  scope_key     NVARCHAR(100) NULL,
  target_value  DECIMAL(18,4) NOT NULL,
  eff_from      DATE NOT NULL DEFAULT CONVERT(DATE, SYSUTCDATETIME()),
  eff_to        DATE NULL,
  created_at    DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT ux_kpi_target UNIQUE(kpi_code, scope_type, scope_key, eff_from)
);

IF OBJECT_ID('dbo.v_exec_quick_kpis','V') IS NOT NULL DROP VIEW dbo.v_exec_quick_kpis;
GO
CREATE VIEW dbo.v_exec_quick_kpis AS
SELECT sf.region_code, sf.iso_week,
       COUNT_BIG(1) AS feedback_count,
       AVG(CASE WHEN sf.overall_mood='pos' THEN 1.0 WHEN sf.overall_mood='neg' THEN 0 ELSE 0.5 END) AS mood_index,
       SUM(ISNULL(sf.miss1_dollars,0)+ISNULL(sf.miss2_dollars,0)+ISNULL(sf.miss3_dollars,0)) AS total_missed_dollars
FROM dbo.store_feedback sf
GROUP BY sf.region_code, sf.iso_week;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='ix_sf_filters')
  CREATE INDEX ix_sf_filters ON dbo.store_feedback(region_code, store_id, iso_week, month_key) INCLUDE(overall_mood, miss1_dollars, miss2_dollars, miss3_dollars, created_at);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='ix_snapshots_scope_time')
  CREATE INDEX ix_snapshots_scope_time ON dbo.exec_report_snapshots(scope_type, scope_key, iso_week, month_key, created_at DESC);

COMMIT TRAN;
END TRY
BEGIN CATCH IF @@TRANCOUNT>0 ROLLBACK TRAN; THROW; END CATCH;