'use client';

import { useEffect, useRef } from 'react';

let inflight = 0; // shared counter across instances

export default function LoadingTopbar() {
  const barRef = useRef<HTMLDivElement | null>(null);

  function start() {
    const el = barRef.current;
    if (!el) return;
    el.style.opacity = '1';
    el.style.width = '15%';
    requestAnimationFrame(() => {
      el.style.width = '60%';
    });
  }

  function done() {
    const el = barRef.current;
    if (!el) return;
    el.style.width = '100%';
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.width = '0%';
    }, 200);
  }

  useEffect(() => {
    const el = document.getElementById('wis-topbar') as HTMLDivElement | null;
    if (el) barRef.current = el;

    const onStart = () => {
      if (inflight === 0) start();
      inflight++;
    };

    const onEnd = () => {
      inflight = Math.max(0, inflight - 1);
      if (inflight === 0) done();
    };

    // Router transitions - intercept history API
    const origPushState = history.pushState;
    history.pushState = function (...args: any[]) {
      onStart();
      origPushState.apply(history, args as any);
      setTimeout(onEnd, 400);
    } as any;

    const origReplaceState = history.replaceState;
    history.replaceState = function (...args: any[]) {
      onStart();
      origReplaceState.apply(history, args as any);
      setTimeout(onEnd, 300);
    } as any;

    // Fetch interception (basic)
    const origFetch = window.fetch;
    (window as any).fetch = async (...args: any[]) => {
      onStart();
      try {
        const res = await origFetch(...args);
        return res;
      } finally {
        onEnd();
      }
    };

    return () => {
      (window as any).fetch = origFetch;
      history.pushState = origPushState;
      history.replaceState = origReplaceState;
    };
  }, []);

  return <div id='wis-topbar' />;
}

