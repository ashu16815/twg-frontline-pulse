'use client';
import { useState } from 'react';

export default function LoadingButton({
  onClick,
  className = '',
  children,
  busyText = 'Working…'
}: {
  onClick: () => Promise<any> | any;
  className?: string;
  children: any;
  busyText?: string;
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
      disabled={loading}
      onClick={handle}
      className={`btn btn-primary ${loading ? 'opacity-60 pointer-events-none' : ''} ${className}`}
    >
      {loading ? busyText : children}
    </button>
  );
}