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
    <nav className="bg-[#f7f7f4]/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-black/[0.07] dark:border-gray-800 px-2 pt-2 pb-[calc(0.75rem+env(safe-area-inset-bottom)+var(--mobile-browser-bottom,0px))] shadow-[0_-10px_30px_rgba(17,19,24,0.08)]">
      <div className="flex items-center justify-around gap-1">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`flex min-h-[54px] flex-1 flex-col items-center justify-center rounded-2xl px-2 py-2 transition-all duration-200 min-w-0 ${
                isActive
                  ? 'bg-black dark:bg-white text-white dark:text-black'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-white dark:hover:bg-gray-800'
              }`}
            >
              <Icon className={`h-5 w-5 mb-1 ${isActive ? 'text-white dark:text-black' : 'text-gray-400 dark:text-gray-500'}`} />
              <span className="max-w-full truncate text-[11px] font-semibold leading-none">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
