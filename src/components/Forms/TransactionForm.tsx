import React, { useState, useEffect } from 'react';
import { Plus, Wallet, X } from 'lucide-react';
import { Transaction, Account } from '../../types';
import { generateId } from '../../utils/formatters';
import { dataService } from '../../services/dataService';
import { useCurrency } from '../../contexts/CurrencyContext';
import { currencyService } from '../../services/currencyService';
import { SelectField } from './SelectField';

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Transaction) => void;
  type: 'income' | 'expense';
  transaction?: Transaction;
  onCreateAccount?: () => void;
  initialDescription?: string;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  isOpen,
  onClose,
  onSave,
  type,
  transaction,
  onCreateAccount,
  initialDescription = '',
}) => {
  const { currency } = useCurrency();
  const currencySymbol = currencyService.getCurrencySymbol(currency);
  const [formData, setFormData] = useState({
    description: transaction?.description || initialDescription,
    amount: transaction?.amount ? String(transaction.amount) : '',
    category: transaction?.category || '',
    account: transaction?.account || '',
    date: transaction?.date || new Date().toISOString().split('T')[0],
  });

  const [accounts, setAccounts] = useState<Account[]>(() => dataService.getCachedAccounts());

  useEffect(() => {
    if (isOpen) {
      setFormData((prev) => ({
        description: transaction?.description || initialDescription || '',
        amount: transaction?.amount ? String(transaction.amount) : '',
        category: transaction?.category || '',
        account: transaction?.account || prev.account,
        date: transaction?.date || new Date().toISOString().split('T')[0],
      }));

      dataService.getAccounts().then((loadedAccounts) => {
        setAccounts(loadedAccounts);
        setFormData((prev) => ({
          ...prev,
          account: transaction?.account || prev.account || loadedAccounts[0]?.name || '',
        }));
      });
    }
  }, [initialDescription, isOpen, transaction]);
  
  const incomeCategories = ['Freelance', 'Consulting', 'Product Sales', 'Investment', 'Royalties', 'Other'];
  const expenseCategories = ['Office', 'Software', 'Marketing', 'Travel', 'Equipment', 'Utilities', 'Food', 'Transportation', 'Other'];
  
  const categories = type === 'income' ? incomeCategories : expenseCategories;
  const categoryOptions = categories.map(category => ({
    value: category,
    label: category,
  }));
  const accountOptions = accounts.map(account => ({
    value: account.name,
    label: account.name,
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.account) {
      alert('Please create or select an account first');
      return;
    }

    const amount = Number(formData.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      alert('Please enter an amount greater than zero');
      return;
    }
    
    const newTransaction: Transaction = {
      id: transaction?.id || generateId(),
      ...formData,
      amount,
      type,
      status: 'completed',
    };

    const selectedAccount = accounts.find(account => account.name === newTransaction.account);
    if (selectedAccount) {
      const previousAmount =
        transaction?.account === selectedAccount.name && transaction.type === type
          ? transaction.amount
          : 0;
      const direction = type === 'income' ? 1 : -1;
      await dataService.saveAccount({
        ...selectedAccount,
        balance: selectedAccount.balance - direction * previousAmount + direction * amount,
      });
    }

    await dataService.saveTransaction(newTransaction);
    onSave(newTransaction);
    onClose();
    
    // Reset form
    setFormData({
      description: '',
      amount: '',
      category: '',
      account: accounts.length > 0 ? accounts[0].name : '',
      date: new Date().toISOString().split('T')[0],
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 overscroll-contain">
      {/* Mobile: Full screen modal */}
      <div className="w-[calc(100%-0.75rem)] h-[calc(100dvh-var(--mobile-browser-bottom,0px)-0.75rem)] sm:h-auto sm:max-h-[90vh] sm:max-w-xl sm:mx-4 bg-white dark:bg-gray-900 rounded-3xl flex flex-col overflow-hidden mb-1.5 sm:mb-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-black to-gray-800 p-4 sm:p-6 text-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
                {transaction ? 'Edit' : 'Add'} {type === 'income' ? 'Income' : 'Expense'}
              </h3>
              <p className="text-white/80 text-sm mt-1">
                {type === 'income' ? 'Record new income' : 'Track your spending'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">
                Description
              </label>
              <input
                type="text"
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-black focus:border-transparent transition-all font-medium text-base"
                placeholder="Enter description"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">
                Amount
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full pl-8 pr-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-black focus:border-transparent transition-all font-medium text-base"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">
                Category
              </label>
              <SelectField
                required
                value={formData.category}
                onChange={(value) => setFormData({ ...formData, category: value })}
                options={categoryOptions}
                placeholder="Select category"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">
                Account Used
              </label>
              {accounts.length === 0 ? (
                <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                      <Wallet className="h-5 w-5 text-gray-700 dark:text-gray-200" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 dark:text-white">Create an account first</p>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {type === 'income' ? 'Income' : 'Expenses'} need an account so the balance can update correctly.
                      </p>
                      {onCreateAccount && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onCreateAccount();
                          }}
                          className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors font-semibold"
                        >
                          <Plus className="h-4 w-4" />
                          Add account
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <SelectField
                  required
                  value={formData.account}
                  onChange={(value) => setFormData({ ...formData, account: value })}
                  options={accountOptions}
                  placeholder="Select account"
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">
                Date
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-black focus:border-transparent transition-all font-medium text-base"
              />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-800 p-5 sm:p-6 flex-shrink-0 bg-white dark:bg-gray-900">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 border border-gray-200 text-gray-700 rounded-2xl hover:bg-gray-50 transition-all font-bold text-base"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              className={`flex-1 px-6 py-4 text-white rounded-2xl transition-all font-bold text-base shadow-lg ${
                type === 'income' 
                  ? 'bg-green-500 hover:bg-green-600 shadow-green-500/25' 
                  : 'bg-red-500 hover:bg-red-600 shadow-red-500/25'
              }`}
            >
              {transaction ? 'Update' : 'Add'} {type === 'income' ? 'Income' : 'Expense'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
