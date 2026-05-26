import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Edit, Trash2, ArrowUpRight, ArrowDownLeft, Filter, Search } from 'lucide-react';
import { Account, Transaction } from '../types';
import { dataService } from '../services/dataService';
import { formatCurrency, formatDate } from '../utils/formatters';
import { TransactionForm } from '../components/Forms/TransactionForm';

interface AccountDetailProps {
  accountId: string;
  onBack: () => void;
}

export const AccountDetail: React.FC<AccountDetailProps> = ({ accountId, onBack }) => {
  const fmt = useCurrencyFormat();
  const [account, setAccount] = useState<Account | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('income');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');

  useEffect(() => {
    const load = async () => {
      const accounts = await dataService.getAccounts();
      const foundAccount = accounts.find(acc => acc.id === accountId) || null;
      setAccount(foundAccount);
      const allTransactions = await dataService.getTransactions();
      const accountTransactions = allTransactions.filter(t => t.account === foundAccount?.name);
      setTransactions(accountTransactions);
      setFilteredTransactions(accountTransactions);
    };
    load();
  }, [accountId]);

  useEffect(() => {
    let filtered = transactions;

    if (filterType !== 'all') {
      filtered = filtered.filter(t => t.type === filterType);
    }

    if (searchTerm) {
      filtered = filtered.filter(t =>
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredTransactions(filtered);
  }, [transactions, filterType, searchTerm]);

  const handleTransactionSave = async () => {
    const accounts = await dataService.getAccounts();
    const foundAccount = accounts.find(acc => acc.id === accountId) || null;
    setAccount(foundAccount);
    const allTransactions = await dataService.getTransactions();
    const accountTransactions = allTransactions.filter(t => t.account === foundAccount?.name);
    setTransactions(accountTransactions);
  };

  const handleDeleteTransaction = (id: string) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      dataService.deleteTransaction(id);
      handleTransactionSave();
    }
  };

  const handleQuickAction = (type: 'income' | 'expense') => {
    setTransactionType(type);
    setShowTransactionForm(true);
  };

  if (!account) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Account not found</h2>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const getAccountTypeColor = (type: string) => {
    switch (type) {
      case 'savings':
        return 'from-green-500 to-emerald-600';
      case 'current':
        return 'from-blue-500 to-indigo-600';
      case 'cash':
        return 'from-yellow-500 to-orange-500';
      case 'investment':
        return 'from-purple-500 to-pink-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 lg:pb-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 p-4 sm:p-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
          >
            <ArrowLeft className="h-6 w-6 text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{account.name}</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Account Details & Transactions</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Account Overview */}
        <div className={`bg-gradient-to-r ${getAccountTypeColor(account.type)} p-6 rounded-2xl text-white`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-white/80 text-sm font-medium">Current Balance</p>
              <p className="text-3xl font-bold">{fmt(account.balance, account.currency)}</p>
            </div>
            <div className="text-right">
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                {account.type.charAt(0).toUpperCase() + account.type.slice(1)}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-white/80 text-xs font-medium mb-1">Total Income</p>
              <p className="text-lg font-bold">{fmt(totalIncome, account.currency)}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-white/80 text-xs font-medium mb-1">Total Expenses</p>
              <p className="text-lg font-bold">{fmt(totalExpenses, account.currency)}</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleQuickAction('income')}
              className="flex items-center justify-center space-x-2 p-4 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-800/30 rounded-xl transition-colors border border-green-200 dark:border-green-700"
            >
              <Plus className="h-5 w-5 text-green-600 dark:text-green-400" />
              <span className="font-semibold text-green-700 dark:text-green-400">Add Income</span>
            </button>
            <button
              onClick={() => handleQuickAction('expense')}
              className="flex items-center justify-center space-x-2 p-4 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-800/30 rounded-xl transition-colors border border-red-200 dark:border-red-700"
            >
              <Plus className="h-5 w-5 text-red-600 dark:text-red-400" />
              <span className="font-semibold text-red-700 dark:text-red-400">Add Expense</span>
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setFilterType('all')}
                className={`px-4 py-3 rounded-xl font-medium transition-colors ${
                  filterType === 'all' ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType('income')}
                className={`px-4 py-3 rounded-xl font-medium transition-colors ${
                  filterType === 'income' ? 'bg-green-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Income
              </button>
              <button
                onClick={() => setFilterType('expense')}
                className={`px-4 py-3 rounded-xl font-medium transition-colors ${
                  filterType === 'expense' ? 'bg-red-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Expenses
              </button>
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
          <div className="p-6 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Transactions ({filteredTransactions.length})
              </h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Showing {filterType === 'all' ? 'all' : filterType} transactions
              </span>
            </div>
          </div>
          
          <div className="p-6">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Filter className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                </div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-2">No transactions found</h4>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  {searchTerm || filterType !== 'all' 
                    ? 'Try adjusting your filters or search term'
                    : 'Start by adding your first transaction'
                  }
                </p>
                <button
                  onClick={() => handleQuickAction('income')}
                  className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors font-semibold"
                >
                  Add Transaction
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTransactions.map((transaction) => (
                  <div key={transaction.id} className="group flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        transaction.type === 'income' 
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                          : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                      }`}>
                        {transaction.type === 'income' ? (
                          <ArrowUpRight className="h-5 w-5" />
                        ) : (
                          <ArrowDownLeft className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{transaction.description}</p>
                        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                          <span>{formatDate(transaction.date)}</span>
                          <span>•</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            transaction.type === 'income' 
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                          }`}>
                            {transaction.category}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className={`font-bold ${
                          transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'}{fmt(transaction.amount, account.currency)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteTransaction(transaction.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Transaction Form */}
      <TransactionForm
        isOpen={showTransactionForm}
        onClose={() => setShowTransactionForm(false)}
        onSave={handleTransactionSave}
        type={transactionType}
      />
    </div>
  );
};