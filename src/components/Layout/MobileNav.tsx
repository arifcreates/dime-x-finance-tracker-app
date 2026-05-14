import React from 'react';
import {
  LayoutGrid,
  Receipt,
  CreditCard,
  Wallet,
  Calendar,
  BarChart3,
  FileText,
} from 'lucide-react';

interface MobileNavProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const navigationItems = [
  { id: 'dashboard', label: 'Home', icon: LayoutGrid },
  { id: 'income', label: 'Income', icon: FileText },
  { id: 'expenses', label: 'Expenses', icon: Receipt },
  { id: 'accounts', label: 'Accounts', icon: Wallet },
  { id: 'emi', label: 'Loans', icon: CreditCard },
];

export const MobileNav: React.FC<MobileNavProps> = ({ activeSection, onSectionChange }) => {
  return (
    <nav className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 px-2 py-2 safe-area-bottom">
      <div className="flex items-center justify-around">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`flex flex-col items-center justify-center px-3 py-2 rounded-2xl transition-all duration-200 min-w-0 flex-1 ${
                isActive
                  ? 'bg-black dark:bg-white text-white dark:text-black'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <Icon className={`h-5 w-5 mb-1 ${isActive ? 'text-white dark:text-black' : 'text-gray-400 dark:text-gray-500'}`} />
              <span className="text-xs font-semibold truncate">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};