'use client';

import { useEffect, useState } from 'react';
import { Money } from './ui';

export default function ThemeDrawer({
  open,
  onClose,
  theme
}: {
  open: boolean;
  onClose: () => void;
  theme: { name: string; mentions: number; impact: number };
}) {
  const [examples, setExamples] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      if (!open) return;
      const r = await fetch('/api/exec/themes');
      const j = await r.json();
      const sample = (j.themes || []).filter((t: any) => t.name === theme.name).slice(0, 1);
      setExamples(sample);
    }
    load();
  }, [open, theme]);

  if (!open) return null;

  return (
    <div className='fixed inset-0 z-30 flex'>
      <div className='flex-1' onClick={onClose} />
      <aside className='w-full sm:w-[420px] bg-black border-l border-white/10 p-5 space-y-4 overflow-y-auto'>
        <header className='flex items-center justify-between'>
          <h3 className='font-semibold'>{theme.name}</h3>
          <button className='btn' onClick={onClose}>
            Close
          </button>
        </header>
        <div className='text-sm text-white/60'>
          Mentions {theme.mentions} • Impact {Money(theme.impact)}
        </div>
        <div className='space-y-2'>
          <h4 className='text-sm font-semibold'>Examples</h4>
          <ul className='list-disc pl-5 text-sm space-y-1'>
            {examples.length ? (
              examples.map((e: any, i: number) => (
                <li key={i}>
                  {e.name || 'Example'} — {Money(e.impact || 0)}
                </li>
              ))
            ) : (
              <li className='text-white/50'>Examples will appear once per-theme example API is wired.</li>
            )}
          </ul>
        </div>
      </aside>
    </div>
  );
}

