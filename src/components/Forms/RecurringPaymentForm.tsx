import React, { useState } from 'react';
import { X } from 'lucide-react';
import { RecurringPayment } from '../../types';
import { generateId } from '../../utils/formatters';
import { dataService } from '../../services/dataService';

interface RecurringPaymentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payment: RecurringPayment) => void;
  payment?: RecurringPayment;
}

export const RecurringPaymentForm: React.FC<RecurringPaymentFormProps> = ({
  isOpen,
  onClose,
  onSave,
  payment,
}) => {
  const [formData, setFormData] = useState({
    name: payment?.name || '',
    amount: payment?.amount || 0,
    frequency: payment?.frequency || 'monthly' as const,
    nextDate: payment?.nextDate || new Date().toISOString().split('T')[0],
    category: payment?.category || '',
    isActive: payment?.isActive ?? true,
  });

  const categories = [
    'Software',
    'Utilities',
    'Insurance',
    'Subscriptions',
    'Rent',
    'Internet',
    'Phone',
    'Cloud Services',
    'Marketing',
    'Other'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newPayment: RecurringPayment = {
      id: payment?.id || generateId(),
      ...formData,
    };

    dataService.saveRecurringPayment(newPayment);
    onSave(newPayment);
    onClose();
    
    // Reset form
    setFormData({
      name: '',
      amount: 0,
      frequency: 'monthly',
      nextDate: new Date().toISOString().split('T')[0],
      category: '',
      isActive: true,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">
            {payment ? 'Edit' : 'Add'} Recurring Payment
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="e.g., Adobe Creative Cloud"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount
            </label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Frequency
            </label>
            <select
              required
              value={formData.frequency}
              onChange={(e) => setFormData({ ...formData, frequency: e.target.value as 'monthly' | 'yearly' })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="">Select category</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Next Payment Date
            </label>
            <input
              type="date"
              required
              value={formData.nextDate}
              onChange={(e) => setFormData({ ...formData, nextDate: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
              Active subscription
            </label>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl hover:from-teal-600 hover:to-cyan-700 transition-colors font-medium"
            >
              {payment ? 'Update' : 'Add'} Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};