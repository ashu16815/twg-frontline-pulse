import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const COOKIE = process.env.SESSION_COOKIE_NAME || 'wis_session';
const SECRET = process.env.AUTH_JWT_SECRET || 'dev_secret_change_me';

export async function middleware(req: NextRequest) {
  const timestamp = new Date().toISOString();
  const { pathname } = req.nextUrl;
  const method = req.method;
  const userAgent = req.headers.get('user-agent') || 'unknown';
  const referer = req.headers.get('referer') || 'direct';

  console.log(`🔍 [${timestamp}] MIDDLEWARE START:`, {
    pathname,
    method,
    userAgent: userAgent.substring(0, 50) + '...',
    referer: referer.substring(0, 50) + '...',
    cookies: Object.fromEntries(req.cookies.getAll().map(c => [c.name, c.value?.substring(0, 20) + '...'])),
    allCookieNames: req.cookies.getAll().map(c => c.name),
    environment: process.env.NODE_ENV
  });

  // Allow specific API routes and static assets to pass without auth checks
  if (
    pathname.startsWith('/api/auth/login') || // Allow login API
    pathname.startsWith('/api/auth/me') ||    // Allow checking session API
    pathname.startsWith('/api/sys/maintenance') || // Allow maintenance check API
    pathname.startsWith('/_next') ||           // Next.js internal files
    pathname.startsWith('/favicon.ico') ||     // Favicon
    pathname.startsWith('/brand/')             // Brand assets
  ) {
    console.log(`⏭️ [${timestamp}] MIDDLEWARE SKIP:`, pathname);
    return NextResponse.next();
  }

  // Get the token from cookies
  const token = req.cookies.get(COOKIE)?.value;
  let isAuthenticated = false;

  console.log(`🍪 [${timestamp}] MIDDLEWARE COOKIE CHECK:`, {
    cookieName: COOKIE,
    hasToken: !!token,
    tokenLength: token?.length || 0,
    tokenPreview: token?.substring(0, 30) + '...' || 'none'
  });

  if (token) {
    try {
      const secret = new TextEncoder().encode(SECRET);
      const { payload } = await jwtVerify(token, secret);
      isAuthenticated = true;
      console.log(`✅ [${timestamp}] MIDDLEWARE TOKEN VALID:`, {
        user_id: (payload as any)?.user_id,
        name: (payload as any)?.name,
        role: (payload as any)?.role,
        exp: (payload as any)?.exp,
        iat: (payload as any)?.iat
      });
    } catch (e) {
      // Token is invalid or expired. Clear the cookie and treat as unauthenticated.
      isAuthenticated = false;
      console.log(`❌ [${timestamp}] MIDDLEWARE TOKEN INVALID:`, {
        error: (e as Error).message,
        pathname
      });
      const response = NextResponse.redirect(new URL('/login', req.url));
      response.cookies.set(COOKIE, '', { maxAge: 0, path: '/' }); // Clear invalid cookie
      console.log(`🔄 [${timestamp}] MIDDLEWARE REDIRECT TO LOGIN (invalid token):`, '/login');
      return response;
    }
  } else {
    console.log(`❌ [${timestamp}] MIDDLEWARE NO TOKEN:`, pathname);
  }

  // If on the login page and already authenticated, redirect to home
  if (pathname === '/login' && isAuthenticated) {
    console.log(`🔄 [${timestamp}] MIDDLEWARE REDIRECT FROM LOGIN TO HOME:`, '/');
    return NextResponse.redirect(new URL('/', req.url));
  }

  // If not authenticated and trying to access a protected route (not the login page), redirect to login
  if (!isAuthenticated && pathname !== '/login') {
    const url = new URL('/login', req.url);
    url.searchParams.set('next', pathname); // Preserve the intended destination
    console.log(`🔄 [${timestamp}] MIDDLEWARE REDIRECT TO LOGIN (no auth):`, {
      from: pathname,
      to: url.toString()
    });
    return NextResponse.redirect(url);
  }

  // For all other cases (authenticated on a protected route, or unauthenticated on login page), proceed
  console.log(`✅ [${timestamp}] MIDDLEWARE PROCEED:`, {
    pathname,
    isAuthenticated,
    reason: pathname === '/login' ? 'login page' : 'authenticated user'
  });
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

