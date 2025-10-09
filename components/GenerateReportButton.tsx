'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function GenerateReportButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reports/generate', {
        method: 'POST',
      });
      
      if (res.ok) {
        // Refresh the page to show the new report
        router.refresh();
      } else {
        const error = await res.json();
        alert(`Error: ${error.error || 'Failed to generate report'}`);
      }
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleGenerate}
      disabled={loading}
      className='btn btn-liquid px-6 py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed relative'
    >
      {loading ? (
        <span className='flex items-center gap-3'>
          <svg className='animate-spin h-5 w-5' viewBox='0 0 24 24'>
            <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' fill='none' />
            <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z' />
          </svg>
          Generating Report with AI...
        </span>
      ) : (
        '🤖 Generate Executive Report (Azure OpenAI)'
      )}
    </button>
  );
}

