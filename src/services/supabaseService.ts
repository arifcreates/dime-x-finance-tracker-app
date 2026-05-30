import { supabase } from '../lib/supabase';
import { Transaction, Account, Invoice, Client, EMI, CreditCard, RecurringPayment } from '../types';
import { getInvoiceMetadata } from '../utils/invoiceUtils';

class SupabaseService {
  // Auth methods
  async signUp(email: string, password: string, name: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });

    if (error) throw error;

    // Create profile
    if (data.user) {
      await this.createProfile(data.user.id, email, name);
    }

    return data;
  }

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  }

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  async createProfile(userId: string, email: string, name: string) {
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email,
        name,
        preferences: {
          theme: 'light',
          currency: 'USD',
          notifications: true,
        },
      });

    if (error) throw error;
    return data;
  }

  async updateProfile(userId: string, updates: any) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);

    if (error) throw error;
    return data;
  }

  // Accounts
  async getAccounts(userId: string): Promise<Account[]> {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async saveAccount(userId: string, account: Account) {
    const accountData = {
      id: account.id,
      user_id: userId,
      name: account.name,
      type: account.type,
      balance: account.balance,
      currency: account.currency,
    };

    const { data, error } = await supabase
      .from('accounts')
      .upsert(accountData);

    if (error) throw error;
    return data;
  }

  async deleteAccount(accountId: string) {
    const { error } = await supabase
      .from('accounts')
      .delete()
      .eq('id', accountId);

    if (error) throw error;
  }

  // Transactions
  async getTransactions(userId: string): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async saveTransaction(userId: string, transaction: Transaction) {
    const transactionData = {
      id: transaction.id,
      user_id: userId,
      date: transaction.date,
      description: transaction.description,
      amount: transaction.amount,
      type: transaction.type,
      category: transaction.category,
      account: transaction.account,
      status: transaction.status,
    };

    const { data, error } = await supabase
      .from('transactions')
      .upsert(transactionData);

    if (error) throw error;
    return data;
  }

  async deleteTransaction(transactionId: string) {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', transactionId);

    if (error) throw error;
  }

  // Clients
  async getClients(userId: string): Promise<Client[]> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async saveClient(userId: string, client: Client) {
    const clientData = {
      id: client.id,
      user_id: userId,
      name: client.name,
      email: client.email,
      phone: client.phone,
      address: client.address,
    };

    const { data, error } = await supabase
      .from('clients')
      .upsert(clientData);

    if (error) throw error;
    return data;
  }

  async deleteClient(clientId: string) {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', clientId);

    if (error) throw error;
  }

  // Invoices
  async getInvoices(userId: string): Promise<Invoice[]> {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data?.map(invoice => {
      const storedItems = invoice.items || [];
      const items = Array.isArray(storedItems) ? storedItems : storedItems.lineItems || [];
      const metadata = Array.isArray(storedItems) ? {} : storedItems.metadata || {};

      return {
        id: invoice.id,
        clientId: invoice.client_id,
        invoiceNumber: invoice.invoice_number,
        date: invoice.date,
        dueDate: invoice.due_date,
        amount: invoice.amount,
        status: invoice.status,
        items,
        ...metadata,
      };
    }) || [];
  }

  async saveInvoice(userId: string, invoice: Invoice) {
    const invoicePayload = {
      lineItems: invoice.items,
      metadata: getInvoiceMetadata(invoice),
    };

    const invoiceData = {
      id: invoice.id,
      user_id: userId,
      client_id: invoice.clientId,
      invoice_number: invoice.invoiceNumber,
      date: invoice.date,
      due_date: invoice.dueDate,
      amount: invoice.amount,
      status: invoice.status,
      items: invoicePayload,
    };

    const { data, error } = await supabase
      .from('invoices')
      .upsert(invoiceData);

    if (error) throw error;
    return data;
  }

  async deleteInvoice(invoiceId: string) {
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', invoiceId);

    if (error) throw error;
  }

  // EMIs
  async getEMIs(userId: string): Promise<EMI[]> {
    const { data, error } = await supabase
      .from('emis')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data?.map(emi => ({
      id: emi.id,
      name: emi.name,
      principal: emi.principal,
      interestRate: emi.interest_rate,
      tenure: emi.tenure,
      monthlyAmount: emi.monthly_amount,
      remainingBalance: emi.remaining_balance,
      nextDueDate: emi.next_due_date,
    })) || [];
  }

  async saveEMI(userId: string, emi: EMI) {
    const emiData = {
      id: emi.id,
      user_id: userId,
      name: emi.name,
      principal: emi.principal,
      interest_rate: emi.interestRate,
      tenure: emi.tenure,
      monthly_amount: emi.monthlyAmount,
      remaining_balance: emi.remainingBalance,
      next_due_date: emi.nextDueDate,
    };

    const { data, error } = await supabase
      .from('emis')
      .upsert(emiData);

    if (error) throw error;
    return data;
  }

  async deleteEMI(emiId: string) {
    const { error } = await supabase
      .from('emis')
      .delete()
      .eq('id', emiId);

    if (error) throw error;
  }

  // Credit Cards
  async getCreditCards(userId: string): Promise<CreditCard[]> {
    const { data, error } = await supabase
      .from('credit_cards')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data?.map(card => ({
      id: card.id,
      name: card.name,
      creditLimit: card.credit_limit,
      currentBalance: card.current_balance,
      minimumDue: card.minimum_due,
      dueDate: card.due_date,
      interestRate: card.interest_rate,
    })) || [];
  }

  async saveCreditCard(userId: string, card: CreditCard) {
    const cardData = {
      id: card.id,
      user_id: userId,
      name: card.name,
      credit_limit: card.creditLimit,
      current_balance: card.currentBalance,
      minimum_due: card.minimumDue,
      due_date: card.dueDate,
      interest_rate: card.interestRate,
    };

    const { data, error } = await supabase
      .from('credit_cards')
      .upsert(cardData);

    if (error) throw error;
    return data;
  }

  async deleteCreditCard(cardId: string) {
    const { error } = await supabase
      .from('credit_cards')
      .delete()
      .eq('id', cardId);

    if (error) throw error;
  }

  // Recurring Payments
  async getRecurringPayments(userId: string): Promise<RecurringPayment[]> {
    const { data, error } = await supabase
      .from('recurring_payments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data?.map(payment => ({
      id: payment.id,
      name: payment.name,
      amount: payment.amount,
      frequency: payment.frequency,
      nextDate: payment.next_date,
      category: payment.category,
      isActive: payment.is_active,
    })) || [];
  }

  async saveRecurringPayment(userId: string, payment: RecurringPayment) {
    const paymentData = {
      id: payment.id,
      user_id: userId,
      name: payment.name,
      amount: payment.amount,
      frequency: payment.frequency,
      next_date: payment.nextDate,
      category: payment.category,
      is_active: payment.isActive,
    };

    const { data, error } = await supabase
      .from('recurring_payments')
      .upsert(paymentData);

    if (error) throw error;
    return data;
  }

  async deleteRecurringPayment(paymentId: string) {
    const { error } = await supabase
      .from('recurring_payments')
      .delete()
      .eq('id', paymentId);

    if (error) throw error;
  }

  // Initialize sample data for new users
  async initializeSampleData(userId: string) {
    try {
      // Check if user already has data
      const accounts = await this.getAccounts(userId);
      if (accounts.length > 0) return; // User already has data

      // Create sample accounts
      const sampleAccounts: Account[] = [
        { id: crypto.randomUUID(), name: 'Primary Savings', type: 'savings', balance: 45000, currency: 'USD' },
        { id: crypto.randomUUID(), name: 'Business Current', type: 'current', balance: 28500, currency: 'USD' },
        { id: crypto.randomUUID(), name: 'Cash in Hand', type: 'cash', balance: 2500, currency: 'USD' },
        { id: crypto.randomUUID(), name: 'Investment Account', type: 'investment', balance: 15000, currency: 'USD' },
      ];

      for (const account of sampleAccounts) {
        await this.saveAccount(userId, account);
      }

      // Create sample transactions
      const sampleTransactions: Transaction[] = [
        { id: crypto.randomUUID(), date: '2024-01-15', description: 'Website Development - TechCorp', amount: 4500, type: 'income', category: 'Freelance', account: 'Business Current', status: 'completed' },
        { id: crypto.randomUUID(), date: '2024-01-20', description: 'Mobile App Consulting', amount: 2800, type: 'income', category: 'Consulting', account: 'Business Current', status: 'completed' },
        { id: crypto.randomUUID(), date: '2024-01-14', description: 'Office Supplies & Equipment', amount: 320, type: 'expense', category: 'Office', account: 'Business Current', status: 'completed' },
        { id: crypto.randomUUID(), date: '2024-01-16', description: 'Adobe Creative Suite', amount: 89, type: 'expense', category: 'Software', account: 'Business Current', status: 'completed' },
      ];

      for (const transaction of sampleTransactions) {
        await this.saveTransaction(userId, transaction);
      }

      // Create sample clients
      const sampleClients: Client[] = [
        { id: crypto.randomUUID(), name: 'TechCorp Solutions', email: 'contact@techcorp.com', phone: '+1-555-0123', address: '123 Tech Street, Silicon Valley, CA 94000' },
        { id: crypto.randomUUID(), name: 'StartupXYZ', email: 'hello@startupxyz.com', phone: '+1-555-0456', address: '456 Innovation Ave, Austin, TX 78701' },
      ];

      for (const client of sampleClients) {
        await this.saveClient(userId, client);
      }

    } catch (error) {
      console.error('Error initializing sample data:', error);
    }
  }
}

export const supabaseService = new SupabaseService();
