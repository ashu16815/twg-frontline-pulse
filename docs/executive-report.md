# Executive Report Module

## Scope & Purpose
C-suite report translating store feedback into actions. Sections: Dashboard, Strategic Insights, Deep-Dive, Predictive Outlook, Action Recommendations.

## Data & RAG flow
1) Fetch filtered rows from `dbo.store_feedback` (week/month, region, store).
2) Compact payload → Azure OpenAI (GPT-5) system prompt (Big-4 style) → JSON insights.
3) (Optional) Call Azure ML endpoint for forecasts/scenarios; included as a stub.
4) Cache payload in `dbo.exec_report_cache` to keep page <3s.
5) Thumbs/Comments → `dbo.exec_report_feedback` for continuous improvement.

## Extending
- Replace AML stub with your deployed endpoint (same payload shape).
- Move heavy aggregations to Synapse and query via `lib/synapse.ts`.
- Add PDF export from this page to ship weekly packs.

## Security
- Protected by your existing auth middleware.
- No secrets in code; use Azure App Settings or Key Vault references.

## Setup Instructions

### 1. Database Setup
```bash
npm run db:apply:exec-report
```

### 2. Seed Mock Data (Optional)
```bash
npm run seed:mock:feedback
```

### 3. Environment Variables
Add these optional variables to your `.env`:
```
# Azure ML (optional)
AZURE_ML_SCORING_URI=https://<aml-endpoint>/score
AZURE_ML_KEY=***

# Synapse (optional)
SYNAPSE_SQL_ENDPOINT=your-synapse.sql.azuresynapse.net
SYNAPSE_DB=dw
SYNAPSE_USER=***
SYNAPSE_PASSWORD=***
```

### 4. Access the Report
Navigate to `/exec-report` in your application.

## Features

### Executive Dashboard
- **KPI Cards**: Coverage %, Regions, Submissions, Total Impact
- **Directional Warning**: Shows when coverage < 70%

### Strategic Insights
- **Executive Summary**: 2-4 bullet points with business implications
- **What's Working**: Positive trends ranked by materiality
- **What's Not**: Issues with $ impact amounts

### Action Planning
- **Top 3 Opportunities**: Network-wide opportunities with themes and impact
- **Top 3 Actions**: Concrete actions with owners and expected impact

### Risk & Regional Analysis
- **Risk Assessment**: Up to 5 key risks
- **Opportunity by Region**: Impact and mention counts per region

### Predictive Outlook
- **Azure ML Integration**: Optional forecasts and scenarios
- **Graceful Degradation**: Shows helpful message when not configured

### Feedback System
- **Thumbs Up/Down**: Rate each section (summary, insights, actions, predictive)
- **Continuous Improvement**: Feedback stored for AI model improvement

## API Endpoints

### `/api/exec-report/summary`
- **GET**: Generate executive report with AI insights
- **Parameters**: `scope`, `week`, `month`, `region`, `storeId`, `cache`
- **Response**: JSON with summary, insights, opportunities, actions, risks, regional data

### `/api/exec-report/feedback`
- **POST**: Submit feedback on report sections
- **Body**: `{ scope, scope_key, region, storeId, section, rating, comment }`

### `/api/lookups/stores`
- **GET**: Fetch active stores for filter dropdowns
- **Response**: `{ ok: true, stores: [...] }`

## Database Schema

### `exec_report_cache`
- Caches AI-generated insights for fast page loads
- Indexed by `report_scope` and `scope_key`

### `exec_report_feedback`
- Stores user feedback on report sections
- Links to user, scope, region, and store for analytics

## Performance
- **Caching**: Repeat loads under 3 seconds
- **RAG Optimization**: Compact payloads sent to Azure OpenAI
- **Lazy Loading**: Only loads data when filters change
