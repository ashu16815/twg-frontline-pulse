# Simple Executive Report System

## What I Built

A clean, simple executive report system that:
- ✅ Fetches last 7 days of feedback
- ✅ Uses Azure OpenAI to generate insights
- ✅ Shows Top 3 Opportunities
- ✅ Shows Top 3 Pain Points
- ✅ Displays Executive Summary
- ✅ Shows What's Working Well
- ✅ Provides Recommended Actions

## How to Use

### 1. Navigate to the Report Page
Visit: `http://localhost:3000/executive-reports`

### 2. Generate Report
Click the "⚡ Generate Report" button

### 3. View Results
The report will display:
- **Executive Summary**: 3-4 sentence overview
- **What's Working Well**: Success stories
- **Top 3 Opportunities**: Growth areas
- **Top 3 Pain Points**: Issues to address
- **Recommended Actions**: Next steps

## How It Works

### API: `/api/reports/executive`

**POST** - Generates new report
```bash
curl -X POST http://localhost:3000/api/reports/executive
```

**GET** - Retrieves last generated report
```bash
curl http://localhost:3000/api/reports/executive
```

### Data Flow

```
1. Fetch last 7 days of feedback from database
2. Structure data into JSON format:
   - Positive themes
   - Pain points with impact
   - Sample comments
   - Store count, total impact
3. Send to Azure OpenAI with structured prompt
4. Receive JSON response with:
   - executive_summary
   - top_opportunities (array)
   - top_pain_points (array)
   - what_is_working_well (array)
   - recommended_actions (array)
5. Display in UI
```

## Files Created

- **`app/api/reports/executive/route.ts`**: API endpoint
- **`components/reports/ExecutiveReportSimple.tsx`**: UI component
- **`app/executive-reports/page.tsx`**: Page route

## Key Features

### 1. Last 7 Days Data
```typescript
WHERE created_at >= DATEADD(day, -7, GETDATE())
```

### 2. Structured Data for AI
- Total feedbacks count
- Stores with feedback
- Total estimated impact ($)
- Positive themes (top 20)
- Pain points with dollar impact (top 30)
- Sample comments (top 10)

### 3. Azure OpenAI Prompt
```
System: You are a senior retail operations executive analyst for The Warehouse Group.

User: {structured data as JSON}

Output: {
  "executive_summary": "...",
  "top_opportunities": ["opp1", "opp2", "opp3"],
  "top_pain_points": ["issue1", "issue2", "issue3"],
  "what_is_working_well": ["success1", "success2"],
  "recommended_actions": ["action1", "action2", "action3"]
}
```

### 4. UI Components
- Green cards for "What's Working Well"
- Blue cards for "Top Opportunities"
- Red cards for "Pain Points"
- Yellow cards for "Recommended Actions"

## Testing

### Test the API Directly
```bash
curl -X POST http://localhost:3000/api/reports/executive
```

Expected response:
```json
{
  "ok": true,
  "report": {
    "executive_summary": "...",
    "top_opportunities": ["...", "...", "..."],
    "top_pain_points": ["...", "...", "..."],
    "what_is_working_well": ["...", "..."],
    "recommended_actions": ["...", "...", "..."]
  },
  "metadata": {
    "feedback_count": 42,
    "stores_count": 15,
    "estimated_impact": 50000
  }
}
```

### Test in Browser
1. Go to `http://localhost:3000/executive-reports`
2. Click "Generate Report"
3. Wait for AI to process (5-10 seconds)
4. View results

## Troubleshooting

### If AI fails:
The system returns a fallback report so the UI never breaks.

### If no data:
Check that there's feedback in the last 7 days:
```sql
SELECT COUNT(*) FROM dbo.store_feedback 
WHERE created_at >= DATEADD(day, -7, GETDATE())
```

### To see AI logs:
Check terminal where `npm run dev` is running, look for:
- 🤖 Calling Azure OpenAI...
- ✅ AI report generated successfully
- ❌ Error messages if issues occur

## Next Steps (Optional Enhancements)

1. **Add caching**: Store reports in database
2. **Add filters**: Region, store, date range
3. **Add PDF export**: Download report
4. **Add schedule**: Auto-generate daily/weekly
5. **Add charts**: Visualize opportunities and pain points

## Success Criteria

✅ **Works**: Generates report in 5-10 seconds
✅ **Simple**: One click to generate
✅ **Clear**: Executive-friendly format
✅ **Useful**: Actionable insights
✅ **Reliable**: Fallback if AI fails

## Summary

This is a **simple, working solution** that:
- Fetches last 7 days of feedback
- Structures data for AI
- Calls Azure OpenAI
- Returns actionable insights
- Displays beautifully

**No complex async architecture, no Redis, just pure simplicity.**
