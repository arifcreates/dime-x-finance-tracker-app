import { Transaction, Account, Invoice, Client, EMI, CreditCard, RecurringPayment } from '../types';
import { supabaseService } from './supabaseService';
import { supabase, supabaseConfigured } from '../lib/supabase';

class DataService {
  private currentUserId: string | null = null;
  private isOnline = true;

  // In-memory cache — populated on first async load, updated after every save/delete
  private cache: {
    transactions: Transaction[];
    accounts: Account[];
    invoices: Invoice[];
    clients: Client[];
    emis: EMI[];
    creditCards: CreditCard[];
    recurringPayments: RecurringPayment[];
  } = {
    transactions: [],
    accounts: [],
    invoices: [],
    clients: [],
    emis: [],
    creditCards: [],
    recurringPayments: [],
  };

  constructor() {
    if (supabaseConfigured) {
      try {
        supabase.auth.onAuthStateChange((event, session) => {
          this.currentUserId = session?.user?.id || null;
          if (event === 'SIGNED_IN' && this.currentUserId) {
            this.syncLocalDataToSupabase();
          }
          if (event === 'SIGNED_OUT') {
            this.clearCache();
          }
        });
      } catch (error) {
        console.error('Supabase auth init error:', error);
      }
    }

    window.addEventListener('online', () => {
      this.isOnline = true;
      if (this.currentUserId) this.syncLocalDataToSupabase();
    });

    window.addEventListener('offline', () => { this.isOnline = false; });
  }

  private clearCache() {
    this.cache = { transactions: [], accounts: [], invoices: [], clients: [], emis: [], creditCards: [], recurringPayments: [] };
  }

  private async syncLocalDataToSupabase() {
    if (!supabaseConfigured || !this.currentUserId || !this.isOnline) return;
    try {
      const localAccounts = this.getFromStorage<Account>('accounts');
      for (const account of localAccounts) await supabaseService.saveAccount(this.currentUserId, account);
      const localTransactions = this.getFromStorage<Transaction>('transactions');
      for (const transaction of localTransactions) await supabaseService.saveTransaction(this.currentUserId, transaction);
      localStorage.removeItem('accounts');
      localStorage.removeItem('transactions');
      localStorage.removeItem('clients');
      localStorage.removeItem('invoices');
      localStorage.removeItem('emis');
      localStorage.removeItem('creditcards');
      localStorage.removeItem('recurringpayments');
    } catch (error) {
      console.error('Error syncing local data to Supabase:', error);
    }
  }

