-- Quick setup for admin audit table
-- Run this in your Azure SQL database

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
  
  PRINT '✅ audit_store_changes table created';
END
ELSE
BEGIN
  PRINT '✅ audit_store_changes table already exists';
END

