-- Set Auckland timezone views for the database
-- Note: Azure SQL doesn't have a global timezone setting, but we can use AT TIME ZONE

-- Example of how to convert UTC to Auckland time in queries:
-- SELECT created_at AT TIME ZONE 'UTC' AT TIME ZONE 'New Zealand Standard Time' as created_at_nz

-- Note: In Azure SQL, 'New Zealand Standard Time' automatically handles DST
-- (switches between NZST and NZDT)

-- Create view for app_users with Auckland timezone
IF OBJECT_ID('dbo.vw_app_users_auckland', 'V') IS NOT NULL
    DROP VIEW dbo.vw_app_users_auckland;
GO

CREATE VIEW dbo.vw_app_users_auckland AS
SELECT 
    id,
    user_id,
    full_name,
    email,
    role,
    password_hash,
    is_active,
    created_at AT TIME ZONE 'UTC' AT TIME ZONE 'New Zealand Standard Time' as created_at_nz,
    last_login_at AT TIME ZONE 'UTC' AT TIME ZONE 'New Zealand Standard Time' as last_login_at_nz,
    created_at,
    last_login_at
FROM dbo.app_users;
GO

PRINT 'Auckland timezone views created successfully!';
PRINT 'Use vw_app_users_auckland for Auckland times';
PRINT 'To use in queries: SELECT * FROM vw_app_users_auckland';

