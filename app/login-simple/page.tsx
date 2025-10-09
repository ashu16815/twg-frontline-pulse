'use client';

import { useState } from 'react';

export default function SimpleLoginPage() {
  const [user_id, setUid] = useState('');
  const [password, setPw] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user_id.trim(), password: password.trim() })
      });

      const data = await r.json();

      if (!r.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      // Just redirect - let the server handle the cookie
      alert('Login successful! Redirecting...');
      window.location.href = '/';
    } catch (e: any) {
      setError(e.message || 'Login failed');
      setLoading(false);
    }
  }

  return (
    <main className='min-h-screen flex items-center justify-center bg-[#0b0f13] text-[#e6edf3] p-6'>
      <div className='w-full max-w-sm space-y-6 bg-white/5 border border-white/10 rounded-2xl p-8'>
        <div className='text-center space-y-2'>
          <div className='text-4xl'>🏪</div>
          <h1 className='text-2xl font-semibold'>Win In Store</h1>
          <p className='text-sm text-white/60'>Sign in to continue</p>
        </div>

        <form onSubmit={submit} className='space-y-4'>
          <div>
            <label className='text-sm text-white/70 block mb-2'>User ID</label>
            <input
              className='w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-white/30 outline-none'
              placeholder='e.g., 323905'
              value={user_id}
              onChange={e => setUid(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div>
            <label className='text-sm text-white/70 block mb-2'>Password</label>
            <input
              type='password'
              className='w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-white/30 outline-none'
              placeholder='••••••••'
              value={password}
              onChange={e => setPw(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className='text-sm text-red-400 bg-red-900/20 border border-red-500/30 rounded-lg p-3'>
              {error}
            </div>
          )}

          <button
            type='submit'
            disabled={loading}
            className='w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors'
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className='text-xs text-white/40 text-center'>
          Use your assigned credentials to access the system
        </div>
      </div>
    </main>
  );
}

