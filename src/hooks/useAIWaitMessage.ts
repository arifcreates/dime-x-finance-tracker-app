import { useEffect, useState } from 'react';

export function useAIWaitMessage(busy: boolean) {
  const [waiting,setWaiting]=useState(false);
  useEffect(()=>{
    setWaiting(false);
    if(!busy) return;
    const timer=window.setTimeout(()=>setWaiting(true),15000);
    return ()=>window.clearTimeout(timer);
  },[busy]);
  return busy && waiting ? 'The AI service is still responding. This can take up to 90 seconds; one retry happens automatically. Keep this window open.' : '';
}
