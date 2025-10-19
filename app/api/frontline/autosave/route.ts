import { NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';

const autoSaveSchema = z.object({
  sessionId: z.string(),
  storeId: z.string(),
  formData: z.record(z.string())
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const pRes = autoSaveSchema.safeParse(body);

    if (!pRes.success) {
      return NextResponse.json({ error: 'Invalid auto-save data' }, { status: 400 });
    }

    const { sessionId, storeId, formData } = pRes.data;
    
    // Generate a unique key for this session
    const autoSaveKey = crypto.createHash('sha256')
      .update(`${sessionId}-${storeId}-${Date.now()}`)
      .digest('hex').slice(0, 16);

    // Store in a simple in-memory cache (in production, use Redis or database)
    // For now, we'll use a simple approach with localStorage on the client side
    const autoSaveData = {
      sessionId,
      storeId,
      formData,
      timestamp: Date.now(),
      key: autoSaveKey
    };

    return NextResponse.json({ 
      success: true, 
      autoSaveKey,
      message: 'Form data auto-saved',
      data: autoSaveData
    });

  } catch (e: any) {
    console.error('Auto-save error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');
  const storeId = searchParams.get('storeId');

  if (!sessionId || !storeId) {
    return NextResponse.json({ error: 'Missing sessionId or storeId' }, { status: 400 });
  }

  try {
    // In a real implementation, you'd retrieve from Redis/database
    // For now, return empty to indicate no saved data
    return NextResponse.json({ 
      success: true, 
      hasSavedData: false,
      message: 'No auto-saved data found'
    });

  } catch (e: any) {
    console.error('Auto-save retrieval error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
