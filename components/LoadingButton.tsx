'use client';
import { useState } from 'react';
export default function LoadingButton({onClick, children, className, busyText, disabled, type}:{onClick?:()=>Promise<any>|any, children:any, className?:string, busyText?:string, disabled?:boolean, type?:'button'|'submit'|'reset'}){
  const [loading,setLoading]=useState(false);
  async function handle(){ if(loading || disabled) return; setLoading(true); try{ if(onClick) await onClick(); } finally{ setLoading(false); } }
  return (
    <button type={type || 'button'} disabled={loading || disabled} onClick={handle} className={`btn ${className||''} ${loading?'opacity-60 pointer-events-none':''}`}>
      {loading? (busyText || 'Working…') : children}
    </button>
  );
}