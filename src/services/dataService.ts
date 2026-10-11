import { Transaction, Account, Invoice, Client, EMI, CreditCard, RecurringPayment } from '../types';
import { supabaseService } from './supabaseService';
import { supabaseConfigured } from '../lib/supabase';
import { businessProfileService } from './businessProfileService';
import { calculateInvoiceTotals } from '../utils/invoiceUtils';
import { errorService } from './errorService';
import { applyTransactionChange, type FinanceState } from '../utils/finance';
import { currencyService } from './currencyService';

const emptyState = (): FinanceState => ({ transactions: [], accounts: [], invoices: [], clients: [], emis: [], creditCards: [], recurringPayments: [] });
type Collection = keyof FinanceState;

export class DataService {
  private currentUserId: string | null = null;
  private cache = emptyState();
  private revision = 0;
  private reads = new Map<string, Promise<unknown>>();
  private pending: Promise<unknown> = Promise.resolve();

  setCurrentUserId(userId: string | null) {
    if (this.currentUserId === userId) return;
    this.currentUserId = userId;
    this.revision++;
    this.reads.clear();
    this.cache = emptyState();
    businessProfileService.setCurrentUserId(userId);
  }

  private get localKey() { return `dimex:${this.currentUserId || 'guest'}:workspace`; }
  private get remote() { return !!this.currentUserId; }

  private readLocal() {
    try {
      const raw = localStorage.getItem(this.localKey);
      if (raw) return { ...emptyState(), ...JSON.parse(raw) } as FinanceState;
    } catch { errorService.addError('Could not read the browser workspace.', 'error'); }
    return emptyState();
  }

  private persistLocal(state: FinanceState) {
    // Persist a guest operation as one snapshot before exposing it as successful.
    localStorage.setItem(this.localKey, JSON.stringify(state));
    this.cache = state;
  }

  private async load<K extends Collection>(key: K, fetcher: (id: string) => Promise<FinanceState[K]>): Promise<FinanceState[K]> {
    const userId = this.currentUserId;
    const revision = this.revision;
    if (!userId) { this.cache = this.readLocal(); return this.cache[key]; }
    if (!supabaseConfigured) throw new Error('The backend is not configured. Real accounts require Supabase.');
    const readKey = `${userId}:${key}`;
    let request = this.reads.get(readKey) as Promise<FinanceState[K]> | undefined;
    if (!request) {
      request = fetcher(userId);
      this.reads.set(readKey, request);
      const activeRequest = request;
      void request.finally(() => { if (this.reads.get(readKey) === activeRequest) this.reads.delete(readKey); }).catch(() => {});
    }
    const items = await request;
    if (revision !== this.revision) return emptyState()[key];
    this.cache[key] = items;
    return items;
  }

  getTransactions() { return this.load('transactions', id => supabaseService.getTransactions(id)); }
  getAccounts() { return this.load('accounts', id => supabaseService.getAccounts(id)); }
  async getInvoices() {
    const items = await this.load('invoices', id => supabaseService.getInvoices(id));
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    return items.map(invoice => invoice.status === 'sent' && invoice.dueDate < today ? { ...invoice, status: 'overdue' as const } : invoice);
  }
  getClients() { return this.load('clients', id => supabaseService.getClients(id)); }
  getEMIs() { return this.load('emis', id => supabaseService.getEMIs(id)); }
  getCreditCards() { return this.load('creditCards', id => supabaseService.getCreditCards(id)); }
  getRecurringPayments() { return this.load('recurringPayments', id => supabaseService.getRecurringPayments(id)); }

  getCachedTransactions() { return this.cache.transactions; }
  getCachedAccounts() { return this.cache.accounts; }
  getCachedInvoices() { return this.cache.invoices; }
  getCachedClients() { return this.cache.clients; }
  getCachedEMIs() { return this.cache.emis; }
  getCachedCreditCards() { return this.cache.creditCards; }
  getCachedRecurringPayments() { return this.cache.recurringPayments; }

  private mutate(operation: (state: FinanceState, userId: string | null) => Promise<void>) {
    const revision = this.revision;
    const userId = this.currentUserId;
    const run = this.pending.then(async () => {
      if (revision !== this.revision) throw new Error('Your account changed. Please retry.');
      if (userId && (!supabaseConfigured || !navigator.onLine)) throw new Error('Reconnect to save to your account. Your changes have not been saved.');
      const state = this.remote ? structuredClone(this.cache) : this.readLocal();
      await operation(state, userId);
      if (revision !== this.revision) return;
      if (userId) this.cache = state;
      else this.persistLocal(state);
    });
    this.pending = run.catch(() => {});
    return run;
  }

