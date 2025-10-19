import { NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const session = await verifySessionToken(token);

    if (!session) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    return NextResponse.json({
      ok: true,
      user: {
        user_id: session.user_id,
        name: session.name,
        role: session.role
      }
    });
  } catch (error: any) {
    console.error('Token verification error:', error);
    return NextResponse.json({ error: 'Token verification failed' }, { status: 500 });
  }
}
