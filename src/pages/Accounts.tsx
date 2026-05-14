import React, { useState, useEffect } from 'react';
import { Wallet, Plus, RefreshCw, Edit, Trash2, ArrowUpDown } from 'lucide-react';
import { AccountForm } from '../components/Forms/AccountForm';
import { TransferForm } from '../components/Forms/TransferForm';
import { Account, Transaction } from '../types';
import { dataService } from '../services/dataService';
import { formatCurrency } from '../utils/formatters';

interface AccountsProps {
  onAccountSelect?: (accountId: string) => void;
}

export const Accounts: React.FC<AccountsProps> = ({ onAccountSelect }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | undefined>();

  useEffect(() => {
    setAccounts(dataService.getAccounts());
  }, []);

  const handleAccountSave = () => {
    setAccounts(dataService.getAccounts());
    setEditingAccount(undefined);
  };

  const handleTransfer = () => {
    setAccounts(dataService.getAccounts());
  };

  const handleDeleteAccount = (id: string) => {
    if (confirm('Are you sure you want to delete this account?')) {
      const updatedAccounts = accounts.filter(acc => acc.id !== id);
      localStorage.setItem('accounts', JSON.stringify(updatedAccounts));
      setAccounts(updatedAccounts);
    }
  };

  const handleEditAccount = (account: Account) => {
    setEditingAccount(account);
    setShowAccountForm(true);
  };

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);

  const getAccountTypeColor = (type: string) => {
    switch (type) {
      case 'savings':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400';
      case 'current':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400';
      case 'cash':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400';
      case 'investment':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-3 sm:p-4 lg:p-6 pb-20 lg:pb-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        
        {/* Header */}
        <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-2xl sm:rounded-[1.75rem] shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Accounts & Cash</h3>
              <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base">Manage your bank accounts and cash flow</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button
                onClick={() => setShowAccountForm(true)}
                className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-semibold shadow-lg shadow-blue-500/25 hover:scale-[1.02]"
              >
                <Plus className="h-4 w-4" />
                <span>Add Account</span>
              </button>
              <button
                onClick={() => setShowTransferForm(true)}
                className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all font-semibold shadow-lg shadow-green-500/25 hover:scale-[1.02]"
              >
                <ArrowUpDown className="h-4 w-4" />
                <span>Transfer</span>
              </button>
              <button className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all font-semibold shadow-lg shadow-gray-500/25 hover:scale-[1.02]">
                <RefreshCw className="h-4 w-4" />
                <span>Reconcile</span>
              </button>
            </div>
          </div>
        </div>

        {/* Total Balance Card */}
        <div className="bg-gradient-to-r from-blue-600 to-teal-600 p-4 sm:p-6 rounded-2xl sm:rounded-[1.75rem] text-white">
          <h3 className="text-lg font-medium opacity-90">Total Balance</h3>
          <p className="text-2xl sm:text-3xl font-bold mt-2">{formatCurrency(totalBalance)}</p>
          <p className="text-sm opacity-75 mt-1">Across {accounts.length} accounts</p>
        </div>

        {/* Accounts Grid - Horizontal Layout */}
        <div className="space-y-4">
          {/* Desktop: 4 cards per row */}
          <div className="hidden lg:grid lg:grid-cols-4 gap-4">
            {accounts.map((account) => (
              <div 
                key={account.id} 
                className="bg-white dark:bg-gray-900 p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer"
                onClick={() => onAccountSelect?.(account.id)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                      <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base truncate">{account.name}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAccountTypeColor(account.type)}`}>
                        {account.type.charAt(0).toUpperCase() + account.type.slice(1)}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditAccount(account);
                      }}
                      className="p-2 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAccount(account.id);
                      }}
                      className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Balance</span>
                    <span className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(account.balance)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Currency</span>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{account.currency}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowTransferForm(true);
                    }}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium"
                  >
                    <ArrowUpDown className="h-4 w-4" />
                    <span>Transfer</span>
                  </button>
                </div>
              </div>
            ))}

            {/* Add Account Card */}
            <div
              onClick={() => setShowAccountForm(true)}
              className="bg-white dark:bg-gray-900 p-4 sm:p-5 rounded-2xl shadow-sm border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors cursor-pointer flex flex-col items-center justify-center text-center min-h-[200px]"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-4">
                <Plus className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2 text-sm sm:text-base">Add New Account</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">Create a new bank account or cash account</p>
            </div>
          </div>

          {/* Tablet: 2 cards per row */}
          <div className="hidden md:grid lg:hidden md:grid-cols-2 gap-4">
            {accounts.map((account) => (
              <div 
                key={account.id} 
                className="bg-white dark:bg-gray-900 p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer"
                onClick={() => onAccountSelect?.(account.id)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                      <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base truncate">{account.name}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAccountTypeColor(account.type)}`}>
                        {account.type.charAt(0).toUpperCase() + account.type.slice(1)}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditAccount(account);
                      }}
                      className="p-2 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAccount(account.id);
                      }}
                      className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Balance</span>
                    <span className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(account.balance)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Currency</span>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{account.currency}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowTransferForm(true);
                    }}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium"
                  >
                    <ArrowUpDown className="h-4 w-4" />
                    <span>Transfer</span>
                  </button>
                </div>
              </div>
            ))}

            {/* Add Account Card */}
            <div
              onClick={() => setShowAccountForm(true)}
              className="bg-white dark:bg-gray-900 p-4 sm:p-5 rounded-2xl shadow-sm border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors cursor-pointer flex flex-col items-center justify-center text-center min-h-[200px]"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-4">
                <Plus className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2 text-sm sm:text-base">Add New Account</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">Create a new bank account or cash account</p>
            </div>
          </div>

          {/* Mobile: 2 cards per row */}
          <div className="grid md:hidden grid-cols-2 gap-3">
            {accounts.map((account) => (
              <div 
                key={account.id} 
                className="bg-white dark:bg-gray-900 p-3 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer"
                onClick={() => onAccountSelect?.(account.id)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                    <Wallet className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditAccount(account);
                      }}
                      className="p-1 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    >
                      <Edit className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAccount(account.id);
                      }}
                      className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-bold text-gray-900 dark:text-white text-sm truncate">{account.name}</h4>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getAccountTypeColor(account.type)}`}>
                    {account.type.charAt(0).toUpperCase() + account.type.slice(1)}
                  </span>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(account.balance)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{account.currency}</p>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowTransferForm(true);
                    }}
                    className="w-full flex items-center justify-center space-x-1 px-2 py-2 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-xs font-medium"
                  >
                    <ArrowUpDown className="h-3 w-3" />
                    <span>Transfer</span>
                  </button>
                </div>
              </div>
            ))}

            {/* Add Account Card */}
            <div
              onClick={() => setShowAccountForm(true)}
              className="bg-white dark:bg-gray-900 p-3 rounded-2xl shadow-sm border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors cursor-pointer flex flex-col items-center justify-center text-center min-h-[140px]"
            >
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-2">
                <Plus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-1 text-sm">Add Account</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">Create new account</p>
            </div>
          </div>
        </div>

        {/* Forms */}
        <AccountForm
          isOpen={showAccountForm}
          onClose={() => {
            setShowAccountForm(false);
            setEditingAccount(undefined);
          }}
          onSave={handleAccountSave}
          account={editingAccount}
        />

        <TransferForm
          isOpen={showTransferForm}
          onClose={() => setShowTransferForm(false)}
          onTransfer={handleTransfer}
          accounts={accounts}
        />
      </div>
    </div>
  );
};