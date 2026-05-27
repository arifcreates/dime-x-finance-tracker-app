import React, { useState, useEffect } from 'react';
import { Bell, Calendar, CreditCard, X } from 'lucide-react';
import { formatCurrency, formatDate, getDaysUntilDate } from '../../utils/formatters';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';
import { dataService } from '../../services/dataService';
import { EMI, CreditCard as CreditCardType } from '../../types';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ isOpen, onClose }) => {
  const fmt = useCurrencyFormat();
  const [emis, setEmis] = useState<EMI[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCardType[]>([]);

  useEffect(() => {
    if (isOpen) {
      Promise.all([dataService.getEMIs(), dataService.getCreditCards()]).then(([emiList, cardList]) => {
        setEmis(emiList);
        setCreditCards(cardList);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Generate notifications from data
  const notifications = [
    // EMI notifications
    ...emis.map(emi => {
      const daysUntil = getDaysUntilDate(emi.nextDueDate);
      return {
        id: `emi-${emi.id}`,
        type: 'emi' as const,
        title: `EMI Payment Due`,
        message: `${emi.name} payment of ${fmt(emi.monthlyAmount)} is due ${daysUntil <= 0 ? 'today' : `in ${daysUntil} days`}`,
        time: emi.nextDueDate,
        urgency: daysUntil <= 3 ? 'high' as const : 'medium' as const,
        icon: Calendar,
      };
    }),
    // Credit card notifications
    ...creditCards.map(card => {
      const daysUntil = getDaysUntilDate(card.dueDate);
      return {
        id: `card-${card.id}`,
        type: 'credit-card' as const,
        title: `Credit Card Payment Due`,
        message: `${card.name} minimum payment of ${fmt(card.minimumDue)} is due ${daysUntil <= 0 ? 'today' : `in ${daysUntil} days`}`,
        time: card.dueDate,
        urgency: daysUntil <= 3 ? 'high' as const : 'medium' as const,
        icon: CreditCard,
      };
    }),
  ].sort((a, b) => {
    // Sort by urgency first, then by date
    const urgencyOrder = { high: 3, medium: 2, low: 1 };
    if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
      return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
    }
    return new Date(b.time).getTime() - new Date(a.time).getTime();
  });

  const getNotificationColor = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return 'border-l-red-500 bg-red-50 dark:bg-red-900/20';
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      default:
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20';
    }
  };

  const getIconColor = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return 'text-red-600 dark:text-red-400';
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-blue-600 dark:text-blue-400';
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose}
      />
      
      {/* Dropdown */}
      <div className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <h3 className="font-bold text-gray-900 dark:text-white">Notifications</h3>
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {notifications.filter(n => n.urgency === 'high').length}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-6 text-center">
              <Bell className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">No notifications</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm">You're all caught up!</p>
            </div>
          ) : (
            <div className="p-2">
              {notifications.slice(0, 8).map((notification) => {
                const Icon = notification.icon;
                return (
                  <div
                    key={notification.id}
                    className={`p-3 mb-2 rounded-xl border-l-4 ${getNotificationColor(notification.urgency)} hover:shadow-md transition-all cursor-pointer`}
                  >
                    <div className="flex items-start space-x-3">
                      <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${getIconColor(notification.urgency)}`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">
                          {notification.title}
                        </p>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1 leading-relaxed">
                          {notification.message}
                        </p>
                        <p className="text-gray-400 dark:text-gray-500 text-xs mt-2">
                          {formatDate(notification.time)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <button className="w-full text-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold text-sm transition-colors">
              Mark all as read
            </button>
          </div>
        )}
      </div>
    </>
  );
};
