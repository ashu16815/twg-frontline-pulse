'use client';

import { useState, useEffect, useCallback } from 'react';
import React from 'react';

export type User = {
  user_id: string;
  name: string;
  role?: string;
};

export type AuthState = {
  user: User | null;
  loading: boolean;
  error: string | null;
};

// Client-side authentication utilities
export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null
  });

  const checkAuth = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      // First try cookie-based authentication
      const response = await fetch('/api/auth/me', {
        credentials: 'include', // Include cookies
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAuthState({
          user: data.user,
          loading: false,
          error: null
        });
        return data.user;
      }

      // If cookie auth fails, try localStorage fallback
      const localToken = localStorage.getItem('wis_session');
      if (localToken && localToken !== 'temp_token') {
        // Verify localStorage token by making a request with it
        const tokenResponse = await fetch('/api/auth/verify-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localToken}`
          }
        });

        if (tokenResponse.ok) {
          const tokenData = await tokenResponse.json();
          setAuthState({
            user: tokenData.user,
            loading: false,
            error: null
          });
          return tokenData.user;
        }
      }

      // No valid authentication found
      setAuthState({
        user: null,
        loading: false,
        error: null
      });
      return null;
    } catch (error) {
      console.error('Auth check failed:', error);
      setAuthState({
        user: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      });
      return null;
    }
  }, []);

  const login = useCallback(async (user_id: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Include cookies
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

      setAuthState({
        user: data.user,
        loading: false,
        error: null
      });

      return data.user;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setAuthState({
        user: null,
        loading: false,
        error: errorMessage
      });
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      // Clear server-side session
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear client-side state
      localStorage.removeItem('wis_session');
      setAuthState({
        user: null,
        loading: false,
        error: null
      });
    }
  }, []);

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return {
    ...authState,
    login,
    logout,
    checkAuth
  };
}

// Higher-order component for protecting routes
export function withAuth<T extends object>(Component: React.ComponentType<T>) {
  return function AuthenticatedComponent(props: T) {
    const { user, loading, error } = useAuth();

    if (loading) {
      return React.createElement('div', { className: "min-h-screen flex items-center justify-center" },
        React.createElement('div', { className: "text-center" },
          React.createElement('div', { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4" }),
          React.createElement('p', { className: "text-white/60" }, "Checking authentication...")
        )
      );
    }

    if (error) {
      return React.createElement('div', { className: "min-h-screen flex items-center justify-center" },
        React.createElement('div', { className: "text-center" },
          React.createElement('p', { className: "text-red-400 mb-4" }, `Authentication error: ${error}`),
          React.createElement('button', { 
            onClick: () => window.location.href = '/login',
            className: "btn btn-primary"
          }, "Go to Login")
        )
      );
    }

    if (!user) {
      // Redirect to login with current path as next parameter
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
      window.location.href = `/login?next=${encodeURIComponent(currentPath)}`;
      return null;
    }

    return React.createElement(Component, props);
  };
}

// Hook for checking if user has specific role
export function useRole(requiredRole?: string) {
  const { user, loading } = useAuth();
  
  if (loading) return { hasRole: false, loading: true };
  if (!user) return { hasRole: false, loading: false };
  if (!requiredRole) return { hasRole: true, loading: false };
  
  return { 
    hasRole: user.role?.toLowerCase() === requiredRole.toLowerCase(), 
    loading: false 
  };
}
