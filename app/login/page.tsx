'use client';

import { useState, useEffect } from 'react';
import LoadingButton from '@/components/LoadingButton';

export default function LoginPage() {
  const [user_id, setUid] = useState('');
  const [password, setPw] = useState('');
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  const [success, setSuccess] = useState(false);

  const next =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('next') || '/'
      : '/';

  // Simple mount effect to avoid hydration issues
  useEffect(() => {
    const timestamp = new Date().toISOString();
    console.log(`🔄 [${timestamp}] LOGIN PAGE MOUNT:`, { next });
    setMounted(true);
    
    // Check if user is already logged in and redirect immediately
    const checkAuth = async () => {
      const checkTimestamp = new Date().toISOString();
      console.log(`🔍 [${checkTimestamp}] LOGIN PAGE CHECK AUTH START`);
      
      try {
        const response = await fetch('/api/auth/me');
        console.log(`📡 [${checkTimestamp}] LOGIN PAGE AUTH CHECK RESPONSE:`, {
          status: response.status,
          ok: response.ok,
          headers: Object.fromEntries(response.headers.entries())
        });
        
        if (response.ok) {
          console.log(`✅ [${checkTimestamp}] LOGIN PAGE USER ALREADY AUTHENTICATED - REDIRECTING TO:`, next);
          // User is already authenticated, redirect to home
          window.location.href = next;
        } else {
          console.log(`❌ [${checkTimestamp}] LOGIN PAGE USER NOT AUTHENTICATED - STAYING ON LOGIN`);
        }
      } catch (error) {
        console.log(`❌ [${checkTimestamp}] LOGIN PAGE AUTH CHECK ERROR:`, error);
        // Not authenticated, stay on login page
      }
    };
    
    checkAuth();
  }, [next]);

  async function submit() {
    const timestamp = new Date().toISOString();
    console.log(`🔐 [${timestamp}] LOGIN PAGE SUBMIT START:`, { user_id, hasPassword: !!password, next });
    setError('');

    const r = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id, password })
    });

    const responseTimestamp = new Date().toISOString();
    console.log(`📡 [${responseTimestamp}] LOGIN PAGE SUBMIT RESPONSE:`, {
      status: r.status,
      ok: r.ok,
      headers: Object.fromEntries(r.headers.entries())
    });

    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      console.log(`❌ [${responseTimestamp}] LOGIN PAGE SUBMIT FAILED:`, j);
      setError(j.error || 'Login failed');
      return;
    }

    const responseData = await r.json();
    console.log(`✅ [${responseTimestamp}] LOGIN PAGE SUBMIT SUCCESS:`, responseData);

    // Show success message briefly
    setSuccess(true);
    
    const redirectTimestamp = new Date().toISOString();
    console.log(`🚀 [${redirectTimestamp}] LOGIN PAGE REDIRECTING TO:`, next);
    
    // Immediate redirect - no delay
    window.location.href = next;
  }

  return (
    <main className='min-h-[70vh] flex items-center justify-center p-6'>
      <div className='card w-full max-w-sm space-y-4'>
        <header className='space-y-1 text-center'>
          <div className='text-4xl mb-2'>🏪</div>
          <h1 className='text-2xl font-semibold'>Win In Store</h1>
          <p className='text-sm text-white/60'>Sign in with your credentials</p>
        </header>

        <div className='space-y-3'>
          <div>
            <label className='text-sm text-white/70 block mb-1.5'>User ID</label>
            <input
              className='btn p-3 w-full'
              placeholder='e.g., 323905'
              value={user_id}
              onChange={e => setUid(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              autoFocus
            />
          </div>

          <div>
            <label className='text-sm text-white/70 block mb-1.5'>Password</label>
            <input
              className='btn p-3 w-full'
              type='password'
              placeholder='••••••••'
              value={password}
              onChange={e => setPw(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
            />
          </div>

          {error && (
            <div className='text-xs text-red-400 bg-red-900/20 border border-red-500/30 rounded-lg p-3'>
              {error}
            </div>
          )}

          {success && (
            <div className='text-sm text-green-400 bg-green-900/20 border border-green-500/30 rounded-lg p-3 text-center'>
              ✅ Login successful! Redirecting...
            </div>
          )}

          {success ? (
            <button 
              className='btn-liquid w-full py-3' 
              onClick={() => window.location.replace(next)}
            >
              Go to Home Page →
            </button>
          ) : (
            <LoadingButton className='btn-liquid w-full py-3' busyText='Signing in…' onClick={submit}>
              Sign in
            </LoadingButton>
          )}
        </div>

        <div className='text-xs text-white/40 text-center pt-2'>
          Use your assigned User ID and password to access the system
        </div>
      </div>
    </main>
  );
}

