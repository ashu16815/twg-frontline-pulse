import Link from 'next/link';
import { SheenButton } from './Glass';

export default function NavBar() {
  return (
    <div className="sticky top-0 z-40 backdrop-blur bg-black/30 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-semibold tracking-tight flex items-center space-x-2">
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span>TWG Frontline Feedback</span>
        </Link>
        <div className="flex gap-3 items-center">
          <Link href="/frontline/submit" className="btn bg-red-600 hover:bg-red-700 text-white">
            Submit Store Report
          </Link>
          <Link href="/feedback/raw" className="btn">
            Feedback
          </Link>
          <Link href="/executive-reports" className="btn">
            Reports
          </Link>
          <Link href="/ceo">
            <SheenButton>CEO Office</SheenButton>
          </Link>
        </div>
      </div>
    </div>
  );
}
