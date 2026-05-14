export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  account: string;
  status: 'completed' | 'pending' | 'cancelled';
}

export interface Account {
  id: string;
  name: string;
  type: 'savings' | 'current' | 'cash' | 'investment';
  balance: number;
  currency: string;
}

export interface Invoice {
  id: string;
  clientId: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  items: InvoiceItem[];
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
}

export interface EMI {
  id: string;
  name: string;
  principal: number;
  interestRate: number;
  tenure: number;
  monthlyAmount: number;
  remainingBalance: number;
  nextDueDate: string;
}

export interface CreditCard {
  id: string;
  name: string;
  creditLimit: number;
  currentBalance: number;
  minimumDue: number;
  dueDate: string;
  interestRate: number;
}

export interface RecurringPayment {
  id: string;
  name: string;
  amount: number;
  frequency: 'monthly' | 'yearly';
  nextDate: string;
  category: string;
  isActive: boolean;
}