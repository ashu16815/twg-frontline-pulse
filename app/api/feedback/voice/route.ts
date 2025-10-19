import { NextResponse } from 'next/server';
import { callAzureJSON } from '@/lib/azure';

const SYS = { role: 'system', content: `You extract structured feedback for a weekly store report. Output strict JSON only:
{
  "store_code": string,
  "iso_week": string,        // e.g., 2025-W41
  "month_key": string,       // e.g., 2025-10
  "top_positive": string,
  "miss1": string, "miss1_dollars": number,
  "miss2": string, "miss2_dollars": number,
  "miss3": string, "miss3_dollars": number,
  "overall_mood": "pos"|"neu"|"neg",
  "freeform_comments": string
}
Return only the JSON.` };

export async function POST(req: Request){
  const body = await req.json();
  const user = { role:'user', content: body.transcript||'' };
  const out = await callAzureJSON([SYS,user]);
  return NextResponse.json({ ok:true, data: out });
}
