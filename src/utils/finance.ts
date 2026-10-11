import type { Transaction, Account, Invoice, Client, EMI, CreditCard, RecurringPayment } from '../types';

export interface FinanceState {
  transactions: Transaction[]; accounts: Account[]; invoices: Invoice[]; clients: Client[];
  emis: EMI[]; creditCards: CreditCard[]; recurringPayments: RecurringPayment[];
}

export function applyTransactionChange(state: FinanceState, id: string, next?: Transaction) {
  const old = state.transactions.find(t => t.id === id);
  if (old?.invoiceId || old?.transferId) throw new Error('Linked financial records cannot be edited separately.');
  const delta = (transaction: Transaction, direction: number) => {
    const account = state.accounts.find(a => a.id === transaction.accountId);
    if (!account) throw new Error('The transaction account does not exist.');
    if (transaction.status === 'completed') account.balance = Math.round((account.balance + direction * (transaction.type === 'income' ? transaction.amount : -transaction.amount)) * 100) / 100;
  };
  if (next && (!Number.isFinite(next.amount) || next.amount <= 0)) throw new Error('Amount must be greater than zero.');
  if (old) delta(old,-1);
  if (next) delta(next,1);
  state.transactions = [...state.transactions.filter(t=>t.id!==id), ...(next?[next]:[])];
}
