# Updated Executive Report System

## ✅ New Features Added

### 1. Filters
- **Region Filter**: Filter by region code (e.g., AKL, WLG)
- **Store Filter**: Filter by store ID (e.g., 383)
- Leave empty for all stores

### 2. Show Details Section
- **Toggle Button**: Click to reveal/hide raw feedback data
- **Sample Feedbacks**: Shows top 20 feedbacks analyzed
  - Store ID, Region, Mood
  - Positive feedback
  - Pain points with $ impact
  - Comments
- **Pain Points by Impact**: Sorted list with dollar amounts

### 3. Metadata Display
- **Feedback Count**: Total feedback entries
- **Stores**: Number of unique stores
- **Est. Impact**: Total estimated dollar impact

## How It Works

### With Filters:
1. Enter region code OR store ID (or both)
2. Click "Generate Report"
3. Only filtered feedback is sent to Azure OpenAI
4. Report is generated based on filtered data

### Show Details:
1. Generate a report
2. Scroll to bottom
3. Click "▶ Show Details"
4. See all raw feedback that was analyzed
5. See pain points sorted by impact

## Example Usage

### All Stores
- Leave filters empty
- Click "Generate Report"
- Shows: All feedback from last 7 days

### Auckland Region Only
- Enter "AKL" in region filter
- Leave store empty
- Click "Generate Report"
- Shows: Only AKL feedback

### Single Store
- Enter store ID "383" in store filter
- Leave region empty
- Click "Generate Report"
- Shows: Only that store's feedback

## Data Displayed

### Raw Feedbacks Show:
- Store ID & Name
- Region Code
- Overall Mood (pos/neg/neu)
- Positive feedback (green)
- Pain points with dollar impact (red)
- Freeform comments

### Pain Points by Impact:
- Issue description
- Dollar impact amount
- Sorted by highest impact first

## API Usage

### POST /api/reports/executive

```javascript
// All stores
fetch('/api/reports/executive', { method: 'POST', body: JSON.stringify({}) })

// Filter by region
fetch('/api/reports/executive', { 
  method: 'POST', 
  body: JSON.stringify({ region_code: 'AKL' }) 
})

// Filter by store
fetch('/api/reports/executive', { 
  method: 'POST', 
  body: JSON.stringify({ store_id: '383' }) 
})

// Filter by both
fetch('/api/reports/executive', { 
  method: 'POST', 
  body: JSON.stringify({ region_code: 'AKL', store_id: '383' }) 
})
```

## Response Structure

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
    "estimated_impact": 50000,
    "region_filter": "AKL",
    "store_filter": "All"
  },
  "raw_data": {
    "sample_feedbacks": [...],
    "pain_points": [...]
  }
}
```

## Success! 🎉

Your executive report system now has:
- ✅ Filters for region and store
- ✅ Show details with all raw feedback
- ✅ Store count, feedback count, impact metrics
- ✅ Pain points sorted by impact
- ✅ Sample feedback display

Try it at: `http://localhost:3000/executive-reports`
