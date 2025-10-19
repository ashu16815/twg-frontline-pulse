'use client';

import UsersAdmin from '@/components/admin/UsersAdmin';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function Page() {
  return (
    <ProtectedRoute requiredRole="admin">
      <main className='max-w-6xl mx-auto p-8'>
        <UsersAdmin />
      </main>
    </ProtectedRoute>
  );
}

