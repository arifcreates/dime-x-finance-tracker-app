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
          className="fixed inset-0 bg-black/25 backdrop-blur-[1px] z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Action Buttons */}
      {isOpen && (
        <div className="fixed inset-x-4 bottom-[calc(9rem+var(--mobile-browser-bottom,0px))] z-50 rounded-2xl border border-gray-200 bg-white/95 p-4 shadow-2xl backdrop-blur-xl dark:border-gray-800 dark:bg-gray-900/95">
          <div className="grid grid-cols-2 gap-3">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => handleAction(action.id)}
                className="flex min-h-[60px] items-center gap-3 rounded-xl border border-gray-100 bg-white px-3 py-3 text-left transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800"
              >
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-black text-white dark:bg-white dark:text-black">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-sm font-semibold leading-tight text-gray-900 dark:text-white">
                  {action.label}
                </span>
              </button>
            );
          })}
          </div>
        </div>
      )}

      {/* Main FAB - Positioned above mobile nav */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-[calc(5rem+var(--mobile-browser-bottom,0px))] right-5 z-50 w-12 h-12 bg-black text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-105 ${
          isOpen ? 'rotate-45' : ''
        }`}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
      </button>
    </>
  );
};
