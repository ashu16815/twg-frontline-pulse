# Win In Store - Database Setup & Testing Guide

## 🚀 Complete Setup Script

A comprehensive database setup script that:
- **Drops** all existing tables (clean slate)
- **Creates** 6 tables with proper indexes
- **Populates** with realistic test data
- **Verifies** data integrity

### Tables Created

1. **`store_master`** - Store directory (8 stores across 3 regions)
2. **`store_feedback`** - Weekly feedback submissions
3. **`weekly_summary`** - Regional performance summaries
4. **`executive_report`** - AI-generated executive reports
5. **`wis_docs`** - RAG document corpus (6 operational playbooks)
6. **`audit_log`** - System audit trail

---

## 📊 Test Data Included

### Stores (8 total)
- **North Region**: Albany, Hamilton
- **Central Region**: Manukau, Wellington, Palmerston North
- **South Region**: Dunedin, Riccarton, Christchurch

### Feedback Submissions (5 for current week)
- **ST-001 Albany** (missed target -6%, -$14,500)
  - Challenge: Apparel availability, roster gaps, supplier delays
  - Mood: Negative
  
- **ST-014 Manukau** (beat target +3%, +$7,200)
  - Strength: Audio/Tech performance
  - Challenge: Fitting room queues
  - Mood: Positive
  
- **ST-027 Dunedin** (beat target +2%, +$3,500)
  - Strength: Homewares growth
  - Challenge: Late apparel deliveries
  - Mood: Positive
  
- **ST-033 Riccarton** (beat target +5%, +$12,000)
  - Strength: Kids apparel
  - Challenge: POS system performance
  - Mood: Positive
  
- **ST-042 Wellington** (missed target -3%, -$8,000)
  - Challenge: Stockouts, staff sickness
  - Mood: Negative

### Regional Summaries (3)
- North, Central, South regions
- Themes, drivers, and total impact calculated

### RAG Documents (6)
Operational playbooks covering:
- Availability management (North)
- Promo launch checklist
- Fitting room standards (Central)
- DC escalation process (South)
- POS health monitoring
- Roster management

---

## 🛠️ Commands

### 1. Complete Database Setup
```bash
npm run db:setup
```

**What it does:**
1. ✅ Connects to Azure SQL
2. 🗑️ Drops existing tables
3. 📋 Creates 6 tables with indexes
4. 📊 Populates stores (8)
5. 📝 Adds feedback (5 submissions)
6. 📄 Creates summaries (3 regions)
7. 📚 Seeds RAG docs (6 playbooks)
8. 🔍 Verifies data counts

**Output:**
```
✅ DATABASE SETUP COMPLETE!

📊 Summary:
   • 6 tables created
   • 8 stores
   • 5 feedback submissions
   • 3 regional summaries
   • 6 RAG documents
   • Test data for week: 2025-W41
```

---

### 2. End-to-End Testing
```bash
npm run test:e2e
```

**What it tests:**
- ✅ Database health check
- ✅ GET /api/stores (returns 8 stores)
- ✅ GET /reports (with real data)
- ✅ GET /frontline/submit (passcode gate)
- ✅ GET /weekly/submit
- ✅ POST /api/reports/generate (AI report)
- ✅ GET /api/coverage (5/8 = 63% coverage)
- ✅ Home page renders
- ✅ CEO page renders

**Expected Result:**
```
🎉 All tests PASSED! System is fully operational.

📊 Test Results:
   ✅ Passed: 9
   ❌ Failed: 0
   Total:  9
```

---

### 3. Test Azure OpenAI
```bash
npm run test:azure
```

Tests connectivity and capabilities:
- Chat completion
- JSON mode
- Feedback analysis
- Transcription endpoint

---

### 4. Combined Setup & Test
```bash
npm run setup
```

Runs both `db:setup` and `test:e2e` sequentially.

---

## 📁 Database Schema

### `store_master`
```sql
- id (uniqueidentifier, PK)
- store_id (nvarchar(20), unique)
- store_name (nvarchar(200))
- region (nvarchar(100))
- manager_email (nvarchar(200))
- active (bit, default 1)
- created_at (datetime2)
```

### `store_feedback`
```sql
- id (uniqueidentifier, PK)
- created_at (datetime2)
- iso_week (nvarchar(10)) -- indexed
- store_id (nvarchar(20)) -- indexed
- store_name, region, manager_email

-- Performance
- hit_target (bit)
- target_variance_pct, variance_dollars (float)

-- Feedback
- top_positive (nvarchar(400))
- top_positive_impact (float)
- top_negative_1/2/3 (nvarchar(400))
- top_negative_1/2/3_impact (float)
- next_actions, freeform_comments (nvarchar(max))
- estimated_dollar_impact (float)

-- Legacy fields
- miss1/2/3, miss1/2/3_dollars
- priority1/2/3, priority1/2/3_horizon

-- AI Analysis
- overall_mood (nvarchar(16))
- themes (nvarchar(1000))
```

### `weekly_summary`
```sql
- id (uniqueidentifier, PK)
- created_at (datetime2)
- iso_week (nvarchar(10)) -- indexed
- region (nvarchar(100)) -- indexed
- summary (nvarchar(max))
- top_themes (nvarchar(1000))
- total_reported_impact (float)
- top_drivers (nvarchar(max)) -- JSON
```

### `executive_report`
```sql
- id (uniqueidentifier, PK)
- created_at (datetime2)
- iso_week (nvarchar(10)) -- indexed
- narrative (nvarchar(max))
- highlights (nvarchar(max)) -- JSON
- themes (nvarchar(max)) -- JSON
- risks (nvarchar(max)) -- JSON
- actions (nvarchar(max)) -- JSON
```