  private getFromStorage<T>(key: string): T[] {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.warn(`Ignoring invalid ${key} data:`, error);
      localStorage.removeItem(key);
      return [];
    }
  }

  private saveToStorage<T>(key: string, data: T[]): void {
    localStorage.setItem(key, JSON.stringify(data));
  }

  private upsertStorageItem<T extends { id: string }>(key: string, item: T): void {
    const items = this.getFromStorage<T>(key);
    const index = items.findIndex(existing => existing.id === item.id);
    if (index >= 0) items[index] = item;
    else items.push(item);
    this.saveToStorage(key, items);
  }

  private deleteStorageItem<T extends { id: string }>(key: string, id: string): void {
    this.saveToStorage(key, this.getFromStorage<T>(key).filter(item => item.id !== id));
  }

  private mergeById<T extends { id: string }>(remoteItems: T[], localItems: T[]): T[] {
    const items = new Map<string, T>();
    for (const item of remoteItems) items.set(item.id, item);
    for (const item of localItems) items.set(item.id, item);
    return Array.from(items.values());
  }

  private async fetchFromSupabaseOrStorage<T>(
    supabaseMethod: () => Promise<T[]>,
    storageKey: string
  ): Promise<T[]> {
    const localItems = this.getFromStorage<T>(storageKey);

    if (supabaseConfigured && this.currentUserId && this.isOnline) {
      try {
        const remoteItems = await supabaseMethod();
        return this.mergeById(remoteItems as Array<T & { id: string }>, localItems as Array<T & { id: string }>) as T[];
      } catch (error) {
        console.error('Supabase error, falling back to localStorage:', error);
        return localItems;
      }
    }
    return localItems;
  }

  // ── Async fetch methods (update cache) ──────────────────────────────────────

  async getTransactions(): Promise<Transaction[]> {
    this.cache.transactions = await this.fetchFromSupabaseOrStorage(
      () => supabaseService.getTransactions(this.currentUserId!),
      'transactions'
    );
    return this.cache.transactions;
  }

  async getAccounts(): Promise<Account[]> {
    this.cache.accounts = await this.fetchFromSupabaseOrStorage(
      () => supabaseService.getAccounts(this.currentUserId!),
      'accounts'
    );
    return this.cache.accounts;
  }

  async getInvoices(): Promise<Invoice[]> {
    this.cache.invoices = await this.fetchFromSupabaseOrStorage(
      () => supabaseService.getInvoices(this.currentUserId!),
      'invoices'
    );
    return this.cache.invoices;
  }

  async getClients(): Promise<Client[]> {
    this.cache.clients = await this.fetchFromSupabaseOrStorage(
      () => supabaseService.getClients(this.currentUserId!),
      'clients'
    );
    return this.cache.clients;
  }

  async getEMIs(): Promise<EMI[]> {
    this.cache.emis = await this.fetchFromSupabaseOrStorage(
      () => supabaseService.getEMIs(this.currentUserId!),
      'emis'
    );
    return this.cache.emis;
  }

  async getCreditCards(): Promise<CreditCard[]> {
    this.cache.creditCards = await this.fetchFromSupabaseOrStorage(
      () => supabaseService.getCreditCards(this.currentUserId!),
      'creditcards'
    );
    return this.cache.creditCards;
  }

  async getRecurringPayments(): Promise<RecurringPayment[]> {
    this.cache.recurringPayments = await this.fetchFromSupabaseOrStorage(
      () => supabaseService.getRecurringPayments(this.currentUserId!),
      'recurringpayments'
    );
    return this.cache.recurringPayments;
  }

  // ── Synchronous cache reads (safe to call in render) ────────────────────────

  getCachedTransactions(): Transaction[] { return this.cache.transactions; }
  getCachedAccounts(): Account[] { return this.cache.accounts; }
  getCachedInvoices(): Invoice[] { return this.cache.invoices; }
  getCachedClients(): Client[] { return this.cache.clients; }
  getCachedEMIs(): EMI[] { return this.cache.emis; }
  getCachedCreditCards(): CreditCard[] { return this.cache.creditCards; }
  getCachedRecurringPayments(): RecurringPayment[] { return this.cache.recurringPayments; }

  // ── Save / Delete ────────────────────────────────────────────────────────────

  async saveTransaction(transaction: Transaction): Promise<void> {
    this.upsertStorageItem('transactions', transaction);

    if (supabaseConfigured && this.currentUserId && this.isOnline) {
      try {
        await supabaseService.saveTransaction(this.currentUserId, transaction);
      } catch (error) {
        console.error('Error saving to Supabase, kept local copy:', error);
      }
    }
    const idx = this.cache.transactions.findIndex(t => t.id === transaction.id);
    if (idx >= 0) this.cache.transactions[idx] = transaction;
    else this.cache.transactions.push(transaction);
  }

  async deleteTransaction(id: string): Promise<void> {
    this.deleteStorageItem<Transaction>('transactions', id);

    if (supabaseConfigured && this.currentUserId && this.isOnline) {
      try { await supabaseService.deleteTransaction(id); }
      catch (error) { console.error('Error deleting from Supabase:', error); }
    }
    this.cache.transactions = this.cache.transactions.filter(t => t.id !== id);
  }

  async saveAccount(account: Account): Promise<void> {
    this.upsertStorageItem('accounts', account);

    if (supabaseConfigured && this.currentUserId && this.isOnline) {
      try {
        await supabaseService.saveAccount(this.currentUserId, account);
      } catch (error) {
        console.error('Error saving to Supabase, kept local copy:', error);
      }
    }
    const idx = this.cache.accounts.findIndex(a => a.id === account.id);
    if (idx >= 0) this.cache.accounts[idx] = account;
    else this.cache.accounts.push(account);
  }

  async deleteAccount(id: string): Promise<void> {
    this.deleteStorageItem<Account>('accounts', id);

    if (supabaseConfigured && this.currentUserId && this.isOnline) {
      try { await supabaseService.deleteAccount(id); }
      catch (error) { console.error('Error deleting from Supabase:', error); }
    }
    this.cache.accounts = this.cache.accounts.filter(a => a.id !== id);
  }

  async saveInvoice(invoice: Invoice): Promise<void> {
    this.upsertStorageItem('invoices', invoice);

    if (supabaseConfigured && this.currentUserId && this.isOnline) {
      try { await supabaseService.saveInvoice(this.currentUserId, invoice); }
      catch (error) { console.error('Error saving to Supabase:', error); }
    }
    const idx = this.cache.invoices.findIndex(i => i.id === invoice.id);
    if (idx >= 0) this.cache.invoices[idx] = invoice;
    else this.cache.invoices.push(invoice);
  }

  async deleteInvoice(id: string): Promise<void> {
    this.deleteStorageItem<Invoice>('invoices', id);

    if (supabaseConfigured && this.currentUserId && this.isOnline) {
      try { await supabaseService.deleteInvoice(id); }
      catch (error) { console.error('Error deleting from Supabase:', error); }
    }
    this.cache.invoices = this.cache.invoices.filter(i => i.id !== id);
  }

  async saveClient(client: Client): Promise<void> {
    this.upsertStorageItem('clients', client);

    if (supabaseConfigured && this.currentUserId && this.isOnline) {
      try { await supabaseService.saveClient(this.currentUserId, client); }
      catch (error) { console.error('Error saving to Supabase:', error); }
    }
    const idx = this.cache.clients.findIndex(c => c.id === client.id);
    if (idx >= 0) this.cache.clients[idx] = client;
    else this.cache.clients.push(client);
  }

  async deleteClient(id: string): Promise<void> {
    this.deleteStorageItem<Client>('clients', id);

    if (supabaseConfigured && this.currentUserId && this.isOnline) {
      try { await supabaseService.deleteClient(id); }
      catch (error) { console.error('Error deleting from Supabase:', error); }
    }
    this.cache.clients = this.cache.clients.filter(c => c.id !== id);
  }

  async saveEMI(emi: EMI): Promise<void> {
    this.upsertStorageItem('emis', emi);

    if (supabaseConfigured && this.currentUserId && this.isOnline) {
      try { await supabaseService.saveEMI(this.currentUserId, emi); }
      catch (error) { console.error('Error saving to Supabase:', error); }
    }
    const idx = this.cache.emis.findIndex(e => e.id === emi.id);
    if (idx >= 0) this.cache.emis[idx] = emi;
    else this.cache.emis.push(emi);
  }

  async deleteEMI(id: string): Promise<void> {
    this.deleteStorageItem<EMI>('emis', id);

    if (supabaseConfigured && this.currentUserId && this.isOnline) {
      try { await supabaseService.deleteEMI(id); }
      catch (error) { console.error('Error deleting from Supabase:', error); }
    }
    this.cache.emis = this.cache.emis.filter(e => e.id !== id);
  }

  async saveCreditCard(card: CreditCard): Promise<void> {
    this.upsertStorageItem('creditcards', card);

    if (supabaseConfigured && this.currentUserId && this.isOnline) {
      try { await supabaseService.saveCreditCard(this.currentUserId, card); }
      catch (error) { console.error('Error saving to Supabase:', error); }
    }
    const idx = this.cache.creditCards.findIndex(c => c.id === card.id);
    if (idx >= 0) this.cache.creditCards[idx] = card;
    else this.cache.creditCards.push(card);
  }

  async deleteCreditCard(id: string): Promise<void> {
    this.deleteStorageItem<CreditCard>('creditcards', id);

    if (supabaseConfigured && this.currentUserId && this.isOnline) {
      try { await supabaseService.deleteCreditCard(id); }
      catch (error) { console.error('Error deleting from Supabase:', error); }
    }
    this.cache.creditCards = this.cache.creditCards.filter(c => c.id !== id);
  }

  async saveRecurringPayment(payment: RecurringPayment): Promise<void> {
    this.upsertStorageItem('recurringpayments', payment);

    if (supabaseConfigured && this.currentUserId && this.isOnline) {
      try { await supabaseService.saveRecurringPayment(this.currentUserId, payment); }
      catch (error) { console.error('Error saving to Supabase:', error); }
    }
    const idx = this.cache.recurringPayments.findIndex(p => p.id === payment.id);
    if (idx >= 0) this.cache.recurringPayments[idx] = payment;
    else this.cache.recurringPayments.push(payment);
  }

  async deleteRecurringPayment(id: string): Promise<void> {
    this.deleteStorageItem<RecurringPayment>('recurringpayments', id);

    if (supabaseConfigured && this.currentUserId && this.isOnline) {
      try { await supabaseService.deleteRecurringPayment(id); }
      catch (error) { console.error('Error deleting from Supabase:', error); }
    }
    this.cache.recurringPayments = this.cache.recurringPayments.filter(p => p.id !== id);
  }

  // ── Analytics (computed from cache after async load) ────────────────────────

  private isTransfer(transaction: Transaction): boolean {
    return transaction.category.toLowerCase() === 'transfer';
  }

  async getMonthlyIncome(month?: number, year?: number): Promise<number> {
    const transactions = await this.getTransactions();
    const currentDate = new Date();
    const targetMonth = month ?? currentDate.getMonth();
    const targetYear = year ?? currentDate.getFullYear();
    return transactions
      .filter(t => {
        const date = new Date(t.date);
        return t.type === 'income' && !this.isTransfer(t) && date.getMonth() === targetMonth && date.getFullYear() === targetYear;
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }

  async getMonthlyExpenses(month?: number, year?: number): Promise<number> {
    const transactions = await this.getTransactions();
    const currentDate = new Date();
    const targetMonth = month ?? currentDate.getMonth();
    const targetYear = year ?? currentDate.getFullYear();
    return transactions
      .filter(t => {
        const date = new Date(t.date);
        return t.type === 'expense' && !this.isTransfer(t) && date.getMonth() === targetMonth && date.getFullYear() === targetYear;
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }

  async getTotalBalance(): Promise<number> {
    const accounts = await this.getAccounts();
    return accounts.reduce((sum, account) => sum + account.balance, 0);
  }

  async getCashFlow(month?: number, year?: number): Promise<number> {
    const income = await this.getMonthlyIncome(month, year);
    const expenses = await this.getMonthlyExpenses(month, year);
    return income - expenses;
  }

  async getIncomeByCategory(month?: number, year?: number): Promise<Record<string, number>> {
    const currentDate = new Date();
    const targetMonth = month ?? currentDate.getMonth();
    const targetYear = year ?? currentDate.getFullYear();
    const transactions = (await this.getTransactions()).filter(t => {
      const date = new Date(t.date);
      return t.type === 'income' && !this.isTransfer(t) && date.getMonth() === targetMonth && date.getFullYear() === targetYear;
    });
    return transactions.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);
  }

  async getExpensesByCategory(month?: number, year?: number): Promise<Record<string, number>> {
    const currentDate = new Date();
    const targetMonth = month ?? currentDate.getMonth();
    const targetYear = year ?? currentDate.getFullYear();
    const transactions = (await this.getTransactions()).filter(t => {
      const date = new Date(t.date);
      return t.type === 'expense' && !this.isTransfer(t) && date.getMonth() === targetMonth && date.getFullYear() === targetYear;
    });
    return transactions.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);
  }

  async initializeSampleData(): Promise<void> {
    if (supabaseConfigured && this.currentUserId && this.isOnline) {
      await supabaseService.initializeSampleData(this.currentUserId);
    }
  }
}

export const dataService = new DataService();