  private async save<K extends Collection>(key: K, item: FinanceState[K][number], remoteSave: (id: string) => Promise<unknown>) {
    await this.mutate(async (state, id) => {
      if (id) await remoteSave(id);
      const items = state[key] as Array<{ id: string }>;
      const index = items.findIndex(existing => existing.id === item.id);
      if (index >= 0) items[index] = item;
      else items.push(item);
    });
  }
  private async remove<K extends Collection>(key: K, itemId: string, remoteDelete: () => Promise<unknown>) {
    await this.mutate(async (state, id) => {
      if (id) await remoteDelete();
      state[key] = state[key].filter(item => item.id !== itemId) as FinanceState[K];
    });
  }

  async saveTransaction(transaction: Transaction) {
    await this.mutate(async (state, id) => {
      if (id) {
        await supabaseService.saveTransaction(id, transaction);
        try {
          state.transactions = await supabaseService.getTransactions(id);
          state.accounts = await supabaseService.getAccounts(id);
        } catch { errorService.addError('Saved to your account. Refresh to reload the latest balances.', 'info'); }
      } else applyTransactionChange(state, transaction.id, transaction);
    });
  }
  async deleteTransaction(transactionId: string) {
    await this.mutate(async (state, id) => {
      const item = state.transactions.find(t => t.id === transactionId);
      if (item?.invoiceId || item?.transferId) throw new Error('Invoice payments and transfers cannot be removed as individual transactions.');
      if (id) {
        await supabaseService.deleteTransaction(transactionId);
        try {
          state.transactions = await supabaseService.getTransactions(id);
          state.accounts = await supabaseService.getAccounts(id);
        } catch { errorService.addError('Saved to your account. Refresh to reload the latest balances.', 'info'); }
      } else applyTransactionChange(state, transactionId);
    });
  }
  async saveAccount(item: Account) {
    await this.mutate(async (state, id) => {
      const old = state.accounts.find(a => a.id === item.id);
      if (!Number.isFinite(item.balance)) throw new Error('Enter a valid account balance.');
      if (!id && old && old.currency !== item.currency && (state.transactions.some(t => t.accountId === item.id) || state.emis.some(e => e.creditedAccountId === item.id))) throw new Error('Keep the original currency for accounts with financial history.');
      if (id) await supabaseService.saveAccount(id, item);
      state.accounts = [...state.accounts.filter(a => a.id !== item.id), item];
    });
  }
  async deleteAccount(accountId: string) {
    await this.mutate(async (state, id) => {
      if (id) await supabaseService.deleteAccount(accountId);
      else if (state.transactions.some(t => t.accountId === accountId) || state.emis.some(e => e.creditedAccountId === accountId)) throw new Error('Keep accounts that have financial history.');
      state.accounts = state.accounts.filter(a => a.id !== accountId);
    });
  }
  async saveInvoice(item: Invoice) {
    const totals = calculateInvoiceTotals(item);
    const invoice = { ...item, amount: totals.total, subtotal: totals.subtotal, taxAmount: totals.taxAmount, discountAmount: totals.discountAmount };
    const old = this.cache.invoices.find(i => i.id === item.id);
    if (old?.status === 'paid') throw new Error('Paid invoices are locked to preserve payment history.');
    if (item.status === 'paid') throw new Error('Use Record payment to mark an invoice paid.');
    return this.save('invoices', invoice, id => supabaseService.saveInvoice(id, invoice));
  }
  async deleteInvoice(id: string) {
    if (this.cache.invoices.find(i => i.id === id)?.status === 'paid') throw new Error('Paid invoices cannot be deleted.');
    return this.remove('invoices', id, () => supabaseService.deleteInvoice(id));
  }
  saveClient(item: Client) { return this.save('clients', item, id => supabaseService.saveClient(id, item)); }
  async deleteClient(clientId: string) {
    await this.mutate(async (state, id) => {
      if (id) await supabaseService.deleteClient(clientId);
      state.clients = state.clients.filter(c => c.id !== clientId);
      state.invoices = state.invoices.map(i => i.clientId === clientId ? { ...i, clientId: null } : i);
    });
  }
  async saveEMI(item: EMI) {
    await this.mutate(async (state, id) => {
      if (id) {
        await supabaseService.saveEMI(id, item);
        try { state.accounts = await supabaseService.getAccounts(id); } catch { errorService.addError('Credit saved. Refresh to reload balances.', 'info'); }
      } else if (item.debtType === 'credit' && !state.emis.some(e => e.id === item.id)) {
        const account = state.accounts.find(a => a.id === item.creditedAccountId);
        if (!account) throw new Error('Choose the account that received this credit.');
        account.balance += item.principal;
      }
      state.emis = [...state.emis.filter(e => e.id !== item.id), item];
    });
  }
  deleteEMI(id: string) { return this.remove('emis', id, () => supabaseService.deleteEMI(id)); }
  saveCreditCard(item: CreditCard) { return this.save('creditCards', item, id => supabaseService.saveCreditCard(id, item)); }
  deleteCreditCard(id: string) { return this.remove('creditCards', id, () => supabaseService.deleteCreditCard(id)); }
  saveRecurringPayment(item: RecurringPayment) { return this.save('recurringPayments', item, id => supabaseService.saveRecurringPayment(id, item)); }
  deleteRecurringPayment(id: string) { return this.remove('recurringPayments', id, () => supabaseService.deleteRecurringPayment(id)); }

