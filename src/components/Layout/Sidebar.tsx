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
  UsersRound,
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
  { id: 'clients', label: 'Clients', icon: UsersRound },
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
  const avatar = user?.avatar || user?.preferences?.avatar;
  const avatarInitial = (user?.name || user?.email || 'U').trim().charAt(0).toUpperCase();

  return (
    <div className="w-80 lg:w-80 bg-[#f7f7f4] dark:bg-gray-900 h-[calc(100dvh-var(--mobile-browser-bottom,0px))] lg:h-screen flex flex-col border-r border-black/[0.07] dark:border-gray-800">
      {/* Header */}
      <div className="flex h-[96px] flex-shrink-0 items-center border-b border-black/[0.07] px-5 py-0 dark:border-gray-800 lg:h-[112px] lg:px-7">
        <div className="flex w-full items-center justify-between">
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
          <div className="flex h-10 w-10 overflow-hidden rounded-full bg-black text-white dark:bg-white dark:text-black">
            {avatar ? (
              <img src={avatar} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm font-semibold">
                {avatarInitial || <User className="h-5 w-5" />}
              </div>
            )}
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
