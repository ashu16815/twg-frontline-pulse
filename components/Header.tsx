import Link from 'next/link';
import Image from 'next/image';

export default function Header() {
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
        <div className='ml-auto text-xs text-white/60'>Frontline → Bottom line</div>
      </div>
    </header>
  );
}

