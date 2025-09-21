import { NextResponse } from 'next/server';
import { sbAdmin } from '@/lib/supabase-admin';
import demoData from '@/scripts/demo-data';

export const dynamic='force-dynamic';

export async function GET(){
  try {
    const {data,error}=await sbAdmin.from('stores').select('*').order('store_name');
    if(error) throw error;
    return NextResponse.json(data||[]);
  } catch (error) {
    console.log('Database not available, using demo data for stores');
    return NextResponse.json(demoData.stores);
  }
}
