import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const COOKIE = process.env.SESSION_COOKIE_NAME || 'wis_session';
const MAX_DAYS = Number(process.env.SESSION_COOKIE_MAX_DAYS || '14');
const SECRET = process.env.AUTH_JWT_SECRET || 'dev_secret_change_me';

export type Session = {
  sub: string;
  user_id: string;
  name: string;
  role?: string;
};

export async function createSessionToken(s: Session) {
  console.log('🔑 CREATING SESSION TOKEN:', s);
  const secret = new TextEncoder().encode(SECRET);
  const token = await new SignJWT(s)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MAX_DAYS}d`)
    .sign(secret);
  
  console.log('✅ TOKEN CREATED:', {
    tokenLength: token.length,
    tokenPreview: token.substring(0, 50) + '...',
    secretLength: secret.length
  });
  
  return token;
}

export async function verifySessionToken(t: string): Promise<Session | null> {
  try {
    console.log('🔍 VERIFYING TOKEN:', {
      tokenLength: t.length,
      tokenPreview: t.substring(0, 50) + '...'
    });
    
    const secret = new TextEncoder().encode(SECRET);
    const { payload } = await jwtVerify(t, secret);
    
    console.log('✅ TOKEN VERIFIED:', payload);
    return payload as Session;
  } catch (e) {
    console.log('❌ TOKEN VERIFICATION FAILED:', e);
    return null;
  }
}

export function setSessionCookie(token: string) {
  const isProduction = process.env.NODE_ENV === 'production';
  cookies().set(COOKIE, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_DAYS * 24 * 60 * 60
  });
}

export function clearSessionCookie() {
  const isProduction = process.env.NODE_ENV === 'production';
  cookies().set(COOKIE, '', {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 0
  });
}

export async function getSession(): Promise<Session | null> {
  const c = cookies().get(COOKIE)?.value;
  if (!c) return null;
  return await verifySessionToken(c);
}

