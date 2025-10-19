'use client';

import { useState, useEffect } from 'react';
import LoadingButton from '@/components/LoadingButton';

export default function LoginPage() {
  const [user_id, setUid] = useState('');
  const [password, setPw] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const next =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('next') || '/'
      : '/';

  async function submit() {
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ user_id, password })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      const data = await response.json();
      
      // Store token in localStorage as backup
      if (data.token) {
        localStorage.setItem('wis_session', data.token);
      }

      setSuccess(true);
      
      // Redirect after successful login
      setTimeout(() => {
        window.location.href = next;
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
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
              onKeyDown={e => e.key === 'Enter' && !loading && submit()}
              autoFocus
              disabled={loading}
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
              onKeyDown={e => e.key === 'Enter' && !loading && submit()}
              disabled={loading}
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
              onClick={() => window.location.href = next}
            >
              Go to Home Page →
            </button>
          ) : (
            <LoadingButton 
              className='btn-liquid w-full py-3' 
              busyText='Signing in…' 
              onClick={submit}
              disabled={loading}
            >
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

