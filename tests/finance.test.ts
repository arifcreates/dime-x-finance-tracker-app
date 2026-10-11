import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyTransactionChange, type FinanceState } from '../src/utils/finance';
import { moneySummary } from '../src/utils/money';
import type { Transaction } from '../src/types';
function state(): FinanceState { return {accounts:[{id:'a',name:'A',type:'cash',balance:100,currency:'INR'},{id:'b',name:'B',type:'cash',balance:0,currency:'INR'}],transactions:[],invoices:[],clients:[],emis:[],creditCards:[],recurringPayments:[]}; }
const transaction: Transaction={id:'t',date:'2026-10-11',description:'Work',amount:50,type:'income',category:'Work',account:'A',accountId:'a',currency:'INR',status:'completed'};
test('edit moves funds from original account; delete restores balances',()=>{const s=state();applyTransactionChange(s,'t',transaction);assert.equal(s.accounts[0].balance,150);applyTransactionChange(s,'t',{...transaction,accountId:'b',account:'B',amount:40});assert.equal(s.accounts[0].balance,100);assert.equal(s.accounts[1].balance,40);applyTransactionChange(s,'t');assert.equal(s.accounts[1].balance,0);});
test('repeated upsert is idempotent',()=>{const s=state();applyTransactionChange(s,'t',transaction);applyTransactionChange(s,'t',transaction);assert.equal(s.accounts[0].balance,150);assert.equal(s.transactions.length,1);});
test('pending entries do not affect spendable balance',()=>{const s=state();applyTransactionChange(s,'t',{...transaction,status:'pending'});assert.equal(s.accounts[0].balance,100);applyTransactionChange(s,'t',transaction);assert.equal(s.accounts[0].balance,150);});
test('linked payments are immutable',()=>{const s=state();applyTransactionChange(s,'t',{...transaction,invoiceId:'invoice'});assert.throws(()=>applyTransactionChange(s,'t'),/Linked/);});
test('invalid amounts are rejected',()=>{for(const amount of [0,-1,NaN,Infinity])assert.throws(()=>applyTransactionChange(state(),'t',{...transaction,amount}),/Amount/);});
test('mixed-currency totals stay separate',()=>{const result=moneySummary([{currency:'INR',amount:100},{currency:'USD',amount:100},{currency:'USD',amount:20}],item=>item.amount);assert.equal(result,'₹100 + $120');});
