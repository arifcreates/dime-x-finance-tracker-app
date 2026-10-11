export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  account: string;
  accountId?: string;
  currency?: string;
  invoiceId?: string;
  transferId?: string;
  source?: 'manual' | 'recurring' | 'import' | 'ai';
  categoryId?: string;
  status: 'completed' | 'pending' | 'cancelled';
}

export interface Category {
  id: string;
  name: string;
  bucket: 'fixed' | 'flex' | 'non_monthly' | 'income' | 'transfer';
}

export interface CategoryRule {
  id: string;
  matchText: string;
  categoryId: string;
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
  clientId: string | null;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  items: InvoiceItem[];
  currency?: string;
  companyName?: string;
  companyEmail?: string;
  companyPhone?: string;
  companyAddress?: string;
  billToName?: string;
  billToEmail?: string;
  billToPhone?: string;
  billToAddress?: string;
  notes?: string;
  bankDetails?: string;
  taxRate?: number;
  taxAmount?: number;
  discountType?: 'fixed' | 'percentage';
  discountValue?: number;
  discountAmount?: number;
  subtotal?: number;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface BusinessProfile {
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  companyAddress: string;
  bankDetails: string;
  defaultNotes: string;
  defaultTaxRate: number;
  invoicePrefix: string;
  accentColor: string;
  logoDataUrl: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
}

export interface EMI {
  currency?: string;
  id: string;
  name: string;
  principal: number;
  interestRate: number;
  tenure: number;
  monthlyAmount: number;
  remainingBalance: number;
  nextDueDate: string;
  debtType?: 'emi' | 'credit';
  creditTakenDate?: string;
  creditedAccountId?: string;
  creditedAccountName?: string;
}

export interface CreditCard {
  currency?: string;
  id: string;
  name: string;
  creditLimit: number;
  currentBalance: number;
  minimumDue: number;
  dueDate: string;
  interestRate: number;
}

export interface RecurringPayment {
  currency?: string;
  id: string;
  name: string;
  amount: number;
  frequency: 'monthly' | 'yearly';
  nextDate: string;
  category: string;
  isActive: boolean;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  currency: string;
  notifications: boolean;
  avatar?: string | null;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar: string | null;
  preferences: UserPreferences;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  preferences: UserPreferences;
  business_profile?: BusinessProfile;
}
