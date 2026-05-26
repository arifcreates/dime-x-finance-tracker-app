import React from 'react';
import { AlertTriangle, Calendar, CreditCard } from 'lucide-react';
import { formatCurrency, getDaysUntilDate, formatDate } from '../../utils/formatters';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';

interface Alert {
  id: string;
  type: 'emi' | 'credit-card' | 'subscription';
  title: string;
  amount: number;
  dueDate: string;
  urgency: 'high' | 'medium' | 'low';
}

interface UpcomingAlertsProps {
  alerts: Alert[];
  onDelete?: (id: string) => void;
}

export const UpcomingAlerts: React.FC<UpcomingAlertsProps> = ({ alerts }) => {
  const fmt = useCurrencyFormat();
  const getIcon = (type: string) => {
    switch (type) {
      case 'emi':
        return Calendar;
      case 'credit-card':
        return CreditCard;
      default:
        return AlertTriangle;
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-100 dark:border-red-800';
      case 'medium':
        return 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-100 dark:border-yellow-800';
      default:
        return 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-800';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-2xl border border-gray-100 dark:border-gray-800 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-gray-900 dark:text-white tracking-tight">Upcoming Payments</h3>
        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full">
          {alerts.length} pending
        </span>
      </div>
      
      <div className="space-y-2">
        {alerts.length === 0 ? (
          <div className="text-center py-6 text-gray-500 dark:text-gray-400">
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-6 w-6 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="font-bold text-gray-900 dark:text-white mb-1 text-sm">All caught up!</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">No upcoming payments</p>
          </div>
        ) : (
          alerts.slice(0, 4).map((alert) => {
            const Icon = getIcon(alert.type);
            const daysUntil = getDaysUntilDate(alert.dueDate);
            
            return (
              <div key={alert.id} className={`p-3 rounded-xl border group ${getUrgencyColor(alert.urgency)}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Icon className="h-4 w-4" />
                    <div>
                      <p className="font-medium text-sm">{alert.title}</p>
                      <div className="flex items-center space-x-2 text-xs opacity-75">
                        <span>Due: {formatDate(alert.dueDate)}</span>
                        <span>•</span>
                        <span>
                          {daysUntil > 0 
                            ? `${daysUntil} days left` 
                            : daysUntil === 0 
                            ? 'Due today' 
                            : `${Math.abs(daysUntil)} days overdue`
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">{fmt(alert.amount)}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};