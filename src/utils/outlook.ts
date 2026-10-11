import type { Account, CreditCard, EMI, Invoice, RecurringPayment, Transaction } from '../types';
import { localDate } from './quickAdd';

export interface PlanningSettings { currency: string; taxReserve: number; otherReserve: number; buffer: number; }
export interface OutlookEvent { id: string; name: string; date: string; originalDate: string; amount: number; direction: 'expense' | 'income'; kind: 'bill' | 'emi' | 'card' | 'invoice'; overdue: boolean; }
export interface OutlookInput { accounts:Account[];transactions:Transaction[];invoices:Invoice[];emis:EMI[];creditCards:CreditCard[];recurringPayments:RecurringPayment[]; }
const round = (n:number) => Math.round(n*100)/100;
const day = (date:string) => new Date(`${date}T12:00:00`);
const shift = (date:string,days:number) => {const next=day(date);next.setDate(next.getDate()+days);return localDate(next);};
const validDate = (date:string) => /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(day(date).getTime()) && localDate(day(date))===date;
function recurrence(anchor:string,index:number,frequency:'monthly'|'yearly') {
  const date=day(anchor);const month=date.getMonth()+index*(frequency==='yearly'?12:1);
  const last=new Date(date.getFullYear(),month+1,0).getDate();
  return localDate(new Date(date.getFullYear(),month,Math.min(date.getDate(),last),12));
}

// All input amounts must first be converted to one home currency. This is a
// deterministic cash forecast; expected receipts never enter Safe to Spend.
export function buildOutlook(input:OutlookInput,settings:PlanningSettings,today=localDate()) {
  const end=shift(today,30);const events:OutlookEvent[]=[];
  const add=(id:string,name:string,date:string,amount:number,direction:OutlookEvent['direction'],kind:OutlookEvent['kind'])=>{
    if (!validDate(date) || date>end || !Number.isFinite(amount) || amount<=0) return;
    events.push({id,name,originalDate:date,date:date<today?today:date,amount:round(amount),direction,kind,overdue:date<today});
  };
  for (const bill of input.recurringPayments.filter(b=>b.isActive)) {
    if (!validDate(bill.nextDate)) continue;
    let index=0;
    if (bill.nextDate<today) {
      add(`bill-${bill.id}-overdue`,bill.name,bill.nextDate,bill.amount,'expense','bill');
      while (recurrence(bill.nextDate,index,bill.frequency)<today && index<1500) index++;
    }
    for (let n=0;n<3;n++,index++) {
      const date=recurrence(bill.nextDate,index,bill.frequency);if(date>end)break;
      add(`bill-${bill.id}-${date}`,bill.name,date,bill.amount,'expense','bill');
    }
  }
  for (const emi of input.emis.filter(e=>e.remainingBalance>0)) {
    if (!validDate(emi.nextDueDate)) continue;
    let index=0;
    if (emi.nextDueDate<today) {
      add(`emi-${emi.id}-overdue`,emi.name,emi.nextDueDate,emi.monthlyAmount,'expense','emi');
      while(recurrence(emi.nextDueDate,index,'monthly')<today&&index<1500)index++;
    }
    for(let n=0;n<3;n++,index++) {
      const date=recurrence(emi.nextDueDate,index,'monthly');if(date>end)break;
      add(`emi-${emi.id}-${date}`,emi.name,date,emi.monthlyAmount,'expense','emi');
    }
  }
  for (const card of input.creditCards) add(`card-${card.id}`,`${card.name} · full balance`,card.dueDate,card.currentBalance,'expense','card');
  for (const invoice of input.invoices.filter(i=>i.status==='sent'||i.status==='overdue')) add(`invoice-${invoice.id}`,`Invoice ${invoice.invoiceNumber}`,invoice.dueDate,invoice.amount,'income','invoice');
  events.sort((a,b)=>a.date.localeCompare(b.date)||(a.direction==='expense'?-1:1)-(b.direction==='expense'?-1:1)||a.name.localeCompare(b.name));
  const cash=round(input.accounts.filter(a=>a.type!=='investment').reduce((sum,a)=>sum+a.balance,0));
  const reserves=round(settings.taxReserve+settings.otherReserve+settings.buffer);
  const obligations=round(events.filter(e=>e.direction==='expense').reduce((sum,e)=>sum+e.amount,0));
  const expected=round(events.filter(e=>e.direction==='income').reduce((sum,e)=>sum+e.amount,0));
  const safe=round(cash-reserves-obligations);
  const points:{date:string;cashOnly:number;withExpected:number}[]=[];
  let cashOnly=cash-reserves,withExpected=cash-reserves,firstShortfall:string|null=null;
  for(let n=0;n<=30;n++) {
    const date=shift(today,n);
    for(const event of events.filter(e=>e.date===date)) {
      if(event.direction==='expense') {cashOnly-=event.amount;withExpected-=event.amount;}
      else withExpected+=event.amount;
    }
    if(cashOnly<0&&!firstShortfall)firstShortfall=date;
    points.push({date,cashOnly:round(cashOnly),withExpected:round(withExpected)});
  }
  const month=today.slice(0,7);
  const completed=input.transactions.filter(t=>t.status==='completed'&&!t.transferId&&t.category!=='Transfer'&&t.date<=today);
  const current=completed.filter(t=>t.date.slice(0,7)===month);
  const spent=round(current.filter(t=>t.type==='expense').reduce((sum,t)=>sum+t.amount,0));
  const earned=round(current.filter(t=>t.type==='income').reduce((sum,t)=>sum+t.amount,0));
  const categories=current.filter(t=>t.type==='expense').reduce<Record<string,number>>((totals,t)=>{totals[t.category]=(totals[t.category]||0)+t.amount;return totals;},{});
  const sorted=Object.entries(categories).sort((a,b)=>b[1]-a[1]);
  const slices=sorted.slice(0,5).map(([name,amount])=>({name,amount:round(amount),categories:[name]}));
  if(sorted.length>5)slices.push({name:'Other categories',amount:round(sorted.slice(5).reduce((sum,[,amount])=>sum+amount,0)),categories:sorted.slice(5).map(([name])=>name)});
  let sentence=safe<0?'Your scheduled commitments exceed the cash available.':cash>0&&safe<cash*.1?'Your spending room is tight for the next 30 days.':'Your recorded cash covers the next 30 days of scheduled commitments.';
  const previousMonths=Array.from({length:3},(_,index)=>{const date=day(today);date.setDate(1);date.setMonth(date.getMonth()-index-1);return localDate(date).slice(0,7);});
  if(sorted.length) {
    const changes=sorted.map(([name,amount])=>{
      const previous=completed.filter(t=>t.type==='expense'&&t.category===name&&previousMonths.includes(t.date.slice(0,7))).reduce((sum,t)=>sum+t.amount,0)/3;
      return {name,amount,previous,difference:amount-previous};
    }).filter(c=>c.previous>0&&c.amount>c.previous*1.2).sort((a,b)=>b.difference-a.difference);
    if(changes[0])sentence+=` ${changes[0].name} spending is ${Math.round((changes[0].amount/changes[0].previous-1)*100)}% above your previous three-month monthly average.`;
  }
  return {today,end,cash,reserves,taxReserve:settings.taxReserve,otherReserve:settings.otherReserve,buffer:settings.buffer,obligations,expected,safe,events,points,firstShortfall,spent,earned,slices,sentence};
}