  async recordInvoicePayment(invoice: Invoice, accountId: string) {
    const accounts = await this.getAccounts();
    const account = accounts.find(a => a.id === accountId);
    if (!account) throw new Error('Choose an account.');
    const amount = await currencyService.convertCurrency(invoice.amount, invoice.currency || 'USD', account.currency);
    await this.mutate(async (state, id) => {
      if (id) {
        await supabaseService.recordInvoicePayment(invoice.id, accountId, amount);
        try {
          state.invoices = await supabaseService.getInvoices(id);
          state.accounts = await supabaseService.getAccounts(id);
          state.transactions = await supabaseService.getTransactions(id);
        } catch { errorService.addError('Payment recorded. Refresh to reload your workspace.', 'info'); }
      } else {
        const current = state.invoices.find(i => i.id === invoice.id);
        if (!current) throw new Error('Invoice no longer exists.');
        if (current.status === 'paid') return;
        applyTransactionChange(state, crypto.randomUUID(), { id: crypto.randomUUID(), date: new Date().toISOString().slice(0,10), description: `Invoice Payment - ${invoice.invoiceNumber}`, amount, type: 'income', category: 'Invoice Payment', status: 'completed', account: account.name, accountId, currency: account.currency, invoiceId: invoice.id });
        current.status = 'paid';
      }
    });
  }

  async transfer(fromId: string, toId: string, amount: number, description: string, requestId: string) {
    await this.mutate(async (state, id) => {
      if (id) {
        await supabaseService.transfer(fromId, toId, amount, description, requestId);
        try {
          state.accounts = await supabaseService.getAccounts(id);
          state.transactions = await supabaseService.getTransactions(id);
        } catch { errorService.addError('Transfer recorded. Refresh to reload your workspace.', 'info'); }
      } else {
        const from = state.accounts.find(a => a.id === fromId);
        const to = state.accounts.find(a => a.id === toId);
        if (!from || !to || fromId === toId || from.currency !== to.currency || !Number.isFinite(amount) || amount <= 0 || from.balance < amount) throw new Error('Choose two accounts in the same currency and an available amount greater than zero.');
        const transferId = requestId;
        if (state.transactions.some(t=>t.transferId===requestId)) return;
        for (const [account, type] of [[from, 'expense'], [to, 'income']] as const) {
          const txn: Transaction = { id: crypto.randomUUID(), date: new Date().toISOString().slice(0,10), description: description || 'Account transfer', amount, type, category: 'Transfer', account: account.name, accountId: account.id, currency: account.currency, status: 'completed', transferId };
          applyTransactionChange(state, txn.id, txn);
        }
      }
    });
  }

  private async reportTransactions() {
    const [items, accounts] = await Promise.all([this.getTransactions(), this.getAccounts()]);
    const currency = businessProfileService.getReportCurrency();
    return Promise.all(items.filter(t => t.status === 'completed' && t.category !== 'Transfer').map(async t => ({ ...t, amount: await currencyService.convertCurrency(t.amount, t.currency || accounts.find(a => a.id === t.accountId)?.currency || 'USD', currency) })));
  }
  async getMonthlyIncome(month = new Date().getMonth(), year = new Date().getFullYear()) { return this.monthlyTotal('income',month,year); }
  async getMonthlyExpenses(month = new Date().getMonth(), year = new Date().getFullYear()) { return this.monthlyTotal('expense',month,year); }
  private async monthlyTotal(type: Transaction['type'], month: number, year: number) { return (await this.reportTransactions()).filter(t => t.type === type && Number(t.date.slice(0,4)) === year && Number(t.date.slice(5,7)) === month+1).reduce((sum,t) => sum+t.amount,0); }
  async getCashFlow(month?: number, year?: number) { return (await this.getMonthlyIncome(month,year)) - (await this.getMonthlyExpenses(month,year)); }
  async getTotalBalance() { const amounts = await Promise.all((await this.getAccounts()).map(a => currencyService.convertCurrency(a.balance,a.currency,businessProfileService.getReportCurrency()))); return amounts.reduce((sum,n)=>sum+n,0); }
  async getIncomeByCategory(month = new Date().getMonth(), year = new Date().getFullYear()) { return this.byCategory('income',month,year); }
  async getExpensesByCategory(month = new Date().getMonth(), year = new Date().getFullYear()) { return this.byCategory('expense',month,year); }
  private async byCategory(type: Transaction['type'], month: number, year: number) { return (await this.reportTransactions()).filter(t=>t.type===type && Number(t.date.slice(0,4))===year && Number(t.date.slice(5,7))===month+1).reduce<Record<string,number>>((totals,t)=>{ totals[t.category]=(totals[t.category]||0)+t.amount;return totals; },{}); }
  async initializeSampleData() { /* Real workspaces start empty. */ }
}
export const dataService = new DataService();
