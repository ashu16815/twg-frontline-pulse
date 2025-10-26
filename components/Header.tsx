'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import LogoutButton from './LogoutButton';

export default function Header() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication status
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  return (
    <header className='border-b border-white/10 bg-black/40 backdrop-blur'>
      <div className='max-w-6xl mx-auto px-4 py-3 flex items-center gap-3'>
        <span 
          className='h-1.5 w-6 rounded-full' 
          style={{background: 'var(--brand-accent, #CC0000)'}}
        />
        <Link href='/' className='flex items-center gap-2'>
          <Image 
            src='/brand/wis-icon.svg' 
            alt='Win In Store' 
            width={20} 
            height={20}
            className='h-5 w-5'
          />
          <span className='text-white/90 text-sm font-medium'>Win In Store</span>
        </Link>
        
        {/* Navigation Links */}
        <nav className='flex items-center gap-1 ml-4'>
          <Link href='/reports' className='text-xs text-white/60 hover:text-white/90 px-3 py-1.5 rounded transition-colors'>
            Reports
          </Link>
          <Link href='/ceo' className='text-xs text-white/60 hover:text-white/90 px-3 py-1.5 rounded transition-colors'>
            Ask Questions
          </Link>
          {user?.role?.toLowerCase() === 'admin' && (
            <>
              <Link href='/admin/users' className='text-xs text-white/60 hover:text-white/90 px-3 py-1.5 rounded transition-colors'>
                Users
              </Link>
              <Link href='/admin/health' className='text-xs text-white/60 hover:text-white/90 px-3 py-1.5 rounded transition-colors'>
                Health
              </Link>
              <Link href='/admin/jobs' className='text-xs text-white/60 hover:text-white/90 px-3 py-1.5 rounded transition-colors'>
                AI Jobs
              </Link>
            </>
          )}
        </nav>
        
        <div className='ml-auto flex items-center gap-3'>
          {loading ? (
            <div className='text-xs text-white/40'>Loading...</div>
          ) : user ? (
            <>
              <div className='text-xs text-white/60'>
                {user.name} ({user.role || 'User'})
              </div>
              <LogoutButton />
            </>
          ) : (
            <Link href='/login' className='btn text-xs px-3 py-1.5'>Sign In</Link>
          )}
        </div>
      </div>
    </header>
  );
}

