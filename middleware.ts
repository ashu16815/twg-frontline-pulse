import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';

const COOKIE = process.env.SESSION_COOKIE_NAME || 'wis_session';
const SECRET = process.env.AUTH_JWT_SECRET || 'dev_secret_change_me';

// Protected route patterns
const PROTECTED = [/^\/weekly/, /^\/exec/, /^\/reports/, /^\/ceo/];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip API routes and static files
  if (pathname.startsWith('/api') || pathname.startsWith('/_next') || pathname.startsWith('/login')) {
    return NextResponse.next();
  }

  // Check if this route is protected
  const guarded = PROTECTED.some(rx => rx.test(pathname));
  if (!guarded) return NextResponse.next();

  // Get session token
  const token = req.cookies.get(COOKIE)?.value;
  if (!token) {
    const url = new URL('/login', req.url);
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  // Verify token
  try {
    verify(token, SECRET);
    return NextResponse.next();
  } catch {
    const url = new URL('/login', req.url);
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: ['/weekly/:path*', '/exec/:path*', '/reports/:path*', '/ceo/:path*']
};

