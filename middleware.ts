import { NextRequest, NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  // TEMPORARILY DISABLED - Let pages handle their own auth
  // This will fix the login redirect loop immediately
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ]
};

