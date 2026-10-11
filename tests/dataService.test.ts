import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DataService } from '../src/services/dataService';
import { supabaseService } from '../src/services/supabaseService';
import type { Account, Transaction } from '../src/types';

const storage = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {getItem:(key:string)=>storage.get(key) ?? null,setItem:(key:string,value:string)=>storage.set(key,value),removeItem:(key:string)=>storage.delete(key)} });
Object.defineProperty(globalThis, 'navigator', { configurable: true, value: {onLine:true} });
const account: Account = {id:'a',name:'Cash',type:'cash',balance:100,currency:'INR'};
const transaction: Transaction = {id:'t',date:'2026-10-11',description:'Work',amount:50,type:'income',category:'Work',account:'Cash',accountId:'a',currency:'INR',status:'completed'};

test('guest persistence is atomic and protects account history currency', async()=>{
 storage.clear(); const service=new DataService();
 await service.saveAccount(account); await service.saveTransaction(transaction); await service.saveTransaction(transaction);
 assert.equal((await service.getAccounts())[0].balance,150);
 await assert.rejects(()=>service.saveAccount({...account,currency:'USD'}),/original currency/);
 assert.equal((await service.getAccounts())[0].currency,'INR');
 const restored=new DataService(); assert.equal((await restored.getTransactions()).length,1);
 await restored.deleteTransaction('t'); assert.equal((await restored.getAccounts())[0].balance,100);
});

test('failed cloud saves never become successful local records',async()=>{
 const service=new DataService(); service.setCurrentUserId('user-one');
 const original=supabaseService.saveAccount;
 supabaseService.saveAccount=async()=>{throw new Error('Backend write rejected');};
 try {
  await assert.rejects(()=>service.saveAccount(account),/Backend write rejected/);
  assert.equal(service.getCachedAccounts().length,0);
  assert.equal(storage.has('dimex:user-one:workspace'),false);
 } finally {supabaseService.saveAccount=original;}
});

test('late reads from an old identity cannot populate the new identity cache',async()=>{
 const service=new DataService(); service.setCurrentUserId('user-one');
 const original=supabaseService.getAccounts; let resolveRead:(items:Account[])=>void=()=>{};
 supabaseService.getAccounts=()=>new Promise(resolve=>{resolveRead=resolve;});
 try {
  const read=service.getAccounts(); service.setCurrentUserId('user-two'); resolveRead([account]);
  assert.deepEqual(await read,[]); assert.deepEqual(service.getCachedAccounts(),[]);
 } finally {supabaseService.getAccounts=original;}
});
