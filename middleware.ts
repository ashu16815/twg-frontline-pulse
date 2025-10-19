import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const COOKIE = process.env.SESSION_COOKIE_NAME || 'wis_session';
const SECRET = process.env.AUTH_JWT_SECRET || 'dev_secret_change_me';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow specific API routes and static assets to pass without auth checks
  if (
    pathname.startsWith('/api/auth/login') || // Allow login API
    pathname.startsWith('/api/auth/me') ||    // Allow checking session API
    pathname.startsWith('/api/sys/maintenance') || // Allow maintenance check API
    pathname.startsWith('/_next') ||           // Next.js internal files
    pathname.startsWith('/favicon.ico') ||     // Favicon
    pathname.startsWith('/brand/')             // Brand assets
  ) {
    return NextResponse.next();
  }

  // Get the token from cookies
  const token = req.cookies.get(COOKIE)?.value;
  let isAuthenticated = false;

  if (token) {
    try {
      const secret = new TextEncoder().encode(SECRET);
      await jwtVerify(token, secret);
      isAuthenticated = true;
    } catch (e) {
      // Token is invalid or expired. Clear the cookie and treat as unauthenticated.
      isAuthenticated = false;
      const response = NextResponse.redirect(new URL('/login', req.url));
      response.cookies.set(COOKIE, '', { maxAge: 0, path: '/' }); // Clear invalid cookie
      return response;
    }
  }

  // If on the login page and already authenticated, redirect to home
  if (pathname === '/login' && isAuthenticated) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // If not authenticated and trying to access a protected route (not the login page), redirect to login
  if (!isAuthenticated && pathname !== '/login') {
    const url = new URL('/login', req.url);
    url.searchParams.set('next', pathname); // Preserve the intended destination
    return NextResponse.redirect(url);
  }

  // For all other cases (authenticated on a protected route, or unauthenticated on login page), proceed
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

