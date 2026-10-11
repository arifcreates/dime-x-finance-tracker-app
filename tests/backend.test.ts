import { test } from 'node:test';
import assert from 'node:assert/strict';
import { authenticate, HttpError, verifyHmac } from '../supabase/functions/_shared/http.ts';

Object.assign(globalThis,{Deno:{env:{get:(name:string)=>({SUPABASE_URL:'https://example.supabase.co',SUPABASE_ANON_KEY:'test-public-key',SUPABASE_SERVICE_ROLE_KEY:'test-service-key',RAZORPAY_WEBHOOK_SECRET:'test-webhook-secret'} as Record<string,string>)[name]},serve:()=>{}}});
test('backend rejects requests without a session before accessing data',async()=>{await assert.rejects(()=>authenticate(new Request('https://example.test',{method:'POST'})),error=>error instanceof HttpError && error.status===401);});
test('webhook HMAC authenticates exact body and rejects tampering',async()=>{const payload='{"event":"subscription.activated"}';const key=await crypto.subtle.importKey('raw',new TextEncoder().encode('secret'),{name:'HMAC',hash:'SHA-256'},false,['sign']);const digest=await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(payload));const signature=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');assert.equal(await verifyHmac(payload,signature,'secret'),true);assert.equal(await verifyHmac(payload+' ',signature,'secret'),false);assert.equal(await verifyHmac(payload,signature,'wrong'),false);assert.equal(await verifyHmac(payload,'bad','secret'),false);});
test('AI disabled response never contacts a model',async()=>{
 const original=globalThis.fetch;let calls=0;
 globalThis.fetch=async()=>{calls++;return new Response(JSON.stringify({id:'11111111-1111-4111-8111-111111111111',email:'test@example.com',email_confirmed_at:new Date().toISOString()}),{headers:{'Content-Type':'application/json'}});};
 try {const {handleRequest}=await import('../supabase/functions/ai-assist/index.ts');const response=await handleRequest(new Request('https://example.test',{method:'POST',headers:{Authorization:'Bearer test-token','Content-Type':'application/json'},body:'{"task":"invoice-draft","description":"Synthetic work","consent":true}'}));assert.equal(response.status,503);assert.equal(calls,1);}
 finally {globalThis.fetch=original;}
});
