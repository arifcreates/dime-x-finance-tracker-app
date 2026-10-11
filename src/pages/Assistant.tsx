import { useEffect, useState } from 'react';
import { dataService } from '../services/dataService';
import { callBackend } from '../services/backendService';
import type { Invoice } from '../types';

export default function Assistant() {
  const [invoices,setInvoices]=useState<Invoice[]>([]);
  const [invoiceId,setInvoiceId]=useState('');
  const [draft,setDraft]=useState('');
  const [consent,setConsent]=useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [copied,setCopied]=useState(false);
  useEffect(()=>{dataService.getInvoices().then(items=>{const outstanding=items.filter(i=>i.status==='sent' || i.status==='overdue');setInvoices(outstanding);setInvoiceId(outstanding[0]?.id || '');});},[]);
  const generate=async()=>{
    setBusy(true);setError('');setDraft('');setCopied(false);
    try {const result=await callBackend<{message:string}>('ai-assist',{task:'reminder-draft',invoiceId,consent});setDraft(result.message);}
    catch(error){setError(error instanceof Error?error.message:'Could not draft reminder.');}
    finally{setBusy(false);}
  };
  return <div className="mx-auto max-w-3xl space-y-6 p-6 pb-24">
    <div><h2 className="text-2xl font-semibold">AI drafts</h2><p className="mt-2 text-gray-500">Prepare a payment reminder for review. Invoice numbers, amounts and dates come from your saved records.</p></div>
    <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
      <label className="block">Outstanding invoice<select aria-label="Outstanding invoice" value={invoiceId} onChange={e=>{setInvoiceId(e.target.value);setDraft('');}} className="mt-2 w-full rounded-lg border p-3 dark:bg-gray-800"><option value="">Select an invoice</option>{invoices.map(i=><option key={i.id} value={i.id}>{i.invoiceNumber} · {i.status}</option>)}</select></label>
      {!invoices.length && <p className="text-sm text-gray-500">Create an invoice and mark it sent to draft a reminder.</p>}
      <label className="flex gap-2 text-sm"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} />Use the configured AI provider to draft the wording. Client names, bank details and invoice facts stay out of the model request.</label>
      <button disabled={busy || !consent || !invoiceId} onClick={generate} className="rounded-lg bg-black px-4 py-3 text-white disabled:opacity-40">{busy?'Drafting…':'Draft reminder'}</button>
      {error && <p role="alert" className="text-red-600">{error}</p>}
      {draft && <><textarea aria-label="Reminder draft" value={draft} onChange={e=>setDraft(e.target.value)} rows={9} className="w-full rounded-lg border p-3 dark:bg-gray-800" /><button onClick={async()=>{await navigator.clipboard.writeText(draft);setCopied(true);}} className="rounded-lg border px-4 py-2">{copied?'Copied':'Copy reviewed reminder'}</button><p className="text-sm text-gray-500">Nothing has been sent. Review the message and send it through your email app.</p></>}
    </div>
    <p className="text-sm text-gray-500">You can also draft invoice line items inside Create Invoice. AI suggestions require review and never change your balances.</p>
  </div>;
}
