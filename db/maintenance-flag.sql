IF OBJECT_ID('dbo.app_maintenance','U') IS NULL
BEGIN
  CREATE TABLE dbo.app_maintenance(
    key_name sysname PRIMARY KEY,
    value_bit bit NOT NULL,
    updated_at datetime2 NOT NULL DEFAULT sysutcdatetime()
  );
  INSERT INTO dbo.app_maintenance(key_name, value_bit) VALUES ('store_reload', 0);
END;
