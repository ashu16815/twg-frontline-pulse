SET NOCOUNT ON;
BEGIN TRY
  BEGIN TRAN;

  -- Maintenance ON
  IF EXISTS (SELECT 1 FROM sys.objects WHERE object_id=OBJECT_ID('dbo.app_maintenance') AND type='U')
  BEGIN
    MERGE dbo.app_maintenance AS t
    USING (SELECT CAST('store_reload' AS sysname) AS key_name, CAST(1 AS bit) AS value_bit) s
    ON t.key_name = s.key_name
    WHEN MATCHED THEN UPDATE SET value_bit=1, updated_at=SYSUTCDATETIME()
    WHEN NOT MATCHED THEN INSERT (key_name,value_bit) VALUES (s.key_name, s.value_bit);
  END

  -- 1) Backup current master
  IF OBJECT_ID('dbo.store_master_prev') IS NOT NULL DROP TABLE dbo.store_master_prev;
  SELECT * INTO dbo.store_master_prev FROM dbo.store_master;

  -- 2) Map skeleton (old→new)
  IF OBJECT_ID('dbo.store_id_map') IS NOT NULL DROP TABLE dbo.store_id_map;
  CREATE TABLE dbo.store_id_map(
    id int IDENTITY(1,1) PRIMARY KEY,
    store_code   nvarchar(50) NOT NULL,
    old_store_id nvarchar(50) NULL,
    new_store_id nvarchar(50) NULL
  );
  INSERT INTO dbo.store_id_map(store_code, old_store_id)
  SELECT store_code, store_id FROM dbo.store_master_prev;

  -- 3) Replace master
  DELETE FROM dbo.store_master;

  INSERT INTO dbo.store_master (
    store_id, store_code, store_name, banner, region, region_code, manager_email, active, created_at, updated_at
  )
  SELECT
    CONCAT('ST-',FORMAT(NEXT VALUE FOR dbo.seq_store_id,'000')),
    s.store_code, s.store_name, s.banner, s.region, s.region_code, s.manager_email,
    COALESCE(s.active,1), SYSUTCDATETIME(), SYSUTCDATETIME()
  FROM dbo.store_master_stg s;

  -- 4) Fill new IDs in mapping
  UPDATE m
    SET new_store_id = sm.store_id
  FROM dbo.store_id_map m
  JOIN dbo.store_master sm ON sm.store_code = m.store_code;

  -- 5) Remap children (generated dynamically from JSON list)
  -- (This block is a placeholder; it is executed by scripts/run-migration.mjs)

  COMMIT TRAN;

  -- Maintenance OFF
  IF EXISTS (SELECT 1 FROM sys.objects WHERE object_id=OBJECT_ID('dbo.app_maintenance') AND type='U')
  BEGIN
    UPDATE dbo.app_maintenance SET value_bit=0, updated_at=SYSUTCDATETIME() WHERE key_name='store_reload';
  END

  PRINT '✅ Store master reloaded.';
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0 ROLLBACK TRAN;
  IF EXISTS (SELECT 1 FROM sys.objects WHERE object_id=OBJECT_ID('dbo.app_maintenance') AND type='U')
  BEGIN
    UPDATE dbo.app_maintenance SET value_bit=0, updated_at=SYSUTCDATETIME() WHERE key_name='store_reload';
  END
  DECLARE @msg nvarchar(4000)=ERROR_MESSAGE();
  RAISERROR('Store reload failed: %s',16,1,@msg);
END CATCH;
