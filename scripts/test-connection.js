import 'dotenv/config';
import { config } from 'dotenv';

config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Testing Supabase connection...');
console.log('URL:', url);
console.log('Anon Key:', anonKey ? 'Present' : 'Missing');

if (!url || !anonKey) {
  console.log('Missing environment variables');
  process.exit(1);
}

// Test connection by trying to access the database
const response = await fetch(`${url}/rest/v1/`, {
  headers: {
    'apikey': anonKey,
    'Authorization': `Bearer ${anonKey}`
  }
});

console.log('Connection test result:', response.status);
if (response.ok) {
  console.log('✅ Supabase connection successful!');
} else {
  console.log('❌ Supabase connection failed:', await response.text());
}
