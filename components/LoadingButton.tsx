'use client';
import { useState } from 'react';
export default function LoadingButton({onClick, children, className}:{onClick:()=>Promise<any>|any, children:any, className?:string}){
  const [loading,setLoading]=useState(false);
  async function handle(){ if(loading) return; setLoading(true); try{ await onClick(); } finally{ setLoading(false); } }
  return (
    <button disabled={loading} onClick={handle} className={`btn ${className||''} ${loading?'opacity-60 pointer-events-none':''}`}>
      {loading? 'Working…' : children}
    </button>
  );
}