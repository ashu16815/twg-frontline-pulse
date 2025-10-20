import { NextRequest, NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  // TEMPORARILY DISABLED - Let's fix this step by step
  // We'll implement client-side only authentication for now
  console.log(`🔧 [${new Date().toISOString()}] Middleware disabled for debugging`);
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

