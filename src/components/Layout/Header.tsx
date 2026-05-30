import React, { useState } from 'react';
import { Bell, Search, Menu } from 'lucide-react';
import { NotificationDropdown } from './NotificationDropdown';

interface HeaderProps {
  sectionTitle: string;
  onMenuClick?: () => void;
  user?: any;
  onSettingsClick?: () => void;
  onSearch?: (query: string) => void;
  searchQuery?: string;
}

export const Header: React.FC<HeaderProps> = ({ 
  sectionTitle, 
  onMenuClick, 
  onSearch,
  searchQuery = ''
}) => {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="bg-[#f7f7f4] dark:bg-gray-900 border-b border-black/[0.07] dark:border-gray-800 px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
      <div className="flex min-h-[64px] items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Mobile Menu Button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div>
            <h2 className="text-xl sm:text-2xl lg:text-[2rem] font-semibold text-gray-900 dark:text-white tracking-tight">
              {sectionTitle}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium text-sm sm:text-base hidden sm:block">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4 lg:space-x-6">
          {/* Search - Hidden on mobile */}
          <div className="relative hidden xl:block">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => onSearch?.(e.target.value)}
              className="pl-12 pr-6 py-3 bg-white dark:bg-gray-800 border border-black/[0.07] dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-black dark:focus:ring-white focus:bg-white dark:focus:bg-gray-700 transition-all w-80 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 font-medium"
            />
          </div>

          {/* Notifications */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-3 sm:p-4 text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-white dark:hover:bg-gray-800 rounded-2xl transition-all"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-lime-400 rounded-full"></span>
            </button>
            
            <NotificationDropdown 
              isOpen={showNotifications} 
              onClose={() => setShowNotifications(false)} 
            />
          </div>
        </div>
      </div>
    </header>
  );
};
