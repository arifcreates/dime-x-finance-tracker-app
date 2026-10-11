import { useEffect, useState } from 'react';
import { callBackend } from '../services/backendService';
import { formatCurrency } from '../utils/formatters';

interface BillingState {
  configured: boolean;
  subscription: { status: string; current_end: string | null; paid_count: number; cancel_at_cycle_end: boolean } | null;
  plan: {name:string;amount:number;currency:string;interval:number;period:string} | null;
}
export default function Billing() {
  const [state,setState]=useState<BillingState | null>(null);
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  const load=async()=>{setState(await callBackend<BillingState>('billing',{action:'status'}));};
  useEffect(()=>{load().catch(error=>setError(error instanceof Error?error.message:'Could not load billing.'));},[]);
  const action=async(type:string)=>{
    if(type==='cancel' && !confirm('Cancel renewal at the end of your current billing cycle?'))return;
    setBusy(true);setError('');
    try {
      const result=await callBackend<{url?:string}>('billing',{action:type});
      if(result.url){const url=new URL(result.url);if(url.protocol!=='https:' || !['rzp.io','razorpay.com'].some(host=>url.hostname===host || url.hostname.endsWith('.'+host)))throw new Error('Unexpected checkout URL.');window.location.assign(url.href);}
      else await load();
    } catch(error){setError(error instanceof Error?error.message:'Billing request failed.');}
    finally{setBusy(false);}
  };
  const paid=state?.subscription?.status==='active' && state.subscription.paid_count>0 && !!state.subscription.current_end && new Date(state.subscription.current_end).getTime()>Date.now();
  return <div className="mx-auto max-w-3xl space-y-6 p-6 pb-24">
    <div><h2 className="text-2xl font-semibold">Your Dime-X plan</h2><p className="mt-2 text-gray-500">Manage your Dime-X subscription. Your personal bills are tracked separately under Bills.</p></div>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}
    <div className="space-y-4 rounded-2xl border bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
      <h3 className="text-xl font-semibold">{paid?'Pro':'Free'}</h3>
      <p>Finance tracking, clients and PDF invoices. {paid?'100':'10'} AI drafting requests per day when AI is enabled.</p>
      {state?.subscription && <p className="text-sm text-gray-500">Subscription status: {state.subscription.status}{state.subscription.current_end?` · Current cycle ends ${new Date(state.subscription.current_end).toLocaleDateString()}`:''}{state.subscription.cancel_at_cycle_end?' · Renewal cancelled':''}</p>}
      {state && !state.configured && <p className="text-sm text-gray-500">Paid subscriptions are not available yet. Continue using the free workspace.</p>}
      {state?.plan && <p className="font-semibold">{state.plan.name}: {formatCurrency(state.plan.amount,state.plan.currency)} every {state.plan.interval} {state.plan.period} cycle</p>}
      <div className="flex flex-wrap gap-3">
        {state?.configured && !paid && state.plan && <button disabled={busy} onClick={()=>action('checkout')} className="rounded-lg bg-black px-4 py-3 text-white disabled:opacity-40">Subscribe with Razorpay</button>}
        {state?.configured && state.subscription && <button disabled={busy} onClick={()=>action('refresh')} className="rounded-lg border px-4 py-3">Refresh payment status</button>}
        {paid && !state?.subscription?.cancel_at_cycle_end && <button disabled={busy} onClick={()=>action('cancel')} className="rounded-lg border px-4 py-3">Cancel renewal</button>}
      </div>
      <p className="text-sm text-gray-500">Access updates after the backend verifies your subscription. Review the recurring amount in checkout before authorizing payment.</p>
    </div>
  </div>;
}
