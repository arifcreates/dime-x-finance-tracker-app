import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { EMI } from '../../types';
import { generateId } from '../../utils/formatters';
import { dataService } from '../../services/dataService';

interface EMIFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (emi: EMI) => void;
  emi?: EMI;
}

export const EMIForm: React.FC<EMIFormProps> = ({
  isOpen,
  onClose,
  onSave,
  emi,
}) => {
  const [formData, setFormData] = useState({
    name: emi?.name || '',
    principal: emi?.principal ? String(emi.principal) : '',
    interestRate: emi?.interestRate ? String(emi.interestRate) : '',
    tenure: emi?.tenure ? String(emi.tenure) : '',
    monthlyAmount: emi?.monthlyAmount ? String(emi.monthlyAmount) : '',
    remainingBalance: emi?.remainingBalance ? String(emi.remainingBalance) : '',
    nextDueDate: emi?.nextDueDate || new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (!isOpen) return;

    setFormData({
      name: emi?.name || '',
      principal: emi?.principal ? String(emi.principal) : '',
      interestRate: emi?.interestRate ? String(emi.interestRate) : '',
      tenure: emi?.tenure ? String(emi.tenure) : '',
      monthlyAmount: emi?.monthlyAmount ? String(emi.monthlyAmount) : '',
      remainingBalance: emi?.remainingBalance ? String(emi.remainingBalance) : '',
      nextDueDate: emi?.nextDueDate || new Date().toISOString().split('T')[0],
    });
  }, [emi, isOpen]);

  const calculateEMI = () => {
    const principal = Number(formData.principal);
    const interestRate = Number(formData.interestRate);
    const tenure = Number(formData.tenure);

    if (principal && interestRate && tenure) {
      const monthlyRate = interestRate / 100 / 12;
      const calculatedEMI = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / 
                  (Math.pow(1 + monthlyRate, tenure) - 1);
      setFormData(prev => ({ 
        ...prev, 
        monthlyAmount: String(Math.round(calculatedEMI)),
        remainingBalance: prev.remainingBalance || String(principal)
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const principal = Number(formData.principal);
    const interestRate = Number(formData.interestRate);
    const tenure = Number(formData.tenure);
    const monthlyAmount = Number(formData.monthlyAmount);
    const remainingBalance = Number(formData.remainingBalance);
    
    const newEMI: EMI = {
      id: emi?.id || generateId(),
      name: formData.name,
      principal,
      interestRate,
      tenure,
      monthlyAmount,
      remainingBalance,
      nextDueDate: formData.nextDueDate,
    };

    dataService.saveEMI(newEMI);
    onSave(newEMI);
    onClose();
    
    // Reset form
    setFormData({
      name: '',
      principal: '',
      interestRate: '',
      tenure: '',
      monthlyAmount: '',
      remainingBalance: '',
      nextDueDate: new Date().toISOString().split('T')[0],
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 overscroll-contain">
      <div className="bg-white dark:bg-gray-900 rounded-3xl w-[calc(100%-0.75rem)] sm:w-full max-w-2xl h-[calc(100dvh-var(--mobile-browser-bottom,0px)-0.75rem)] sm:h-auto sm:max-h-[90vh] mx-0 sm:mx-4 mb-1.5 sm:mb-0 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-5 sm:px-8 sm:py-6 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            {emi ? 'Edit EMI' : 'Add New EMI'}
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
                Loan Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all"
                placeholder="e.g., Home Loan, Car Loan"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Principal Amount
              </label>
              <input
                type="number"
                required
                min="0"
                step="1000"
                value={formData.principal}
                onChange={(e) => setFormData({ ...formData, principal: e.target.value })}
                onBlur={calculateEMI}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all"
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
                onBlur={calculateEMI}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all"
                placeholder="0.0"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Tenure (months)
              </label>
              <input
                type="number"
                required
                min="1"
                max="600"
                value={formData.tenure}
                onChange={(e) => setFormData({ ...formData, tenure: e.target.value })}
                onBlur={calculateEMI}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Monthly EMI Amount
              </label>
              <input
                type="number"
                required
                min="0"
                step="1"
                value={formData.monthlyAmount}
                onChange={(e) => setFormData({ ...formData, monthlyAmount: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all bg-gray-50 dark:bg-gray-800"
                placeholder="0"
                readOnly
              />
              <p className="text-xs text-gray-500 mt-2">Calculated automatically based on principal, rate, and tenure</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Remaining Balance
              </label>
              <input
                type="number"
                required
                min="0"
                step="1000"
                value={formData.remainingBalance}
                onChange={(e) => setFormData({ ...formData, remainingBalance: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all"
                placeholder="0"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Next Due Date
              </label>
              <input
                type="date"
                required
                value={formData.nextDueDate}
                onChange={(e) => setFormData({ ...formData, nextDueDate: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all"
              />
            </div>
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
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-800 transition-colors font-semibold shadow-lg shadow-blue-500/25"
            >
              {emi ? 'Update EMI' : 'Add EMI'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
