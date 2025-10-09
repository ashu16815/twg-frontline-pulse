'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string; statusCode?: number };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Error boundary caught:', error);
  }, [error]);

  // Parse error for user-friendly messages
  const isDbError = error.message?.includes('database') || 
                    error.message?.includes('timeout') || 
                    error.message?.includes('firewall') ||
                    error.message?.includes('SQL');

  const isNetworkError = error.message?.includes('fetch') || 
                         error.message?.includes('network') ||
                         error.message?.includes('ECONNREFUSED');

  const isAuthError = error.statusCode === 401 || error.statusCode === 403;

  let userMessage = 'An unexpected error occurred';
  let technicalDetails = error.message;
  let actionButton = null;

  if (isDbError) {
    userMessage = 'Database Connection Error';
    technicalDetails = 'Unable to connect to the database. This is usually a firewall or network issue.';
    actionButton = (
      <Link href='/admin/health' className='btn btn-liquid'>
        🔍 Check System Health
      </Link>
    );
  } else if (isNetworkError) {
    userMessage = 'Network Error';
    technicalDetails = 'Unable to reach the server. Please check your internet connection.';
  } else if (isAuthError) {
    userMessage = 'Authentication Error';
    technicalDetails = 'You need to be logged in to access this page.';
    actionButton = (
      <Link href='/login' className='btn btn-liquid'>
        🔐 Go to Login
      </Link>
    );
  }

  return (
    <div className='min-h-[70vh] flex items-center justify-center p-6'>
      <div className='card max-w-2xl w-full space-y-6'>
        {/* Error Icon */}
        <div className='text-center'>
          <div className='text-6xl mb-4'>⚠️</div>
          <h1 className='text-2xl font-semibold'>{userMessage}</h1>
        </div>

        {/* Technical Details */}
        <div className='bg-red-900/20 border border-red-500/30 rounded-lg p-4'>
          <div className='text-sm font-medium text-red-400 mb-2'>Technical Details:</div>
          <div className='text-xs text-white/70 font-mono break-all'>
            {technicalDetails}
          </div>
          {error.digest && (
            <div className='text-xs text-white/40 mt-2'>
              Error ID: {error.digest}
            </div>
          )}
        </div>

        {/* Suggestions */}
        <div className='space-y-3'>
          <div className='text-sm font-medium'>What you can do:</div>
          <ul className='list-disc pl-5 text-sm text-white/70 space-y-1'>
            {isDbError && (
              <>
                <li>Check if your IP address is allowed in Azure SQL firewall</li>
                <li>Verify your database connection string is correct</li>
                <li>Visit the Health dashboard to diagnose the issue</li>
              </>
            )}
            {isNetworkError && (
              <>
                <li>Check your internet connection</li>
                <li>Try refreshing the page</li>
                <li>Contact your network administrator if the issue persists</li>
              </>
            )}
            {isAuthError && (
              <>
                <li>Log in with your credentials</li>
                <li>Contact an administrator if you need access</li>
              </>
            )}
            {!isDbError && !isNetworkError && !isAuthError && (
              <>
                <li>Try refreshing the page</li>
                <li>Clear your browser cache</li>
                <li>Contact support if the issue persists</li>
              </>
            )}
          </ul>
        </div>

        {/* Action Buttons */}
        <div className='flex gap-3 justify-center'>
          <button onClick={reset} className='btn btn-liquid'>
            🔄 Try Again
          </button>
          {actionButton}
          <Link href='/' className='btn'>
            🏠 Go Home
          </Link>
        </div>

        {/* Support Info */}
        <div className='text-center text-xs text-white/40'>
          If this issue persists, please contact your system administrator
        </div>
      </div>
    </div>
  );
}

