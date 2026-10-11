import { admin, env, json, verifyHmac } from '../_shared/http.ts';
import { currentEnd, ProviderSubscription, razorpay } from '../_shared/razorpay.ts';

export async function handleRequest(req: Request) {
  if(req.method!=='POST') return json({error:'Method not allowed'},405);
  try {
    if(Number(req.headers.get('content-length') || 0)>100000) return json({error:'Too large'},413);
    const raw=await req.text(); if(raw.length>100000) return json({error:'Too large'},413);
    const signature=req.headers.get('x-razorpay-signature') || '';
    if(!await verifyHmac(raw,signature,env('RAZORPAY_WEBHOOK_SECRET'))) return json({error:'Invalid signature'},401);
    const event=JSON.parse(raw); const eventId=req.headers.get('x-razorpay-event-id');
    if(!eventId || !Number.isFinite(event.created_at)) return json({error:'Invalid event'},400);
    if(typeof event.event!=='string' || !event.event.startsWith('subscription.')) return json({received:true});
    const providerId=event.payload?.subscription?.entity?.id;
    if(typeof providerId!=='string' || !/^sub_[a-zA-Z0-9]+$/.test(providerId)) return json({error:'Invalid subscription'},400);
    // Fetch authoritative current status rather than trusting an old event's state.
    const subscription=await razorpay<ProviderSubscription>(`subscriptions/${providerId}`);
    if(subscription.plan_id!==env('RAZORPAY_PLAN_ID')) return json({received:true});
    const client=admin();
    const {error}=await client.rpc('apply_subscription_event',{p_event_id:eventId,p_provider_id:providerId,p_status:subscription.status,p_current_end:currentEnd(subscription),p_paid_count:subscription.paid_count,p_event_at:new Date(event.created_at*1000).toISOString()});
    if(error) return json({error:'Could not apply event; retry required'},503);
    return json({received:true});
  } catch { return json({error:'Webhook processing unavailable; retry required'},503); }
}
Deno.serve(handleRequest);
