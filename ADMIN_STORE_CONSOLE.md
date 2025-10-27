# Admin Store Management Console

## Overview

A secure, admin-only management console for maintaining store master data (region codes, store numbers, manager emails, banners). Provides CRUD operations with audit tracking, inline editing, and CSV export.

## Features

✅ **Admin-Only Access** - Role-based access control (admin role required)
✅ **Inline Editing** - Direct table editing with auto-save
✅ **Audit Trail** - Complete change history for all modifications
✅ **Cascade Updates** - Changes automatically sync to related tables (feedback, reports)
✅ **CSV Export** - Export store data for bulk management
✅ **Filtering** - Search by name, region, or status

## Database Setup

Run the following SQL script to create the audit table and indexes:

```bash
# Apply database migration
sqlcmd -S your-server -d your-database -i db/admin-store-console.sql
```

This will create:
- `audit_store_changes` table for tracking changes
- Indexes on `store_master` for performance

## Files Created

```
app/admin/stores/page.tsx          # Admin UI page
app/api/admin/stores/route.ts      # GET/POST endpoints
app/api/admin/stores/[store_id]/route.ts  # PUT endpoint
app/api/admin/stores/export/route.ts      # CSV export
lib/admin-middleware.ts            # Admin auth helper
db/admin-store-console.sql         # Database migration
```

## Access Control

- **Route**: `/admin/stores`
- **Access**: Admins only (server-side + client-side validation)
- **Auth**: Verified via `requireAdmin()` middleware on all API routes

## Usage

1. Navigate to `/admin/stores`
2. View all stores with filters (search, region, status)
3. Click any cell to edit inline
4. Changes auto-save on blur
5. Export to CSV for bulk updates

## Cascade Updates

When you update:
- **region_code**: Automatically updates `store_feedback.region_code`
- **store_id**: Automatically updates `store_feedback.store_id`

All changes are logged in `audit_store_changes` table.

## Testing Locally

1. Ensure you have admin role in session
2. Start dev server: `npm run dev`
3. Navigate to: `http://localhost:3000/admin/stores`
4. Try editing a store field
5. Check audit logs in database

## Security

- ✅ Admin-only access enforced server-side
- ✅ All changes audited
- ✅ Input validation
- ✅ SQL injection protection via parameterized queries

## Next Steps

- [ ] Add CSV import functionality
- [ ] Add bulk edit capabilities
- [ ] Add store deletion (soft delete)
- [ ] Add change history modal
- [ ] Add data validation rules

