import React from 'react';
import {
  LayoutGrid,
  Receipt,
  CreditCard,
  Wallet,
  Calendar,
  TrendingUp,
  FileText,
  BarChart3,
  X,
  User,
} from 'lucide-react';
import dimeXWordmarkDark from '../../assets/brand/dimex-wordmark-dark.svg';
import dimeXWordmarkLight from '../../assets/brand/dimex-wordmark-light.svg';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  onClose?: () => void;
  user?: any;
  onSettingsClick?: () => void;
}

const navigationItems = [
  { id: 'dashboard', label: 'Overview', icon: LayoutGrid },
  { id: 'income', label: 'Income', icon: FileText },
  { id: 'expenses', label: 'Expenses', icon: Receipt },
  { id: 'accounts', label: 'Accounts', icon: Wallet },
  { id: 'emi', label: 'Loans', icon: CreditCard },
  { id: 'recurring', label: 'Recurring', icon: Calendar },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
];

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeSection, 
  onSectionChange, 
  onClose,
  user,
  onSettingsClick 
}) => {
  return (
    <div className="w-80 lg:w-80 bg-[#f7f7f4] dark:bg-gray-900 h-[calc(100dvh-var(--mobile-browser-bottom,0px))] lg:h-screen flex flex-col border-r border-black/[0.07] dark:border-gray-800">
      {/* Header */}
      <div className="px-5 py-5 lg:px-7 lg:py-6 border-b border-black/[0.07] dark:border-gray-800 flex-shrink-0">
        <div className="flex min-h-[64px] items-center justify-between">
          <div className="flex min-w-0 items-center">
            <img src={dimeXWordmarkDark} alt="Dime-x" className="h-8 w-auto max-w-[150px] dark:hidden" />
            <img src={dimeXWordmarkLight} alt="Dime-x" className="hidden h-8 w-auto max-w-[150px] dark:block" />
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
            >
              <X className="h-6 w-6" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 lg:p-6">
        <ul className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => onSectionChange(item.id)}
                  className={`w-full flex items-center space-x-4 px-4 py-3 rounded-2xl text-left transition-all duration-300 group ${
                    isActive
                      ? 'bg-black dark:bg-white text-white dark:text-black shadow-lg shadow-black/10 dark:shadow-white/10'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'text-white dark:text-black' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`} />
                  <span className="font-medium text-sm">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 lg:p-6 pb-[calc(1rem+var(--mobile-browser-bottom,0px))] lg:pb-6 border-t border-black/[0.07] dark:border-gray-800 flex-shrink-0">
        <button
          onClick={onSettingsClick}
          className="w-full flex items-center space-x-3 p-3 text-left text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 rounded-xl transition-all"
        >
          <div className="w-10 h-10 bg-black dark:bg-white rounded-xl flex items-center justify-center">
            <User className="h-5 w-5 text-white dark:text-black" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Settings & profile</p>
          </div>
        </button>
      </div>
    </div>
  );
};
