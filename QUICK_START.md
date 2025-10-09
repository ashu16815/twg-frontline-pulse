# 🚀 Win In Store - Quick Start Guide

## ⚡ Get Running in 3 Commands

```bash
# 1. Setup database with test data
npm run db:setup

# 2. Start the app
npm run dev

# 3. Run tests (in another terminal)
npm run test:e2e
```

**That's it!** Your system is now fully operational with:
- ✅ 8 stores across 3 regions
- ✅ 5 feedback submissions with realistic data
- ✅ 6 RAG operational playbooks
- ✅ All API endpoints tested and working

---

## 🌐 Access Your App

| URL | Description |
|-----|-------------|
| http://localhost:3000 | **Home** - Main dashboard |
| http://localhost:3000/frontline/submit | **Submit Feedback** (requires passcode) |
| http://localhost:3000/reports | **View Reports** - See all submissions |
| http://localhost:3000/ceo | **CEO Dashboard** - AI-powered insights |
| http://localhost:3000/api/coverage | **Coverage API** - Store response rates |
| http://localhost:3000/api/health/db | **Health Check** - Database status |

---

## 📊 What Data is Included?

### Stores (8)
- **North**: TWG Albany, TWG Hamilton
- **Central**: TWG Manukau, TWG Wellington, TWG Palmerston North  
- **South**: TWG Dunedin, TWG Riccarton, TWG Christchurch

### This Week's Feedback (5 submissions)
1. **Albany** (-6%, -$14.5K) - Availability issues
2. **Manukau** (+3%, +$7.2K) - Strong tech sales ✅
3. **Dunedin** (+2%, +$3.5K) - Homewares growth ✅
4. **Riccarton** (+5%, +$12K) - Kids apparel star ✅
5. **Wellington** (-3%, -$8K) - Stockout challenges

**Coverage**: 5/8 stores = 63%

---

## 🧪 Test Everything Works

```bash
npm run test:e2e
```

**Expected:** 9/9 tests passing ✅

Tests:
1. Database health check
2. GET /api/stores (8 stores)
3. GET /reports (shows data)
4. GET /frontline/submit (loads form)
5. GET /weekly/submit (loads form)
6. POST /api/reports/generate (AI report)
7. GET /api/coverage (63% coverage)
8. Home page renders
9. CEO page renders

---

## 🔧 Troubleshooting

### Server won't start?
```bash
# Kill existing process
lsof -ti:3000 | xargs kill -9

# Restart
npm run dev
```

### Database connection error?
```bash
# Check your .env.local file exists
cat .env.local | grep AZURE_SQL_CONNECTION_STRING

# Test connection directly
node scripts/test-jdbc-connection.js
```

### Need to reset everything?
```bash
# This drops all tables and recreates with fresh data
npm run db:setup
```

---

## 🎯 Try These Next

### 1. Submit New Feedback
```
→ Visit: http://localhost:3000/frontline/submit
→ Enter passcode from .env.local
→ Pick a store (try ST-055 Hamilton - hasn't submitted yet!)
→ Fill in feedback
→ Submit
```

### 2. Generate AI Report
```bash
curl -X POST http://localhost:3000/api/reports/generate
```

View the generated report in the database:
```sql
SELECT * FROM dbo.executive_report ORDER BY created_at DESC
```

### 3. Check Store Coverage
```
→ Visit: http://localhost:3000/api/coverage
→ See which stores have/haven't submitted
→ Grouped by region
```

### 4. Ask the CEO AI
```
→ Visit: http://localhost:3000/ceo
→ Ask questions like:
   • "What are the biggest challenges this week?"
   • "Which stores are underperforming?"
   • "What themes are emerging across regions?"
```

---

## 📦 All Commands

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm run db:setup         # ✨ Setup database + data
npm run test:e2e         # ✨ Test all functionality
npm run test:azure       # Test Azure OpenAI
npm run setup            # ✨ Full setup + tests
```

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `scripts/setup-database-complete.mjs` | **Complete DB setup script** |
| `scripts/test-end-to-end.mjs` | **E2E testing script** |
| `scripts/test-azure-openai.mjs` | Azure OpenAI connection test |
| `lib/db.ts` | Database connection pool |
| `lib/azure.ts` | Azure OpenAI client |
| `lib/gpt5.ts` | AI analysis functions |
| `.env.local` | **Your credentials** |

---

## 🎉 You're All Set!

Your Win In Store system is now fully operational. The database is populated with realistic test data, all API endpoints are working, and the frontend is ready to use.

**Next Steps:**
1. ✅ Explore the app at http://localhost:3000
2. ✅ Submit test feedback
3. ✅ Generate AI reports
4. ✅ Customize for your stores

**Questions?** Check `DATABASE_SETUP.md` for detailed documentation.

---

**Built for frontline teams. Designed for executive insight.**
**Win In Store** 🚀

