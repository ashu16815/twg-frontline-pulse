'use client';

import { useRouter } from 'next/navigation';
import LoadingButton from './LoadingButton';

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  return (
    <LoadingButton onClick={handleLogout} busyText='Logging out...' className='text-xs px-3 py-1.5'>
      Logout
    </LoadingButton>
  );
}

