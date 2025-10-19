import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const COOKIE = process.env.SESSION_COOKIE_NAME || 'wis_session';
const SECRET = process.env.AUTH_JWT_SECRET || 'dev_secret_change_me';

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/login',
  '/api/auth/login',
  '/api/auth/me',
  '/api/auth/verify-token',
  '/api/health',
  '/api/sys/maintenance'
];

// Routes that should redirect authenticated users away
const AUTH_REDIRECT_ROUTES = ['/login'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Skip middleware for API routes, static files, and public routes
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    PUBLIC_ROUTES.includes(pathname)
  ) {
    return NextResponse.next();
  }

  // Get the session cookie
  const token = req.cookies.get(COOKIE)?.value;
  
  // Check if user is authenticated
  let isAuthenticated = false;
  if (token) {
    try {
      const secret = new TextEncoder().encode(SECRET);
      const { payload } = await jwtVerify(token, secret);
      isAuthenticated = !!payload;
    } catch (error) {
      // Token is invalid or expired
      isAuthenticated = false;
    }
  }

  // Handle login page - redirect authenticated users away
  if (AUTH_REDIRECT_ROUTES.includes(pathname)) {
    if (isAuthenticated) {
      const nextUrl = req.nextUrl.searchParams.get('next') || '/';
      return NextResponse.redirect(new URL(nextUrl, req.url));
    }
    return NextResponse.next();
  }

  // Protect all other routes - redirect unauthenticated users to login
  if (!isAuthenticated) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (handled above)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

