import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Transaction } from '../../types';
import { generateId } from '../../utils/formatters';
import { dataService } from '../../services/dataService';

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Transaction) => void;
  type: 'income' | 'expense';
  transaction?: Transaction;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  isOpen,
  onClose,
  onSave,
  type,
  transaction,
}) => {
  const [formData, setFormData] = useState({
    description: transaction?.description || '',
    amount: transaction?.amount || 0,
    category: transaction?.category || '',
    account: transaction?.account || '',
    date: transaction?.date || new Date().toISOString().split('T')[0],
  });

  const accounts = dataService.getAccounts();
  
  const incomeCategories = ['Freelance', 'Consulting', 'Product Sales', 'Investment', 'Royalties', 'Other'];
  const expenseCategories = ['Office', 'Software', 'Marketing', 'Travel', 'Equipment', 'Utilities', 'Food', 'Transportation', 'Other'];
  
  const categories = type === 'income' ? incomeCategories : expenseCategories;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.account && accounts.length > 0) {
      setFormData(prev => ({ ...prev, account: accounts[0].name }));
      return;
    }
    
    const newTransaction: Transaction = {
      id: transaction?.id || generateId(),
      ...formData,
      type,
      status: 'completed',
    };

    dataService.saveTransaction(newTransaction);
    onSave(newTransaction);
    onClose();
    
    // Reset form
    setFormData({
      description: '',
      amount: 0,
      category: '',
      account: accounts.length > 0 ? accounts[0].name : '',
      date: new Date().toISOString().split('T')[0],
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50">
      {/* Mobile: Full screen modal */}
      <div className="w-full h-full sm:h-auto sm:max-w-xl sm:mx-4 bg-white sm:rounded-3xl flex flex-col overflow-hidden">
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
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
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
                  $
                </span>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full pl-8 pr-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-black focus:border-transparent transition-all font-medium text-base"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">
                Category
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-black focus:border-transparent transition-all font-medium text-base"
              >
                <option value="">Select category</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">
                Account Used
              </label>
              <select
                required
                value={formData.account}
                onChange={(e) => setFormData({ ...formData, account: e.target.value })}
                className="w-full px-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-black focus:border-transparent transition-all font-medium text-base"
              >
                <option value="">Select account</option>
                {accounts.map(account => (
                  <option key={account.id} value={account.name}>{account.name}</option>
                ))}
              </select>
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