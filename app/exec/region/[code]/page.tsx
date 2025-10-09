import { Section, Stat, Money } from '@/components/exec/ui';

export const dynamic = 'force-dynamic';

async function fetchJSON(url: string) {
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

function qs(week?: string, region?: string) {
  const p = new URLSearchParams();
  if (week) p.set('week', week);
  if (region) p.set('region', region);
  const s = p.toString();
  return s ? `?${s}` : '';
}

export default async function RegionPage({
  params,
  searchParams
}: {
  params: { code: string };
  searchParams: { week?: string };
}) {
  const iso = searchParams.week;
  const region = decodeURIComponent(params.code);

  const [sum, themes] = await Promise.all([
    fetchJSON(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/exec/summary${qs(iso, region)}`),
    fetchJSON(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/exec/themes${qs(iso, region)}`)
  ]);

  const base = sum.base || {};
  const ai = sum.ai || {};
  const t = themes.themes || [];
  const impact = t.reduce((a: number, x: any) => a + (x.impact || 0), 0);

  return (
    <main className='max-w-6xl mx-auto p-8 space-y-8'>
      <header className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-semibold'>Region — {region}</h1>
          <div className='text-xs text-white/60'>Week {sum.isoWeek}</div>
        </div>
        <a className='btn' href={`/exec?week=${encodeURIComponent(iso || sum.isoWeek)}`}>
          Back
        </a>
      </header>

      <section className='grid md:grid-cols-4 gap-3'>
        <Stat label='Themes' value={t.length} />
        <Stat label='Impact' value={Money(impact)} />
        <Stat label='Coverage' value={`${base.coveragePct || 0}%`} />
        <Stat label='Submissions' value={ai?.kpis?.stores ?? '—'} />
      </section>

      <Section title='Top Themes'>
        {t.length > 0 ? (
          <ul className='list-disc pl-6 text-sm space-y-1'>
            {t.map((x: any, i: number) => (
              <li key={i}>
                <span className='text-white/90'>{x.name}</span> — ${Math.round(x.impact || 0).toLocaleString()}
              </li>
            ))}
          </ul>
        ) : (
          <div className='text-sm text-white/50'>No themes detected for this region</div>
        )}
      </Section>

      <Section title='Narrative'>
        <p className='text-sm whitespace-pre-wrap'>
          {ai.narrative || 'AI narrative unavailable for this region.'}
        </p>
      </Section>

      <Section title="What's Working">
        {(ai.whatsWorking || []).length > 0 ? (
          <ul className='list-disc pl-6 text-sm space-y-1'>
            {(ai.whatsWorking || []).map((item: string, i: number) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        ) : (
          <div className='text-sm text-white/50'>No positive highlights for this region</div>
        )}
      </Section>

      <Section title="What's Not Working">
        {(ai.whatsNot || []).length > 0 ? (
          <ul className='list-disc pl-6 text-sm space-y-1'>
            {(ai.whatsNot || []).map((item: any, i: number) => (
              <li key={i}>
                <span className='text-white/90'>{item.text}</span>{' '}
                <span className='text-white/50'>{Money(item.impact || 0)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className='text-sm text-white/50'>No issues reported for this region</div>
        )}
      </Section>
    </main>
  );
}

