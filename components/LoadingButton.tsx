'use client';

import { useState } from 'react';
import Spinner from './Spinner';

export default function LoadingButton({
  children,
  className = '',
  onClick,
  type = 'button',
  busyText = 'Working...',
  disabled = false
}: {
  children: any;
  className?: string;
  onClick?: (e: any) => Promise<any> | any;
  type?: 'button' | 'submit';
  busyText?: string;
  disabled?: boolean;
}) {
  const [busy, setBusy] = useState(false);

  async function handle(e: any) {
    if (busy || disabled) return;
    const ret = onClick?.(e);
    if (ret && typeof ret.then === 'function') {
      try {
        setBusy(true);
        await ret;
      } finally {
        setBusy(false);
      }
    }
  }

  const cls = `btn ${className}`;

  return (
    <button type={type} className={cls} aria-busy={busy} disabled={busy || disabled} onClick={handle}>
      {busy ? (
        <span className='inline-flex items-center gap-2'>
          <Spinner />
          <span>{busyText}</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}

