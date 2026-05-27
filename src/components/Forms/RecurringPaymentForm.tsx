import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { RecurringPayment } from '../../types';
import { generateId } from '../../utils/formatters';
import { dataService } from '../../services/dataService';
import { SelectField } from './SelectField';

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
    amount: payment?.amount ? String(payment.amount) : '',
    frequency: payment?.frequency || 'monthly' as const,
    nextDate: payment?.nextDate || new Date().toISOString().split('T')[0],
    category: payment?.category || '',
    isActive: payment?.isActive ?? true,
  });

  useEffect(() => {
    if (!isOpen) return;

    setFormData({
      name: payment?.name || '',
      amount: payment?.amount ? String(payment.amount) : '',
      frequency: payment?.frequency || 'monthly',
      nextDate: payment?.nextDate || new Date().toISOString().split('T')[0],
      category: payment?.category || '',
      isActive: payment?.isActive ?? true,
    });
  }, [payment, isOpen]);

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

  const frequencyOptions = [
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' },
  ];

  const categoryOptions = categories.map(category => ({
    value: category,
    label: category,
  }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const amount = Number(formData.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      alert('Please enter an amount greater than zero');
      return;
    }
    
    const newPayment: RecurringPayment = {
      id: payment?.id || generateId(),
      ...formData,
      amount,
    };

    dataService.saveRecurringPayment(newPayment);
    onSave(newPayment);
    onClose();
    
    // Reset form
    setFormData({
      name: '',
      amount: '',
      frequency: 'monthly',
      nextDate: new Date().toISOString().split('T')[0],
      category: '',
      isActive: true,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 overscroll-contain">
      <div className="bg-white dark:bg-gray-900 rounded-3xl w-[calc(100%-0.75rem)] sm:w-full max-w-md h-[calc(100dvh-var(--mobile-browser-bottom,0px)-0.75rem)] sm:h-auto sm:max-h-[90vh] mx-0 sm:mx-4 mb-1.5 sm:mb-0 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-5 sm:px-6 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            {payment ? 'Edit' : 'Add'} Recurring Payment
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="min-h-0 flex-1 overflow-y-auto overscroll-contain modal-scroll px-5 py-5 sm:px-6 space-y-5">
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
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Frequency
            </label>
            <SelectField
              required
              value={formData.frequency}
              onChange={(value) => setFormData({ ...formData, frequency: value as 'monthly' | 'yearly' })}
              options={frequencyOptions}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
