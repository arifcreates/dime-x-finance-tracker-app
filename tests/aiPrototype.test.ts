import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aiConfiguration, DEFAULT_AI_MODEL } from '../supabase/functions/_shared/ai-config.ts';

const authSettings:Record<string,string>={SUPABASE_URL:'https://example.supabase.co',SUPABASE_ANON_KEY:'test-public-key',SUPABASE_SERVICE_ROLE_KEY:'test-service-key'};
const prototypeSettings={...authSettings,AI_MODE:'prototype',AI_API_KEY:'synthetic-provider-key',AI_PROTOTYPE_EMAILS:'tester@example.com'};
const testUser={id:'11111111-1111-4111-8111-111111111111',email:'tester@example.com',email_confirmed_at:'2026-10-11T00:00:00Z'};
const request=(payload:Record<string,unknown>)=>new Request('https://example.test',{method:'POST',headers:{Authorization:'Bearer synthetic-session','Content-Type':'application/json'},body:JSON.stringify(payload)});
function setEnv(settings:Record<string,string>){Object.assign(globalThis,{Deno:{env:{get:(name:string)=>settings[name]},serve:()=>{}}});}
async function withMocks(settings:Record<string,string>,fetcher:typeof fetch,run:()=>Promise<void>){
 const originalFetch=globalThis.fetch;
 const previous=(globalThis as unknown as {Deno:unknown}).Deno;
 setEnv(settings);globalThis.fetch=fetcher;
 try {await run();} finally {globalThis.fetch=originalFetch;Object.assign(globalThis,{Deno:previous});}
}
const response=(value:unknown,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json'}});

test('prototype config defaults to Lightning and restricts tester access',()=>{
 const previous=(globalThis as unknown as {Deno:unknown}).Deno;
 try {
  setEnv(prototypeSettings);
  assert.equal(aiConfiguration('TESTER@example.com').ready,true);
  assert.equal(aiConfiguration('tester@example.com').model,DEFAULT_AI_MODEL);
  assert.equal(aiConfiguration('outsider@example.com').ready,false);
  setEnv({...authSettings,AI_API_KEY:'synthetic-provider-key',AI_MODE:'production'});
  assert.equal(aiConfiguration('tester@example.com').ready,false);
  setEnv({...authSettings,AI_API_KEY:'synthetic-provider-key',AI_MODE:'production',AI_PRODUCTION_APPROVED:'true'});
  assert.equal(aiConfiguration('any-verified-user@example.com').ready,true);
 } finally {Object.assign(globalThis,{Deno:previous});}
});

test('status requires auth but consumes no quota and exposes no key',async()=>{
 let calls=0;
 await withMocks(prototypeSettings,async()=>{calls++;return response(testUser);},async()=>{
  const {handleRequest}=await import('../supabase/functions/ai-assist/index.ts');
  const result=await handleRequest(request({task:'status'}));
  const status=await result.json();assert.equal(result.status,200);assert.equal(status.ready,true);assert.equal(status.prototype,true);assert.equal(calls,1);
  assert.equal(JSON.stringify(status).includes(prototypeSettings.AI_API_KEY),false);
 });
});

test('unlisted users and unconfirmed test data never reach model or quota',async()=>{
 for(const [email,payload,expected] of [
  ['outsider@example.com',{task:'invoice-draft',description:'Fictional work',consent:true,testDataConfirmed:true},503],
  ['tester@example.com',{task:'invoice-draft',description:'Fictional work',consent:true},400],
  ['tester@example.com',{task:'invoice-draft',description:'Fictional work',consent:false,testDataConfirmed:true},400],
 ] as const){
  let calls=0;
  await withMocks(prototypeSettings,async()=>{calls++;return response({...testUser,email});},async()=>{
   const {handleRequest}=await import('../supabase/functions/ai-assist/index.ts');
   assert.equal((await handleRequest(request(payload))).status,expected);assert.equal(calls,1);
  });
 }
});

test('prototype generates validated line items through the configured NVIDIA API',async()=>{
 const calls:string[]=[];
 await withMocks(prototypeSettings,async(input,init)=>{
  const url=String(input);calls.push(url);
  if(url.endsWith('/auth/v1/user')) return response(testUser);
  if(url.includes('/rpc/claim_ai_usage')) return response({allowed:true,remaining:9});
  assert.equal(url,'https://integrate.api.nvidia.com/v1/chat/completions');
  const payload=JSON.parse(String(init?.body));
  assert.equal(payload.model,DEFAULT_AI_MODEL);assert.equal(payload.chat_template_kwargs.enable_thinking,false);
  assert.equal(payload.messages.length,4);assert.match(payload.messages[3].content,/Copy explicitly stated quantities/);
  return response({choices:[{message:{content:'{"items":[{"description":"Fictional design","quantity":3,"rate":1500,"amount":1}]}'}}]});
 },async()=>{
  const {handleRequest}=await import('../supabase/functions/ai-assist/index.ts');
  const result=await handleRequest(request({task:'invoice-draft',description:'Fictional design: 3 hours at INR 1500',consent:true,testDataConfirmed:true}));
  assert.equal(result.status,200);const value=await result.json();assert.equal(value.items[0].amount,4500);assert.equal(value.remaining,9);assert.equal(calls.length,3);
 });
});

test('reminder drafting keeps stored invoice facts out of the model request',async()=>{
 await withMocks(prototypeSettings,async(input,init)=>{
  const url=String(input);
  if(url.endsWith('/auth/v1/user')) return response(testUser);
  if(url.includes('/rest/v1/invoices')) return response({invoice_number:'FICTIONAL-123',due_date:'2026-10-10',amount:3210,status:'sent',items:{metadata:{currency:'INR'}}});
  if(url.includes('/rpc/claim_ai_usage')) return response({allowed:true,remaining:8});
  const payload=String(init?.body);assert.equal(payload.includes('FICTIONAL-123'),false);assert.equal(payload.includes('3210'),false);assert.equal(payload.includes('2026-10-10'),false);
  return response({choices:[{message:{content:'{"message":"Please review the outstanding invoice when convenient."}'}}]});
 },async()=>{
  const {handleRequest}=await import('../supabase/functions/ai-assist/index.ts');
  const result=await handleRequest(request({task:'reminder-draft',invoiceId:'fictional-invoice',consent:true,testDataConfirmed:true}));
  assert.equal(result.status,200);const value=await result.json();assert.match(value.message,/FICTIONAL-123/);assert.match(value.message,/3210 INR/);
 });
});

test('provider credential failure is explained without leaking provider secrets',async()=>{
 await withMocks(prototypeSettings,async input=>{
  const url=String(input);
  if(url.endsWith('/auth/v1/user')) return response(testUser);
  if(url.includes('/rpc/claim_ai_usage')) return response({allowed:true,remaining:9});
  return response({error:'synthetic-provider-key'},401);
 },async()=>{
  const {handleRequest}=await import('../supabase/functions/ai-assist/index.ts');
  const result=await handleRequest(request({task:'invoice-draft',description:'Fictional design',consent:true,testDataConfirmed:true}));
  assert.equal(result.status,503);const value=await result.json();assert.match(value.error,/credentials/);assert.equal(JSON.stringify(value).includes(prototypeSettings.AI_API_KEY),false);
 });
});

test('automatic provider retry consumes one app quota reservation',async()=>{
 let quotaCalls=0;let providerCalls=0;
 await withMocks(prototypeSettings,async input=>{
  const url=String(input);
  if(url.endsWith('/auth/v1/user')) return response(testUser);
  if(url.includes('/rpc/claim_ai_usage')){quotaCalls++;return response({allowed:true,remaining:9});}
  providerCalls++;if(providerCalls===1)throw new DOMException('Synthetic timeout','TimeoutError');
  return response({choices:[{message:{content:'{"items":[{"description":"Fictional design","quantity":1,"rate":100}]}'}}]});
 },async()=>{
  const {handleRequest}=await import('../supabase/functions/ai-assist/index.ts');
  const result=await handleRequest(request({task:'invoice-draft',description:'Fictional design',consent:true,testDataConfirmed:true}));
  assert.equal(result.status,200);assert.equal(quotaCalls,1);assert.equal(providerCalls,2);
 });
});

test('quick-add is a draft-only metered task and never fetches financial records',async()=>{
 let quota=0;
 await withMocks(prototypeSettings,async(input,init)=>{
  const url=String(input);
  if(url.endsWith('/auth/v1/user')) return response(testUser);
  if(url.includes('/rpc/claim_ai_usage')) {quota++;return response({allowed:true,remaining:9});}
  assert.equal(url,'https://integrate.api.nvidia.com/v1/chat/completions');
  const payload=JSON.parse(String(init?.body));assert.match(payload.messages.at(-1).content,/Do NOT resolve relative dates/);
  return response({choices:[{message:{content:JSON.stringify({entries:[{intent:'expense',amount:450,description:'Fictional meal',merchant:'Fictional cafe',category:'Food',dateText:'yesterday'},{intent:'unsupported',amount:null,description:'Card payment',dateText:'today'}]})}}]});
 },async()=>{
  const {handleRequest}=await import('../supabase/functions/ai-assist/index.ts');
  const result=await handleRequest(request({task:'quick-add',description:'Fictional meal yesterday and card payment',consent:true,testDataConfirmed:true}));
  assert.equal(result.status,200);const value=await result.json();assert.equal(value.entries[0].dateText,'yesterday');assert.equal(value.entries[1].intent,'unsupported');assert.equal(quota,1);
 });
});
