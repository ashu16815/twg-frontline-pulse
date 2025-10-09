-- Win In Store - Authentication Schema
-- User accounts with hashed passwords

if not exists (select * from sys.tables where name='app_users')
create table dbo.app_users (
  id uniqueidentifier not null default NEWID() primary key,
  user_id nvarchar(32) not null,             -- human-readable ID like 323905
  full_name nvarchar(150) not null,
  email nvarchar(200) null,
  role nvarchar(50) null,                    -- e.g., 'StoreManager','ELT','Admin'
  password_hash nvarchar(200) not null,
  is_active bit not null default(1),
  created_at datetime2 not null default sysutcdatetime(),
  last_login_at datetime2 null
);

if not exists (select * from sys.indexes where name='ux_app_users_userid')
  create unique index ux_app_users_userid on dbo.app_users(user_id);

if not exists (select * from sys.indexes where name='ix_app_users_email')
  create index ix_app_users_email on dbo.app_users(email);

print 'Auth schema applied successfully';

