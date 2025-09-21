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
        const response = await fetch('/api/health/db', { 
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        const data = await response.json();
        console.log('DB Health check result:', data);
        setHealth({ ok: data.ok, loading: false });
      } catch (error) {
        console.error('DB Health check error:', error);
        // Retry once after a short delay
        setTimeout(async () => {
          try {
            const retryResponse = await fetch('/api/health/db', { 
              cache: 'no-cache',
              headers: {
                'Cache-Control': 'no-cache'
              }
            });
            const retryData = await retryResponse.json();
            console.log('DB Health check retry result:', retryData);
            setHealth({ ok: retryData.ok, loading: false });
          } catch (retryError) {
            console.error('DB Health check retry error:', retryError);
            setHealth({ ok: false, loading: false });
          }
        }, 1000);
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
