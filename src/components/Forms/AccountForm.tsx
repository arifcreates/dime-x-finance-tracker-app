import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Account } from '../../types';
import { generateId } from '../../utils/formatters';
import { dataService } from '../../services/dataService';

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
  const [formData, setFormData] = useState({
    name: account?.name || '',
    type: account?.type || 'savings' as const,
    balance: account?.balance || 0,
    currency: account?.currency || 'USD',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newAccount: Account = {
      id: account?.id || generateId(),
      ...formData,
    };

    dataService.saveAccount(newAccount);
    onSave(newAccount);
    onClose();
    
    // Reset form
    setFormData({
      name: '',
      type: 'savings',
      balance: 0,
      currency: 'USD',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {account ? 'Edit Account' : 'Add Account'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter account name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Type
            </label>
            <select
              required
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as Account['type'] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="savings">Savings</option>
              <option value="current">Current</option>
              <option value="cash">Cash</option>
              <option value="investment">Investment</option>
            </select>
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
              onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Currency
            </label>
            <select
              required
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="INR">INR</option>
            </select>
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
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {account ? 'Update Account' : 'Add Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};