import Link from 'next/link';
import { SheenButton } from './Glass';

export default function NavBar() {
  return (
    <div className="sticky top-0 z-40 backdrop-blur bg-black/30 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-semibold tracking-tight">
          TWG Frontline Pulse
        </Link>
        <div className="flex gap-3 items-center">
          <Link href="/weekly/submit" className="btn">
            Give Weekly Feedback
          </Link>
          <Link href="/ceo">
            <SheenButton>CEO Office</SheenButton>
          </Link>
        </div>
      </div>
    </div>
  );
}
