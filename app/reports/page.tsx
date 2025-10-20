import ExecReportInline from '@/components/reports/ExecReportInline';

export default function Page(){
  return (
    <main className='max-w-6xl mx-auto p-6 space-y-6'>
      {/* Your existing cards/charts can remain above/below; this swaps in the AI-powered content */}
      <ExecReportInline />
    </main>
  );
}
