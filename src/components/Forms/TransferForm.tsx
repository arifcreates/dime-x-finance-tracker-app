import React, { useState } from 'react';
import { X, ArrowRight } from 'lucide-react';
import { Account } from '../../types';
import { dataService } from '../../services/dataService';

interface TransferFormProps {
  isOpen: boolean;
  onClose: () => void;
  onTransfer: () => void;
  accounts: Account[];
}

export const TransferForm: React.FC<TransferFormProps> = ({
  isOpen,
  onClose,
  onTransfer,
  accounts,
}) => {
  const [formData, setFormData] = useState({
    fromAccount: '',
    toAccount: '',
    amount: 0,
    description: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.fromAccount === formData.toAccount) {
      alert('Cannot transfer to the same account');
      return;
    }

    const fromAccount = accounts.find(acc => acc.id === formData.fromAccount);
    const toAccount = accounts.find(acc => acc.id === formData.toAccount);

    if (!fromAccount || !toAccount) {
      alert('Invalid account selection');
      return;
    }

    if (fromAccount.balance < formData.amount) {
      alert('Insufficient balance in source account');
      return;
    }

    // Update account balances
    const updatedFromAccount = {
      ...fromAccount,
      balance: fromAccount.balance - formData.amount
    };

    const updatedToAccount = {
      ...toAccount,
      balance: toAccount.balance + formData.amount
    };

    // Save updated accounts
    dataService.saveAccount(updatedFromAccount);
    dataService.saveAccount(updatedToAccount);

    // Create transfer transactions
    const transferOutTransaction = {
      id: `transfer-out-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      description: `Transfer to ${toAccount.name}${formData.description ? ` - ${formData.description}` : ''}`,
      amount: formData.amount,
      type: 'expense' as const,
      category: 'Transfer',
      account: fromAccount.name,
      status: 'completed' as const,
    };

    const transferInTransaction = {
      id: `transfer-in-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      description: `Transfer from ${fromAccount.name}${formData.description ? ` - ${formData.description}` : ''}`,
      amount: formData.amount,
      type: 'income' as const,
      category: 'Transfer',
      account: toAccount.name,
      status: 'completed' as const,
    };

    dataService.saveTransaction(transferOutTransaction);
    dataService.saveTransaction(transferInTransaction);

    onTransfer();
    onClose();
    
    // Reset form
    setFormData({
      fromAccount: '',
      toAccount: '',
      amount: 0,
      description: '',
    });
  };

  if (!isOpen) return null;

  const availableToAccounts = accounts.filter(acc => acc.id !== formData.fromAccount);
  const selectedFromAccount = accounts.find(acc => acc.id === formData.fromAccount);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50">
      <div className="w-full h-full sm:h-auto sm:max-w-xl sm:mx-4 bg-white sm:rounded-3xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 sm:p-6 text-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight">Transfer Money</h3>
              <p className="text-white/80 text-sm mt-1">Move funds between your accounts</p>
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
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">
                From Account
              </label>
              <select
                required
                value={formData.fromAccount}
                onChange={(e) => setFormData({ ...formData, fromAccount: e.target.value })}
                className="w-full px-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium text-base"
              >
                <option value="">Select source account</option>
                {accounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.name} - ${account.balance.toLocaleString()}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <ArrowRight className="h-6 w-6 text-blue-600" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">
                To Account
              </label>
              <select
                required
                value={formData.toAccount}
                onChange={(e) => setFormData({ ...formData, toAccount: e.target.value })}
                className="w-full px-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium text-base"
                disabled={!formData.fromAccount}
              >
                <option value="">Select destination account</option>
                {availableToAccounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.name} - ${account.balance.toLocaleString()}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">
                Amount
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold">
                  $
                </span>
                <input
                  type="number"
                  required
                  min="0.01"
                  max={selectedFromAccount?.balance || 0}
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full pl-8 pr-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium text-base"
                  placeholder="0.00"
                />
              </div>
              {selectedFromAccount && (
                <p className="text-sm text-gray-500 mt-2">
                  Available: ${selectedFromAccount.balance.toLocaleString()}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">
                Description (Optional)
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium text-base"
                placeholder="Transfer purpose"
              />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 sm:p-6 flex-shrink-0">
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
              className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all font-bold text-base shadow-lg shadow-blue-500/25"
            >
              Transfer Money
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};