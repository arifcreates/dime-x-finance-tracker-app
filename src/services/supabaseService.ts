import { supabase } from '../lib/supabase';
import { Transaction, Account, Invoice, Client, EMI, CreditCard, RecurringPayment, UserProfile, UserPreferences, Category, CategoryRule } from '../types';
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
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) throw error;

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
    const profile = data as UserProfile;
    return { ...profile, preferences: { theme: 'light' as const, currency: 'INR', notifications: true, ...(profile.preferences as Partial<UserPreferences>) } };
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

  async updateProfile(userId: string, updates: Partial<Pick<UserProfile, 'name' | 'phone' | 'preferences' | 'business_profile'>>) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId).select('id').single();

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
      .upsert(accountData).select().single();

    if (error) throw error;
    return data;
  }

  async deleteAccount(accountId: string) {
    const { error } = await supabase
      .from('accounts')
      .delete()
      .eq('id', accountId).select('id').single();

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
    return (data || []).map(t => ({ ...t, accountId: t.account_id, invoiceId: t.invoice_id || undefined, transferId: t.transfer_id || undefined, categoryId: t.category_id || undefined }));
  }

  private transactionData(userId: string, transaction: Transaction) {
    return {
      id: transaction.id,
      user_id: userId,
      date: transaction.date,
      description: transaction.description,
      amount: transaction.amount,
      type: transaction.type,
      category: transaction.category,
      account: transaction.account,
      account_id: transaction.accountId,
      currency: transaction.currency,
      status: transaction.status,
      source: transaction.source || 'manual',
      category_id: transaction.categoryId || null,
    };
  }

  async saveTransactions(userId: string, transactions: Transaction[]) {
    const { error } = await supabase.from('transactions').upsert(transactions.map(t => this.transactionData(userId, t)));
    if (error) throw error;
  }

  async saveTransaction(userId: string, transaction: Transaction) {
    const transactionData = this.transactionData(userId, transaction);
    const { data, error } = await supabase
      .from('transactions')
      .upsert(transactionData).select().single();

    if (error) throw error;
    return data;
  }

  async deleteTransaction(transactionId: string) {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', transactionId).select('id').single();

    if (error) throw error;
  }

  async getCategories(userId: string): Promise<Category[]> {
    const { data, error } = await supabase.from('categories').select('id,name,bucket').eq('user_id', userId).order('name');
    if (error) throw error;
    return data || [];
  }

  async getCategoryRules(userId: string): Promise<CategoryRule[]> {
    const { data, error } = await supabase.from('category_rules').select('id,match_text,category_id').eq('user_id', userId);
    if (error) throw error;
    return (data || []).map(r => ({id:r.id, matchText:r.match_text, categoryId:r.category_id}));
  }

  async saveCategory(userId: string, category: Category): Promise<Category> {
    const { data, error } = await supabase.from('categories').upsert({user_id:userId,name:category.name,bucket:category.bucket}, {onConflict:'user_id,name'}).select('id,name,bucket').single();
    if (error) throw error;
    return data;
  }

  async saveCategoryRule(userId: string, rule: CategoryRule): Promise<CategoryRule> {
    const { data, error } = await supabase.from('category_rules').upsert({user_id:userId,match_text:rule.matchText,category_id:rule.categoryId}, {onConflict:'user_id,match_text'}).select('id,match_text,category_id').single();
    if (error) throw error;
    return {id:data.id,matchText:data.match_text,categoryId:data.category_id};
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
      .upsert(clientData).select().single();

    if (error) throw error;
    return data;
  }

  async deleteClient(clientId: string) {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', clientId).select('id').single();

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
      client_id: invoice.clientId || null,
      invoice_number: invoice.invoiceNumber,
      date: invoice.date,
      due_date: invoice.dueDate,
      amount: invoice.amount,
      status: invoice.status,
      items: invoicePayload,
    };

    const { data, error } = await supabase
      .from('invoices')
      .upsert(invoiceData).select().single();

    if (error) throw error;
    return data;
  }

  async deleteInvoice(invoiceId: string) {
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', invoiceId).select('id').single();

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
      currency: emi.currency,
      principal: emi.principal,
      interestRate: emi.interest_rate,
      tenure: emi.tenure,
      monthlyAmount: emi.monthly_amount,
      remainingBalance: emi.remaining_balance,
      nextDueDate: emi.next_due_date,
      debtType: emi.debt_type || 'emi',
      creditTakenDate: emi.credit_taken_date || undefined,
      creditedAccountId: emi.credited_account_id || undefined,
      creditedAccountName: emi.credited_account_name || undefined,
    })) || [];
  }

  async saveEMI(userId: string, emi: EMI) {
    const emiData = {
      id: emi.id,
      user_id: userId,
      name: emi.name,
      currency: emi.currency,
      principal: emi.principal,
      interest_rate: emi.interestRate,
      tenure: emi.tenure,
      monthly_amount: emi.monthlyAmount,
      remaining_balance: emi.remainingBalance,
      next_due_date: emi.nextDueDate,
      debt_type: emi.debtType || 'emi',
      credit_taken_date: emi.creditTakenDate || null,
      credited_account_id: emi.creditedAccountId || null,
      credited_account_name: emi.creditedAccountName || null,
    };

    const { data, error } = await supabase
      .from('emis')
      .upsert(emiData).select().single();

    if (error) throw error;
    return data;
  }

  async deleteEMI(emiId: string) {
    const { error } = await supabase
      .from('emis')
      .delete()
      .eq('id', emiId).select('id').single();

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
      currency: card.currency,
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
      currency: card.currency,
      credit_limit: card.creditLimit,
      current_balance: card.currentBalance,
      minimum_due: card.minimumDue,
      due_date: card.dueDate,
      interest_rate: card.interestRate,
    };

    const { data, error } = await supabase
      .from('credit_cards')
      .upsert(cardData).select().single();

    if (error) throw error;
    return data;
  }

  async deleteCreditCard(cardId: string) {
    const { error } = await supabase
      .from('credit_cards')
      .delete()
      .eq('id', cardId).select('id').single();

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
      currency: payment.currency,
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
      currency: payment.currency,
      amount: payment.amount,
      frequency: payment.frequency,
      next_date: payment.nextDate,
      category: payment.category,
      is_active: payment.isActive,
    };

    const { data, error } = await supabase
      .from('recurring_payments')
      .upsert(paymentData).select().single();

    if (error) throw error;
    return data;
  }

  async deleteRecurringPayment(paymentId: string) {
    const { error } = await supabase
      .from('recurring_payments')
      .delete()
      .eq('id', paymentId).select('id').single();

    if (error) throw error;
  }

  async recordInvoicePayment(invoiceId: string, accountId: string, amount: number) {
    const { error } = await supabase.rpc('record_invoice_payment', { p_invoice_id: invoiceId, p_account_id: accountId, p_amount: amount });
    if (error) throw error;
  }
  async transfer(fromId: string, toId: string, amount: number, description: string, requestId: string) {
    const { error } = await supabase.rpc('transfer_funds', { p_from: fromId, p_to: toId, p_amount: amount, p_description: description, p_request_id: requestId });
    if (error) throw error;
  }

  // New users must start with an empty workspace. Keep this as a no-op so
  // older call sites cannot accidentally seed demo balances into real accounts.
  async initializeSampleData(userId: string) {
    console.info('Sample data seeding is disabled for user workspaces:', userId);
  }
}

export const supabaseService = new SupabaseService();
