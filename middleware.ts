import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const COOKIE = process.env.SESSION_COOKIE_NAME || 'wis_session';
const SECRET = process.env.AUTH_JWT_SECRET || 'dev_secret_change_me';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip everything except pages that need auth
  if (
    pathname.startsWith('/api') || 
    pathname.startsWith('/_next') || 
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/brand/') ||
    pathname === '/login'
  ) {
    return NextResponse.next();
  }

  // Check for auth token
  const token = req.cookies.get(COOKIE)?.value;
  
  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Verify token
  try {
    const secret = new TextEncoder().encode(SECRET);
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch (e) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
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

