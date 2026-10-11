import type { Account, Category, CategoryRule, Transaction } from '../types';
import type { QuickAddEntry } from '../../supabase/functions/_shared/quick-add';
export type { QuickAddEntry } from '../../supabase/functions/_shared/quick-add';

export const localDate = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
export function resolveQuickDate(text: string, now = new Date()): string {
  const input = text.trim().toLowerCase();
  const date = new Date(now.getFullYear(),now.getMonth(),now.getDate(),12);
  if (!input || input === 'today') return localDate(date);
  if (input === 'yesterday') { date.setDate(date.getDate()-1); return localDate(date); }
  const weekday = /^last (sunday|monday|tuesday|wednesday|thursday|friday|saturday)$/.exec(input);
  if (weekday) {
    const day = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'].indexOf(weekday[1]);
    date.setDate(date.getDate()-((date.getDay()-day+7)%7 || 7));
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
  const recent = [...transactions].filter(t=>t.status==='completed' && !t.transferId).sort((a,b)=>b.date.localeCompare(a.date));
  const same = recent.find(t=>compatible.some(a=>a.id===t.accountId) && (t.category.toLowerCase()===entry.category.toLowerCase() || (!!entry.merchant && t.description.toLowerCase().includes(entry.merchant.toLowerCase()))));
  if (same?.accountId) return same.accountId;
  const counts = new Map<string,number>();
  recent.forEach(t=>{if(t.accountId) counts.set(t.accountId,(counts.get(t.accountId)||0)+1);});
  const used = [...compatible].sort((a,b)=>(counts.get(b.id)||0)-(counts.get(a.id)||0));
  return used.length === 1 || (used[0] && (counts.get(used[0].id)||0)>0) ? used[0].id : '';
}

// Deliberately small grammar: uncertain clauses remain visible for manual review.
// No account names or transaction history are sent to a provider by this parser.
export function parseQuickAdd(text: string): QuickAddEntry[] {
  const parts = text.trim().split(/\s*(?:;|\n|\band\b)\s*/i).filter(Boolean);
  if (!parts.length || parts.length > 10 || text.length > 3000) throw new Error('Describe 1–10 entries in up to 3000 characters.');
  return parts.map(part => {
    const uncertain = (): QuickAddEntry => ({intent:'unsupported',amount:null,description:part.slice(0,500),merchant:'',category:'',dateText:''});
    if (/\b(card|emi|loan|invoice|transfer|moved|goal|toward|refund|owe|pending|not|didn.t|budget|estimate)\b/i.test(part) || /[-+]\s*\d/.test(part)) return uncertain();
    let phrase = part.trim();
    let dateText = 'today';
    const date = /\b(today|yesterday|last (?:sunday|monday|tuesday|wednesday|thursday|friday|saturday)|\d{4}-\d{2}-\d{2})\s*$/i.exec(phrase);
    if (date) {dateText=date[1];phrase=phrase.slice(0,date.index).trim();}
    const intent = /^(got|received|earned|income)\b/i.test(phrase) ? 'income' : 'expense';
    if (intent === 'expense' && /\b(got|received|earned|income|salary|deposit|paid me)\b/i.test(phrase)) return uncertain();
    phrase = phrase.replace(/^(spent|paid|expense|got|received|earned|income)\s+/i,'');
    const amountPattern = /(?:₹|rs\.?\s*|inr\s*|usd\s*|\$|eur\s*|€|gbp\s*|£)?\d+(?:,\d{3})*(?:\.\d{1,2})?\s*(?:k\b|l\b|lakh\b|rupees\b)?/gi;
    const amounts = [...phrase.matchAll(amountPattern)];
    if (amounts.length !== 1 || /\d/.test(phrase.replace(amountPattern,''))) return uncertain();
    const token = amounts[0][0];
    const number = token.replace(/,/g,'').match(/\d+(?:\.\d+)?/);
    const multiplier = /(?:l|lakh)\b/i.test(token) ? 100000 : /k\b/i.test(token) ? 1000 : 1;
    const amount = Math.round(Number(number?.[0])*multiplier*100)/100;
    const merchant = phrase.replace(token,'').replace(/^(on|for|from)\s+/i,'').trim();
    if (!merchant || merchant.length > 100 || !Number.isFinite(amount) || amount <= 0 || amount > 100000000 || /\b(at|each|tomorrow|next|last|today|yesterday|sunday|monday|tuesday|wednesday|thursday|friday|saturday|week|month|year|ago|days|between|minus|plus)\b/i.test(merchant)) return uncertain();
    const currency = /₹|rs\.?|inr|rupees/i.test(token) ? 'INR' : /usd|\$/i.test(token) ? 'USD' : /eur|€/i.test(token) ? 'EUR' : /gbp|£/i.test(token) ? 'GBP' : undefined;
    return {intent,amount,description:merchant,merchant,category:intent==='income'?'Other income':'Other',dateText,...(currency?{currency}:{})};
  });
}
