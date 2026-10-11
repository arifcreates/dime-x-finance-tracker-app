import type { Account, Category, CategoryRule, Transaction } from '../types';
import type { QuickAddEntry } from '../../supabase/functions/_shared/quick-add';
export type { QuickAddEntry } from '../../supabase/functions/_shared/quick-add';

export const localDate = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
export function resolveQuickDate(text: string, now = new Date()): string {
  const input = text.trim().toLowerCase();
  const date = new Date(now.getFullYear(),now.getMonth(),now.getDate(),12);
  if (!input || input === 'today') return localDate(date);
  if (input === 'yesterday') { date.setDate(date.getDate()-1); return localDate(date); }
  if (input === 'day before yesterday') { date.setDate(date.getDate()-2); return localDate(date); }
  const ago = /^(\d{1,3}) days? ago$/.exec(input);
  if (ago) { date.setDate(date.getDate()-Number(ago[1])); return localDate(date); }
  const weekday = /^(?:last |on )?(sunday|monday|tuesday|wednesday|thursday|friday|saturday)$/.exec(input);
  if (weekday) {
    const day = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'].indexOf(weekday[1]);
    date.setDate(date.getDate()-((date.getDay()-day+7)%7 || (input.startsWith('last ')?7:0)));
    return localDate(date);
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    const parsed = new Date(`${input}T12:00:00`);
    if (Number.isFinite(parsed.getTime()) && localDate(parsed) === input) return input;
  }
  return ''; // Ask the user rather than choosing an ambiguous date.
}

export function matchCategory(merchant: string, categories: Category[], rules: CategoryRule[]): Category | undefined {
  const text = merchant.toLowerCase();
  const rule = [...rules].sort((a,b)=>b.matchText.length-a.matchText.length || a.matchText.localeCompare(b.matchText))
    .find(r=>text.includes(r.matchText.toLowerCase()));
  return categories.find(c=>c.id===rule?.categoryId);
}

export function preferredAccount(entry: QuickAddEntry, transactions: Transaction[], accounts: Account[]): string {
  const compatible = accounts.filter(a => !entry.currency || a.currency === entry.currency);
  if (entry.accountHint) {
    const matches = compatible.filter(a=>a.name.toLowerCase()===entry.accountHint!.toLowerCase());
    if (matches.length===1) return matches[0].id;
    // An explicit account hint must never silently fall back to another account.
    return '';
  }
  const recent = [...transactions].filter(t=>t.status==='completed' && !t.transferId).sort((a,b)=>b.date.localeCompare(a.date));
  const same = recent.find(t=>compatible.some(a=>a.id===t.accountId) && (t.category.toLowerCase()===entry.category.toLowerCase() || (!!entry.merchant && t.description.toLowerCase().includes(entry.merchant.toLowerCase()))));
  if (same?.accountId) return same.accountId;
  const counts = new Map<string,number>();
  recent.forEach(t=>{if(t.accountId) counts.set(t.accountId,(counts.get(t.accountId)||0)+1);});
  const used = [...compatible].sort((a,b)=>(counts.get(b.id)||0)-(counts.get(a.id)||0));
  return used.length === 1 || (used[0] && (counts.get(used[0].id)||0)>0) ? used[0].id : '';
}

export function suggestedCategory(description: string, intent: 'expense' | 'income'): string {
  const text = description.toLowerCase();
  if (intent === 'income') return /salary|paycheck|wages/.test(text) ? 'Salary' : /freelance|design|consult|project|client/.test(text) ? 'Freelance' : 'Other income';
  if (/swiggy|zomato|coffee|cafe|meal|lunch|dinner|restaurant|food/.test(text)) return 'Food';
  if (/petrol|diesel|fuel|uber|ola|taxi|bus|metro/.test(text)) return 'Transportation';
  if (/shoe|clothes|shopping|shirt/.test(text)) return 'Shopping';
  if (/grocery|groceries|supermarket/.test(text)) return 'Groceries';
  if (/rent/.test(text)) return 'Rent';
  if (/electric|internet|utility|utilities|water bill/.test(text)) return 'Utilities';
  if (/software|subscription|adobe|figma/.test(text)) return 'Software';
  return 'Other';
}