### `wis_docs`
```sql
- doc_id (uniqueidentifier, PK)
- title (nvarchar(300))
- region (nvarchar(100)) -- indexed
- content (nvarchar(max))
- created_at (datetime2)
-- Note: VECTOR column not included (preview feature)
```

### `audit_log`
```sql
- id (uniqueidentifier, PK)
- created_at (datetime2) -- indexed
- actor (nvarchar(200))
- action (nvarchar(100)) -- indexed
- meta (nvarchar(max)) -- JSON
```

---

## 🔍 Coverage Dashboard

After setup, visit `/api/coverage` to see:

```json
{
  "ok": true,
  "isoWeek": "2025-W41",
  "total": 8,
  "responded": 5,
  "nonresponded": 3,
  "coveragePct": 63,
  "byRegion": {
    "North": {
      "total": 2,
      "responded": 1,
      "nonresponders": ["ST-055 Hamilton"]
    },
    "Central": {
      "total": 3,
      "responded": 2,
      "nonresponders": ["ST-068 Palmerston North"]
    },
    "South": {
      "total": 3,
      "responded": 2,
      "nonresponders": ["ST-079 Christchurch"]
    }
  }
}
```

---

## 🧪 Manual Testing Checklist

After running `npm run setup`, test these flows:

### 1. View Reports
```
✅ http://localhost:3000/reports
   → Should show 5 submissions
   → Should show total impact
   → Should show regional breakdown
```

### 2. Submit Feedback
```
✅ http://localhost:3000/frontline/submit
   → Enter passcode (from env)
   → Pick store from dropdown
   → Submit feedback
   → Check database for new entry
```

### 3. Generate Report
```
✅ POST http://localhost:3000/api/reports/generate
   → AI generates executive summary
   → Saved to executive_report table
   → Returns highlights/themes/risks/actions
```

### 4. Check Coverage
```
✅ http://localhost:3000/api/coverage
   → Shows 5/8 stores (63%)
   → Lists responders and non-responders
   → Grouped by region
```

### 5. CEO Dashboard
```
✅ http://localhost:3000/ceo
   → View all reports
   → Query with natural language
```

---

## 🔐 Environment Variables Required

```env
# Azure SQL Database
AZURE_SQL_CONNECTION_STRING="Server=tcp:redpulse.database.windows.net,1433;Database=redpulse;User Id=redpulseadmin@redpulse;Password=***;Encrypt=true;TrustServerCertificate=false;Connection Timeout=30;"

# Azure OpenAI
AZURE_OPENAI_ENDPOINT="https://openai-instance-australiaeast2.openai.azure.com/"
AZURE_OPENAI_API_KEY="***"
AZURE_OPENAI_DEPLOYMENT_GPT5="gpt-5-mini"
AZURE_OPENAI_DEPLOYMENT_TRANSCRIBE="whisper"
AZURE_OPENAI_API_VERSION="2024-10-01-preview"

# Application
APP_SHARED_PASSCODE="change-me"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

---

## 🐛 Troubleshooting

### "Connection string not found"
```bash
# Ensure .env.local exists with AZURE_SQL_CONNECTION_STRING
cat .env.local | grep AZURE_SQL_CONNECTION_STRING
```

### "Login failed"
- ✅ Check username/password in connection string
- ✅ Verify your IP is in Azure SQL firewall rules
- ✅ Test connection: `node scripts/test-jdbc-connection.js`

### "Table already exists"
```bash
# Script automatically drops tables first
npm run db:setup
```

### Tests failing
```bash
# Ensure dev server is running
npm run dev

# In another terminal
npm run test:e2e
```

---

## 📦 NPM Scripts Reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run db:setup` | **Complete database setup with data** |
| `npm run db:apply` | Apply schema only (no data) |
| `npm run seed` | Seed data only (legacy) |
| `npm run test:azure` | Test Azure OpenAI connection |
| `npm run test:e2e` | Run end-to-end tests |
| `npm run setup` | **Full setup + tests** |

---

## ✅ Success Criteria

After running `npm run setup`, you should see:

1. ✅ **Database Setup**: 6 tables created, 8 stores, 5 feedback, 3 summaries, 6 docs
2. ✅ **Tests Pass**: 9/9 tests passing
3. ✅ **Pages Load**: Home, Reports, CEO, Submit pages all render
4. ✅ **API Works**: Health, stores, coverage, report generation all functional
5. ✅ **Data Visible**: Reports page shows real feedback data

**Expected Terminal Output:**
```
═══════════════════════════════════════════════════════════
✅ DATABASE SETUP COMPLETE!

📊 Summary:
   • 6 tables created
   • 8 stores
   • 5 feedback submissions
   • 3 regional summaries
   • 6 RAG documents
   • Test data for week: 2025-W41

🎉 All tests PASSED! System is fully operational.

📊 Test Results:
   ✅ Passed: 9
   ❌ Failed: 0
   Total:  9
```

---

## 🎯 Next Steps

1. **Customize Data**: Edit `scripts/setup-database-complete.mjs` to add your stores
2. **Add More Docs**: Insert RAG documents for your operational playbooks
3. **Configure AI**: Update Azure OpenAI deployments in `.env.local`
4. **Deploy**: Push to Vercel with production Azure SQL credentials

---

## 📚 Related Documentation

- `README.md` - Main project documentation
- `VOICE_SETUP.md` - Voice transcription setup
- `env.example` - Environment variable template
- `db/schema.sql` - Legacy schema reference

---

**Built by experienced engineers for enterprise retail operations.**
**Focus on the front line to drive bottom line.** 🚀

