'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checked, setChecked] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Prevent multiple checks
    if (checked) return;
    
    const checkAuth = async () => {
      console.log('🔍 AuthGuard: Checking authentication for path:', pathname);
      
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include'
        });
        
        console.log('🔍 AuthGuard: API response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('🔍 AuthGuard: User authenticated:', data.user?.user_id);
          setUser(data.user);
          
          // If user is authenticated and on login page, redirect to home
          if (pathname === '/login') {
            const next = new URLSearchParams(window.location.search).get('next') || '/';
            console.log('🔍 AuthGuard: Redirecting authenticated user from login to:', next);
            router.replace(next);
            return;
          }
        } else {
          console.log('🔍 AuthGuard: User not authenticated');
          setUser(null);
          
          // If user is not authenticated and not on login page, redirect to login
          if (pathname !== '/login') {
            console.log('🔍 AuthGuard: Redirecting unauthenticated user to login');
            router.replace(`/login?next=${encodeURIComponent(pathname)}`);
            return;
          }
        }
      } catch (error) {
        console.error('🔍 AuthGuard: Auth check failed:', error);
        setUser(null);
        
        // If auth check fails and not on login page, redirect to login
        if (pathname !== '/login') {
          console.log('🔍 AuthGuard: Redirecting after error to login');
          router.replace(`/login?next=${encodeURIComponent(pathname)}`);
          return;
        }
      }
      
      console.log('🔍 AuthGuard: Setting loading to false');
      setLoading(false);
      setChecked(true);
    };

    checkAuth();
  }, [pathname, router, checked]);

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/60">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If on login page, always show the login form
  if (pathname === '/login') {
    console.log('🔍 AuthGuard: Rendering login page');
    return <>{children}</>;
  }

  // If not authenticated, don't render children (redirect will happen)
  if (!user) {
    console.log('🔍 AuthGuard: User not authenticated, not rendering children');
    return null;
  }

  // User is authenticated, render children
  console.log('🔍 AuthGuard: User authenticated, rendering children');
  return <>{children}</>;
}
