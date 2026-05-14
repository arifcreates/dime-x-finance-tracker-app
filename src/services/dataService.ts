import { Transaction, Account, Invoice, Client, EMI, CreditCard, RecurringPayment } from '../types';

class DataService {
  private getFromStorage<T>(key: string): T[] {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  private saveToStorage<T>(key: string, data: T[]): void {
    localStorage.setItem(key, JSON.stringify(data));
  }

  // Check if user is guest
  private isGuestUser(): boolean {
    const user = localStorage.getItem('user');
    if (!user) return true;
    const userData = JSON.parse(user);
    return userData.id === 'guest';
  }

  // Transactions
  getTransactions(): Transaction[] {
    if (this.isGuestUser()) {
      return []; // Return empty array for guest users
    }
    return this.getFromStorage<Transaction>('transactions');
  }

  saveTransaction(transaction: Transaction): void {
    if (this.isGuestUser()) return; // Don't save for guest users
    
    const transactions = this.getTransactions();
    const existingIndex = transactions.findIndex(t => t.id === transaction.id);
    
    if (existingIndex >= 0) {
      transactions[existingIndex] = transaction;
    } else {
      transactions.push(transaction);
    }
    
    this.saveToStorage('transactions', transactions);
  }

  deleteTransaction(id: string): void {
    if (this.isGuestUser()) return;
    
    const transactions = this.getTransactions().filter(t => t.id !== id);
    this.saveToStorage('transactions', transactions);
  }

  // Accounts
  getAccounts(): Account[] {
    if (this.isGuestUser()) {
      return []; // Return empty array for guest users
    }
    return this.getFromStorage<Account>('accounts');
  }

  saveAccount(account: Account): void {
    if (this.isGuestUser()) return;
    
    const accounts = this.getAccounts();
    const existingIndex = accounts.findIndex(a => a.id === account.id);
    
    if (existingIndex >= 0) {
      accounts[existingIndex] = account;
    } else {
      accounts.push(account);
    }
    
    this.saveToStorage('accounts', accounts);
  }

  deleteAccount(id: string): void {
    if (this.isGuestUser()) return;
    
    const accounts = this.getAccounts().filter(a => a.id !== id);
    this.saveToStorage('accounts', accounts);
  }

  // Invoices
  getInvoices(): Invoice[] {
    if (this.isGuestUser()) return [];
    return this.getFromStorage<Invoice>('invoices');
  }

  saveInvoice(invoice: Invoice): void {
    if (this.isGuestUser()) return;
    
    const invoices = this.getInvoices();
    const existingIndex = invoices.findIndex(i => i.id === invoice.id);
    
    if (existingIndex >= 0) {
      invoices[existingIndex] = invoice;
    } else {
      invoices.push(invoice);
    }
    
    this.saveToStorage('invoices', invoices);
  }

  deleteInvoice(id: string): void {
    if (this.isGuestUser()) return;
    
    const invoices = this.getInvoices().filter(i => i.id !== id);
    this.saveToStorage('invoices', invoices);
  }

  // Clients
  getClients(): Client[] {
    if (this.isGuestUser()) return [];
    return this.getFromStorage<Client>('clients');
  }

  saveClient(client: Client): void {
    if (this.isGuestUser()) return;
    
    const clients = this.getClients();
    const existingIndex = clients.findIndex(c => c.id === client.id);
    
    if (existingIndex >= 0) {
      clients[existingIndex] = client;
    } else {
      clients.push(client);
    }
    
    this.saveToStorage('clients', clients);
  }

  deleteClient(id: string): void {
    if (this.isGuestUser()) return;
    
    const clients = this.getClients().filter(c => c.id !== id);
    this.saveToStorage('clients', clients);
  }

  // EMIs
  getEMIs(): EMI[] {
    if (this.isGuestUser()) return [];
    return this.getFromStorage<EMI>('emis');
  }

  saveEMI(emi: EMI): void {
    if (this.isGuestUser()) return;
    
    const emis = this.getEMIs();
    const existingIndex = emis.findIndex(e => e.id === emi.id);
    
    if (existingIndex >= 0) {
      emis[existingIndex] = emi;
    } else {
      emis.push(emi);
    }
    
    this.saveToStorage('emis', emis);
  }

  deleteEMI(id: string): void {
    if (this.isGuestUser()) return;
    
    const emis = this.getEMIs().filter(e => e.id !== id);
    this.saveToStorage('emis', emis);
  }

  // Credit Cards
  getCreditCards(): CreditCard[] {
    if (this.isGuestUser()) return [];
    return this.getFromStorage<CreditCard>('creditcards');
  }

  saveCreditCard(card: CreditCard): void {
    if (this.isGuestUser()) return;
    
    const cards = this.getCreditCards();
    const existingIndex = cards.findIndex(c => c.id === card.id);
    
    if (existingIndex >= 0) {
      cards[existingIndex] = card;
    } else {
      cards.push(card);
    }
    
    this.saveToStorage('creditcards', cards);
  }

  deleteCreditCard(id: string): void {
    if (this.isGuestUser()) return;
    
    const cards = this.getCreditCards().filter(c => c.id !== id);
    this.saveToStorage('creditcards', cards);
  }

  // Recurring Payments
  getRecurringPayments(): RecurringPayment[] {
    if (this.isGuestUser()) return [];
    return this.getFromStorage<RecurringPayment>('recurringpayments');
  }

  saveRecurringPayment(payment: RecurringPayment): void {
    if (this.isGuestUser()) return;
    
    const payments = this.getRecurringPayments();
    const existingIndex = payments.findIndex(p => p.id === payment.id);
    
    if (existingIndex >= 0) {
      payments[existingIndex] = payment;
    } else {
      payments.push(payment);
    }
    
    this.saveToStorage('recurringpayments', payments);
  }

  deleteRecurringPayment(id: string): void {
    if (this.isGuestUser()) return;
    
    const payments = this.getRecurringPayments().filter(p => p.id !== id);
    this.saveToStorage('recurringpayments', payments);
  }

  // Analytics and calculations
  getMonthlyIncome(month?: number, year?: number): number {
    const transactions = this.getTransactions();
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

  getMonthlyExpenses(month?: number, year?: number): number {
    const transactions = this.getTransactions();
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

  getTotalBalance(): number {
    return this.getAccounts().reduce((sum, account) => sum + account.balance, 0);
  }

  getCashFlow(month?: number, year?: number): number {
    return this.getMonthlyIncome(month, year) - this.getMonthlyExpenses(month, year);
  }

  getIncomeByCategory(): Record<string, number> {
    const transactions = this.getTransactions().filter(t => t.type === 'income');
    return transactions.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);
  }

  getExpensesByCategory(): Record<string, number> {
    const transactions = this.getTransactions().filter(t => t.type === 'expense');
    return transactions.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);
  }

  // Sample data initialization - only for registered users
  initializeSampleData(): void {
    if (this.isGuestUser()) return; // Don't initialize sample data for guest users
    
    if (this.getAccounts().length === 0) {
      const sampleAccounts: Account[] = [
        { id: '1', name: 'Primary Savings', type: 'savings', balance: 45000, currency: 'USD' },
        { id: '2', name: 'Business Current', type: 'current', balance: 28500, currency: 'USD' },
        { id: '3', name: 'Cash in Hand', type: 'cash', balance: 2500, currency: 'USD' },
        { id: '4', name: 'Investment Account', type: 'investment', balance: 15000, currency: 'USD' },
      ];
      this.saveToStorage('accounts', sampleAccounts);
    }

    if (this.getTransactions().length === 0) {
      const sampleTransactions: Transaction[] = [
        // Income transactions
        { id: '1', date: '2024-01-15', description: 'Website Development - TechCorp', amount: 4500, type: 'income', category: 'Freelance', account: 'Business Current', status: 'completed' },
        { id: '2', date: '2024-01-20', description: 'Mobile App Consulting', amount: 2800, type: 'income', category: 'Consulting', account: 'Business Current', status: 'completed' },
        { id: '3', date: '2024-01-25', description: 'Product Sales Commission', amount: 1200, type: 'income', category: 'Product Sales', account: 'Primary Savings', status: 'completed' },
        { id: '4', date: '2024-01-28', description: 'Investment Returns', amount: 850, type: 'income', category: 'Investment', account: 'Investment Account', status: 'completed' },
        
        // Expense transactions
        { id: '5', date: '2024-01-14', description: 'Office Supplies & Equipment', amount: 320, type: 'expense', category: 'Office', account: 'Business Current', status: 'completed' },
        { id: '6', date: '2024-01-16', description: 'Adobe Creative Suite', amount: 89, type: 'expense', category: 'Software', account: 'Business Current', status: 'completed' },
        { id: '7', date: '2024-01-18', description: 'Marketing Campaign', amount: 450, type: 'expense', category: 'Marketing', account: 'Business Current', status: 'completed' },
        { id: '8', date: '2024-01-22', description: 'Business Travel', amount: 680, type: 'expense', category: 'Travel', account: 'Business Current', status: 'completed' },
        { id: '9', date: '2024-01-24', description: 'New Laptop', amount: 1200, type: 'expense', category: 'Equipment', account: 'Business Current', status: 'completed' },
        { id: '10', date: '2024-01-26', description: 'Internet & Phone Bills', amount: 150, type: 'expense', category: 'Utilities', account: 'Business Current', status: 'completed' },
        
        // Previous month data
        { id: '11', date: '2023-12-15', description: 'E-commerce Platform Development', amount: 5200, type: 'income', category: 'Freelance', account: 'Business Current', status: 'completed' },
        { id: '12', date: '2023-12-20', description: 'UI/UX Design Project', amount: 3100, type: 'income', category: 'Freelance', account: 'Business Current', status: 'completed' },
        { id: '13', date: '2023-12-10', description: 'Office Rent', amount: 800, type: 'expense', category: 'Office', account: 'Business Current', status: 'completed' },
        { id: '14', date: '2023-12-12', description: 'Software Licenses', amount: 200, type: 'expense', category: 'Software', account: 'Business Current', status: 'completed' },
      ];
      this.saveToStorage('transactions', sampleTransactions);
    }

    if (this.getClients().length === 0) {
      const sampleClients: Client[] = [
        { id: '1', name: 'TechCorp Solutions', email: 'contact@techcorp.com', phone: '+1-555-0123', address: '123 Tech Street, Silicon Valley, CA 94000' },
        { id: '2', name: 'StartupXYZ', email: 'hello@startupxyz.com', phone: '+1-555-0456', address: '456 Innovation Ave, Austin, TX 78701' },
        { id: '3', name: 'Enterprise Inc', email: 'projects@enterprise.com', phone: '+1-555-0789', address: '789 Business Blvd, New York, NY 10001' },
      ];
      this.saveToStorage('clients', sampleClients);
    }

    if (this.getInvoices().length === 0) {
      const sampleInvoices: Invoice[] = [
        {
          id: '1',
          clientId: '1',
          invoiceNumber: 'INV-2024-001',
          date: '2024-01-15',
          dueDate: '2024-02-14',
          amount: 4500,
          status: 'paid',
          items: [
            { description: 'Website Development', quantity: 1, rate: 4500, amount: 4500 }
          ]
        },
        {
          id: '2',
          clientId: '2',
          invoiceNumber: 'INV-2024-002',
          date: '2024-01-20',
          dueDate: '2024-02-19',
          amount: 2800,
          status: 'sent',
          items: [
            { description: 'Mobile App Consulting', quantity: 40, rate: 70, amount: 2800 }
          ]
        },
      ];
      this.saveToStorage('invoices', sampleInvoices);
    }

    if (this.getEMIs().length === 0) {
      const sampleEMIs: EMI[] = [
        { id: '1', name: 'Home Loan', principal: 350000, interestRate: 7.2, tenure: 240, monthlyAmount: 2650, remainingBalance: 285000, nextDueDate: '2024-02-01' },
        { id: '2', name: 'Car Loan', principal: 45000, interestRate: 8.5, tenure: 60, monthlyAmount: 920, remainingBalance: 32000, nextDueDate: '2024-02-03' },
      ];
      this.saveToStorage('emis', sampleEMIs);
    }

    if (this.getCreditCards().length === 0) {
      const sampleCards: CreditCard[] = [
        { id: '1', name: 'Business Credit Card', creditLimit: 15000, currentBalance: 3200, minimumDue: 160, dueDate: '2024-02-05', interestRate: 18.5 },
        { id: '2', name: 'Personal Credit Card', creditLimit: 8000, currentBalance: 1800, minimumDue: 90, dueDate: '2024-02-08', interestRate: 22.0 },
      ];
      this.saveToStorage('creditcards', sampleCards);
    }

    if (this.getRecurringPayments().length === 0) {
      const sampleRecurring: RecurringPayment[] = [
        { id: '1', name: 'Adobe Creative Cloud', amount: 89, frequency: 'monthly', nextDate: '2024-02-01', category: 'Software', isActive: true },
        { id: '2', name: 'Office 365', amount: 15, frequency: 'monthly', nextDate: '2024-02-03', category: 'Software', isActive: true },
        { id: '3', name: 'Hosting Services', amount: 25, frequency: 'monthly', nextDate: '2024-02-05', category: 'Software', isActive: true },
      ];
      this.saveToStorage('recurringpayments', sampleRecurring);
    }
  }
}

export const dataService = new DataService();