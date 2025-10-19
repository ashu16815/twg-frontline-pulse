'use client';

export default function PowerBIEmbed() {
  const url = process.env.NEXT_PUBLIC_POWERBI_EMBED_URL || process.env.POWERBI_EMBED_URL;
  const token = process.env.POWERBI_ACCESS_TOKEN;
  const reportId = process.env.POWERBI_REPORT_ID;

  if (!url || !token || !reportId) return null;

  return (
    <iframe
      title='Executive Report'
      src={`${url}?reportId=${reportId}&autoAuth=true&ctid=`}
      className='w-full h-[720px] rounded-2xl border border-white/10'
      allowFullScreen
    />
  );
}
