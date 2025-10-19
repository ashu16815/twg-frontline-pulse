import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const COOKIE = process.env.SESSION_COOKIE_NAME || 'wis_session';
const SECRET = process.env.AUTH_JWT_SECRET || 'dev_secret_change_me';

export async function middleware(req: NextRequest) {
  // TEMPORARILY DISABLED TO BREAK ENDLESS LOOP
  // The localStorage fallback is working, but middleware is still checking cookies
  // This creates an endless loop. Disable middleware until we fix cookie issues.
  console.log(`🚫 [${new Date().toISOString()}] MIDDLEWARE DISABLED - BREAKING ENDLESS LOOP`);
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

