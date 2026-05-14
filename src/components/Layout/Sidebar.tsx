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
} from 'lucide-react';

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

// Custom star logo component using the provided SVG - bigger size
const DimeXLogo: React.FC<{ className?: string }> = ({ className = "h-6 w-6" }) => (
  <svg viewBox="0 0 100 100" fill="currentColor" className={className}>
    <g>
      <polygon points="85.1,50 72.3,72.3 59.4,50 72.3,27.7" />
      <polygon points="14.9,50 27.7,72.3 40.6,50 27.7,27.7" />
      <polygon points="50,40.6 72.3,27.7 50,14.9 27.7,27.7" />
      <polygon points="50,85.1 72.3,72.3 50,59.4 27.7,72.3" />
    </g>
  </svg>
);

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeSection, 
  onSectionChange, 
  onClose,
  user,
  onSettingsClick 
}) => {
  return (
    <div className="w-80 lg:w-80 bg-white dark:bg-gray-900 min-h-screen flex flex-col border-r border-gray-100 dark:border-gray-800">
      {/* Header */}
      <div className="p-6 lg:p-8 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-black dark:bg-white rounded-2xl flex items-center justify-center shadow-lg">
              <DimeXLogo className="h-10 w-10 text-white dark:text-black" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-black dark:text-white" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>Dime-x</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Personal Finance</p>
            </div>
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
      <nav className="flex-1 p-4 lg:p-6">
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
                      ? 'bg-black dark:bg-white text-white dark:text-black shadow-lg shadow-black/20 dark:shadow-white/20'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
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
    </div>
  );
};