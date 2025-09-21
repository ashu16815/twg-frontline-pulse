import { NextResponse } from 'next/server';
import { sbAdmin } from '@/lib/supabase-admin';

export const dynamic='force-dynamic';

export async function GET(){
  const {data,error}=await sbAdmin.from('stores').select('*').order('store_name');
  if(error) return NextResponse.json([], {status:500});
  return NextResponse.json(data||[]);
}
