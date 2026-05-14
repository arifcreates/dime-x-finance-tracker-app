import React, { useState } from 'react';
import { Plus, X, DollarSign, Receipt, FileText, CreditCard } from 'lucide-react';

interface QuickActionsFABProps {
  onAction: (action: string) => void;
}

export const QuickActionsFAB: React.FC<QuickActionsFABProps> = ({ onAction }) => {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    {
      id: 'add-income',
      label: 'Add Income',
      icon: DollarSign,
      color: 'bg-green-500 hover:bg-green-600',
    },
    {
      id: 'add-expense',
      label: 'Add Expense',
      icon: Receipt,
      color: 'bg-red-500 hover:bg-red-600',
    },
    {
      id: 'create-invoice',
      label: 'Create Invoice',
      icon: FileText,
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      id: 'record-payment',
      label: 'Record Payment',
      icon: CreditCard,
      color: 'bg-purple-500 hover:bg-purple-600',
    },
  ];

  const handleAction = (actionId: string) => {
    onAction(actionId);
    setIsOpen(false);
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Action Buttons */}
      {isOpen && (
        <div className="fixed bottom-32 right-4 z-50 space-y-3">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <div
                key={action.id}
                className="flex items-center space-x-3 animate-in slide-in-from-bottom-2 duration-200"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="bg-white px-3 py-2 rounded-xl shadow-lg border border-gray-100">
                  <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                    {action.label}
                  </span>
                </div>
                <button
                  onClick={() => handleAction(action.id)}
                  className={`w-12 h-12 ${action.color} text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110`}
                >
                  <Icon className="h-6 w-6" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Main FAB - Positioned above mobile nav */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-20 right-4 z-50 w-14 h-14 bg-black text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 ${
          isOpen ? 'rotate-45' : ''
        }`}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
      </button>
    </>
  );
};