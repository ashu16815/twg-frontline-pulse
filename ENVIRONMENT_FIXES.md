# Environment Variables Setup Guide

## 🚨 CRITICAL ISSUES TO FIX

### 1. Missing AUTH_JWT_SECRET

**Problem:** The `AUTH_JWT_SECRET` environment variable is missing, which is required for JWT token signing and verification.

**Solution:** Add this environment variable to your Vercel deployment:

```
AUTH_JWT_SECRET=twg2024-super-secret-jwt-key-change-in-production
```

### 2. Azure SQL Database Connection Error

**Problem:** "Incorrect syntax near the keyword 'database'" error suggests a connection string parsing issue.

**Current Connection String:**
```
Server=tcp:redpulse.database.windows.net,1433;Database=redpulse;User Id=redpulseadmin;Password=7NdYYgj4EvilspLS;Encrypt=true;TrustServerCertificate=false;Connection Timeout=30;
```

## 🔧 IMMEDIATE ACTIONS REQUIRED

### Step 1: Add Missing Environment Variable

1. Go to **Vercel Dashboard** → **Your Project** → **Settings** → **Environment Variables**
2. Add the following variable:
   - **Name:** `AUTH_JWT_SECRET`
   - **Value:** `twg2024-super-secret-jwt-key-change-in-production`
   - **Environments:** ✅ Production, ✅ Preview, ✅ Development

### Step 2: Test Database Connection

Run the database connection test script:

```bash
cd /Users/323905/Documents/VibeCoding/RedPulse
node scripts/test-db-connection.mjs
```

This will help identify the exact database connection issue.

### Step 3: Check Azure SQL Firewall

The database connection error might be due to firewall restrictions. Check:

1. **Azure Portal** → **SQL Databases** → **redpulse** → **Networking**
2. Ensure your IP address is allowed
3. For Vercel deployment, you may need to allow Vercel's IP ranges

## 📋 COMPLETE ENVIRONMENT VARIABLES LIST

Make sure ALL these variables are set in Vercel:

```
1. AZURE_SQL_CONNECTION_STRING
   Server=tcp:redpulse.database.windows.net,1433;Database=redpulse;User Id=redpulseadmin;Password=7NdYYgj4EvilspLS;Encrypt=true;TrustServerCertificate=false;Connection Timeout=30;

2. AZURE_OPENAI_ENDPOINT
   https://openai-euw-twg-apps-poc.openai.azure.com/

3. AZURE_OPENAI_API_KEY
   [Your actual API key]

4. AZURE_OPENAI_DEPLOYMENT_GPT5
   gpt-5-mini

5. AZURE_OPENAI_DEPLOYMENT_TRANSCRIBE
   gpt-4o-transcribe

6. AZURE_OPENAI_API_VERSION
   2024-10-01-preview

7. AUTH_JWT_SECRET
   twg2024-super-secret-jwt-key-change-in-production

8. APP_SHARED_PASSCODE
   twg2024
```

## 🧪 TESTING AFTER FIXES

After adding the missing environment variable:

1. **Trigger a new deployment** in Vercel
2. **Test the health endpoint:** `https://your-app.vercel.app/api/admin/health`
3. **Test database connection:** `https://your-app.vercel.app/api/health/db`
4. **Test reports endpoint:** `https://your-app.vercel.app/api/reports/summary`

## 🔍 DEBUGGING TIPS

### If Database Connection Still Fails:

1. **Check Firewall Rules:**
   - Azure Portal → SQL Databases → redpulse → Networking
   - Add your IP address or allow all IPs temporarily

2. **Verify Connection String:**
   - Ensure no extra spaces or characters
   - Check that password doesn't contain special characters that need escaping

3. **Test Locally:**
   - Copy `.env.local` with your actual credentials
   - Run `node scripts/test-db-connection.mjs`

### If JWT Issues Persist:

1. **Clear Browser Cookies** for your domain
2. **Check Console Logs** for JWT-related errors
3. **Verify AUTH_JWT_SECRET** is the same across all environments

## 📞 SUPPORT

If issues persist after following these steps:

1. Check Vercel deployment logs for specific error messages
2. Run the database test script locally to isolate the issue
3. Verify all environment variables are correctly set in Vercel dashboard
