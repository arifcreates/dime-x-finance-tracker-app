import { useCallback, useEffect, useState } from 'react';
import { callBackend } from '../services/backendService';

export interface AIStatus { ready: boolean; mode: string; prototype: boolean; model: string; message: string; }
export function useAIStatus() {
  const [status,setStatus]=useState<AIStatus | null>(null);
  const [checking,setChecking]=useState(true);
  const [statusError,setStatusError]=useState('');
  const refresh=useCallback(async()=>{
    setChecking(true);setStatusError('');
    try { setStatus(await callBackend<AIStatus>('ai-assist',{task:'status'})); }
    catch(error) { setStatus(null);setStatusError(error instanceof Error?error.message:'Could not check AI availability.'); }
    finally {setChecking(false);}
  },[]);
  useEffect(()=>{void refresh();},[refresh]);
  return {status,checking,statusError,refresh};
}
