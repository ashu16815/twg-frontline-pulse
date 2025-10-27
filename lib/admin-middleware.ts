import { NextResponse } from 'next/server';
import { getSession } from './auth';

export async function requireAdmin(req: Request) {
  try {
    const session = await getSession();
    
    if (!session) {
      return {
        error: 'Unauthorized',
        response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      };
    }

    if (session.role?.toLowerCase() !== 'admin') {
      return {
        error: 'Forbidden',
        response: NextResponse.json({ error: 'Admin access required' }, { status: 403 })
      };
    }

    return {
      error: null,
      response: undefined as any, // No error, proceed
      session
    };
  } catch (e: any) {
    return {
      error: e.message,
      response: NextResponse.json({ error: 'Auth error' }, { status: 500 })
    };
  }
}

