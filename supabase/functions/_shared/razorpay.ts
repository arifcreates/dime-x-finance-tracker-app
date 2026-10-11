import { env } from './http.ts';
export interface ProviderSubscription { id: string; status: string; plan_id: string; current_end: number | null; paid_count: number; short_url?: string; notes?: Record<string,string>; }
export async function razorpay<T>(path: string, data?: unknown): Promise<T> {
  const response=await fetch(`https://api.razorpay.com/v1/${path}`,{
    method:data===undefined?'GET':'POST', headers:{Authorization:`Basic ${btoa(`${env('RAZORPAY_KEY_ID')}:${env('RAZORPAY_KEY_SECRET')}`)}`,'Content-Type':'application/json'},
    body:data===undefined?undefined:JSON.stringify(data),signal:AbortSignal.timeout(15000),
  });
  if(!response.ok) throw new Error('Payment service unavailable. Please retry later.');
  return await response.json() as T;
}
export function currentEnd(subscription: ProviderSubscription) { return subscription.current_end?new Date(subscription.current_end*1000).toISOString():null; }
