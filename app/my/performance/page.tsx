import { redirect } from 'next/navigation';

export default function Page() {
  // This page is deprecated - redirect to executive-reports
  redirect('/executive-reports');
}
