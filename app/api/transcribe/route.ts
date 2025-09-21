import { NextResponse } from 'next/server';
import { transcribeAudioWebm } from '@/lib/azure';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get('file');
  const mime = form.get('mime') as string || 'audio/webm';
  
  if (!(file instanceof Blob)) return NextResponse.json({ error: 'No audio' }, { status: 400 });
  
  const buf = Buffer.from(await file.arrayBuffer());
  try {
    const text = await transcribeAudioWebm(buf, mime);
    return NextResponse.json({ text });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
