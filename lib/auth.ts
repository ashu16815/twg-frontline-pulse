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
  const secret = new TextEncoder().encode(SECRET);
  const token = await new SignJWT(s)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MAX_DAYS}d`)
    .sign(secret);
  
  return token;
}

export async function verifySessionToken(t: string): Promise<Session | null> {
  try {
    const secret = new TextEncoder().encode(SECRET);
    const { payload } = await jwtVerify(t, secret);
    return payload as Session;
  } catch (e) {
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

