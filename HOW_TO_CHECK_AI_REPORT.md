# How to Check if Generate AI Report is Working

## Understanding the System

The AI Report generation uses a **job queue system**:

1. **Click "Generate AI Report"** → Creates a job with status `queued`
2. **Background Worker** → Picks up queued jobs and processes them with Azure OpenAI
3. **Job Status** → Changes from `queued` → `running` → `succeeded` or `failed`
4. **Result** → Saved to `exec_report_snapshots` table and displayed on the page

## How to Check if It's Working

### Option 1: Check the UI Status Badge

When you click "⚡ Generate AI Report", you should see:

1. **In the page header**, look for a status badge showing:
   - `queued` - Job waiting to be processed
   - `running` - Job being processed by worker
   - `succeeded` - Job completed successfully ✅
   - `failed` - Job encountered an error ❌

2. **The page polls every 2 seconds** for job status updates

### Option 2: Check the Database Directly

Run this SQL query to check recent jobs:

```sql
SELECT TOP 10 
  job_id,
  scope_type,
  scope_key,
  status,
  created_at,
  started_at,
  finished_at,
  reason,
  created_by
FROM dbo.exec_report_jobs 
ORDER BY created_at DESC;
```

**What to look for:**
- Status should be `queued`, `running`, `succeeded`, or `failed`
- If status is `queued` and old, the worker isn't running
- If status is `failed`, check the `reason` column for error message
- If `started_at` is NULL, job hasn't started yet

### Option 3: Check if Worker is Running

The worker processes jobs via `/api/exec/worker/run`. It needs to be called periodically.

**Check Vercel Cron Jobs:**
- Go to Vercel Dashboard → Your Project → Settings → Cron Jobs
- Look for a cron job that calls `/api/exec/worker/run`
- Should be scheduled (e.g., every minute)

**Or manually trigger it:**
```bash
curl -X POST https://win-in-store-ashu16815-gmailcoms-projects.vercel.app/api/exec/worker/run
```

Expected response: `{"ok":true, "processed": 1}` or `{"ok":true, "processed": 0}`

### Option 4: Check Vercel Function Logs

1. Go to Vercel Dashboard → Your Project → Deployments
2. Click on latest deployment
3. Go to Functions tab
4. Look for logs from `/api/exec/worker/run`
5. Check for errors or processing messages

## Troubleshooting

### Problem: Status stays "queued" forever

**Cause:** Worker is not running

**Solutions:**
1. Check if Vercel cron is set up
2. Manually trigger the worker (see Option 3 above)
3. Check Vercel function logs for errors

### Problem: Status is "failed"

**Cause:** AI generation error

**Check the `reason` column:**
```sql
SELECT reason, created_at 
FROM dbo.exec_report_jobs 
WHERE status = 'failed' 
ORDER BY created_at DESC;
```

**Common issues:**
- Azure OpenAI API key missing or invalid
- Azure OpenAI endpoint unreachable
- Timeout (takes > 15 seconds)
- No data found (empty feedback)

### Problem: No report appears after "succeeded"

**Check if snapshot was created:**
```sql
SELECT TOP 1 
  scope_type, scope_key, iso_week, 
  created_at, 
  LEN(analysis_json) as json_length
FROM dbo.exec_report_snapshots 
ORDER BY created_at DESC;
```

**If no snapshot:**
- Worker might have failed after marking job as succeeded
- Check Vercel function logs

## Manual Testing Steps

1. **Go to Executive Report page** (`/exec-report`)

2. **Click "⚡ Generate AI Report"**

3. **Watch for status changes:**
   - Badge should appear in top right
   - Status should change: `queued` → `running` → `succeeded`
   - Should take 10-30 seconds

4. **Check for AI content:**
   - Executive Narrative should appear
   - Top 3 Opportunities should show
   - Top 3 Actions should show
   - Risks section should populate

5. **If no content appears:**
   ```sql
   -- Check if snapshot exists
   SELECT * FROM dbo.exec_report_snapshots WHERE scope_type='network' ORDER BY created_at DESC;
   
   -- Check last 5 jobs
   SELECT * FROM dbo.exec_report_jobs ORDER BY created_at DESC;
   ```

## Quick Diagnostic SQL

Run this to get a full picture:

```sql
-- Recent jobs with status
SELECT TOP 5
  job_id,
  scope_type,
  status,
  created_at,
  started_at,
  finished_at,
  DATEDIFF(second, created_at, ISNULL(finished_at, GETDATE())) as duration_seconds,
  reason
FROM dbo.exec_report_jobs 
ORDER BY created_at DESC;

-- Recent snapshots
SELECT TOP 5
  scope_type,
  created_at,
  rows_used,
  gen_model,
  gen_ms
FROM dbo.exec_report_snapshots 
ORDER BY created_at DESC;

-- Queued jobs (stuck)
SELECT COUNT(*) as queued_count 
FROM dbo.exec_report_jobs 
WHERE status = 'queued';
```

## Expected Behavior

✅ **Working correctly:**
- Job created with status `queued`
- Status changes to `running` within 1-2 minutes
- Status changes to `succeeded` within 30 seconds
- Report content appears on page
- "AI analysis as of [timestamp]" shows recent date

❌ **Not working:**
- Job stays `queued` forever
- Job goes to `failed` status
- Status badge never appears
- No report content after clicking
- Error message appears

