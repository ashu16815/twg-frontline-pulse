'use client';
import { useState } from 'react';

export default function LoadingButton({
  onClick,
  className = '',
  children,
  busyText = 'Working…',
  disabled = false,
  type = 'button'
}: {
  onClick?: () => Promise<any> | any;
  className?: string;
  children: any;
  busyText?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}) {
  const [loading, setLoading] = useState(false);

  async function handle() {
    if (loading) return;
    setLoading(true);
    try {
      if (onClick) {
        await onClick();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type={type}
      disabled={loading || disabled}
      onClick={handle}
      className={`btn btn-primary ${loading || disabled ? 'opacity-60 pointer-events-none' : ''} ${className}`}
    >
      {loading ? busyText : children}
    </button>
  );
}