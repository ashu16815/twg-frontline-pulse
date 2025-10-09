# Vercel Deployment Guide

## ✅ What's Done

### 1. Environment Variables Added to Vercel Production

All 7 required environment variables have been added to Vercel:

```
✓ AZURE_SQL_CONNECTION_STRING
✓ AZURE_OPENAI_ENDPOINT  
✓ AZURE_OPENAI_API_KEY
✓ AZURE_OPENAI_DEPLOYMENT_GPT5
✓ AZURE_OPENAI_DEPLOYMENT_TRANSCRIBE
✓ AZURE_OPENAI_API_VERSION
✓ APP_SHARED_PASSCODE
```

Verify with: `vercel env ls`

### 2. Code Fixes Applied

- ✅ Added `@types/mssql` for TypeScript support
- ✅ Deprecated `/app/api/weekly/performance/submit` (not used)
- ✅ Deprecated `/app/api/weekly/submit` (not used)
- ✅ Redirected `/app/my/performance/page.tsx` to `/reports`
- ✅ All changes pushed to GitHub

### 3. Project Linked to Vercel

- Project: `win-in-store`
- GitHub: https://github.com/ashu16815/twg-frontline-pulse
- Vercel: ashu16815-gmailcoms-projects/win-in-store

---

## ⚠️ BLOCKING ISSUE: Azure SQL Firewall

### Problem

Vercel build servers are blocked from accessing Azure SQL Database.

**Error:**
```
Cannot open server 'redpulse' requested by the login. 
Client with IP address '13.217.51.162' is not allowed to access the server.
```

### Solution Required

You need to add Vercel's IP addresses to Azure SQL firewall rules.

#### Option 1: Allow All (Quick but less secure)

1. Go to **Azure Portal** → **SQL Databases** → **redpulse**
2. Click **Networking** (left sidebar)
3. Under **Firewall rules**, click **+ Add a firewall rule**
4. Add:
   - **Name:** `vercel-all`
   - **Start IP:** `0.0.0.0`
   - **End IP:** `255.255.255.255`
5. Click **Save**
6. **Wait 5 minutes** for the change to propagate

#### Option 2: Allow Vercel IPs Only (More secure)

1. Go to Azure Portal → SQL Databases → redpulse → Networking
2. Add firewall rules for Vercel's IP ranges:

```
# Vercel Edge Network IPs (partial list - check Vercel docs for full list)
Name: vercel-us-east
Start: 76.76.21.0
End: 76.76.21.255

Name: vercel-us-east-2
Start: 64.23.132.0
End: 64.23.132.255
```

For the complete list, see: https://vercel.com/docs/edge-network/regions

3. Click **Save**
4. **Wait 5 minutes**

---

## 🚀 Deploy After Fixing Firewall

Once the firewall is configured, run:

```bash
vercel --prod --yes
```

OR just push to `main` branch (if auto-deploy is enabled):

```bash
git push origin main
```

---

## 📊 Test After Deployment

1. **Visit the production URL** (Vercel will show it after deployment)
2. **Login** with passcode: `twg2024`
3. **Test flows:**
   - ✅ Home page loads with AI insights
   - ✅ Submit Store Report works
   - ✅ Reports page shows data
   - ✅ Ask Questions (CEO Office) works
   - ✅ Database health check passes

---

## 🔧 Quick Reference

### Check Environment Variables
```bash
vercel env ls
```

### Add/Update Environment Variable
```bash
echo "VALUE" | vercel env add VAR_NAME production
```

### Deploy to Production
```bash
vercel --prod --yes
```

### View Logs
```bash
vercel logs --prod
```

### Pull .env.local from Vercel
```bash
vercel env pull .env.local
```

---

## 📝 Notes

- The app is ready to deploy once the Azure SQL firewall is configured
- All code is migrated from Supabase to Azure SQL
- Voice input is hidden (can be re-enabled by uncommenting in forms)
- Deprecated routes return 410 status codes
- Home page shows live AI insights from database

---

## 🆘 Troubleshooting

### Build Fails with "Missing Supabase..."
This is just a warning. The app uses mock Supabase client and ignores it.

### "Database not configured" error
Check that all environment variables are set in Vercel production.

### Firewall error persists
Wait 5-10 minutes after adding firewall rules. Azure can be slow to propagate.

### Need to restart deployment
```bash
vercel --prod --yes --force
```

