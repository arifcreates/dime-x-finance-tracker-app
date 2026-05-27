import React, { useEffect, useState } from 'react';
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
    creditLimit: card?.creditLimit ? String(card.creditLimit) : '',
    currentBalance: card?.currentBalance ? String(card.currentBalance) : '',
    minimumDue: card?.minimumDue ? String(card.minimumDue) : '',
    dueDate: card?.dueDate || new Date().toISOString().split('T')[0],
    interestRate: card?.interestRate ? String(card.interestRate) : '',
  });

  useEffect(() => {
    if (!isOpen) return;

    setFormData({
      name: card?.name || '',
      creditLimit: card?.creditLimit ? String(card.creditLimit) : '',
      currentBalance: card?.currentBalance ? String(card.currentBalance) : '',
      minimumDue: card?.minimumDue ? String(card.minimumDue) : '',
      dueDate: card?.dueDate || new Date().toISOString().split('T')[0],
      interestRate: card?.interestRate ? String(card.interestRate) : '',
    });
  }, [card, isOpen]);

  const calculateMinimumDue = () => {
    const currentBalance = Number(formData.currentBalance);
    if (currentBalance > 0) {
      // Typically 5% of current balance or minimum $25
      const minDue = Math.max(currentBalance * 0.05, 25);
      setFormData(prev => ({ ...prev, minimumDue: String(Math.round(minDue)) }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const creditLimit = Number(formData.creditLimit);
    const currentBalance = Number(formData.currentBalance);
    const minimumDue = Number(formData.minimumDue);
    const interestRate = Number(formData.interestRate);
    
    const newCard: CreditCard = {
      id: card?.id || generateId(),
      name: formData.name,
      creditLimit,
      currentBalance,
      minimumDue,
      dueDate: formData.dueDate,
      interestRate,
    };

    dataService.saveCreditCard(newCard);
    onSave(newCard);
    onClose();
    
    // Reset form
    setFormData({
      name: '',
      creditLimit: '',
      currentBalance: '',
      minimumDue: '',
      dueDate: new Date().toISOString().split('T')[0],
      interestRate: '',
    });
  };

  if (!isOpen) return null;

  const creditLimit = Number(formData.creditLimit);
  const currentBalance = Number(formData.currentBalance);
  const utilizationPercentage = creditLimit > 0 ? (currentBalance / creditLimit) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 overscroll-contain">
      <div className="bg-white dark:bg-gray-900 rounded-3xl w-[calc(100%-0.75rem)] sm:w-full max-w-2xl h-[calc(100dvh-var(--mobile-browser-bottom,0px)-0.75rem)] sm:h-auto sm:max-h-[90vh] mx-0 sm:mx-4 mb-1.5 sm:mb-0 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-5 sm:px-8 sm:py-6 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            {card ? 'Edit Credit Card' : 'Add New Credit Card'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-2xl hover:bg-gray-100 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-8 sm:py-6 space-y-6">
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
                onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, currentBalance: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, minimumDue: e.target.value })}
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
            {creditLimit > 0 && (
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

          <div className="flex space-x-4 pt-4">
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
