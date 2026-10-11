import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseQuickAdd, resolveQuickDate, matchCategory, preferredAccount } from '../src/utils/quickAdd';
import { validateQuickAdd } from '../supabase/functions/_shared/quick-add';
import { DataService } from '../src/services/dataService';
import { supabaseService } from '../src/services/supabaseService';
import type { Account, Transaction } from '../src/types';

const account:Account={id:'quick-a',name:'Cash',type:'cash',balance:1000,currency:'INR'};
const entry:Transaction={id:'quick-t',date:'2026-10-11',description:'Food',amount:450,type:'expense',category:'Food',account:'Cash',accountId:'quick-a',currency:'INR',status:'completed',source:'manual'};

test('local quick-add preserves decimals, k/lakh, multiple entries and relative date text',()=>{
 const rows=parseQuickAdd('Spent ₹450 on Swiggy yesterday; got 20k from freelance work; 1.5L laptop; 12.50 coffee');
 assert.deepEqual(rows.map(r=>r.amount),[450,20000,150000,12.5]);
 assert.equal(rows[0].dateText,'yesterday');assert.equal(rows[0].merchant,'Swiggy');assert.equal(rows[0].currency,'INR');assert.equal(rows[1].intent,'income');
});

test('ambiguous amounts and compound financial intents remain unsupported',()=>{
 for(const text of ['paid HDFC card 12k','paid car EMI 500','paid loan 500','Acme paid invoice 1042','moved 5k to cash','put 5k toward laptop','not spent 500 food','pending 500 food','450 plus 300 food','500 rent tomorrow','500 food 2026-02-30','spent -450 food','I received 20k salary','20k salary','500 food last week','yesterday 450 food']) {
  const row=parseQuickAdd(text)[0];
  assert.ok(row.intent==='unsupported' || !resolveQuickDate(row.dateText),text);
 }
 assert.throws(()=>parseQuickAdd(Array.from({length:11},()=> '1 coffee').join(';')),/1–10/);
});

test('date resolution uses local calendar and rejects ambiguous/invalid dates',()=>{
 const now=new Date(2026,9,11,0,1);
 assert.equal(resolveQuickDate('yesterday',now),'2026-10-10');assert.equal(resolveQuickDate('last Sunday',now),'2026-10-04');
 assert.equal(resolveQuickDate('last Friday',now),'2026-10-09');assert.equal(resolveQuickDate('2026-02-30',now),'');assert.equal(resolveQuickDate('a week ago',now),'');
});

test('longest merchant rule wins and account default respects explicit currency',()=>{
 const categories=[{id:'food',name:'Food',bucket:'flex' as const},{id:'work',name:'Work meals',bucket:'flex' as const}];
 assert.equal(matchCategory('Swiggy office',categories,[{id:'1',matchText:'swiggy',categoryId:'food'},{id:'2',matchText:'swiggy office',categoryId:'work'}])?.name,'Work meals');
 const draft=parseQuickAdd('₹450 Swiggy')[0];
 assert.equal(preferredAccount(draft,[entry],[account,{...account,id:'usd',currency:'USD'}]),account.id);
 assert.equal(preferredAccount({...draft,currency:'USD'},[entry],[account]),'');
 assert.equal(preferredAccount({...draft,currency:undefined},[],[account,{...account,id:'second'}]),'');
});

test('AI schema rejects fabricated intents, strings as amounts and malformed currency',()=>{
 const draft={intent:'expense',amount:450,description:'Swiggy',category:'Food',merchant:'Swiggy',dateText:'yesterday'};
 assert.equal(validateQuickAdd({entries:[draft]})[0].amount,450);
 for(const change of [{intent:'transfer'},{amount:'450'},{amount:NaN},{amount:0},{currency:'inr'},{category:'Transfer'},{description:''}]) assert.throws(()=>validateQuickAdd({entries:[{...draft,...change}]}));
 assert.equal(validateQuickAdd({entries:[{...draft,intent:'unsupported',amount:null}]})[0].amount,null);
});

test('guest batch is atomic on failure and repeated save does not double-debit',async()=>{
 const service=new DataService();await service.saveAccount(account);
 await assert.rejects(()=>service.saveTransactions([entry,{...entry,id:'missing',accountId:'missing'}]),/does not exist/);
 assert.equal((await service.getAccounts()).find(a=>a.id===account.id)?.balance,1000);
 assert.equal((await service.getTransactions()).some(t=>t.id===entry.id),false);
 await service.saveTransactions([entry]);await service.saveTransactions([entry]);
 assert.equal((await service.getAccounts()).find(a=>a.id===account.id)?.balance,550);
 const restored=new DataService();assert.equal((await restored.getTransactions()).filter(t=>t.id===entry.id).length,1);
 await service.learnCategoryRule('Swiggy','Food','expense');
 assert.equal((await restored.getCategoryRules()).find(r=>r.matchText==='swiggy')?.categoryId,(await restored.getCategories()).find(c=>c.name==='Food')?.id);
});

test('cloud batch rejection leaves local cache unchanged',async()=>{
 const service=new DataService();service.setCurrentUserId('quick-user');
 const original=supabaseService.saveTransactions;
 supabaseService.saveTransactions=async()=>{throw new Error('Atomic batch rejected');};
 try {await assert.rejects(()=>service.saveTransactions([entry]),/Atomic batch rejected/);assert.deepEqual(service.getCachedTransactions(),[]);}
 finally {supabaseService.saveTransactions=original;}
});
