export function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: any }) {
  return (
    <section className='card space-y-3'>
      <div className='flex items-center justify-between'>
        <h2 className='font-semibold'>{title}</h2>
        {subtitle && <div className='text-xs text-white/60'>{subtitle}</div>}
      </div>
      {children}
    </section>
  );
}

export function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className='btn p-4 w-full'>
      <div className='text-xs text-slate-400'>{label}</div>
      <div className='text-2xl'>{value}</div>
      {sub && <div className='text-xs text-slate-500 mt-1'>{sub}</div>}
    </div>
  );
}

export function Chip({ children }: { children: any }) {
  return (
    <span className='inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs'>
      {children}
    </span>
  );
}

export function Skeleton({ h = '2rem' }: { h?: string }) {
  return <div className='animate-pulse rounded bg-white/5' style={{ height: h }} />;
}

export function Pill({ children }: { children: any }) {
  return (
    <span className='inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm'>
      {children}
    </span>
  );
}

export function Money(n: number) {
  return `$${Math.round(n || 0).toLocaleString()}`;
}

