import { useCallback, useEffect, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, AlertTriangle, ChevronDown, Settings2 } from 'lucide-react';
import type { AppUser, Transaction } from '../types';
import { dataService } from '../services/dataService';
import { normalizeOutlook } from '../services/outlookService';
import { buildOutlook, type OutlookInput, type PlanningSettings } from '../utils/outlook';
import { localDate } from '../utils/quickAdd';
import { useCurrency } from '../contexts/CurrencyContext';
import { useCurrencyFormat } from '../hooks/useCurrencyFormat';
import { QuickAdd } from '../components/QuickAdd/QuickAdd';
import { SpendingDonut } from '../components/Dashboard/SpendingDonut';
import { OutlookChart } from '../components/Dashboard/OutlookChart';
import { RecentTransactions } from '../components/Dashboard/RecentTransactions';
import { TransactionForm } from '../components/Forms/TransactionForm';
import { InvoiceForm } from '../components/Forms/InvoiceForm';
import { TransactionsModal } from '../components/Dashboard/TransactionsModal';
interface DashboardProps {
  transactions:Transaction[];onQuickAction?:(action:string)=>void;
  quickActionRequest?:{action:string;id:number}|null;onQuickActionHandled?:()=>void;
  onUpdate?:()=>void;onCreateAccount?:()=>void;user?:AppUser;
}
const empty:OutlookInput={accounts:[],transactions:[],invoices:[],emis:[],creditCards:[],recurringPayments:[]};
const panel='rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-gray-900';
const dateLabel=(date:string)=>new Date(`${date}T12:00:00`).toLocaleDateString('en-IN',{day:'numeric',month:'short'});
export function Dashboard({transactions:initialTransactions,quickActionRequest,onQuickActionHandled,onUpdate,onCreateAccount,user}:DashboardProps) {
  const {currency}=useCurrency();const fmt=useCurrencyFormat();
  const [data,setData]=useState<OutlookInput>(empty);
  const [outlook,setOutlook]=useState<ReturnType<typeof buildOutlook>|null>(null);
  const [settings,setSettings]=useState<PlanningSettings>({currency,taxReserve:0,otherReserve:0,buffer:0});
  const [editingReserves,setEditingReserves]=useState(false);const [saving,setSaving]=useState(false);
  const [error,setError]=useState('');const [loading,setLoading]=useState(true);
  const [showTransactionForm,setShowTransactionForm]=useState(false);const [transactionType,setTransactionType]=useState<'income'|'expense'>('expense');
  const [showInvoiceForm,setShowInvoiceForm]=useState(false);const [showTransactions,setShowTransactions]=useState(false);const [selectedCategories,setSelectedCategories]=useState<string[]>([]);
  const load=useCallback(async()=>{
    setLoading(true);setError('');
    try {
      const [accounts,transactions,invoices,emis,creditCards,recurringPayments,reserves]=await Promise.all([dataService.getAccounts(),dataService.getTransactions(),dataService.getInvoices(),dataService.getEMIs(),dataService.getCreditCards(),dataService.getRecurringPayments(),dataService.getPlanningSettings(currency)]);
      const records={accounts,transactions,invoices,emis,creditCards,recurringPayments};
      const normalized=await normalizeOutlook(records,reserves,currency);
      setData(records);setSettings(normalized.settings);setOutlook(buildOutlook(normalized.input,normalized.settings));
    } catch(err) {setOutlook(null);setError(err instanceof Error?err.message:'Could not load your outlook.');}
    finally {setLoading(false);}
  },[currency]);
  useEffect(()=>{void load();},[load,initialTransactions]);
  useEffect(()=>{
    if(!quickActionRequest)return;
    const action=quickActionRequest.action;
    if(action==='quick-add'){document.getElementById('quick-add')?.scrollIntoView({behavior:'smooth'});document.getElementById('quick-add-text')?.focus({preventScroll:true});}
    else if(action==='create-invoice')setShowInvoiceForm(true);
    else {setTransactionType(action==='add-expense'?'expense':'income');setShowTransactionForm(true);}
    onQuickActionHandled?.();
  },[quickActionRequest,onQuickActionHandled]);
  const refresh=()=>{void load();onUpdate?.();};
  const saveReserves=async()=>{
    setSaving(true);setError('');
    try {await dataService.savePlanningSettings({...settings,currency});setEditingReserves(false);await load();}
    catch(err){setError(err instanceof Error?err.message:'Reserves were not saved.');}
    finally{setSaving(false);}
  };
  const hasData=data.accounts.length+data.transactions.length+data.recurringPayments.length+data.invoices.length+data.emis.length+data.creditCards.length>0;
  const visibleTransactions=selectedCategories.length?data.transactions.filter(t=>t.type==='expense'&&t.date.slice(0,7)===localDate().slice(0,7)&&selectedCategories.includes(t.category)):data.transactions;
  return <div className="min-h-screen bg-gray-50 p-4 pb-28 sm:p-6 dark:bg-gray-950"><div className="mx-auto max-w-7xl space-y-5">
    <header className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-widest text-gray-500">Your money, looking ahead</p><h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">Overview{user?.name?`, ${user.name.split(' ')[0]}`:''}</h1></div><button onClick={()=>setShowInvoiceForm(true)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:text-gray-300">Create invoice</button></header>
    {error&&<div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error} <button onClick={()=>void load()} className="ml-2 underline">Reload</button></div>}
    {loading&&<p role="status" className="text-sm text-gray-500">Updating your outlook…</p>}
    {outlook&&hasData&&!loading&&<section className="overflow-hidden rounded-3xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="p-6 sm:p-8"><div className="flex flex-wrap justify-between gap-3"><p className="text-sm font-medium text-gray-500">Safe to Spend <span className="ml-2 rounded-full bg-gray-100 px-2 py-1 text-xs dark:bg-gray-800">Next 30 days</span></p><button onClick={()=>setEditingReserves(!editingReserves)} className="flex items-center gap-1 text-xs text-gray-500"><Settings2 className="h-4 w-4" />Reserves</button></div>
        <p className={`mt-4 text-4xl font-bold tracking-tight sm:text-5xl ${outlook.safe<0?'text-rose-600':'text-gray-900 dark:text-white'}`}>{fmt(outlook.safe)}</p>
        <p className="mt-3 max-w-3xl text-sm text-gray-600 dark:text-gray-300">{outlook.sentence}</p>
        <p className="mt-2 text-xs text-gray-500">Through {dateLabel(outlook.end)} · estimate from recorded balances and schedules. Expected invoices are excluded.</p>
        <details className="mt-5 rounded-xl bg-gray-50 p-4 dark:bg-gray-800"><summary className="flex cursor-pointer items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300">How this is calculated<ChevronDown className="h-4 w-4" /></summary><dl className="mt-4 space-y-2 text-sm">{[['Cash and bank accounts',outlook.cash],['Bills, EMIs and full card balances due',-outlook.obligations],['Tax reserve',-outlook.taxReserve],['Savings and other reserves',-outlook.otherReserve],['Safety buffer',-outlook.buffer]].map(([label,amount])=><div key={String(label)} className="flex justify-between gap-4 text-gray-600 dark:text-gray-300"><dt>{label}</dt><dd className="font-medium">{fmt(Number(amount))}</dd></div>)}<div className="flex justify-between border-t border-gray-200 pt-2 font-bold dark:border-gray-700"><dt>Safe to Spend</dt><dd>{fmt(outlook.safe)}</dd></div></dl><p className="mt-3 text-xs text-gray-500">Investment accounts are excluded. Only scheduled commitments are forecast; future day-to-day purchases are not. Keep balances and due dates current.</p></details>
        {!outlook.reserves&&<p className="mt-3 text-xs text-amber-700 dark:text-amber-400">No tax, savings or buffer reserves have been set. <button onClick={()=>setEditingReserves(true)} className="underline">Set money aside</button></p>}
        {editingReserves&&<form onSubmit={e=>{e.preventDefault();void saveReserves();}} className="mt-4 space-y-3 rounded-xl border border-gray-200 p-4 dark:border-gray-700"><p className="text-sm text-gray-600 dark:text-gray-300">Reserve money already held in your cash/bank accounts ({currency}). This changes the estimate, not your account balances. Enter your tax reserve; Dime-X does not estimate your tax liability.</p><div className="grid gap-3 sm:grid-cols-3">{([['taxReserve','Tax reserve'],['otherReserve','Savings / other reserves'],['buffer','Safety buffer']] as const).map(([key,label])=><label key={key} className="text-xs text-gray-500">{label}<input required type="number" min="0" max="100000000" step="0.01" value={settings[key]} onChange={e=>setSettings(current=>({...current,[key]:Number(e.target.value)}))} className="mt-1 w-full rounded-lg border border-gray-300 bg-transparent p-2 text-sm text-gray-900 dark:border-gray-600 dark:text-white" /></label>)}</div><button disabled={saving} className="rounded-lg bg-black px-3 py-2 text-sm text-white disabled:opacity-40 dark:bg-white dark:text-black">{saving?'Saving…':'Save reserves'}</button></form>}
      </div>
    </section>}
    <QuickAdd accounts={data.accounts} transactions={data.transactions} onSaved={refresh} onCreateAccount={onCreateAccount} />
    {outlook&&hasData&&!loading&&<>
      <div className="grid gap-5 lg:grid-cols-2"><SpendingDonut slices={outlook.slices} spent={outlook.spent} earned={outlook.earned} onSelect={categories=>{setSelectedCategories(categories);setShowTransactions(true);}} />
        <section className={panel}><h2 className="font-semibold text-gray-900 dark:text-white">Coming up <span className="ml-2 text-xs font-normal text-gray-500">30 days</span></h2><p className="mt-1 text-xs text-gray-500">Scheduled commitments and expected invoice payments</p>
          {outlook.firstShortfall&&<p className="mt-4 flex items-start gap-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />Cash falls below your reserves on {dateLabel(outlook.firstShortfall)}, without relying on unpaid invoices.</p>}
          <div className="mt-4 max-h-80 space-y-1 overflow-y-auto">{outlook.events.length?outlook.events.map(event=><div key={event.id} className="flex items-center gap-3 rounded-lg py-3"><span className={`rounded-full p-2 ${event.direction==='income'?'bg-emerald-50 text-emerald-600 dark:bg-emerald-950':'bg-gray-100 text-gray-500 dark:bg-gray-800'}`}>{event.direction==='income'?<ArrowUpRight className="h-4 w-4" />:<ArrowDownLeft className="h-4 w-4" />}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">{event.name}</p><p className="text-xs text-gray-500">{dateLabel(event.originalDate)} · {event.overdue?'Overdue · ':''}{event.direction==='income'?'Expected, not received':'Scheduled, confirm when paid'}</p></div><p className={`text-sm font-semibold ${event.direction==='income'?'text-emerald-600':'text-gray-900 dark:text-white'}`}>{event.direction==='income'?'+':'−'}{fmt(event.amount)}</p></div>):<p className="py-8 text-sm text-gray-500">No upcoming commitments are recorded. Add your bills and due dates to make this outlook useful.</p>}</div>
          {outlook.expected>0&&<p className="mt-4 border-t border-gray-100 pt-3 text-xs text-gray-500 dark:border-gray-800">{fmt(outlook.expected)} expected from invoices. It becomes available only after you record payment.</p>}
        </section></div>
      <section className={panel}><h2 className="font-semibold text-gray-900 dark:text-white">Your 30-day outlook</h2><p className="mb-4 mt-1 text-xs text-gray-500">After your reserves and scheduled payments. The dashed line assumes unpaid invoices arrive on their due dates; it is a scenario, not available cash.</p><OutlookChart points={outlook.points} /></section>
      <section className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"><RecentTransactions transactions={[...data.transactions].sort((a,b)=>b.date.localeCompare(a.date))} onUpdate={refresh} onViewAll={()=>{setSelectedCategories([]);setShowTransactions(true);}} /></section>
    </>}
    <TransactionForm isOpen={showTransactionForm} onClose={()=>setShowTransactionForm(false)} onSave={refresh} type={transactionType} onCreateAccount={onCreateAccount} />
    <InvoiceForm isOpen={showInvoiceForm} onClose={()=>setShowInvoiceForm(false)} onSave={refresh} />
    <TransactionsModal isOpen={showTransactions} onClose={()=>setShowTransactions(false)} transactions={visibleTransactions} onUpdate={refresh} />
  </div></div>;
}
