import { redirect } from 'next/navigation';

export default function Page(){
  // Redirect old /reports to new /executive-reports
  redirect('/executive-reports');
}
