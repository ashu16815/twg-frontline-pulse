# Win In Store - Azure SQL Migration

**Focus on the front line to drive bottom line.**

Win In Store is an enterprise-ready frontline feedback system built with Next.js 14, Azure SQL Database (with VECTOR support for RAG), and Azure OpenAI (GPT-5).

## 🏗️ Architecture

- **Frontend**: Next.js 14 (App Router) + React + Tailwind CSS (black/liquid theme)
- **Server**: Next.js API routes (TypeScript) + mssql driver
- **Database**: Azure SQL Database with native VECTOR support (preview) and COSINE similarity
- **AI**: Azure OpenAI (GPT-5 for reasoning/summarization; gpt-4o-transcribe for Speech-to-Text)

## 🚀 Quick Start

### 1. Prerequisites

- Node.js 18+ 
- Azure SQL Database instance
- Azure OpenAI resource with GPT-5 and transcription deployments
- Your IP address added to Azure SQL firewall rules

### 2. Environment Setup

Copy the environment template:
```bash
cp env.azure.example .env.local
```

Update `.env.local` with your credentials:

```env
# Azure SQL Database
AZURE_SQL_CONNECTION_STRING=Server=tcp:YOUR_SERVER.database.windows.net,1433;Database=YOUR_DATABASE;User Id=YOUR_USER;Password=YOUR_PASSWORD;Encrypt=true;TrustServerCertificate=false;Connection Timeout=30;

# Azure OpenAI
AZURE_OPENAI_ENDPOINT=https://YOUR_RESOURCE.openai.azure.com/
AZURE_OPENAI_API_KEY=your-azure-openai-api-key
AZURE_OPENAI_DEPLOYMENT_GPT5=gpt-5
AZURE_OPENAI_DEPLOYMENT_TRANSCRIBE=gpt-4o-transcribe
AZURE_OPENAI_API_VERSION=2024-10-01-preview

# Application
APP_SHARED_PASSCODE=your-secure-passcode
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Apply Database Schema

This will create all necessary tables in your Azure SQL Database:

```bash
npm run db:apply
```

Expected tables created:
- `store_master` - Store information
- `store_feedback` - Weekly performance feedback
- `weekly_summary` - AI-generated regional summaries
- `executive_report` - Executive-level insights
- `wis_docs` - RAG document corpus with VECTOR embeddings
- `audit_log` - System audit trail

### 5. Seed Demo Data

```bash
npm run seed
```

This will populate:
- 5 demo stores
- 3 feedback submissions
- 4 RAG documents

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## 📊 Database Schema

### store_feedback

The main feedback table supports:
- **Performance tracking**: hit_target, variance_pct, variance_dollars
- **Positives & Misses**: top_positive, miss1-3 with dollar impacts
- **Priorities**: 3 priorities with horizons (Next Month/Quarter)
- **AI Analysis**: overall_mood, themes (comma-separated)

### wis_docs (RAG Support)

Documents for retrieval-augmented generation:
- **VECTOR column**: 1536-dimensional embeddings
- **COSINE similarity**: for semantic search
- **Regional filtering**: optionally scope searches by region

**Note**: VECTOR support is in Azure SQL preview. If not available in your region yet, the table will be created but vector index creation will be skipped.

## 🛠️ NPM Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:apply     # Apply database schema
npm run seed         # Seed demo data
```

## 🔑 Key Features

### 1. Weekly Check-in (`/weekly/submit`)
- Store managers submit weekly performance feedback
- Voice-to-text transcription via Azure OpenAI
- Structured input: positive, misses, priorities
- Dollar impact tracking

### 2. Reports (`/reports`)
- Current week submissions
- Total reported impact aggregation
- Store-level breakdown

### 3. Coverage (`/coverage`)
- Track which stores have/haven't submitted
- Regional coverage breakdown
- Identify non-responders for follow-up

### 4. RAG Search (API: `/api/rag/search`)
- Semantic search across operational documents
- VECTOR-powered cosine similarity
- Regional filtering support

## 🤖 AI Integration

### GPT-5 Analysis

Used for:
- Analyzing performance feedback
- Detecting themes and patterns
- Generating regional summaries
- Creating executive reports

### Speech-to-Text

Azure OpenAI Whisper (gpt-4o-transcribe) for:
- Voice feedback capture
- Multi-language support
- High accuracy transcription

## 🔒 Security Notes

1. **Never commit `.env.local`** - it contains sensitive credentials
2. **Rotate your database password** if it was exposed
3. **Use Azure Key Vault** for production secrets
4. **Enable Azure AD authentication** for enhanced security
5. **Restrict API keys** to server-side only

## 🎨 Branding

- **Name**: Win In Store
- **Tagline**: "Focus on the front line to drive bottom line"
- **Theme**: Black/dark mode with liquid glass effects
- **Accent**: Red (#CC0000)
- **Typography**: Inter font family

## 📦 Migration from Supabase

This version replaces Supabase with Azure SQL. Key changes:

1. **Database**: PostgreSQL → Azure SQL Server
2. **Driver**: `@supabase/supabase-js` → `mssql`
3. **Schema**: Updated for SQL Server syntax (NVARCHAR, UNIQUEIDENTIFIER, etc.)
4. **VECTOR**: Native Azure SQL VECTOR support (preview)
5. **Authentication**: Simplified passcode gate (upgrade to Azure AD recommended)

## 🚨 Troubleshooting

### Connection Issues

If `npm run db:apply` fails:

1. **Check firewall**: Add your IP to Azure SQL firewall rules
2. **Verify credentials**: Ensure connection string is correct
3. **Test connection**: Use Azure Data Studio or SSMS
4. **Check permissions**: User needs CREATE TABLE rights

### VECTOR Index Error

If you see "VECTOR type not supported":
- Azure SQL VECTOR is in preview
- Check if available in your region
- The app will work without VECTOR; RAG search just won't use semantic similarity

### Azure OpenAI Errors

If GPT-5 calls fail:
- Verify deployment names match your Azure OpenAI resource
- Check API key is correct
- Ensure GPT-5 or gpt-4o-transcribe is deployed
- Verify API version is compatible

## 📚 Additional Resources

- [Azure SQL VECTOR documentation](https://learn.microsoft.com/en-us/sql/relational-databases/vectors/)
- [Azure OpenAI Service](https://learn.microsoft.com/en-us/azure/ai-services/openai/)
- [Next.js 14 App Router](https://nextjs.org/docs/app)

## 📝 License

Proprietary - Built for TWG internal use.

---

**Built by enterprise engineers for enterprise needs.**

