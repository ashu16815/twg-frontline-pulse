import { NextResponse } from 'next/server';

export async function GET() {
  const env = {
    AZURE_OPENAI_BASE_URL: process.env.AZURE_OPENAI_BASE_URL,
    AZURE_OPENAI_API_KEY: process.env.AZURE_OPENAI_API_KEY ? 'Present' : 'Missing',
    AZURE_OPENAI_DEPLOYMENT: process.env.AZURE_OPENAI_DEPLOYMENT,
    AZURE_OPENAI_API_VERSION: process.env.AZURE_OPENAI_API_VERSION,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Present' : 'Missing',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Present' : 'Missing',
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL,
    VERCEL_ENV: process.env.VERCEL_ENV
  };

  return NextResponse.json({
    environment: env,
    timestamp: new Date().toISOString()
  });
}
