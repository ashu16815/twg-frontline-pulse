-- Set Auckland timezone for the database session
-- Note: Azure SQL doesn't have a global timezone setting, but we can use AT TIME ZONE

-- Example of how to convert UTC to Auckland time in queries:
-- SELECT created_at AT TIME ZONE 'UTC' AT TIME ZONE 'New Zealand Standard Time' as created_at_nz
-- FROM dbo.feedback;

-- Note: In Azure SQL, 'New Zealand Standard Time' automatically handles DST
-- (switches between NZST and NZDT)

-- You can create a view for easier querying:
IF OBJECT_ID('dbo.vw_feedback_auckland', 'V') IS NOT NULL
    DROP VIEW dbo.vw_feedback_auckland;
GO

CREATE VIEW dbo.vw_feedback_auckland AS
SELECT 
    id,
    store_id,
    store_code,
    store_name,
    region,
    region_code,
    banner,
    iso_week,
    manager_email,
    hit_target,
    variance_pct,
    variance_dollars,
    top_positive,
    miss1,
    miss1_dollars,
    miss2,
    miss2_dollars,
    miss3,
    miss3_dollars,
    pos1,
    pos1_dollars,
    pos2,
    pos2_dollars,
    pos3,
    pos3_dollars,
    p1,
    p1_horizon,
    p2,
    p2_horizon,
    p3,
    p3_horizon,
    transcript_text,
    overall_mood,
    ai_themes,
    ai_summary,
    created_at AT TIME ZONE 'UTC' AT TIME ZONE 'New Zealand Standard Time' as created_at_nz,
    created_at -- Keep UTC version too
FROM dbo.feedback;
GO

-- Similarly for app_users
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
PRINT 'Use vw_feedback_auckland and vw_app_users_auckland for Auckland times';

