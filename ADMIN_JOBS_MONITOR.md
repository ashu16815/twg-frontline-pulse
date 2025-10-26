# Admin Jobs Monitor - Documentation

## Overview

A comprehensive admin page to monitor and manage AI report generation jobs with detailed logging and real-time status updates.

## Features

### 📊 Real-Time Dashboard
- Live stats cards showing total, queued, running, succeeded, and failed jobs
- Auto-refresh option (every 2 seconds)
- Manual refresh button

### 📋 Jobs Table
- Complete list of all AI report jobs
- Filter by status (queued, running, succeeded, failed, canceled)
- Pagination support (50 jobs per page)
- Color-coded status badges

### 🔍 Job Details Modal
When you click "Details" on any job, you see:

**Job Information:**
- Job ID (unique identifier)
- Scope (type and key)
- Status with colored badge
- Created At timestamp
- Started At timestamp  
- Finished At timestamp
- Queue Time (how long it waited)
- Processing Time (how long it took)
- Created By (who triggered it)
- Reason/error message

**Snapshot Details** (if job succeeded):
- Snapshot created timestamp
- Number of rows processed
- AI model used
- Generation time in milliseconds
- JSON size in bytes

**Error Details** (if job failed):
- Full error message/reason
- Stack trace if available

### 🎛️ Job Management
- **Cancel Jobs**: Cancel queued or running jobs
- **Trigger Worker**: Manually trigger the background worker to process jobs
- **Auto-refresh**: Toggle automatic page refresh (every 2 seconds)

## How to Access

1. Login as admin user
2. Look for "AI Jobs" link in the top navigation
3. Click to go to `/admin/jobs`

## Features in Detail

### Status Filtering
Filter jobs by status:
- All Jobs (default)
- Queued
- Running  
- Succeeded
- Failed
- Canceled

### Stats Dashboard
Five stat cards showing:
- Total: Total number of all jobs ever created
- Queued: Jobs waiting to be processed (yellow)
- Running: Jobs currently being processed (blue)
- Succeeded: Successfully completed jobs (green)
- Failed: Jobs that encountered errors (red)

### Color-Coded Status Badges
- 🟡 **Queued** - Yellow badge, waiting to be processed
- 🔵 **Running** - Blue badge, currently processing
- 🟢 **Succeeded** - Green badge, completed successfully
- 🔴 **Failed** - Red badge, encountered an error
- ⚫ **Canceled** - Gray badge, manually canceled

### Job Actions

**Details Button:**
- Opens a detailed modal with full job information
- Shows timing breakdowns
- Displays snapshot data if succeeded
- Shows error details if failed

**Cancel Button** (only for queued/running jobs):
- Confirms cancellation
- Marks job as canceled
- Stops processing
- Shows canceled status in list

**Trigger Worker Button:**
- Manually triggers the background worker
- Processes any queued jobs immediately
- Returns immediately to show results

## API Endpoints

### GET /api/admin/jobs
Fetch jobs with pagination and filtering:
```
GET /api/admin/jobs?page=1&limit=50&status=queued
```

**Response:**
```json
{
  "ok": true,
  "jobs": [...],
  "stats": {
    "total": 100,
    "queued": 5,
    "running": 2,
    "succeeded": 85,
    "failed": 8
  },
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "pages": 2
  }
}
```

### GET /api/admin/jobs?job_id={id}
Get detailed information about a specific job:
```
GET /api/admin/jobs?job_id=abc123
```

**Response:**
```json
{
  "ok": true,
  "job": {
    "job_id": "...",
    "scope_type": "network",
    "status": "succeeded",
    "queue_time_seconds": 120,
    "processing_time_seconds": 15,
    "reason": "ok"
  },
  "snapshot": {
    "created_at": "2025-10-27...",
    "rows_used": 45,
    "gen_model": "gpt-4o-mini",
    "gen_ms": 15234
  }
}
```

### POST /api/admin/jobs
Trigger actions on jobs:

**Trigger Worker:**
```json
{
  "action": "trigger_worker"
}
```

**Cancel Job:**
```json
{
  "action": "cancel_job",
  "job_id": "abc123"
}
```

## Troubleshooting

### Jobs Stuck in Queued Status

**Problem:** Jobs stay queued forever

**Solution:**
1. Click "Trigger Worker Now" button
2. Check Vercel cron jobs are enabled
3. Verify cron schedule in vercel.json:
   ```json
   "crons": [
     {
       "path": "/api/exec/worker/run",
       "schedule": "*/2 * * * *"
     }
   ]
   ```

### Jobs Failing

**Problem:** Jobs showing failed status

**Check:**
1. Click "Details" button to see error message
2. Common causes:
   - Azure OpenAI API key missing
   - Azure OpenAI endpoint unreachable
   - Request timeout (>30 seconds)
   - Database connection issues

**Debug:**
```sql
SELECT 
  job_id, 
  status, 
  reason, 
  created_at 
FROM dbo.exec_report_jobs 
WHERE status = 'failed' 
ORDER BY created_at DESC;
```

### High Queue Times

**Problem:** Jobs taking long to start processing

**Solution:**
1. Increase cron frequency (currently every 2 minutes)
2. Add more worker instances
3. Check worker is running: Look for recent successful jobs

## Use Cases

### Monitor AI Report Generation
- Watch jobs go from queued → running → succeeded
- Identify slow jobs
- Track processing times

### Debug Failed Jobs
- View full error messages
- See which jobs failed
- Identify patterns in failures

### Manage Job Queue
- Cancel stuck jobs
- Trigger worker manually
- Clear queue of old jobs

### Performance Analysis
- Average processing time
- Queue wait time
- Success rate
- Model performance

## Database Tables Used

### dbo.exec_report_jobs
Stores all AI report job information:
- job_id (PK)
- scope_type, scope_key
- iso_week, month_key
- status (queued/running/succeeded/failed/canceled)
- reason (error message)
- created_at, started_at, finished_at
- created_by

### dbo.exec_report_snapshots
Stores generated AI analysis:
- Created by worker after successful job
- Contains JSON analysis
- Links to job via scope + temporal keys

## Future Enhancements

Possible additions:
- Export job logs to CSV
- Email notifications on job failure
- Job retry mechanism
- Job scheduling UI
- Bulk job operations
- Performance graphs
- Worker health monitoring

