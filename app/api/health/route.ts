import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { callAzureJSON } from '@/lib/azure';

export async function GET(){
  const results: any = { sql: null, openai: null, version: process.env.APP_VERSION||'dev' };
  try{ const p = await getDb(); const r = await p.request().query`SELECT TOP 1 1 AS ok`; results.sql = { ok: true }; }catch(e:any){ results.sql = { ok:false, error: e.message }; }
  try{ const r = await callAzureJSON([{role:'system',content:'respond with json: {"status":"ok"}'}]); results.openai = { ok: !!r }; }catch(e:any){ results.openai = { ok:false, error: e.message }; }
  const overall = !!(results.sql?.ok && results.openai?.ok);
  return NextResponse.json({ ok: overall, details: results });
}
