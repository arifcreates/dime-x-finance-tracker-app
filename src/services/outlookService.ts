import { currencyService } from './currencyService';
import type { OutlookInput, PlanningSettings } from '../utils/outlook';
export async function normalizeOutlook(input:OutlookInput,settings:PlanningSettings,currency:string) {
  const convert=(amount:number,from:string|undefined)=>currencyService.convertCurrency(amount,from||'USD',currency);
  const [accounts,transactions,invoices,emis,creditCards,recurringPayments,reserveValues]=await Promise.all([
    Promise.all(input.accounts.map(async a=>({...a,balance:await convert(a.balance,a.currency),currency}))),
    Promise.all(input.transactions.map(async t=>({...t,amount:await convert(t.amount,t.currency||input.accounts.find(a=>a.id===t.accountId)?.currency),currency}))),
    Promise.all(input.invoices.map(async i=>({...i,amount:await convert(i.amount,i.currency),currency}))),
    Promise.all(input.emis.map(async e=>({...e,monthlyAmount:await convert(e.monthlyAmount,e.currency),currency}))),
    Promise.all(input.creditCards.map(async c=>({...c,currentBalance:await convert(c.currentBalance,c.currency),currency}))),
    Promise.all(input.recurringPayments.map(async r=>({...r,amount:await convert(r.amount,r.currency),currency}))),
    Promise.all([settings.taxReserve,settings.otherReserve,settings.buffer].map(n=>convert(n,settings.currency))),
  ]);
  return {input:{accounts,transactions,invoices,emis,creditCards,recurringPayments},settings:{currency,taxReserve:reserveValues[0],otherReserve:reserveValues[1],buffer:reserveValues[2]}};
}
