import { test } from 'node:test';
import assert from 'node:assert/strict';
import { requestAIDraft } from '../supabase/functions/_shared/ai-provider.ts';
import { HttpError } from '../supabase/functions/_shared/http.ts';

const url=new URL('https://example.test/v1/chat/completions');
const payload={model:'synthetic-model',messages:[{role:'user',content:'Fictional test'}]};
const good=()=>new Response(JSON.stringify({choices:[{finish_reason:'stop',message:{content:'{"items":[]}'}}]}));
const timeout=()=>new DOMException('Synthetic timeout','TimeoutError');

test('provider retries a timed-out draft once using a bounded second attempt',async()=>{
 const budgets:number[]=[];let calls=0;
 const result=await requestAIDraft(url,'synthetic-key',payload,{timeoutSignal:ms=>{budgets.push(ms);return new AbortController().signal;},fetcher:async()=>{calls++;if(calls===1)throw timeout();return good();}});
 assert.equal(result,'{"items":[]}');assert.equal(calls,2);assert.deepEqual(budgets,[30000,60000]);
});
test('provider retries a timeout during body reading, not just response headers',async()=>{
 let calls=0;
 await requestAIDraft(url,'synthetic-key',payload,{fetcher:async()=>{calls++;if(calls===1){const result=good();result.json=async()=>{throw timeout();};return result;}return good();}});
 assert.equal(calls,2);
});
test('provider repeated timeout returns a clear 504 after exactly two attempts',async()=>{
 let calls=0;
 await assert.rejects(()=>requestAIDraft(url,'synthetic-key',payload,{fetcher:async()=>{calls++;throw timeout();}}),error=>error instanceof HttpError && error.status===504 && /two attempts/.test(error.message));
 assert.equal(calls,2);
});
test('provider retries transient availability errors, but never auth failures or rate limits',async()=>{
 for(const status of [503,401,429]){
  let calls=0;
  const run=()=>requestAIDraft(url,'synthetic-key',payload,{fetcher:async()=>{calls++;return calls===1?new Response('{}',{status}):good();}});
  if(status===503){assert.equal(await run(),'{"items":[]}');assert.equal(calls,2);}
  else {await assert.rejects(run,error=>error instanceof HttpError && error.status===(status===401?503:429));assert.equal(calls,1);}
 }
});