// Resolve ordinary numerical phrases locally. Leave complex/ambiguous clauses
// to the model or a human; never reinterpret linked debt/payment operations.
export function parseQuickAdd(text: string, accounts: Account[] = [], defaultIntent?: 'income' | 'expense'): QuickAddEntry[] {
  const parts = text.trim().split(/\s*(?:;|\n|\.\s+|,\s+(?=(?:i\s+)?(?:spent|paid|got|received|earned|bought))|\band\b(?=\s+(?:i\s+)?(?:spent|paid|got|received|earned|bought|purchased|₹|\d)))\s*/i).filter(Boolean);
  if (!parts.length || parts.length > 10 || text.length > 3000) throw new Error('Describe 1–10 entries in up to 3000 characters.');
  return parts.map(part => {
    const uncertain = (): QuickAddEntry => ({intent:'unsupported',amount:null,description:part.slice(0,500),merchant:'',category:'',dateText:''});
    if (/\b(emi|loan|invoice|transfer|moved|goal|toward|refund|owe|pending|not|didn.t|budget|estimate|will|planning)\b/i.test(part) || /(?:paid|pay|payment|repay).{0,30}\bcard\b|\bcard\s+(?:bill|payment|dues)/i.test(part) || /[-+]\s*\d/.test(part)) return uncertain();
    let phrase = part.trim().replace(/[.!]+$/,'');
    let dateText = 'today';
    const date = /\b(day before yesterday|today|yesterday|\d{1,3} days? ago|(?:last |on )?(?:sunday|monday|tuesday|wednesday|thursday|friday|saturday)|\d{4}-\d{2}-\d{2})\b/i.exec(phrase);
    if (date) {dateText=date[1];phrase=phrase.replace(date[0],'').trim();}
    let accountHint: string | undefined;
    for (const account of accounts) {
      const escaped = account.name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
      const reference = new RegExp('\\b(?:using|with|via|through|from|into|in|to|on)\\s+(?:my\\s+)?'+escaped+'(?:\\s+account)?(?=\\s|$)','i');
      if (reference.test(phrase)) {if(accountHint) return uncertain();accountHint=account.name;phrase=phrase.replace(reference,'');}
    }
    const income = /\b(got|received|earned|income|salary|paycheck|wages|credited|paid me|sent me|collected)\b/i.test(phrase);
    const expense = /\b(spent|paid|bought|purchased|expense|cost|kharch)\b/i.test(phrase) && !/paid me/i.test(phrase);
    if (income && expense) return uncertain();
    if (!income && !expense && !defaultIntent && /\b(payment|freelance|client|project)\b/i.test(phrase)) return uncertain();
    const intent = income ? 'income' : expense ? 'expense' : defaultIntent || 'expense';
    const amountPattern = /(?:₹|rs\.?\s*|inr\s*|usd\s*|\$|eur\s*|€|gbp\s*|£)?\d+(?:,\d{3})*(?:\.\d{1,2})?\s*(?:k\b|l\b|lakhs?\b|thousand\b)?(?:\s*(?:rupees|rs\.?|inr|usd|eur|gbp)\b)?/gi;
    const amounts = [...phrase.matchAll(amountPattern)];
    if (amounts.length !== 1 || /\d/.test(phrase.replace(amountPattern,''))) return uncertain();
    const token = amounts[0][0];
    const number = token.replace(/,/g,'').match(/\d+(?:\.\d+)?/);
    const multiplier = /(?:l|lakhs?)\b/i.test(token) ? 100000 : /(?:k|thousand)\b/i.test(token) ? 1000 : 1;
    const amount = Math.round(Number(number?.[0])*multiplier*100)/100;
    const description = phrase.replace(token,'').replace(/\b(?:i(?:'ve| have)?|we|just|spent|paid|got|received|earned|bought|purchased|collected|was|credited|cost|me)\b/gi,' ').replace(/\s+/g,' ').trim().replace(/^(?:on|for|from|of|an?|the)\s+/i,'').replace(/\s+(?:on|for|from|of|at|using|with)$/i,'').trim();
    if (!description || description.length > 100 || !Number.isFinite(amount) || amount <= 0 || amount > 100000000 || /\b(hazaar|hazar|sau|crore|crores|million|billion|hundred|lac|lacs|at|each|tomorrow|next|last|today|yesterday|week|month|year|ago|days|between|minus|plus|sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/i.test(description)) return uncertain();
    const currency = /₹|rs\.?|inr|rupees/i.test(token) ? 'INR' : /usd|\$/i.test(token) ? 'USD' : /eur|€/i.test(token) ? 'EUR' : /gbp|£/i.test(token) ? 'GBP' : undefined;
    return {intent,amount,description,merchant:description,category:suggestedCategory(description,intent),dateText,...(currency?{currency}:{}),...(accountHint?{accountHint}:{})};
  });
}

// Preserve explicit context when the model omits it. Match a draft to an
// unambiguous clause by its description/merchant; never assign by row order.
export function enrichQuickAdd(entries:QuickAddEntry[],text:string,accounts:Account[]):QuickAddEntry[] {
  const clauses=text.split(/;|\n|\.\s+|\band\b|\baur\b/i).map(s=>s.trim()).filter(Boolean);
  return entries.map(entry=>{
    const words=[...new Set(`${entry.description} ${entry.merchant}`.toLowerCase().match(/[\p{L}]{3,}/gu)||[])].filter(w=>!['the','for','from','payment','income','expense','fictional'].includes(w));
    const matches=clauses.map(clause=>({clause,score:words.filter(w=>clause.toLowerCase().includes(w)).length})).filter(m=>m.score>0).sort((a,b)=>b.score-a.score);
    const clause=clauses.length===1?clauses[0]:matches[0]&&matches[0].score>(matches[1]?.score||0)?matches[0].clause:'';
    if(!clause)return entry;
    const explicit=accounts.filter(a=>{
      const name=a.name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
      return new RegExp('\\b(?:using|with|via|through|from|into|in|to|on)\\s+(?:my\\s+)?'+name+'(?:\\s+account)?(?=\\s|[.,]|$)','i').test(clause);
    });
    const currencies=[[/₹|\brupees\b|\brs\.?\b|\binr\b/i,'INR'],[/\$|\busd\b|\bdollars\b/i,'USD'],[/€|\beur\b|\beuros\b/i,'EUR'],[/£|\bgbp\b|\bpounds\b/i,'GBP']] as const;
    const currencyMatches=currencies.filter(([pattern])=>pattern.test(clause));
    const date=/\b(day before yesterday|today|yesterday|\d{1,3} days? ago|(?:last |on )?(?:sunday|monday|tuesday|wednesday|thursday|friday|saturday)|\d{4}-\d{2}-\d{2})\b/i.exec(clause);
    return {...entry,...(explicit.length===1?{accountHint:explicit[0].name}:{}),...(currencyMatches.length===1?{currency:currencyMatches[0][1]}:{}),...(date?{dateText:date[1]}:{})};
  });
}
