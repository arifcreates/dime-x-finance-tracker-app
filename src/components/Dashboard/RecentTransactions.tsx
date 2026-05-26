import React from 'react';
import { Transaction } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';
import { ArrowUpRight, ArrowDownLeft, Trash2, TrendingUp, ArrowRight } from 'lucide-react';
import { dataService } from '../../services/dataService';

interface RecentTransactionsProps {
  transactions: Transaction[];
  onUpdate: () => void;
  onViewAll?: () => void;
}

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({ 
  transactions, 
  onUpdate,
  onViewAll 
}) => {
  const fmt = useCurrencyFormat();
  const recentTransactions = transactions.slice(0, 5);

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      dataService.deleteTransaction(id);
      onUpdate();
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h3 className="text-base font-bold text-gray-900 dark:text-white tracking-tight">Recent Transactions</h3>
        <button 
          onClick={onViewAll}
          className="text-black dark:text-white hover:text-gray-700 dark:hover:text-gray-300 text-xs font-bold px-3 sm:px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-all flex items-center space-x-1"
        >
          <span>View All</span>
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>
      
      <div className="space-y-2">
        {recentTransactions.length === 0 ? (
          <div className="text-center py-12 sm:py-16">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <TrendingUp className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400 dark:text-gray-500" />
            </div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-2 text-base">No transactions yet</h4>
            <p className="text-gray-500 dark:text-gray-400 mb-4 sm:mb-6 font-medium text-sm">Your recent transactions will appear here</p>
            <button className="px-4 sm:px-6 py-2 sm:py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-all font-bold shadow-lg shadow-black/20 dark:shadow-white/20 text-sm">
              Add Your First Transaction
            </button>
          </div>
        ) : (
          <div>
            {/* Desktop Table */}
            <div className="hidden md:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-2 font-semibold text-gray-900 dark:text-white text-sm">Details</th>
                    <th className="text-left py-3 px-2 font-semibold text-gray-900 dark:text-white text-sm">Date</th>
                    <th className="text-left py-3 px-2 font-semibold text-gray-900 dark:text-white text-sm">Source</th>
                    <th className="text-right py-3 px-2 font-semibold text-gray-900 dark:text-white text-sm">Amount</th>
                    <th className="text-center py-3 px-2 font-semibold text-gray-900 dark:text-white text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map((transaction) => (
                    <tr key={transaction.id} className="group hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <td className="py-3 px-2">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            transaction.type === 'income' 
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                              : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                          }`}>
                            {transaction.type === 'income' ? (
                              <ArrowUpRight className="h-4 w-4" />
                            ) : (
                              <ArrowDownLeft className="h-4 w-4" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-gray-900 dark:text-white text-sm truncate">{transaction.description}</p>
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                              transaction.type === 'income' 
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                            }`}>
                              {transaction.category}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-gray-600 dark:text-gray-400 text-sm font-medium">
                        {formatDate(transaction.date)}
                      </td>
                      <td className="py-3 px-2 text-gray-600 dark:text-gray-400 text-sm font-medium">
                        {transaction.account}
                      </td>
                      <td className={`py-3 px-2 text-right font-bold text-sm ${
                        transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}{fmt(transaction.amount)}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <button
                          onClick={() => handleDelete(transaction.id)}
                          className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="group flex items-center justify-between p-3 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 rounded-xl transition-all duration-200">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0 ${
                      transaction.type === 'income' 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                        : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                    }`}>
                      {transaction.type === 'income' ? (
                        <ArrowUpRight className="h-4 w-4" />
                      ) : (
                        <ArrowDownLeft className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 dark:text-white text-sm truncate">{transaction.description}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{formatDate(transaction.date)}</span>
                        <span className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></span>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full truncate ${
                          transaction.type === 'income' 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        }`}>
                          {transaction.category}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <div className="text-right">
                      <p className={`font-bold text-sm ${
                        transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}{fmt(transaction.amount)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium truncate">{transaction.account}</p>
                    </div>
                    <button
                      onClick={() => handleDelete(transaction.id)}
                      className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200 flex-shrink-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};