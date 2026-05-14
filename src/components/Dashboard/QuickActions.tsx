import React from 'react';
import { Plus, FileText, Receipt, CreditCard } from 'lucide-react';

interface QuickActionsProps {
  onAction: (action: string) => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onAction }) => {
  const actions = [
    {
      id: 'add-income',
      label: 'Add Income',
      icon: Plus,
      gradient: 'bg-gradient-to-r from-green-500 to-emerald-600',
    },
    {
      id: 'create-invoice',
      label: 'Create Invoice',
      icon: FileText,
      gradient: 'bg-gradient-to-r from-blue-500 to-indigo-600',
    },
    {
      id: 'add-expense',
      label: 'Add Expense',
      icon: Receipt,
      gradient: 'bg-gradient-to-r from-orange-500 to-red-500',
    },
    {
      id: 'record-payment',
      label: 'Record Payment',
      icon: CreditCard,
      gradient: 'bg-gradient-to-r from-purple-500 to-pink-600',
    },
  ];

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={() => onAction(action.id)}
              className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-xl text-white font-medium transition-all duration-200 hover:scale-105 ${action.gradient}`}
            >
              <Icon className="h-4 w-4" />
              <span className="text-sm">{action.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};