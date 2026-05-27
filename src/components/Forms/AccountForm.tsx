import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Account } from '../../types';
import { generateId } from '../../utils/formatters';
import { dataService } from '../../services/dataService';
import { useCurrency } from '../../contexts/CurrencyContext';
import { SelectField } from './SelectField';

interface AccountFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (account: Account) => void;
  account?: Account;
}

export const AccountForm: React.FC<AccountFormProps> = ({
  isOpen,
  onClose,
  onSave,
  account,
}) => {
  const { currency } = useCurrency();
  const [formData, setFormData] = useState({
    name: account?.name || '',
    type: account?.type || 'savings' as const,
    balance: account?.balance ? String(account.balance) : '',
    currency: account?.currency || currency,
  });

  useEffect(() => {
    if (!isOpen) return;

    setFormData({
      name: account?.name || '',
      type: account?.type || 'savings',
      balance: account?.balance ? String(account.balance) : '',
      currency: account?.currency || currency,
    });
  }, [account, currency, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newAccount: Account = {
      id: account?.id || generateId(),
      ...formData,
      balance: Number(formData.balance) || 0,
    };

    await dataService.saveAccount(newAccount);
    onSave(newAccount);
    onClose();
    
    // Reset form
    setFormData({
      name: '',
      type: 'savings',
      balance: '',
      currency,
    });
  };

  if (!isOpen) return null;

  const accountTypeOptions = [
    { value: 'savings', label: 'Savings' },
    { value: 'current', label: 'Current' },
    { value: 'cash', label: 'Cash' },
    { value: 'investment', label: 'Investment' },
  ];

  const currencyOptions = ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD', 'JPY', 'CHF', 'CNY', 'SGD']
    .map(value => ({ value, label: value }));

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 overscroll-contain">
      <div className="bg-white dark:bg-gray-900 rounded-3xl w-[calc(100%-0.75rem)] sm:w-full max-w-md h-[calc(100dvh-var(--mobile-browser-bottom,0px)-0.75rem)] sm:h-auto sm:max-h-[90vh] mx-0 sm:mx-4 mb-1.5 sm:mb-0 overflow-hidden flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-5 sm:px-6 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {account ? 'Edit Account' : 'Add Account'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="Enter account name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Type
            </label>
            <SelectField
              required
              value={formData.type}
              onChange={(value) => setFormData({ ...formData, type: value as Account['type'] })}
              options={accountTypeOptions}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Initial Balance
            </label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.balance}
              onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Currency
            </label>
            <SelectField
              required
              value={formData.currency}
              onChange={(value) => setFormData({ ...formData, currency: value })}
              options={currencyOptions}
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              {account ? 'Update Account' : 'Add Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
