import React, { useState } from 'react';
import { X } from 'lucide-react';
import { CreditCard } from '../../types';
import { generateId } from '../../utils/formatters';
import { dataService } from '../../services/dataService';

interface CreditCardFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (card: CreditCard) => void;
  card?: CreditCard;
}

export const CreditCardForm: React.FC<CreditCardFormProps> = ({
  isOpen,
  onClose,
  onSave,
  card,
}) => {
  const [formData, setFormData] = useState({
    name: card?.name || '',
    creditLimit: card?.creditLimit || 0,
    currentBalance: card?.currentBalance || 0,
    minimumDue: card?.minimumDue || 0,
    dueDate: card?.dueDate || new Date().toISOString().split('T')[0],
    interestRate: card?.interestRate || 0,
  });

  const calculateMinimumDue = () => {
    const { currentBalance } = formData;
    if (currentBalance > 0) {
      // Typically 5% of current balance or minimum $25
      const minDue = Math.max(currentBalance * 0.05, 25);
      setFormData(prev => ({ ...prev, minimumDue: Math.round(minDue) }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newCard: CreditCard = {
      id: card?.id || generateId(),
      ...formData,
    };

    dataService.saveCreditCard(newCard);
    onSave(newCard);
    onClose();
    
    // Reset form
    setFormData({
      name: '',
      creditLimit: 0,
      currentBalance: 0,
      minimumDue: 0,
      dueDate: new Date().toISOString().split('T')[0],
      interestRate: 0,
    });
  };

  if (!isOpen) return null;

  const utilizationPercentage = formData.creditLimit > 0 ? (formData.currentBalance / formData.creditLimit) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-bold text-gray-900">
            {card ? 'Edit Credit Card' : 'Add New Credit Card'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-2xl hover:bg-gray-100 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Card Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="e.g., Chase Sapphire, AMEX Gold"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Credit Limit
              </label>
              <input
                type="number"
                required
                min="0"
                step="100"
                value={formData.creditLimit}
                onChange={(e) => setFormData({ ...formData, creditLimit: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Current Balance
              </label>
              <input
                type="number"
                required
                min="0"
                step="1"
                value={formData.currentBalance}
                onChange={(e) => setFormData({ ...formData, currentBalance: parseFloat(e.target.value) || 0 })}
                onBlur={calculateMinimumDue}
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Interest Rate (% per annum)
              </label>
              <input
                type="number"
                required
                min="0"
                max="50"
                step="0.1"
                value={formData.interestRate}
                onChange={(e) => setFormData({ ...formData, interestRate: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="0.0"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Minimum Due
              </label>
              <input
                type="number"
                required
                min="0"
                step="1"
                value={formData.minimumDue}
                onChange={(e) => setFormData({ ...formData, minimumDue: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="0"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Due Date
              </label>
              <input
                type="date"
                required
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Credit Utilization Display */}
            {formData.creditLimit > 0 && (
              <div className="md:col-span-2 p-4 bg-gray-50 rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">Credit Utilization</span>
                  <span className={`text-sm font-bold ${
                    utilizationPercentage > 80 ? 'text-red-600' :
                    utilizationPercentage > 50 ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {utilizationPercentage.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-300 ${
                      utilizationPercentage > 80 ? 'bg-red-500' :
                      utilizationPercentage > 50 ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {utilizationPercentage > 80 ? 'High utilization - consider paying down balance' :
                   utilizationPercentage > 50 ? 'Moderate utilization - monitor spending' :
                   'Good utilization - keep it up!'}
                </p>
              </div>
            )}
          </div>

          <div className="flex space-x-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-200 text-gray-700 rounded-2xl hover:bg-gray-50 transition-colors font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-700 text-white rounded-2xl hover:from-purple-700 hover:to-pink-800 transition-colors font-semibold shadow-lg shadow-purple-500/25"
            >
              {card ? 'Update Card' : 'Add Card'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};