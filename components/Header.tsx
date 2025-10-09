import Link from 'next/link';
import Image from 'next/image';
import { getSession } from '@/lib/auth';
import LogoutButton from './LogoutButton';

export default async function Header() {
  const session = getSession();

  return (
    <header className='border-b border-white/10 bg-black/40 backdrop-blur'>
      <div className='max-w-6xl mx-auto px-4 py-3 flex items-center gap-3'>
        <span 
          className='h-1.5 w-6 rounded-full' 
          style={{background: 'var(--brand-accent, #CC0000)'}}
        />
        <Link href='/' className='flex items-center gap-2'>
          <Image 
            src='/brand/wis-icon.svg' 
            alt='Win In Store' 
            width={20} 
            height={20}
            className='h-5 w-5'
          />
          <span className='text-white/90 text-sm font-medium'>Win In Store</span>
        </Link>
        
        {/* Navigation Links */}
        <nav className='flex items-center gap-1 ml-4'>
          <Link href='/reports' className='text-xs text-white/60 hover:text-white/90 px-3 py-1.5 rounded transition-colors'>
            Reports
          </Link>
          <Link href='/ceo' className='text-xs text-white/60 hover:text-white/90 px-3 py-1.5 rounded transition-colors'>
            Ask Questions
          </Link>
          {session?.role?.toLowerCase() === 'admin' && (
            <Link href='/admin/users' className='text-xs text-white/60 hover:text-white/90 px-3 py-1.5 rounded transition-colors'>
              Admin
            </Link>
          )}
        </nav>
        
        <div className='ml-auto flex items-center gap-3'>
          {session ? (
            <>
              <div className='text-xs text-white/60'>
                {session.name} ({session.role || 'User'})
              </div>
              <LogoutButton />
            </>
          ) : (
            <div className='text-xs text-white/60'>Frontline → Bottom line</div>
          )}
        </div>
      </div>
    </header>
  );
}

