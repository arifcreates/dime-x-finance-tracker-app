import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildOutlook, type OutlookInput } from '../src/utils/outlook';
const empty=():OutlookInput=>({accounts:[{id:'a',name:'Cash',type:'cash',currency:'INR',balance:10000},{id:'invest',name:'Stocks',type:'investment',currency:'INR',balance:100000}],transactions:[],invoices:[],emis:[],creditCards:[],recurringPayments:[]});
const settings={currency:'INR',taxReserve:1000,otherReserve:2000,buffer:500};
const bill={id:'b',name:'Rent',amount:2000,currency:'INR',frequency:'monthly' as const,nextDate:'2026-10-14',category:'Rent',isActive:true};
const invoice={id:'i',invoiceNumber:'TEST',clientId:null,date:'2026-10-11',dueDate:'2026-10-20',amount:50000,currency:'INR',status:'sent' as const,items:[]};

test('Safe to Spend excludes investments and unpaid invoices, subtracts obligations and reserves once',()=>{
 const data=empty();data.recurringPayments=[bill];data.invoices=[invoice];
 const result=buildOutlook(data,settings,'2026-10-11');
 assert.equal(result.cash,10000);assert.equal(result.reserves,3500);assert.equal(result.obligations,2000);assert.equal(result.safe,4500);assert.equal(result.expected,50000);
 assert.equal(result.points.at(-1)?.cashOnly,4500);assert.equal(result.points.at(-1)?.withExpected,54500);
});

test('overdue commitments affect today, full card balance is reserved and first shortfall is dated',()=>{
 const data=empty();data.accounts[0].balance=1000;data.recurringPayments=[{...bill,nextDate:'2026-10-01'}];
 data.creditCards=[{id:'card',name:'HDFC',creditLimit:100000,currentBalance:5000,minimumDue:500,dueDate:'2026-10-25',interestRate:30,currency:'INR'}];
 const result=buildOutlook(data,{...settings,taxReserve:0,otherReserve:0,buffer:0},'2026-10-11');
 assert.equal(result.firstShortfall,'2026-10-11');assert.equal(result.events[0].overdue,true);assert.equal(result.events.find(e=>e.kind==='card')?.amount,5000);
 assert.equal(result.obligations,9000); // overdue October + November rent + full card
});

test('monthly recurrence keeps anchor day through short months and excludes inactive/distant schedules',()=>{
 const data=empty();data.recurringPayments=[{...bill,nextDate:'2026-01-31'},{...bill,id:'off',isActive:false},{...bill,id:'far',nextDate:'2026-12-01'}];
 const result=buildOutlook(data,{...settings,taxReserve:0,otherReserve:0,buffer:0},'2026-02-01');
 assert.deepEqual(result.events.map(e=>e.originalDate),['2026-01-31','2026-02-28']);
 assert.equal(result.events.length,2);
});

test('expense donut shows five categories plus Other and excludes transfers/pending/future entries',()=>{
 const data=empty();data.transactions=Array.from({length:7},(_,i)=>({id:String(i),date:'2026-10-10',description:'Expense',type:'expense',amount:(i+1)*100,category:`Category ${i}`,account:'Cash',status:'completed'}));
 data.transactions.push({...data.transactions[0],id:'transfer',category:'Transfer',transferId:'transfer',amount:100000},{...data.transactions[0],id:'pending',status:'pending',amount:100000},{...data.transactions[0],id:'future',date:'2026-10-20',amount:100000});
 const result=buildOutlook(data,settings,'2026-10-11');assert.equal(result.spent,2800);assert.equal(result.slices.length,6);assert.equal(result.slices.at(-1)?.amount,300);assert.equal(result.slices.reduce((sum,s)=>sum+s.amount,0),2800);
});

test('paid/draft invoices and cleared debts are not forecast and empty schedules stay explicit',()=>{
 const data=empty();data.invoices=[{...invoice,status:'paid'},{...invoice,id:'draft',status:'draft'}];data.emis=[{id:'emi',name:'Cleared',currency:'INR',principal:1000,interestRate:0,tenure:1,monthlyAmount:1000,remainingBalance:0,nextDueDate:'2026-10-15'}];
 const result=buildOutlook(data,settings,'2026-10-11');assert.equal(result.events.length,0);assert.equal(result.expected,0);assert.equal(result.points.length,31);assert.equal(result.firstShortfall,null);
});

test('monthly EMIs include both due dates when a short-month horizon spans two instalments',()=>{
 const data=empty();data.emis=[{id:'emi',name:'Car',currency:'INR',principal:50000,interestRate:10,tenure:12,monthlyAmount:3000,remainingBalance:30000,nextDueDate:'2026-10-31'}];
 const result=buildOutlook(data,settings,'2026-10-31');assert.deepEqual(result.events.map(e=>e.date),['2026-10-31','2026-11-30']);assert.equal(result.obligations,6000);
});

test('outlook converts account, invoice, obligation and reserve amounts to the same home currency',async()=>{
 const {normalizeOutlook}=await import('../src/services/outlookService');
 const {currencyService}=await import('../src/services/currencyService');
 const original=currencyService.convertCurrency;
 currencyService.convertCurrency=async(amount,from,to)=>amount*(from===to?1:100);
 try {
  const data=empty();data.accounts=[{...data.accounts[0],currency:'USD',balance:100}];data.recurringPayments=[{...bill,currency:'USD',amount:20}];data.invoices=[{...invoice,currency:'USD',amount:500}];
  const normalized=await normalizeOutlook(data,{currency:'USD',taxReserve:10,otherReserve:0,buffer:0},'INR');
  const result=buildOutlook(normalized.input,normalized.settings,'2026-10-11');assert.equal(result.cash,10000);assert.equal(result.taxReserve,1000);assert.equal(result.obligations,2000);assert.equal(result.expected,50000);assert.equal(result.safe,7000);
 }finally{currencyService.convertCurrency=original;}
});
