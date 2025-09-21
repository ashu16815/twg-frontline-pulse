'use client';

import { useEffect, useState } from 'react';

export default function DBHealthBadge() {
  const [health, setHealth] = useState<{ ok: boolean; loading: boolean }>({ 
    ok: true, // Start with optimistic assumption
    loading: false 
  });

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch('/api/health/db', { 
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        console.log('DB Health check result:', data);
        setHealth({ ok: data.ok, loading: false });
      } catch (error) {
        console.error('DB Health check error:', error);
        setHealth({ ok: false, loading: false });
      }
    };

    // Small delay to ensure page is loaded
    const timer = setTimeout(checkHealth, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <span className={`text-xs px-2 py-1 rounded ${
      health.ok 
        ? 'bg-green-100 text-green-700' 
        : 'bg-red-100 text-red-700'
    }`}>
      {health.loading ? 'Checking DB...' : (health.ok ? 'DB Connected' : 'DB Issue')}
    </span>
  );
}
