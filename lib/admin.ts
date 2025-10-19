import 'server-only';
import { getSession } from '@/lib/auth';

export async function requireAdmin() {
  const s = await getSession();
  if (!s || (s.role || '').toLowerCase() !== 'admin') {
    const e: any = new Error('Forbidden');
    e.statusCode = 403;
    throw e;
  }
  return s;
}

