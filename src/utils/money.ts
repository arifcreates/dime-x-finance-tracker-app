import { formatCurrency } from './formatters';
export function moneySummary<T extends { currency?: string }>(items: T[], amount: (item: T) => number): string {
  const totals = items.reduce<Record<string, number>>((result, item) => { const currency = item.currency || 'USD'; result[currency] = (result[currency] || 0) + amount(item); return result; }, {});
  return Object.entries(totals).map(([currency, total]) => formatCurrency(total,currency)).join(' + ') || formatCurrency(0);
}
