'use client';

import { useEffect, useState } from 'react';

export default function MaintenanceBanner() {
  const [isMaintenanceActive, setIsMaintenanceActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkMaintenanceStatus = async () => {
      try {
        const response = await fetch('/api/sys/maintenance');
        const data = await response.json();
        setIsMaintenanceActive(data.active || false);
      } catch (error) {
        console.error('Failed to check maintenance status:', error);
        setIsMaintenanceActive(false);
      } finally {
        setIsLoading(false);
      }
    };

    // Check immediately
    checkMaintenanceStatus();

    // Check every 5 seconds
    const interval = setInterval(checkMaintenanceStatus, 5000);

    return () => clearInterval(interval);
  }, []);

  if (isLoading || !isMaintenanceActive) {
    return null;
  }

  return (
    <div className="w-full bg-yellow-500/10 border-b border-yellow-500/20 text-yellow-300 text-sm py-2 px-4 text-center">
      <div className="flex items-center justify-center gap-2">
        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
        <span>Store master is being refreshed. Some views may briefly lag.</span>
      </div>
    </div>
  );
}
