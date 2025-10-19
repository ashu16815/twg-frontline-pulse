'use client';
import { useState } from 'react';

export default function LoadingButton({
  onClick,
  className = '',
  children,
  busyText = 'Working…',
  disabled = false
}: {
  onClick: () => Promise<any> | any;
  className?: string;
  children: any;
  busyText?: string;
  disabled?: boolean;
}) {
  const [loading, setLoading] = useState(false);

  async function handle() {
    if (loading) return;
    setLoading(true);
    try {
      await onClick();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      disabled={loading || disabled}
      onClick={handle}
      className={`btn btn-primary ${loading || disabled ? 'opacity-60 pointer-events-none' : ''} ${className}`}
    >
      {loading ? busyText : children}
    </button>
  );
}