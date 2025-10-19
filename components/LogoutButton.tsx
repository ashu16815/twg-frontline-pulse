'use client';

import { useAuth } from '@/lib/auth-client';
import LoadingButton from './LoadingButton';

export default function LogoutButton() {
  const { logout } = useAuth();

  async function handleLogout() {
    await logout();
    window.location.href = '/login';
  }

  return (
    <LoadingButton onClick={handleLogout} busyText='Logging out...' className='text-xs px-3 py-1.5'>
      Logout
    </LoadingButton>
  );
}

