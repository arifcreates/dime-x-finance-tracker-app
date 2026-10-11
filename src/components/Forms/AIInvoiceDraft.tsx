import { useState } from 'react';
import { callBackend } from '../../services/backendService';
import type { InvoiceItem } from '../../types';
import { useAIStatus } from '../../hooks/useAIStatus';

export function AIInvoiceDraft({onApply}:{onApply:(items:InvoiceItem[])=>void}) {
  const [description,setDescription]=useState('');
  const [consent,setConsent]=useState(false);
  const [items,setItems]=useState<InvoiceItem[]>([]);
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  const [testDataConfirmed,setTestDataConfirmed]=useState(false);
  const {status,checking,statusError,refresh}=useAIStatus();
  const generate=async()=>{
    setBusy(true);setError('');setItems([]);
    try { const result=await callBackend<{items:InvoiceItem[]}>('ai-assist',{task:'invoice-draft',description,consent,testDataConfirmed});setItems(result.items); }
    catch(error) {setError(error instanceof Error?error.message:'Could not draft items.');}
    finally {setBusy(false);}
  };
  return <details className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
    <summary className="cursor-pointer font-medium">Draft line items with AI</summary>
    <div className="mt-3 space-y-3">
      <p className="text-sm text-gray-500">Describe the work, quantities and agreed rates. AI produces a draft for you to review; totals are calculated by Dime-X.</p>
      <p role="status" className="text-sm text-gray-500">{checking?'Checking AI availability…':status?.message || statusError}</p>
      {status?.ready && <p className="text-xs text-gray-500">Model: {status.model}</p>}
      {status?.prototype && <button type="button" onClick={()=>setDescription('Fictional logo design, 1 project at INR 25000; 3 fictional revision hours at INR 1500 each.')} className="text-sm underline">Use a fictional example</button>}
      {!checking && !status?.ready && <button type="button" onClick={()=>void refresh()} className="text-sm underline">Check connection again</button>}
      <textarea aria-label="Work description for AI" maxLength={3000} value={description} onChange={e=>setDescription(e.target.value)} className="w-full rounded-lg border p-3 dark:bg-gray-800" placeholder="Brand identity design, 1 project at INR 25000; 3 revision hours at INR 1500 each." />
      <label className="flex gap-2 text-sm"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} />Send this description to the configured AI provider. Avoid personal and bank details.</label>
      {status?.prototype && <label className="flex gap-2 text-sm"><input type="checkbox" checked={testDataConfirmed} onChange={e=>setTestDataConfirmed(e.target.checked)} />This is a fictional test example, without real client or confidential information.</label>}
      <button type="button" disabled={busy || checking || !status?.ready || !consent || (status.prototype && !testDataConfirmed) || description.trim().length<5} onClick={generate} className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-40">{busy?'Drafting…':'Generate draft'}</button>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      {items.length>0 && <div className="space-y-2">
        {items.map((item,index)=><p key={index} className="text-sm">{item.description} — {item.quantity} × {item.rate}</p>)}
        <p className="text-sm text-gray-500">Check every description, quantity and rate before saving.</p>
        <button type="button" onClick={()=>{onApply(items);setItems([]);}} className="rounded-lg border px-4 py-2">Replace line items with this draft</button>
      </div>}
    </div>
  </details>;
}
