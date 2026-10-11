import { admin, authenticate, body, env, json, HttpError } from '../_shared/http.ts';
import { currentEnd, ProviderSubscription, razorpay } from '../_shared/razorpay.ts';

export async function handleRequest(req: Request) {
  if(req.method==='OPTIONS') return json({},200,req);
  if(req.method!=='POST') return json({error:'Method not allowed'},405,req);
  try {
    const user=await authenticate(req); const client=admin(); const input=await body(req);
    const configured=!!(Deno.env.get('RAZORPAY_KEY_ID') && Deno.env.get('RAZORPAY_KEY_SECRET') && Deno.env.get('RAZORPAY_PLAN_ID'));
    const {data:existing,error:readError}=await client.from('subscriptions').select('*').eq('user_id',user.id).maybeSingle();
    if(readError) throw new Error('Could not load subscription status.');
    if(input.action==='status') {
      let plan=null;
      if(configured) {
        const result=await razorpay<{item:{name:string;amount:number;currency:string};period:string;interval:number}>(`plans/${env('RAZORPAY_PLAN_ID')}`);
        plan={name:result.item.name,amount:result.item.amount/100,currency:result.item.currency,period:result.period,interval:result.interval};
      }
      return json({configured,subscription:existing,plan},200,req);
    }
    if(!configured) return json({error:'Subscription checkout has not been configured yet.'},503,req);
    if(input.action==='refresh' || input.action==='cancel') {
      if(!existing?.provider_id) throw new Error('No subscription found.');
      const subscription=input.action==='cancel'
        ? await razorpay<ProviderSubscription>(`subscriptions/${existing.provider_id}/cancel`,{cancel_at_cycle_end:1})
        : await razorpay<ProviderSubscription>(`subscriptions/${existing.provider_id}`);
      const {error}=await client.from('subscriptions').update({status:subscription.status,current_end:currentEnd(subscription),paid_count:subscription.paid_count,cancel_at_cycle_end:input.action==='cancel'?true:existing.cancel_at_cycle_end,updated_at:new Date().toISOString()}).eq('user_id',user.id).eq('provider_id',subscription.id);
      if(error) throw new Error('Could not update subscription status.');
      return json({status:subscription.status},200,req);
    }
    if(input.action!=='checkout') return json({error:'Unsupported billing action'},400,req);
    if(existing?.provider_id && !['cancelled','completed','expired'].includes(existing.status)) {
      if(existing.status==='active') throw new Error('Your subscription is already active.');
      const subscription=await razorpay<ProviderSubscription>(`subscriptions/${existing.provider_id}`);
      if(!subscription.short_url) throw new Error('Please refresh your subscription status.');
      return json({url:subscription.short_url},200,req);
    }
    // Reserve creation atomically. Ambiguous provider timeouts stay locked until
    // reconciled, preventing accidental duplicate recurring mandates.
    const {data:reserved,error:reserveError}=await client.rpc('reserve_subscription_checkout',{p_user_id:user.id});
    if(reserveError || !reserved) return json({error:'Checkout is already being prepared. Refresh status or contact support if it persists.'},409,req);
    const subscription=await razorpay<ProviderSubscription>('subscriptions',{plan_id:env('RAZORPAY_PLAN_ID'),total_count:120,quantity:1,customer_notify:1,notes:{user_id:user.id}});
    const {error}=await client.from('subscriptions').update({provider_id:subscription.id,status:subscription.status,current_end:currentEnd(subscription),paid_count:subscription.paid_count,updated_at:new Date().toISOString()}).eq('user_id',user.id).eq('status','creating');
    if(error || !subscription.short_url) throw new Error('Checkout created but not ready. Please contact support before retrying.');
    return json({url:subscription.short_url},200,req);
  } catch(error) { return json({error:error instanceof Error?error.message:'Billing request failed'},error instanceof HttpError?error.status:400,req); }
}
Deno.serve(handleRequest);
