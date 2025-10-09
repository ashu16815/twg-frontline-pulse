import 'server-only';
import jwt from 'jsonwebtoken';
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

export function createSessionToken(s: Session) {
  return jwt.sign(s, SECRET, { expiresIn: `${MAX_DAYS}d` });
}

export function verifySessionToken(t: string): Session | null {
  try {
    return jwt.verify(t, SECRET) as Session;
  } catch {
    return null;
  }
}

export function setSessionCookie(token: string) {
  cookies().set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_DAYS * 24 * 60 * 60
  });
}

export function clearSessionCookie() {
  cookies().set(COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0
  });
}

export function getSession(): Session | null {
  const c = cookies().get(COOKIE)?.value;
  if (!c) return null;
  return verifySessionToken(c);
}

