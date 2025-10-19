import { NextResponse } from 'next/server';
import { callAzureJSON } from '@/lib/azure-simple';

const SYS = {
  role: 'system',
  content: `Extract weekly store feedback as strict JSON only:
{
  "store_code": string,
  "iso_week": string,  
  "month_key": string, 
  "top_positive": string,
  "miss1": string, "miss1_dollars": number,
  "miss2": string, "miss2_dollars": number,
  "miss3": string, "miss3_dollars": number,
  "overall_mood": "pos"|"neu"|"neg",
  "freeform_comments": string
}
Return only JSON.`
};

export async function POST(req: Request) {
  const { transcript } = await req.json();
  const out = await callAzureJSON([SYS, { role: 'user', content: transcript || '' }]);
  return NextResponse.json({ ok: true, data: out });
}