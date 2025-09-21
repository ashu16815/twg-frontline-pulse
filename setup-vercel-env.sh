#!/bin/bash

echo "🔧 Setting up environment variables in Vercel..."
echo "⚠️  IMPORTANT: Replace placeholder values with real credentials before running!"

# Add Azure OpenAI environment variables (REPLACE WITH REAL VALUES)
vercel env add AZURE_OPENAI_BASE_URL production <<< "https://your-resource.openai.azure.com"
vercel env add AZURE_OPENAI_API_KEY production <<< "YOUR_AZURE_OPENAI_API_KEY"
vercel env add AZURE_OPENAI_DEPLOYMENT production <<< "gpt-5-mini"
vercel env add AZURE_OPENAI_DEPLOYMENT_TRANSCRIBE production <<< "gpt-4o-transcribe"
vercel env add AZURE_OPENAI_API_VERSION production <<< "2024-12-01-preview"

# Add Supabase environment variables (REPLACE WITH REAL VALUES)
vercel env add NEXT_PUBLIC_SUPABASE_URL production <<< "https://your-project.supabase.co"
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production <<< "YOUR_SUPABASE_ANON_KEY"
vercel env add SUPABASE_SERVICE_ROLE_KEY production <<< "YOUR_SUPABASE_SERVICE_ROLE_KEY"

# Add app configuration
vercel env add APP_SHARED_PASSCODE production <<< "change-me"

echo "✅ Environment variables added to Vercel production"
echo "🚀 Redeploying to apply changes..."

vercel --prod --yes
