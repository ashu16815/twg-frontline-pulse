import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db-simple';
import { callAzureJSON } from '@/lib/azure-simple';

export async function GET() {
  const details: any = { sql: null, openai: null, version: process.env.APP_VERSION || 'dev' };
  
  try {
    const p = await getDb();
    await p.request().query`SELECT 1`;
    details.sql = { ok: true };
  } catch (e: any) {
    details.sql = { ok: false, error: e.message };
  }
  
  try {
    const r = await callAzureJSON([{ role: 'system', content: 'You are a health check assistant. Respond with JSON only: {"status":"ok"}' }]);
    details.openai = { ok: !!r };
  } catch (e: any) {
    details.openai = { ok: false, error: e.message };
  }
  
  const ok = !!(details.sql?.ok && details.openai?.ok);
  return NextResponse.json({ ok, details });
}