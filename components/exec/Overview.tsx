import WeekPicker from './WeekPicker';
import RegionFilter from './RegionFilter';
import RegionHeatmap from './RegionHeatmap';
import ThemePill from './ThemePill';
import { Section, Stat, Chip, Money } from './ui';

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

export default async function Overview({
  searchParams
}: {
  searchParams?: { week?: string; region?: string };
}) {
  const week = searchParams?.week;
  const region = searchParams?.region;

  const [sum, themes] = await Promise.all([
    fetchJSON(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/exec/summary${qs(week, region)}`),
    fetchJSON(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/exec/themes${qs(week, region)}`)
  ]);

  const base = sum.base || {};
  const ai = sum.ai || {};
  const regions = Array.from(
    new Set((themes.themes || []).map((t: any) => t.region_code).filter(Boolean))
  ) as string[];

  // Build heatmap data
  const heat = (themes.themes || []).reduce((acc: any, t: any) => {
    const r = t.region_code || 'Company';
    acc[r] = (acc[r] || 0) + (t.impact || 0);
    return acc;
  }, {});

  const heatData = Object.entries(heat).map(([region, impact]) => ({
    region,
    impact: Number(impact)
  }));

  return (
    <div className='space-y-8'>
      {/* Header */}
      <header className='flex flex-wrap items-center gap-3 justify-between'>
        <div>
          <h1 className='text-2xl font-semibold'>Executive Summary — {sum.isoWeek}</h1>
          <div className='mt-1 flex items-center gap-2'>
            <Chip>Coverage {sum.base?.coveragePct || 0}%</Chip>
            <Chip>
              Stores {ai?.kpis?.stores ?? '—'}/{base?.stores ?? '—'}
            </Chip>
            <Chip>
              Sentiment {base.sentiment?.pos || 0}/{base.sentiment?.neu || 0}/{base.sentiment?.neg || 0}
            </Chip>
          </div>
        </div>
        <div className='flex gap-2'>
          <WeekPicker />
          {regions.length > 0 && <RegionFilter regions={regions} />}
        </div>
      </header>

      {/* KPI strip */}
      <section className='grid md:grid-cols-4 gap-3'>
        <Stat label='Net reported impact' value={Money(base.totalImpact || 0)} />
        <Stat label='Regions covered' value={ai?.kpis?.regions ?? '—'} />
        <Stat label='Coverage' value={`${ai?.kpis?.coveragePct ?? base.coveragePct ?? 0}%`} />
        <Stat
          label='Submissions'
          value={ai?.kpis?.stores ?? '—'}
          sub={`of ${base?.stores ?? '—'} stores`}
        />
      </section>

      {/* What's working / not */}
      <section className='grid md:grid-cols-2 gap-4'>
        <Section title="What's working" subtitle='AI extracted from weekly submissions'>
          <ul className='list-disc pl-6 text-sm space-y-1'>
            {(ai.whatsWorking || []).length > 0 ? (
              (ai.whatsWorking || []).map((t: string, i: number) => <li key={i}>{t}</li>)
            ) : (
              <li className='text-white/50'>No positive highlights available yet</li>
            )}
          </ul>
        </Section>
        <Section title="What's not" subtitle='AI ranked by $ impact'>
          <ul className='list-disc pl-6 text-sm space-y-1'>
            {(ai.whatsNot || []).length > 0 ? (
              (ai.whatsNot || []).map((t: any, i: number) => (
                <li key={i}>
                  <span className='text-white/90'>{t.text}</span>{' '}
                  <span className='text-white/50'>{Money(t.impact || 0)}</span>
                </li>
              ))
            ) : (
              <li className='text-white/50'>No issues reported yet</li>
            )}
          </ul>
        </Section>
      </section>

      {/* Themes */}
      <Section title='Top themes' subtitle='Mentions • $ impact • WoW trend'>
        <div>
          {(ai.themes || []).length > 0 ? (
            (ai.themes || []).map((t: any) => <ThemePill key={t.name} theme={t} />)
          ) : (
            <div className='text-sm text-white/50'>No themes detected yet</div>
          )}
        </div>
      </Section>

      {/* Region heatmap */}
      <Section title='Region materiality' subtitle='Click a region for drill'>
        {heatData.length > 0 ? (
          <RegionHeatmap data={heatData} />
        ) : (
          <div className='text-sm text-white/50'>No regional data available</div>
        )}
      </Section>

      {/* Narrative + Actions + Risks */}
      <section className='grid md:grid-cols-3 gap-4'>
        <Section title='Executive narrative'>
          <p className='text-sm whitespace-pre-wrap'>{ai.narrative || 'AI narrative unavailable.'}</p>
        </Section>
        <Section title='Recommended actions' subtitle='Owner • Due • Impact'>
          <ol className='list-decimal pl-5 text-sm space-y-2'>
            {(ai.actions || []).length > 0 ? (
              (ai.actions || []).map((a: any, i: number) => (
                <li key={i}>
                  <div className='font-medium'>{a.action}</div>
                  <div className='text-xs text-white/60'>
                    Owner: {a.owner || 'TBD'} • Due: {a.due || 'TBD'} • Impact {Money(a.expectedImpact || 0)}
                  </div>
                </li>
              ))
            ) : (
              <li className='text-white/50'>No actions recommended yet</li>
            )}
          </ol>
        </Section>
        <Section title='Risks & dependencies'>
          <ul className='list-disc pl-6 text-sm space-y-1'>
            {(ai.risks || []).length > 0 ? (
              (ai.risks || []).map((r: string, i: number) => <li key={i}>{r}</li>)
            ) : (
              <li className='text-white/50'>No risks identified yet</li>
            )}
          </ul>
        </Section>
      </section>
    </div>
  );
}

