import { useRef, useState } from 'react';
import { Sparkles, Trash2 } from 'lucide-react';
import { dataService } from '../../services/dataService';
import { callBackend } from '../../services/backendService';
import { useAIStatus } from '../../hooks/useAIStatus';
import { useAIWaitMessage } from '../../hooks/useAIWaitMessage';
import { localDate, enrichQuickAdd, matchCategory, parseQuickAdd, preferredAccount, resolveQuickDate, type QuickAddEntry } from '../../utils/quickAdd';
import type { Account, Category, CategoryRule, Transaction } from '../../types';

interface ReviewRow extends QuickAddEntry {
  id: string;
  accountId: string;
  date: string;
  remember: boolean;
  originalCategory: string;
  source: 'manual' | 'ai';
}
const inputClass = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white';

export function QuickAdd({accounts,transactions,onSaved,onCreateAccount,defaultIntent}:{accounts:Account[];transactions:Transaction[];onSaved:()=>void;onCreateAccount?:()=>void;defaultIntent?:'income'|'expense'}) {
  const [text,setText] = useState('');
  const [rows,setRows] = useState<ReviewRow[]>([]);
  const [categories,setCategories] = useState<Category[]>([]);
  const [rules,setRules] = useState<CategoryRule[]>([]);
  const [error,setError] = useState('');
  const [notice,setNotice] = useState('');
  const [busy,setBusy] = useState(false);
  const [saving,setSaving] = useState(false);
  const saveLock = useRef(false);
  const [consent,setConsent] = useState(false);
  const [testDataConfirmed,setTestDataConfirmed] = useState(false);
  const [showAI,setShowAI] = useState(false);
  const {status,checking,statusError,refresh} = useAIStatus();
  const waitMessage = useAIWaitMessage(busy);

  const prepare = async (entries:QuickAddEntry[], useAI: boolean, cats:Category[], merchantRules:CategoryRule[]) => {
    setCategories(cats);setRules(merchantRules);
    setRows(enrichQuickAdd(entries,text,accounts).map(entry=>{
      const category = matchCategory(entry.merchant,cats,merchantRules)?.name || entry.category;
      const resolved = {...entry,category};
      return {...resolved,id:crypto.randomUUID(),accountId:preferredAccount(resolved,transactions,accounts),date:entry.intent==='unsupported'||!entry.dateText?'':resolveQuickDate(entry.dateText),remember:false,originalCategory:category,source:useAI?'ai':'manual'};
    }));
  };
  const review = async (useAI = false) => {
    if (busy || saving) return;
    setBusy(true);setError('');setNotice('');
    const identity=dataService.getWorkspaceId();
    try {
      const [cats,merchantRules]=await Promise.all([dataService.getCategories(),dataService.getCategoryRules()]);
      if(identity!==dataService.getWorkspaceId()) throw new Error('Your account changed. Please enter the text again.');
      let entries = parseQuickAdd(text,accounts,defaultIntent).map(entry=>({...entry,category:matchCategory(entry.merchant,cats,merchantRules)?.name||entry.category}));
      const needsAI = entries.some(entry=>entry.intent==='unsupported');
      const allowedAI = !!status?.ready && consent && (!status.prototype || testDataConfirmed);
      const usedAI = useAI || (allowedAI && (needsAI || entries.some(entry=>entry.category==='Other'||entry.category==='Other income')));
      if (usedAI) entries = (await callBackend<{entries:QuickAddEntry[]}>('ai-assist',{task:'quick-add',description:text,consent,testDataConfirmed,defaultIntent})).entries;
      if(identity!==dataService.getWorkspaceId()) throw new Error('Your account changed. Please enter the text again.');
      if (needsAI && !allowedAI && !useAI) setShowAI(true);
      await prepare(entries,usedAI,cats,merchantRules);
      setNotice(usedAI ? 'AI interpreted your wording. Review the entries, then save to update your balances.' : needsAI ? 'Some wording needs interpretation. Enable AI below or correct the marked rows. Nothing has been saved.' : 'Understood on your device. Review the entries, then save to update your balances.');
    } catch (err) {setError(err instanceof Error?err.message:'Could not prepare entries.');}
    finally {setBusy(false);}
  };
  const edit = (id:string,update:Partial<ReviewRow>) => setRows(current=>current.map(row=>row.id===id?{...row,...update}:row));
  const valid = rows.length > 0 && rows.every(row=>{
    const account = accounts.find(a=>a.id===row.accountId);
    return row.intent !== 'unsupported' && Number.isFinite(row.amount) && Number(row.amount)>0 && Number(row.amount)<=100000000 && !!row.description.trim() && !!row.category.trim() && row.category.trim().toLowerCase() !== 'transfer' && !!row.date && resolveQuickDate(row.date)===row.date && row.date<=localDate() && !!account && (!row.currency || account.currency===row.currency);
  });
  const save = async () => {
    if (!valid || saveLock.current) return;
    saveLock.current=true;setSaving(true);setError('');setNotice('');
    const identity=dataService.getWorkspaceId();
    try {
      const items:Transaction[] = rows.map(row=>{
        const account = accounts.find(a=>a.id===row.accountId)!;
        return {id:row.id,date:row.date,description:row.description.trim(),amount:Math.round(Number(row.amount)*100)/100,type:row.intent as Transaction['type'],category:row.category.trim(),categoryId:categories.find(c=>c.name.toLowerCase()===row.category.trim().toLowerCase())?.id,accountId:account.id,account:account.name,currency:account.currency,status:'completed',source:row.source};
      });
      await dataService.saveTransactions(items);
      if(identity!==dataService.getWorkspaceId()) return;
      // Ledger saving is authoritative; a failed optional rule must not invite
      // saving the same money again. IDs stay stable for transport retries.
      let failedRule = false;
      for (const row of rows.filter(r=>r.remember && r.merchant.trim().length>=2)) {
        if(identity!==dataService.getWorkspaceId()) return;
        try {await dataService.learnCategoryRule(row.merchant,row.category,row.intent as Transaction['type']);}
        catch {failedRule=true;}
      }
      setRows([]);setText('');onSaved();
      setNotice(`${items.length} ${items.length===1?'entry':'entries'} saved.${failedRule?' Your entries are safe, but a category rule could not be remembered.':''}`);
    } catch (err) {setError(err instanceof Error?err.message:'Could not save. Your review is still here; retry when connected.');}
    finally {saveLock.current=false;setSaving(false);}
  };
  return <section id="quick-add" aria-labelledby="quick-add-title" className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 dark:border-gray-800 dark:bg-gray-900">
    <h2 id="quick-add-title" className="font-bold text-gray-900 dark:text-white">{defaultIntent==='income'?'Tell Dime-X what came in':defaultIntent==='expense'?'Tell Dime-X what you spent':'Tell Dime-X what happened'}</h2>
    <p className="mt-1 text-sm text-gray-500">Use your own words. Include the amount and what it was for; name an account if you want to use it.</p>
    <label htmlFor="quick-add-text" className="sr-only">What did you spend today?</label>
    <textarea id="quick-add-text" maxLength={3000} rows={2} value={text} disabled={busy||saving} onChange={e=>{setText(e.target.value);setRows([]);setNotice('');}} placeholder={defaultIntent==='income'?'I received 20,000 rupees for a design project yesterday…':'I spent 450 rupees on lunch yesterday using my account…'} className={`${inputClass} mt-3`} />
    <div className="mt-3 flex flex-wrap gap-3">
      <button disabled={busy||saving||!text.trim()||!accounts.length} onClick={()=>void review()} className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-40 dark:bg-white dark:text-black">{busy?'Preparing…':'Review entries'}</button>
      <button disabled={busy||saving} onClick={()=>setShowAI(!showAI)} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300"><Sparkles className="h-4 w-4" />AI help</button>
    </div>
    {!accounts.length && <p className="mt-3 text-sm text-gray-500">Add an account first so each entry updates the right balance. {onCreateAccount && <button onClick={onCreateAccount} className="underline">Add account</button>}</p>}
    {showAI && <div className="mt-4 space-y-2 rounded-lg bg-gray-50 p-3 text-sm dark:bg-gray-800">
      <p>{checking?'Checking availability…':status?.message || statusError}</p>
      <label className="flex gap-2"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} />Use AI automatically when my wording needs help. Only the text I enter is shared with the provider; avoid personal, bank and confidential details.</label>
      {status?.prototype && <label className="flex gap-2"><input type="checkbox" checked={testDataConfirmed} onChange={e=>setTestDataConfirmed(e.target.checked)} />This text is a fictional test, without real personal or financial information.</label>}
      {!checking && !status?.ready && <button onClick={()=>void refresh()} className="underline">Check connection again</button>}
      <button disabled={busy||saving||checking||!status?.ready||!consent||(status?.prototype&&!testDataConfirmed)||text.trim().length<3||!accounts.length} onClick={()=>void review(true)} className="rounded-lg border border-gray-300 px-3 py-2 disabled:opacity-40 dark:border-gray-600">Reinterpret with AI</button>
    </div>}
    {waitMessage && <p role="status" className="mt-3 text-sm text-gray-500">{waitMessage}</p>}
    {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
    {notice && <p role="status" className="mt-3 text-sm text-gray-600 dark:text-gray-300">{notice}</p>}
    {rows.length>0 && <div className="mt-4 space-y-3">
      <p className="text-sm font-semibold">Review before saving</p>
      <p className="text-xs text-gray-500">Transfers, invoice payments, card payments, EMIs and goals use their dedicated flows. Remove those rows here. No entries have been saved yet.</p>
      {rows.map((row,index)=><fieldset key={row.id} disabled={saving||busy} className="space-y-3 rounded-xl border border-gray-200 p-3 dark:border-gray-700">
        <legend className="px-1 text-sm font-medium">Entry {index+1}</legend>
        {row.intent==='unsupported' && <p className="text-sm text-amber-600">Not sure what this is: {row.description}. Choose income or expense only for an ordinary transaction, or remove it.</p>}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-xs">Type<select aria-label={`Entry ${index+1} type`} className={inputClass} value={row.intent} onChange={e=>edit(row.id,{intent:e.target.value as ReviewRow['intent']})}><option value="unsupported">Needs review</option><option value="expense">Expense</option><option value="income">Income</option></select></label>
          <label className="text-xs">Amount<input aria-label={`Entry ${index+1} amount`} className={inputClass} type="number" min="0.01" max="100000000" step="0.01" value={row.amount??''} onChange={e=>edit(row.id,{amount:e.target.value===''?null:Number(e.target.value)})} /></label>
          <label className="text-xs">Account<select aria-label={`Entry ${index+1} account`} className={inputClass} value={row.accountId} onChange={e=>edit(row.id,{accountId:e.target.value})}><option value="">Choose account</option>{accounts.map(a=><option key={a.id} value={a.id} disabled={!!row.currency && a.currency!==row.currency}>{a.name} · {a.currency}</option>)}</select>{row.currency && <span className="text-gray-500">Text specifies {row.currency}</span>}</label>
          <label className="text-xs">Description<input aria-label={`Entry ${index+1} description`} maxLength={500} className={inputClass} value={row.description} onChange={e=>edit(row.id,{description:e.target.value})} /></label>
          <label className="text-xs">Category<input aria-label={`Entry ${index+1} category`} maxLength={100} list="quick-add-categories" className={inputClass} value={row.category} onChange={e=>edit(row.id,{category:e.target.value,remember:!!row.merchant && e.target.value!==row.originalCategory})} /></label>
          <label className="text-xs">Date<input aria-label={`Entry ${index+1} date`} className={inputClass} type="date" max={localDate()} value={row.date} onChange={e=>edit(row.id,{date:e.target.value})} />{!row.date && <span className="text-amber-600">Choose a date{row.dateText?` for “${row.dateText}”`:''}.</span>}</label>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          {row.merchant.length>=2 && <label className="flex gap-2 text-xs"><input type="checkbox" checked={row.remember} onChange={e=>edit(row.id,{remember:e.target.checked})} />Remember category for “{row.merchant}”{rules.some(r=>r.matchText===row.merchant.toLowerCase())?' (replace existing rule)':''}</label>}
          <button aria-label={`Remove entry ${index+1}`} onClick={()=>setRows(current=>current.filter(r=>r.id!==row.id))} className="flex items-center gap-1 text-xs text-red-600"><Trash2 className="h-4 w-4" />Remove</button>
        </div>
      </fieldset>)}
      <datalist id="quick-add-categories">{categories.map(c=><option key={c.id} value={c.name} />)}</datalist>
      <button disabled={!valid||busy||saving} onClick={()=>void save()} className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-40 dark:bg-white dark:text-black">{saving?'Saving…':`Save all (${rows.length})`}</button>
      {!valid && <p className="text-xs text-gray-500">Choose an account and check the type, positive amount, category and date on every row.</p>}
    </div>}
  </section>;
}
