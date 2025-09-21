'use client';

import { useEffect, useState } from 'react';

export default function DBHealthBadge() {
  const [health, setHealth] = useState<{ ok: boolean; loading: boolean }>({ 
    ok: false, 
    loading: true 
  });

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch('/api/health/db');
        const data = await response.json();
        setHealth({ ok: data.ok, loading: false });
      } catch (error) {
        setHealth({ ok: false, loading: false });
      }
    };

    checkHealth();
  }, []);

  if (health.loading) {
    return (
      <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">
        Checking DB...
      </span>
    );
  }

  return (
    <span className={`text-xs px-2 py-1 rounded ${
      health.ok 
        ? 'bg-green-100 text-green-700' 
        : 'bg-red-100 text-red-700'
    }`}>
      {health.ok ? 'DB Connected' : 'DB Issue'}
    </span>
  );
}
