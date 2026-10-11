import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseQuickAdd, enrichQuickAdd, resolveQuickDate, matchCategory, preferredAccount } from '../src/utils/quickAdd';
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
 for(const text of ['paid HDFC card 12k','paid car EMI 500','paid loan 500','Acme paid invoice 1042','moved 5k to cash','put 5k toward laptop','not spent 500 food','pending 500 food','450 plus 300 food','500 rent tomorrow','500 food 2026-02-30','spent -450 food','500 food last week']) {
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

test('conversational wording resolves income, expense, account references and flexible date placement',()=>{
 const hdfc={...account,id:'hdfc',name:'HDFC'};
 const cases:[string,'income'|'expense',number,string][]=[
  ['yesterday 450 food','expense',450,'yesterday'],
  ['I spent 450 rupees on lunch yesterday using HDFC','expense',450,'yesterday'],
  ['Yesterday I bought shoes for 2k using my HDFC account','expense',2000,'Yesterday'],
  ['I received 20,000 rupees from a client for design','income',20000,'today'],
  ['My salary of 1.5 lakh was credited today','income',150000,'today'],
  ['Acme paid me 5000 for design on Friday','income',5000,'on Friday'],
 ];
 for(const [text,intent,amount,dateText] of cases) {
  const result=parseQuickAdd(text,[hdfc])[0];
  assert.equal(result.intent,intent,text);assert.equal(result.amount,amount,text);assert.equal(result.dateText,dateText,text);
 }
 const named=parseQuickAdd('I spent 450 rupees on lunch yesterday using HDFC',[hdfc])[0];assert.equal(named.accountHint,'HDFC');assert.equal(preferredAccount(named,[],[account,hdfc]),'hdfc');
 assert.equal(parseQuickAdd('20k freelance project',[], 'income')[0].intent,'income');
 assert.equal(parseQuickAdd('20k freelance project')[0].intent,'unsupported');
 assert.equal(parseQuickAdd('500 for food and drinks')[0].intent,'expense');
 assert.equal(parseQuickAdd('paid HDFC card 12000',[hdfc])[0].intent,'unsupported');
});

test('explicit account, currency and date are retained if omitted by AI, without mapping ambiguous clauses by order',()=>{
 const hdfc={...account,id:'hdfc',name:'HDFC'};
 const rows=enrichQuickAdd([{intent:'expense',amount:500,description:'Lunch',merchant:'Lunch',category:'Food',dateText:'today'},{intent:'income',amount:20000,description:'Freelance design',merchant:'Freelance design',category:'Freelance',dateText:'today'}],'I spent five hundred rupees on lunch yesterday using HDFC and received twenty thousand for freelance design today.',[hdfc]);
 assert.equal(rows[0].accountHint,'HDFC');assert.equal(rows[0].currency,'INR');assert.equal(rows[0].dateText,'yesterday');assert.equal(rows[1].accountHint,undefined);
 const ambiguous=enrichQuickAdd([rows[1]],'received design money using HDFC and received design money using Cash',[hdfc,account]);assert.equal(ambiguous[0].accountHint,undefined);
});
