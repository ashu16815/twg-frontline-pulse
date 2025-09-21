import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.warn('Missing Supabase environment variables - using mock client');
  // Return a mock client that doesn't actually connect to Supabase
  export const sbAdmin = {
    from: () => ({
      select: () => ({ eq: () => ({ order: () => Promise.resolve({ data: [], error: null }) }) }),
      insert: () => Promise.resolve({ error: new Error('Database not configured') }),
      update: () => Promise.resolve({ error: new Error('Database not configured') }),
      delete: () => Promise.resolve({ error: new Error('Database not configured') })
    })
  } as any;
} else {
  export const sbAdmin = createClient(url, key, {
    auth: {
      persistSession: false
    }
  });
}
