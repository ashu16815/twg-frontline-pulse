'use client';

import { useRouter } from 'next/navigation';
import LoadingButton from './LoadingButton';

export default function GenerateReportButton() {
  const router = useRouter();

  const handleGenerate = async () => {
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
    }
  };

  return (
    <LoadingButton
      onClick={handleGenerate}
      busyText='Generating Report with AI...'
      className='btn-liquid px-6 py-3 text-lg font-semibold'
    >
      🤖 Generate Executive Report (Azure OpenAI)
    </LoadingButton>
  );
}

