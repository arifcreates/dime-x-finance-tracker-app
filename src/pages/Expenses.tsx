import React, { useState, useEffect } from 'react';
import { Receipt, Plus, Upload, Edit, Trash2 } from 'lucide-react';
import { TransactionForm } from '../components/Forms/TransactionForm';
import { Transaction } from '../types';
import { dataService } from '../services/dataService';
import { formatCurrency, formatDate } from '../utils/formatters';

export const Expenses: React.FC = () => {
  const [expenses, setExpenses] = useState<Transaction[]>([]);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Transaction | undefined>();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    setExpenses(dataService.getTransactions().filter(t => t.type === 'expense'));
  }, []);

  const handleExpenseSave = () => {
    setExpenses(dataService.getTransactions().filter(t => t.type === 'expense'));
    setEditingExpense(undefined);
  };

  const handleDeleteExpense = (id: string) => {
    if (confirm('Are you sure you want to delete this expense?')) {
      dataService.deleteTransaction(id);
      setExpenses(dataService.getTransactions().filter(t => t.type === 'expense'));
    }
  };

  const handleEditExpense = (expense: Transaction) => {
    setEditingExpense(expense);
    setShowExpenseForm(true);
  };

  const categories = ['all', ...Array.from(new Set(expenses.map(e => e.category)))];
  const filteredExpenses = selectedCategory === 'all' 
    ? expenses 
    : expenses.filter(e => e.category === selectedCategory);

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const thisMonthExpenses = expenses
    .filter(e => new Date(e.date).getMonth() === new Date().getMonth())
    .reduce((sum, exp) => sum + exp.amount, 0);

  const categoryTotals = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-3 sm:p-4 lg:p-6 pb-20 lg:pb-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        
        {/* Header */}
        <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-2xl sm:rounded-[1.75rem] shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Expenses & Receipts</h3>
              <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base">Track and categorize your business expenses</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button
                onClick={() => setShowExpenseForm(true)}
                className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors font-medium shadow-lg shadow-orange-500/25"
              >
                <Plus className="h-4 w-4" />
                <span>Add Expense</span>
              </button>
              <button className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors font-medium shadow-lg shadow-gray-500/25">
                <Upload className="h-4 w-4" />
                <span>Upload Receipt</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Expenses</h4>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(totalExpenses)}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">This Month</h4>
            <p className="text-xl sm:text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">{formatCurrency(thisMonthExpenses)}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Categories</h4>
            <p className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{Object.keys(categoryTotals).length}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Category Breakdown */}
          <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Categories</h4>
            <div className="space-y-2 sm:space-y-3">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  selectedCategory === 'all' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <div className="flex justify-between">
                  <span className="text-sm sm:text-base text-gray-900 dark:text-white">All Expenses</span>
                  <span className="font-medium text-sm sm:text-base text-gray-900 dark:text-white">{formatCurrency(totalExpenses)}</span>
                </div>
              </button>
              {Object.entries(categoryTotals).map(([category, total]) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    selectedCategory === category ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="flex justify-between">
                    <span className="text-sm sm:text-base truncate text-gray-900 dark:text-white">{category}</span>
                    <span className="font-medium text-sm sm:text-base text-gray-900 dark:text-white">{formatCurrency(total)}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Expenses List */}
          <div className="lg:col-span-3 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
            <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-800">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                {selectedCategory === 'all' ? 'All Expenses' : `${selectedCategory} Expenses`}
              </h4>
            </div>
            
            <div className="p-4 sm:p-6">
              {filteredExpenses.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <Receipt className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 mb-4">No expenses found</p>
                  <button
                    onClick={() => setShowExpenseForm(true)}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    Add Your First Expense
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredExpenses.map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between p-3 sm:p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                          <div className="mb-2 sm:mb-0">
                            <h5 className="font-medium text-gray-900 dark:text-white truncate">{expense.description}</h5>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {expense.category} • {formatDate(expense.date)} • {expense.account}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <p className="font-semibold text-red-600 dark:text-red-400">{formatCurrency(expense.amount)}</p>
                            <div className="flex space-x-1">
                              <button
                                onClick={() => handleEditExpense(expense)}
                                className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteExpense(expense.id)}
                                className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Expense Form */}
        <TransactionForm
          isOpen={showExpenseForm}
          onClose={() => {
            setShowExpenseForm(false);
            setEditingExpense(undefined);
          }}
          onSave={handleExpenseSave}
          type="expense"
          transaction={editingExpense}
        />
      </div>
    </div>
  );
};