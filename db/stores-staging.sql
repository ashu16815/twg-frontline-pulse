IF OBJECT_ID('dbo.store_master_stg') IS NOT NULL DROP TABLE dbo.store_master_stg;
CREATE TABLE dbo.store_master_stg(
  store_code     nvarchar(50) NOT NULL,
  store_name     nvarchar(200) NOT NULL,
  banner         nvarchar(20)  NULL,
  region         nvarchar(100) NULL,
  region_code    nvarchar(20)  NULL,
  manager_email  nvarchar(200) NULL,
  active         bit           NULL
);

-- Create sequence for new IDs if not exists
IF OBJECT_ID('dbo.seq_store_id','SO') IS NULL
BEGIN
  CREATE SEQUENCE dbo.seq_store_id AS int START WITH 1000 INCREMENT BY 1;
END;
