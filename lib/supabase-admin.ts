import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

let sbAdmin: any;

if (!url || !key) {
  console.warn('Missing Supabase environment variables - using mock client');
  // Return a mock client that doesn't actually connect to Supabase
  sbAdmin = {
    from: () => ({
      select: () => ({ eq: () => ({ order: () => Promise.resolve({ data: [], error: null }) }) }),
      insert: () => Promise.resolve({ error: new Error('Database not configured') }),
      update: () => Promise.resolve({ error: new Error('Database not configured') }),
      delete: () => Promise.resolve({ error: new Error('Database not configured') })
    })
  };
} else {
  sbAdmin = createClient(url, key, {
    auth: {
      persistSession: false
    }
  });
}

export { sbAdmin };
