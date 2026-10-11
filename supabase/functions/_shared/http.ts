import { createClient } from 'npm:@supabase/supabase-js@2.105.4';

export function json(body: unknown, status = 200, req?: Request) {
  const origin = req?.headers.get('origin') || '';
  const allowed = (Deno.env.get('APP_ORIGINS') || 'http://localhost:5173,http://localhost:5174,https://dime-x-finance-tracker-app.vercel.app').split(',').map(s=>s.trim());
  return new Response(JSON.stringify(body), { status, headers: {
    'Content-Type': 'application/json', 'Vary': 'Origin',
    ...(allowed.includes(origin) ? { 'Access-Control-Allow-Origin': origin } : {}),
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  } });
}
export function env(name: string) { const value = Deno.env.get(name); if(!value) throw new Error('This service has not been configured yet.'); return value; }
export function admin() { return createClient(env('SUPABASE_URL'),env('SUPABASE_SERVICE_ROLE_KEY'),{auth:{persistSession:false,autoRefreshToken:false}}); }
export class HttpError extends Error { constructor(message: string, public status: number) { super(message); } }
export async function authenticate(req: Request) {
  const token = req.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
  if (!token) throw new HttpError('Sign in to continue.',401);
  const client = createClient(env('SUPABASE_URL'),env('SUPABASE_ANON_KEY'),{auth:{persistSession:false,autoRefreshToken:false}});
  const {data,error}=await client.auth.getUser(token);
  if(error || !data.user || !data.user.email_confirmed_at) throw new HttpError('Sign in with a verified email to continue.',401);
  return data.user;
}
export async function body(req: Request) {
  if (Number(req.headers.get('content-length') || 0)>16000) throw new Error('Request too large.');
  const text=await req.text(); if(text.length>16000) throw new Error('Request too large.');
  return JSON.parse(text) as Record<string,unknown>;
}
export async function verifyHmac(payload: string, signature: string, secret: string) {
  if(!/^[a-f0-9]{64}$/i.test(signature)) return false;
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['verify']);
  const bytes=Uint8Array.from(signature.match(/../g)!,s=>parseInt(s,16));
  return crypto.subtle.verify('HMAC',key,bytes,new TextEncoder().encode(payload));
}
