export interface QuickAddEntry {
  intent: 'expense' | 'income' | 'unsupported';
  amount: number | null;
  description: string;
  merchant: string;
  category: string;
  dateText: string;
  currency?: string;
}

export function validateQuickAdd(value: unknown): QuickAddEntry[] {
  if (!value || typeof value !== 'object' || !('entries' in value)) throw new Error('AI returned invalid entries.');
  const entries = (value as {entries:unknown}).entries;
  if (!Array.isArray(entries) || entries.length < 1 || entries.length > 10) throw new Error('Review 1–10 entries at a time.');
  return entries.map((entry: unknown) => {
    if (!entry || typeof entry !== 'object') throw new Error('AI returned an invalid entry.');
    const item = entry as Record<string,unknown>;
    if (!['expense','income','unsupported'].includes(String(item.intent))) throw new Error('AI returned an unsupported intent.');
    const text = (key: string, limit: number, fallback = '') => {
      const val = item[key] ?? fallback;
      if (typeof val !== 'string' || val.length > limit) throw new Error('AI returned invalid entry text.');
      return val.trim();
    };
    const intent = item.intent as QuickAddEntry['intent'];
    if (intent !== 'unsupported' && (typeof item.amount !== 'number' || !Number.isFinite(item.amount) || item.amount <= 0 || item.amount > 100000000)) throw new Error('AI returned an invalid amount.');
    const currency = text('currency',3);
    if (currency && !/^[A-Z]{3}$/.test(currency)) throw new Error('AI returned an invalid currency.');
    const category = text('category',100);
    if (intent !== 'unsupported' && category.toLowerCase() === 'transfer') throw new Error('Use the dedicated transfer flow.');
    const description = text('description',500);
    if (!description) throw new Error('AI returned an empty description.');
    return {intent,amount:intent === 'unsupported' ? null : Math.round(Number(item.amount)*100)/100,description,merchant:text('merchant',100),category,dateText:text('dateText',80,'today'),...(currency ? {currency} : {})};
  });
}
