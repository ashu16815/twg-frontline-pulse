import 'server-only';
import { getSession } from '@/lib/auth';

export function requireAdmin() {
  const s = getSession();
  if (!s || (s.role || '').toLowerCase() !== 'admin') {
    const e: any = new Error('Forbidden');
    e.statusCode = 403;
    throw e;
  }
  return s;
}

