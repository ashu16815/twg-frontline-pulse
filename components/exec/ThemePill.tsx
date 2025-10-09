'use client';

import { useState } from 'react';
import ThemeDrawer from './ThemeDrawer';
import { Pill, Money } from './ui';

export default function ThemePill({
  theme
}: {
  theme: { name: string; mentions: number; impact: number; trend?: 'up' | 'down' | 'flat' };
}) {
  const [open, setOpen] = useState(false);
  const caret = theme.trend === 'up' ? '▲' : theme.trend === 'down' ? '▼' : '—';

  return (
    <>
      <button type='button' className='mr-2 mb-2' onClick={() => setOpen(true)}>
        <Pill>
          <span className='text-white/80'>{theme.name}</span>
          <span className='text-xs text-white/60'>×{theme.mentions}</span>
          <span className='text-xs text-white/60'>{Money(theme.impact)}</span>
          <span className='text-xs text-white/40'>{caret}</span>
        </Pill>
      </button>
      <ThemeDrawer open={open} onClose={() => setOpen(false)} theme={theme} />
    </>
  );
}

