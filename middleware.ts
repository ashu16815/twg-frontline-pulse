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

  console.log('🔍 MIDDLEWARE DEBUG:', {
    pathname,
    url: req.url,
    method: req.method,
    cookies: Object.fromEntries(req.cookies.getAll().map(c => [c.name, c.value]))
  });

  // Skip API routes, static files, and favicon
  if (
    pathname.startsWith('/api') || 
    pathname.startsWith('/_next') || 
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/brand/')
  ) {
    console.log('⏭️ SKIPPING:', pathname);
    return NextResponse.next();
  }

  // Check if this is a public route
  const isPublic = PUBLIC_ROUTES.some(route => pathname === route);
  if (isPublic) {
    console.log('✅ PUBLIC ROUTE:', pathname);
    return NextResponse.next();
  }

  // All other routes require authentication
  const token = req.cookies.get(COOKIE)?.value;
  
  console.log('🔍 AUTH CHECK:', {
    pathname,
    hasToken: !!token,
    tokenLength: token?.length || 0,
    cookieName: COOKIE
  });
  
  if (!token) {
    console.log('❌ NO TOKEN - REDIRECTING TO LOGIN:', pathname);
    const url = new URL('/login', req.url);
    url.searchParams.set('next', pathname);
    console.log('🔄 REDIRECT URL:', url.toString());
    return NextResponse.redirect(url);
  }

  // Verify token
  try {
    const secret = new TextEncoder().encode(SECRET);
    const { payload } = await jwtVerify(token, secret);
    const session: any = payload;
    console.log('✅ TOKEN VERIFIED:', {
      user_id: session.user_id,
      name: session.name,
      role: session.role,
      exp: session.exp,
      iat: session.iat
    });
    
    // If admin area, enforce Admin role
    if (pathname.startsWith('/admin') && String(session.role || '').toLowerCase() !== 'admin') {
      console.log('❌ NON-ADMIN ACCESSING ADMIN AREA:', pathname);
      const url = new URL('/exec', req.url);
      return NextResponse.redirect(url);
    }
    
    console.log('✅ AUTHENTICATED - PROCEEDING:', pathname);
    return NextResponse.next();
  } catch (e) {
    console.log('❌ TOKEN VERIFICATION FAILED:', {
      error: e,
      pathname,
      tokenPreview: token?.substring(0, 50) + '...'
    });
    const url = new URL('/login', req.url);
    url.searchParams.set('next', pathname);
    console.log('🔄 REDIRECT TO LOGIN:', url.toString());
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

