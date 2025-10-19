'use client';
import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Legend, ResponsiveContainer } from 'recharts';

const fetcher = (u: string) => fetch(u).then(r => r.json());

export default function ExecDashboard() {
  const [region, setRegion] = useState('');
  const [store, setStore] = useState('');
  const [week, setWeek] = useState('');
  const [month, setMonth] = useState('');

  const qs = new URLSearchParams({
    ...(region ? { region_code: region } : {}),
    ...(store ? { store_id: store } : {}),
    ...(week ? { iso_week: week } : {}),
    ...(month ? { month: month } : {})
  });

  const { data } = useSWR('/api/exec/summary?' + qs.toString(), fetcher, { revalidateOnFocus: false });

  const themes = data?.analysis?.top_opportunities || [];
  const actions = data?.analysis?.top_actions || [];

  return (
    <div className='space-y-6'>
      <div className='card p-4 grid grid-cols-2 md:grid-cols-4 gap-3'>
        <input
          className='input'
          placeholder='Region code (e.g., AKL)'
          value={region}
          onChange={e => setRegion(e.target.value.toUpperCase())}
        />
        <input
          className='input'
          placeholder='Store ID (GUID)'
          value={store}
          onChange={e => setStore(e.target.value)}
        />
        <input
          className='input'
          placeholder='ISO Week (YYYY-Www)'
          value={week}
          onChange={e => setWeek(e.target.value)}
        />
        <input
          className='input'
          placeholder='Month (YYYY-MM)'
          value={month}
          onChange={e => setMonth(e.target.value)}
        />
      </div>

      <div className='card p-4'>
        <div className='font-semibold mb-2'>AI Executive Summary</div>
        {!data ? (
          'Loading…'
        ) : (
          <div className='space-y-2 text-sm'>
            <div>
              <span className='font-medium'>Top 3 Opportunities:</span>{' '}
              {themes.map((t: any, i: number) => (
                <div key={i}>
                  • {t.theme} — est. ${t.impact_dollars?.toLocaleString?.()}
                </div>
              ))}
            </div>
            <div>
              <span className='font-medium'>Top 3 Actions:</span>{' '}
              {actions.map((a: any, i: number) => (
                <div key={i}>
                  • {a.action} (Owner: {a.owner}, {a.eta_weeks}w, +${a.expected_uplift_dollars?.toLocaleString?.()})
                </div>
              ))}
            </div>
            {data?.analysis?.risks?.length > 0 && (
              <div>
                <span className='font-medium'>Risks:</span>{' '}
                {data.analysis.risks.map((r: any, i: number) => (
                  <div key={i}>
                    • {r.risk} — Mitigation: {r.mitigation}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className='grid md:grid-cols-2 gap-6'>
        <div className='card p-4'>
          <div className='font-semibold mb-2'>Feedback Volume (last 12 weeks)</div>
          <ResponsiveContainer width='100%' height={240}>
            <LineChart data={data?.analysis?.volume_series || []}>
              <CartesianGrid strokeDasharray='3 3' />
              <XAxis dataKey='week' />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type='monotone' dataKey='count' />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className='card p-4'>
          <div className='font-semibold mb-2'>Themes by Impact ($)</div>
          <ResponsiveContainer width='100%' height={240}>
            <BarChart data={themes}>
              <CartesianGrid strokeDasharray='3 3' />
              <XAxis dataKey='theme' />
              <YAxis />
              <Tooltip />
              <Bar dataKey='impact_dollars' />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
