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
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  private saveToStorage<T>(key: string, data: T[]): void {
    localStorage.setItem(key, JSON.stringify(data));
  }

  private async fetchFromSupabaseOrStorage<T>(
    supabaseMethod: () => Promise<T[]>,
    storageKey: string
  ): Promise<T[]> {
    if (supabaseConfigured && this.currentUserId && this.isOnline) {
      try {
        return await supabaseMethod();
      } catch (error) {
        console.error('Supabase error, falling back to localStorage:', error);
        return this.getFromStorage<T>(storageKey);
      }
    }
    return this.getFromStorage<T>(storageKey);
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
    if (supabaseConfigured && this.currentUserId && this.isOnline) {
      try { await supabaseService.saveTransaction(this.currentUserId, transaction); }
      catch (error) { console.error('Error saving to Supabase, saving locally:', error); }
    } else {
      const items = this.getFromStorage<Transaction>('transactions');
      const idx = items.findIndex(t => t.id === transaction.id);
      if (idx >= 0) items[idx] = transaction; else items.push(transaction);
      this.saveToStorage('transactions', items);
    }
    const idx = this.cache.transactions.findIndex(t => t.id === transaction.id);
    if (idx >= 0) this.cache.transactions[idx] = transaction;
    else this.cache.transactions.push(transaction);
  }

  async deleteTransaction(id: string): Promise<void> {
    if (supabaseConfigured && this.currentUserId && this.isOnline) {
      try { await supabaseService.deleteTransaction(id); }
      catch (error) { console.error('Error deleting from Supabase:', error); }
    } else {
      this.saveToStorage('transactions', this.getFromStorage<Transaction>('transactions').filter(t => t.id !== id));
    }
    this.cache.transactions = this.cache.transactions.filter(t => t.id !== id);
  }

  async saveAccount(account: Account): Promise<void> {
    if (supabaseConfigured && this.currentUserId && this.isOnline) {
      try { await supabaseService.saveAccount(this.currentUserId, account); }
      catch (error) { console.error('Error saving to Supabase:', error); }
    } else {
      const items = this.getFromStorage<Account>('accounts');
      const idx = items.findIndex(a => a.id === account.id);
      if (idx >= 0) items[idx] = account; else items.push(account);
      this.saveToStorage('accounts', items);
    }
    const idx = this.cache.accounts.findIndex(a => a.id === account.id);
    if (idx >= 0) this.cache.accounts[idx] = account;
    else this.cache.accounts.push(account);
  }

  async deleteAccount(id: string): Promise<void> {
    if (supabaseConfigured && this.currentUserId && this.isOnline) {
      try { await supabaseService.deleteAccount(id); }
      catch (error) { console.error('Error deleting from Supabase:', error); }
    } else {
      this.saveToStorage('accounts', this.getFromStorage<Account>('accounts').filter(a => a.id !== id));
    }
    this.cache.accounts = this.cache.accounts.filter(a => a.id !== id);
  }

  async saveInvoice(invoice: Invoice): Promise<void> {
    if (supabaseConfigured && this.currentUserId && this.isOnline) {
      try { await supabaseService.saveInvoice(this.currentUserId, invoice); }
      catch (error) { console.error('Error saving to Supabase:', error); }
    } else {
      const items = this.getFromStorage<Invoice>('invoices');
      const idx = items.findIndex(i => i.id === invoice.id);
      if (idx >= 0) items[idx] = invoice; else items.push(invoice);
      this.saveToStorage('invoices', items);
    }
    const idx = this.cache.invoices.findIndex(i => i.id === invoice.id);
    if (idx >= 0) this.cache.invoices[idx] = invoice;
    else this.cache.invoices.push(invoice);
  }

  async deleteInvoice(id: string): Promise<void> {
    if (supabaseConfigured && this.currentUserId && this.isOnline) {
      try { await supabaseService.deleteInvoice(id); }
      catch (error) { console.error('Error deleting from Supabase:', error); }
    } else {
      this.saveToStorage('invoices', this.getFromStorage<Invoice>('invoices').filter(i => i.id !== id));
    }
    this.cache.invoices = this.cache.invoices.filter(i => i.id !== id);
  }

  async saveClient(client: Client): Promise<void> {
    if (supabaseConfigured && this.currentUserId && this.isOnline) {
      try { await supabaseService.saveClient(this.currentUserId, client); }
      catch (error) { console.error('Error saving to Supabase:', error); }
    } else {
      const items = this.getFromStorage<Client>('clients');
      const idx = items.findIndex(c => c.id === client.id);
      if (idx >= 0) items[idx] = client; else items.push(client);
      this.saveToStorage('clients', items);
    }
    const idx = this.cache.clients.findIndex(c => c.id === client.id);
    if (idx >= 0) this.cache.clients[idx] = client;
    else this.cache.clients.push(client);
  }

  async deleteClient(id: string): Promise<void> {
    if (supabaseConfigured && this.currentUserId && this.isOnline) {
      try { await supabaseService.deleteClient(id); }
      catch (error) { console.error('Error deleting from Supabase:', error); }
    } else {
      this.saveToStorage('clients', this.getFromStorage<Client>('clients').filter(c => c.id !== id));
    }
    this.cache.clients = this.cache.clients.filter(c => c.id !== id);
  }

  async saveEMI(emi: EMI): Promise<void> {
    if (supabaseConfigured && this.currentUserId && this.isOnline) {
      try { await supabaseService.saveEMI(this.currentUserId, emi); }
      catch (error) { console.error('Error saving to Supabase:', error); }
    } else {
      const items = this.getFromStorage<EMI>('emis');
      const idx = items.findIndex(e => e.id === emi.id);
      if (idx >= 0) items[idx] = emi; else items.push(emi);
      this.saveToStorage('emis', items);
    }
    const idx = this.cache.emis.findIndex(e => e.id === emi.id);
    if (idx >= 0) this.cache.emis[idx] = emi;
    else this.cache.emis.push(emi);
  }

  async deleteEMI(id: string): Promise<void> {
    if (supabaseConfigured && this.currentUserId && this.isOnline) {
      try { await supabaseService.deleteEMI(id); }
      catch (error) { console.error('Error deleting from Supabase:', error); }
    } else {
      this.saveToStorage('emis', this.getFromStorage<EMI>('emis').filter(e => e.id !== id));
    }
    this.cache.emis = this.cache.emis.filter(e => e.id !== id);
  }

  async saveCreditCard(card: CreditCard): Promise<void> {
    if (supabaseConfigured && this.currentUserId && this.isOnline) {
      try { await supabaseService.saveCreditCard(this.currentUserId, card); }
      catch (error) { console.error('Error saving to Supabase:', error); }
    } else {
      const items = this.getFromStorage<CreditCard>('creditcards');
      const idx = items.findIndex(c => c.id === card.id);
      if (idx >= 0) items[idx] = card; else items.push(card);
      this.saveToStorage('creditcards', items);
    }
    const idx = this.cache.creditCards.findIndex(c => c.id === card.id);
    if (idx >= 0) this.cache.creditCards[idx] = card;
    else this.cache.creditCards.push(card);
  }

  async deleteCreditCard(id: string): Promise<void> {
    if (supabaseConfigured && this.currentUserId && this.isOnline) {
      try { await supabaseService.deleteCreditCard(id); }
      catch (error) { console.error('Error deleting from Supabase:', error); }
    } else {
      this.saveToStorage('creditcards', this.getFromStorage<CreditCard>('creditcards').filter(c => c.id !== id));
    }
    this.cache.creditCards = this.cache.creditCards.filter(c => c.id !== id);
  }

  async saveRecurringPayment(payment: RecurringPayment): Promise<void> {
    if (supabaseConfigured && this.currentUserId && this.isOnline) {
      try { await supabaseService.saveRecurringPayment(this.currentUserId, payment); }
      catch (error) { console.error('Error saving to Supabase:', error); }
    } else {
      const items = this.getFromStorage<RecurringPayment>('recurringpayments');
      const idx = items.findIndex(p => p.id === payment.id);
      if (idx >= 0) items[idx] = payment; else items.push(payment);
      this.saveToStorage('recurringpayments', items);
    }
    const idx = this.cache.recurringPayments.findIndex(p => p.id === payment.id);
    if (idx >= 0) this.cache.recurringPayments[idx] = payment;
    else this.cache.recurringPayments.push(payment);
  }

  async deleteRecurringPayment(id: string): Promise<void> {
    if (supabaseConfigured && this.currentUserId && this.isOnline) {
      try { await supabaseService.deleteRecurringPayment(id); }
      catch (error) { console.error('Error deleting from Supabase:', error); }
    } else {
      this.saveToStorage('recurringpayments', this.getFromStorage<RecurringPayment>('recurringpayments').filter(p => p.id !== id));
    }
    this.cache.recurringPayments = this.cache.recurringPayments.filter(p => p.id !== id);
  }

  // ── Analytics (computed from cache after async load) ────────────────────────

  async getMonthlyIncome(month?: number, year?: number): Promise<number> {
    const transactions = await this.getTransactions();
    const currentDate = new Date();
    const targetMonth = month ?? currentDate.getMonth();
    const targetYear = year ?? currentDate.getFullYear();
    return transactions
      .filter(t => {
        const date = new Date(t.date);
        return t.type === 'income' && date.getMonth() === targetMonth && date.getFullYear() === targetYear;
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
        return t.type === 'expense' && date.getMonth() === targetMonth && date.getFullYear() === targetYear;
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

  async getIncomeByCategory(): Promise<Record<string, number>> {
    const transactions = (await this.getTransactions()).filter(t => t.type === 'income');
    return transactions.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);
  }

  async getExpensesByCategory(): Promise<Record<string, number>> {
    const transactions = (await this.getTransactions()).filter(t => t.type === 'expense');
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
