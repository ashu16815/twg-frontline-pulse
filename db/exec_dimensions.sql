BEGIN TRY
BEGIN TRAN;

-- 1) Areas/dimensions (Supply Chain, Availability, Rosters, Pricing, Merch, Service, etc.)
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
 ('AVAIL','Availability',10),
 ('SUPPLY','Supply Chain',20),
 ('ROSTER','Rosters',30),
 ('PRICING','Pricing',40),
 ('MERCH','Merchandising',50),
 ('SERVICE','Service',60);

-- 2) KPI targets/benchmarks (editable)
IF OBJECT_ID('dbo.exec_kpi_targets','U') IS NULL
CREATE TABLE dbo.exec_kpi_targets(
  target_id     INT IDENTITY(1,1) PRIMARY KEY,
  kpi_code      VARCHAR(32) NOT NULL,           -- e.g., AVAIL_PCT, FEEDBACK_VOL
  scope_type    VARCHAR(16) NOT NULL,           -- network|region|store
  scope_key     NVARCHAR(100) NULL,             -- null|region_code|store_id
  target_value  DECIMAL(18,4) NOT NULL,
  eff_from      DATE NOT NULL DEFAULT CONVERT(DATE, SYSUTCDATETIME()),
  eff_to        DATE NULL,
  created_at    DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT ux_kpi_target UNIQUE(kpi_code, scope_type, scope_key, eff_from)
);

-- 3) Exec bookmarks (saved filter presets for leaders)
IF OBJECT_ID('dbo.exec_bookmarks','U') IS NULL
CREATE TABLE dbo.exec_bookmarks(
  bookmark_id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  owner_email NVARCHAR(120) NOT NULL,
  title       NVARCHAR(120) NOT NULL,
  payload     NVARCHAR(MAX)  NOT NULL,         -- JSON of filters
  created_at  DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

-- 4) Indexes to ensure speed on exec queries
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='ix_sf_filters')
  CREATE INDEX ix_sf_filters ON dbo.store_feedback(region_code, store_id, iso_week, month_key) INCLUDE(overall_mood, miss1_dollars, miss2_dollars, miss3_dollars, created_at);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='ix_snapshots_scope_time')
  CREATE INDEX ix_snapshots_scope_time ON dbo.exec_report_snapshots(scope_type, scope_key, iso_week, month_key, created_at DESC);

COMMIT TRAN;
END TRY
BEGIN CATCH 
  IF @@TRANCOUNT>0 ROLLBACK TRAN; 
  THROW; 
END CATCH;
