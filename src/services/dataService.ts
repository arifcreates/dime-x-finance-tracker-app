import { Transaction, Account, Invoice, Client, EMI, CreditCard, RecurringPayment } from '../types';
import { supabaseService } from './supabaseService';
import { supabase } from '../lib/supabase';

class DataService {
  private currentUserId: string | null = null;
  private isOnline = true;

  constructor() {
    // Listen for auth state changes
    supabase.auth.onAuthStateChange((event, session) => {
      this.currentUserId = session?.user?.id || null;
      if (event === 'SIGNED_IN' && this.currentUserId) {
        this.syncLocalDataToSupabase();
      }
    });

    // Check online status
    window.addEventListener('online', () => {
      this.isOnline = true;
      if (this.currentUserId) {
        this.syncLocalDataToSupabase();
      }
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  private async syncLocalDataToSupabase() {
    if (!this.currentUserId || !this.isOnline) return;

    try {
      // Sync accounts
      const localAccounts = this.getFromStorage<Account>('accounts');
      for (const account of localAccounts) {
        await supabaseService.saveAccount(this.currentUserId, account);
      }

      // Sync transactions
      const localTransactions = this.getFromStorage<Transaction>('transactions');
      for (const transaction of localTransactions) {
        await supabaseService.saveTransaction(this.currentUserId, transaction);
      }

      // Clear local storage after successful sync
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

  private async useSupabaseOrFallback<T>(
    supabaseMethod: () => Promise<T>,
    fallbackMethod: () => T
  ): Promise<T> {
    if (this.currentUserId && this.isOnline) {
      try {
        return await supabaseMethod();
      } catch (error) {
        console.error('Supabase error, falling back to localStorage:', error);
        return fallbackMethod();
      }
    }
    return fallbackMethod();
  }

  // Transactions
  async getTransactions(): Promise<Transaction[]> {
    return this.useSupabaseOrFallback(
      () => supabaseService.getTransactions(this.currentUserId!),
      () => this.getFromStorage<Transaction>('transactions')
    );
  }

  async saveTransaction(transaction: Transaction): Promise<void> {
    if (this.currentUserId && this.isOnline) {
      try {
        await supabaseService.saveTransaction(this.currentUserId, transaction);
        return;
      } catch (error) {
        console.error('Error saving to Supabase, saving locally:', error);
      }
    }
    
    // Fallback to localStorage
    const transactions = this.getFromStorage<Transaction>('transactions');
    const existingIndex = transactions.findIndex(t => t.id === transaction.id);
    
    if (existingIndex >= 0) {
      transactions[existingIndex] = transaction;
    } else {
      transactions.push(transaction);
    }
    
    this.saveToStorage('transactions', transactions);
  }

  async deleteTransaction(id: string): Promise<void> {
    if (this.currentUserId && this.isOnline) {
      try {
        await supabaseService.deleteTransaction(id);
        return;
      } catch (error) {
        console.error('Error deleting from Supabase, deleting locally:', error);
      }
    }
    
    const transactions = this.getFromStorage<Transaction>('transactions').filter(t => t.id !== id);
    this.saveToStorage('transactions', transactions);
  }

  // Accounts
  async getAccounts(): Promise<Account[]> {
    return this.useSupabaseOrFallback(
      () => supabaseService.getAccounts(this.currentUserId!),
      () => this.getFromStorage<Account>('accounts')
    );
  }

  async saveAccount(account: Account): Promise<void> {
    if (this.currentUserId && this.isOnline) {
      try {
        await supabaseService.saveAccount(this.currentUserId, account);
        return;
      } catch (error) {
        console.error('Error saving to Supabase, saving locally:', error);
      }
    }
    
    const accounts = this.getFromStorage<Account>('accounts');
    const existingIndex = accounts.findIndex(a => a.id === account.id);
    
    if (existingIndex >= 0) {
      accounts[existingIndex] = account;
    } else {
      accounts.push(account);
    }
    
    this.saveToStorage('accounts', accounts);
  }

  async deleteAccount(id: string): Promise<void> {
    if (this.currentUserId && this.isOnline) {
      try {
        await supabaseService.deleteAccount(id);
        return;
      } catch (error) {
        console.error('Error deleting from Supabase, deleting locally:', error);
      }
    }
    
    const accounts = this.getFromStorage<Account>('accounts').filter(a => a.id !== id);
    this.saveToStorage('accounts', accounts);
  }

  // Invoices
  async getInvoices(): Promise<Invoice[]> {
    return this.useSupabaseOrFallback(
      () => supabaseService.getInvoices(this.currentUserId!),
      () => this.getFromStorage<Invoice>('invoices')
    );
  }

  async saveInvoice(invoice: Invoice): Promise<void> {
    if (this.currentUserId && this.isOnline) {
      try {
        await supabaseService.saveInvoice(this.currentUserId, invoice);
        return;
      } catch (error) {
        console.error('Error saving to Supabase, saving locally:', error);
      }
    }
    
    const invoices = this.getFromStorage<Invoice>('invoices');
    const existingIndex = invoices.findIndex(i => i.id === invoice.id);
    
    if (existingIndex >= 0) {
      invoices[existingIndex] = invoice;
    } else {
      invoices.push(invoice);
    }
    
    this.saveToStorage('invoices', invoices);
  }

  async deleteInvoice(id: string): Promise<void> {
    if (this.currentUserId && this.isOnline) {
      try {
        await supabaseService.deleteInvoice(id);
        return;
      } catch (error) {
        console.error('Error deleting from Supabase, deleting locally:', error);
      }
    }
    
    const invoices = this.getFromStorage<Invoice>('invoices').filter(i => i.id !== id);
    this.saveToStorage('invoices', invoices);
  }

  // Clients
  async getClients(): Promise<Client[]> {
    return this.useSupabaseOrFallback(
      () => supabaseService.getClients(this.currentUserId!),
      () => this.getFromStorage<Client>('clients')
    );
  }

  async saveClient(client: Client): Promise<void> {
    if (this.currentUserId && this.isOnline) {
      try {
        await supabaseService.saveClient(this.currentUserId, client);
        return;
      } catch (error) {
        console.error('Error saving to Supabase, saving locally:', error);
      }
    }
    
    const clients = this.getFromStorage<Client>('clients');
    const existingIndex = clients.findIndex(c => c.id === client.id);
    
    if (existingIndex >= 0) {
      clients[existingIndex] = client;
    } else {
      clients.push(client);
    }
    
    this.saveToStorage('clients', clients);
  }

  async deleteClient(id: string): Promise<void> {
    if (this.currentUserId && this.isOnline) {
      try {
        await supabaseService.deleteClient(id);
        return;
      } catch (error) {
        console.error('Error deleting from Supabase, deleting locally:', error);
      }
    }
    
    const clients = this.getFromStorage<Client>('clients').filter(c => c.id !== id);
    this.saveToStorage('clients', clients);
  }

  // EMIs
  async getEMIs(): Promise<EMI[]> {
    return this.useSupabaseOrFallback(
      () => supabaseService.getEMIs(this.currentUserId!),
      () => this.getFromStorage<EMI>('emis')
    );
  }

  async saveEMI(emi: EMI): Promise<void> {
    if (this.currentUserId && this.isOnline) {
      try {
        await supabaseService.saveEMI(this.currentUserId, emi);
        return;
      } catch (error) {
        console.error('Error saving to Supabase, saving locally:', error);
      }
    }
    
    const emis = this.getFromStorage<EMI>('emis');
    const existingIndex = emis.findIndex(e => e.id === emi.id);
    
    if (existingIndex >= 0) {
      emis[existingIndex] = emi;
    } else {
      emis.push(emi);
    }
    
    this.saveToStorage('emis', emis);
  }

  async deleteEMI(id: string): Promise<void> {
    if (this.currentUserId && this.isOnline) {
      try {
        await supabaseService.deleteEMI(id);
        return;
      } catch (error) {
        console.error('Error deleting from Supabase, deleting locally:', error);
      }
    }
    
    const emis = this.getFromStorage<EMI>('emis').filter(e => e.id !== id);
    this.saveToStorage('emis', emis);
  }

  // Credit Cards
  async getCreditCards(): Promise<CreditCard[]> {
    return this.useSupabaseOrFallback(
      () => supabaseService.getCreditCards(this.currentUserId!),
      () => this.getFromStorage<CreditCard>('creditcards')
    );
  }

  async saveCreditCard(card: CreditCard): Promise<void> {
    if (this.currentUserId && this.isOnline) {
      try {
        await supabaseService.saveCreditCard(this.currentUserId, card);
        return;
      } catch (error) {
        console.error('Error saving to Supabase, saving locally:', error);
      }
    }
    
    const cards = this.getFromStorage<CreditCard>('creditcards');
    const existingIndex = cards.findIndex(c => c.id === card.id);
    
    if (existingIndex >= 0) {
      cards[existingIndex] = card;
    } else {
      cards.push(card);
    }
    
    this.saveToStorage('creditcards', cards);
  }

  async deleteCreditCard(id: string): Promise<void> {
    if (this.currentUserId && this.isOnline) {
      try {
        await supabaseService.deleteCreditCard(id);
        return;
      } catch (error) {
        console.error('Error deleting from Supabase, deleting locally:', error);
      }
    }
    
    const cards = this.getFromStorage<CreditCard>('creditcards').filter(c => c.id !== id);
    this.saveToStorage('creditcards', cards);
  }

  // Recurring Payments
  async getRecurringPayments(): Promise<RecurringPayment[]> {
    return this.useSupabaseOrFallback(
      () => supabaseService.getRecurringPayments(this.currentUserId!),
      () => this.getFromStorage<RecurringPayment>('recurringpayments')
    );
  }

  async saveRecurringPayment(payment: RecurringPayment): Promise<void> {
    if (this.currentUserId && this.isOnline) {
      try {
        await supabaseService.saveRecurringPayment(this.currentUserId, payment);
        return;
      } catch (error) {
        console.error('Error saving to Supabase, saving locally:', error);
      }
    }
    
    const payments = this.getFromStorage<RecurringPayment>('recurringpayments');
    const existingIndex = payments.findIndex(p => p.id === payment.id);
    
    if (existingIndex >= 0) {
      payments[existingIndex] = payment;
    } else {
      payments.push(payment);
    }
    
    this.saveToStorage('recurringpayments', payments);
  }

  async deleteRecurringPayment(id: string): Promise<void> {
    if (this.currentUserId && this.isOnline) {
      try {
        await supabaseService.deleteRecurringPayment(id);
        return;
      } catch (error) {
        console.error('Error deleting from Supabase, deleting locally:', error);
      }
    }
    
    const payments = this.getFromStorage<RecurringPayment>('recurringpayments').filter(p => p.id !== id);
    this.saveToStorage('recurringpayments', payments);
  }

  // Analytics and calculations
  async getMonthlyIncome(month?: number, year?: number): Promise<number> {
    const transactions = await this.getTransactions();
    const currentDate = new Date();
    const targetMonth = month ?? currentDate.getMonth();
    const targetYear = year ?? currentDate.getFullYear();

    return transactions
      .filter(t => {
        const date = new Date(t.date);
        return t.type === 'income' && 
               date.getMonth() === targetMonth && 
               date.getFullYear() === targetYear;
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
        return t.type === 'expense' && 
               date.getMonth() === targetMonth && 
               date.getFullYear() === targetYear;
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

  // Initialize sample data for new users
  async initializeSampleData(): Promise<void> {
    if (this.currentUserId && this.isOnline) {
      await supabaseService.initializeSampleData(this.currentUserId);
    }
  }
}

export const dataService = new DataService();