# 🚀 Vercel Deployment Guide - Win In Store

## Environment Variables Required

Add these environment variables in your Vercel project settings:

### 🗄️ Azure SQL Database

```bash
AZURE_SQL_CONNECTION_STRING="Server=tcp:redpulse.database.windows.net,1433;Database=redpulse;User Id=redpulseadmin;Password=7NdYYgj4EvilspLS;Encrypt=true;TrustServerCertificate=false;Connection Timeout=30;"
```

### 🤖 Azure OpenAI Configuration

```bash
# Azure OpenAI Endpoint
AZURE_OPENAI_ENDPOINT="https://openai-euw-twg-apps-poc.openai.azure.com/"

# Azure OpenAI API Key
AZURE_OPENAI_API_KEY="<YOUR_AZURE_OPENAI_API_KEY>"

# GPT-5 Deployment Name (for reasoning/summarization)
AZURE_OPENAI_DEPLOYMENT_GPT5="gpt-5-mini"

# Transcription Deployment Name (for voice-to-text)
AZURE_OPENAI_DEPLOYMENT_TRANSCRIBE="gpt-4o-transcribe"

# API Version
AZURE_OPENAI_API_VERSION="2024-10-01-preview"
```

### 🔐 Application Settings

```bash
# Shared passcode for accessing the app
APP_SHARED_PASSCODE="twg2024"
```

---

## 📋 Step-by-Step Deployment to Vercel

### 1. Install Vercel CLI (if not already installed)

```bash
npm i -g vercel
```

### 2. Login to Vercel

```bash
vercel login
```

### 3. Link to Vercel Project (First Time)

```bash
vercel link
```

### 4. Add Environment Variables

**Option A: Via Vercel Dashboard**
1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add each variable from the list above
5. Make sure to select **Production**, **Preview**, and **Development** for each

**Option B: Via Vercel CLI**

```bash
# Azure SQL
vercel env add AZURE_SQL_CONNECTION_STRING

# Azure OpenAI
vercel env add AZURE_OPENAI_ENDPOINT
vercel env add AZURE_OPENAI_API_KEY
vercel env add AZURE_OPENAI_DEPLOYMENT_GPT5
vercel env add AZURE_OPENAI_DEPLOYMENT_TRANSCRIBE
vercel env add AZURE_OPENAI_API_VERSION

# App Settings
vercel env add APP_SHARED_PASSCODE
```

### 5. Deploy to Vercel

```bash
# Deploy to production
vercel --prod
```

Or simply push to GitHub - Vercel will auto-deploy if connected!

---

## 🔧 Post-Deployment Setup

### 1. Run Database Migrations

After first deployment, run these scripts to set up your database:

```bash
# Apply Azure SQL schema
npm run db:apply

# Seed store master data
npm run db:seed-stores
```

### 2. Test the Deployment

Visit your deployment URL and test:

1. **Health Check**: `/api/health/db` - Should return `{"ok":true}`
2. **Passcode**: Enter `twg2024` to access the app
3. **Store Search**: Try searching for "Albany" or "362"
4. **Submit Feedback**: Go to `/frontline/submit`
5. **Generate Report**: Go to `/reports` and click "Generate Executive Report"

---

## 🌐 Environment-Specific Notes

### Production
- All environment variables must be set
- Azure SQL firewall must allow Vercel IPs
- Azure OpenAI endpoints must be accessible

### Preview (PR Deployments)
- Uses same environment variables as Production
- Good for testing before merging to main

### Development
- Use `.env.local` file locally
- Not needed for Vercel deployments

---

## 🔍 Troubleshooting

### Database Connection Issues
```
Error: Failed to connect to Azure SQL
```
**Fix:** 
- Check Azure SQL firewall rules
- Add Vercel IP ranges to allowlist
- Verify connection string is correct

### Azure OpenAI Issues
```
Error: Missing Azure OpenAI configuration
```
**Fix:**
- Verify all Azure OpenAI environment variables are set
- Check API key is valid
- Ensure deployment names match your Azure setup

### Passcode Not Working
```
Invalid passcode
```
**Fix:**
- Verify `APP_SHARED_PASSCODE` is set to `twg2024`
- Clear browser cache/cookies

---

## 📦 What Gets Deployed

- ✅ Next.js 14 App Router application
- ✅ All API routes (Azure SQL + Azure OpenAI)
- ✅ Store master data (41 stores across 7 regions)
- ✅ Smart typeahead search
- ✅ AI-powered report generation
- ✅ Executive dashboard
- ✅ CEO Q&A interface

---

## 🎯 Quick Deployment Commands

```bash
# One-time setup
vercel link
vercel env pull  # Download env vars for local development

# Deploy
git push origin main  # Auto-deploys to Vercel
# OR
vercel --prod  # Manual deploy
```

---

## ✅ Deployment Checklist

- [ ] All environment variables added to Vercel
- [ ] GitHub repo connected to Vercel project
- [ ] Azure SQL firewall configured for Vercel
- [ ] Database schema applied
- [ ] Store master data seeded
- [ ] Health check endpoint returns OK
- [ ] Passcode works
- [ ] Store search works
- [ ] Feedback submission works
- [ ] Report generation works
- [ ] CEO Q&A works

---

## 🚀 Ready to Deploy!

Your app is now ready for deployment. The complete Win In Store system with:
- Azure SQL Database
- Azure OpenAI Integration
- Smart Store Master
- AI-Powered Reports
- Executive Dashboard

**Next Steps:**
1. Set environment variables in Vercel
2. Push to GitHub (or run `vercel --prod`)
3. Run database setup scripts
4. Test all features
5. Share with your team! 🎉

