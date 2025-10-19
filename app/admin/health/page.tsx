'use client';

import HealthDashboard from '@/components/admin/HealthDashboard';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function HealthPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <main className='max-w-7xl mx-auto p-8'>
        <HealthDashboard />
      </main>
    </ProtectedRoute>
  );
}

