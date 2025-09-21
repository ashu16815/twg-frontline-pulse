import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { code } = await req.json();
  if (!process.env.APP_SHARED_PASSCODE) return NextResponse.json({ ok: false }, { status: 500 });
  return code === process.env.APP_SHARED_PASSCODE 
    ? NextResponse.json({ ok: true }) 
    : NextResponse.json({ ok: false }, { status: 401 });
}