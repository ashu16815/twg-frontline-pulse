-- ═══════════════════════════════════════════════════════════════
-- Admin Store Management Console - Audit Table
-- ═══════════════════════════════════════════════════════════════

-- Audit table for tracking store master changes
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name='audit_store_changes')
BEGIN
  CREATE TABLE dbo.audit_store_changes (
    id uniqueidentifier NOT NULL DEFAULT NEWID() PRIMARY KEY,
    created_at datetime2 NOT NULL DEFAULT SYSDATETIME(),
    store_code nvarchar(50) NULL,
    field_name nvarchar(100) NULL,
    old_value nvarchar(max) NULL,
    new_value nvarchar(max) NULL,
    changed_by nvarchar(200) NULL,
    changed_at datetime2 NOT NULL DEFAULT SYSDATETIME()
  );
  
  CREATE INDEX ix_audit_store_changes_store ON dbo.audit_store_changes(store_code);
  CREATE INDEX ix_audit_store_changes_date ON dbo.audit_store_changes(created_at);
END;

-- Add manager_name to store_master if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.store_master') AND name='manager_name')
BEGIN
  ALTER TABLE dbo.store_master ADD manager_name nvarchar(200) NULL;
END

-- Add indexes if they don't exist
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='ix_store_master_manager_email')
CREATE INDEX ix_store_master_manager_email ON dbo.store_master(manager_email);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='ix_store_master_banner')
CREATE INDEX ix_store_master_banner ON dbo.store_master(banner);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='ix_store_master_active')
CREATE INDEX ix_store_master_active ON dbo.store_master(active);

