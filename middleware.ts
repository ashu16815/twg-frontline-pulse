import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// Force Node.js runtime (not Edge)
export const runtime = 'nodejs';

const COOKIE = process.env.SESSION_COOKIE_NAME || 'wis_session';
const SECRET = process.env.AUTH_JWT_SECRET || 'dev_secret_change_me';

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/login'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip API routes, static files, and favicon
  if (
    pathname.startsWith('/api') || 
    pathname.startsWith('/_next') || 
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/brand/')
  ) {
    return NextResponse.next();
  }

  // Check if this is a public route
  const isPublic = PUBLIC_ROUTES.some(route => pathname === route);
  if (isPublic) {
    return NextResponse.next();
  }

  // All other routes require authentication
  const token = req.cookies.get(COOKIE)?.value;
  
  console.log('🔍 Middleware check:', pathname, 'Token exists:', !!token);
  
  if (!token) {
    console.log('❌ No token, redirecting to login');
    const url = new URL('/login', req.url);
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  // Verify token
  try {
    const secret = new TextEncoder().encode(SECRET);
    const { payload } = await jwtVerify(token, secret);
    const session: any = payload;
    console.log('✅ Token verified for:', session.user_id);
    
    // If admin area, enforce Admin role
    if (pathname.startsWith('/admin') && String(session.role || '').toLowerCase() !== 'admin') {
      console.log('❌ Non-admin accessing admin area, redirecting');
      const url = new URL('/exec', req.url);
      return NextResponse.redirect(url);
    }
    
    return NextResponse.next();
  } catch (e) {
    console.log('❌ Token verification failed:', e);
    const url = new URL('/login', req.url);
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
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

