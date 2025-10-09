import { redirect } from 'next/navigation';

export default function Page() {
  // This page is deprecated - redirect to reports
  redirect('/reports');
}
