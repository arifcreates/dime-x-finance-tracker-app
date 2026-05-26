import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Settings, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { RecurringPaymentForm } from '../components/Forms/RecurringPaymentForm';
import { RecurringPayment } from '../types';
import { dataService } from '../services/dataService';
import { formatCurrency, formatDate, getDaysUntilDate } from '../utils/formatters';

export const Recurring: React.FC = () => {
  const fmt = useCurrencyFormat();
  const [payments, setPayments] = useState<RecurringPayment[]>([]);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState<RecurringPayment | undefined>();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    setPayments(await dataService.getRecurringPayments());
  };

  const handlePaymentSave = () => {
    refreshData();
    setEditingPayment(undefined);
  };

  const handleDeletePayment = (id: string) => {
    if (confirm('Are you sure you want to delete this recurring payment?')) {
      dataService.deleteRecurringPayment(id);
      refreshData();
    }
  };

  const handleEditPayment = (payment: RecurringPayment) => {
    setEditingPayment(payment);
    setShowPaymentForm(true);
  };

  const handleToggleActive = (payment: RecurringPayment) => {
    const updatedPayment = { ...payment, isActive: !payment.isActive };
    dataService.saveRecurringPayment(updatedPayment);
    refreshData();
  };

  const categories = ['all', ...Array.from(new Set(payments.map(p => p.category)))];
  const filteredPayments = selectedCategory === 'all' 
    ? payments 
    : payments.filter(p => p.category === selectedCategory);

  const activePayments = payments.filter(p => p.isActive);
  const totalMonthlyAmount = activePayments
    .filter(p => p.frequency === 'monthly')
    .reduce((sum, p) => sum + p.amount, 0);
  const totalYearlyAmount = activePayments
    .filter(p => p.frequency === 'yearly')
    .reduce((sum, p) => sum + p.amount, 0);
  const totalAnnualCost = totalMonthlyAmount * 12 + totalYearlyAmount;

  const getFrequencyColor = (frequency: string) => {
    return frequency === 'monthly' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400';
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Software': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
      'Utilities': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
      'Insurance': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
      'Subscriptions': 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
      'Rent': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
      'Internet': 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400',
      'Phone': 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400',
      'Cloud Services': 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400',
      'Marketing': 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
    };
    return colors[category] || 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-3 sm:p-4 lg:p-6 pb-20 lg:pb-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        
        {/* Header */}
        <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-2xl sm:rounded-[1.75rem] border border-gray-100 dark:border-gray-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Recurring Payments</h3>
              <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base">Manage your subscriptions and recurring expenses</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button
                onClick={() => setShowPaymentForm(true)}
                className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl hover:from-teal-600 hover:to-cyan-700 transition-all font-medium shadow-lg shadow-teal-500/25"
              >
                <Plus className="h-4 w-4" />
                <span>Add Subscription</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
            <h4 className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Active Subscriptions</h4>
            <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{activePayments.length}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Out of {payments.length} total</p>
          </div>
          <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
            <h4 className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Monthly Cost</h4>
            <p className="text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400">{fmt(totalMonthlyAmount)}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Recurring monthly</p>
          </div>
          <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
            <h4 className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Yearly Cost</h4>
            <p className="text-lg sm:text-2xl font-bold text-purple-600 dark:text-purple-400">{fmt(totalYearlyAmount)}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Annual payments</p>
          </div>
          <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
            <h4 className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Annual</h4>
            <p className="text-lg sm:text-2xl font-bold text-orange-600 dark:text-orange-400">{fmt(totalAnnualCost)}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">All subscriptions</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Category Filter */}
          <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Categories</h4>
            <div className="space-y-2">
              {categories.map((category) => {
                const categoryPayments = category === 'all' ? payments : payments.filter(p => p.category === category);
                const categoryTotal = categoryPayments
                  .filter(p => p.isActive)
                  .reduce((sum, p) => sum + (p.frequency === 'monthly' ? p.amount * 12 : p.amount), 0);
                
                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`w-full text-left px-3 py-2 rounded-xl transition-colors ${
                      selectedCategory === category ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium capitalize text-sm sm:text-base text-gray-900 dark:text-white">
                        {category === 'all' ? 'All Categories' : category}
                      </span>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{fmt(categoryTotal)}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{categoryPayments.length} items</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payments List */}
          <div className="lg:col-span-3 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
            <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-800">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                {selectedCategory === 'all' ? 'All Payments' : `${selectedCategory} Payments`}
              </h4>
            </div>
            
            <div className="p-4 sm:p-6">
              {filteredPayments.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <Calendar className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 mb-4">No recurring payments found</p>
                  <button
                    onClick={() => setShowPaymentForm(true)}
                    className="px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl hover:from-teal-600 hover:to-cyan-700 transition-all font-medium"
                  >
                    Add Your First Subscription
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredPayments.map((payment) => {
                    const daysUntil = getDaysUntilDate(payment.nextDate);
                    const annualCost = payment.frequency === 'monthly' ? payment.amount * 12 : payment.amount;
                    
                    return (
                      <div key={payment.id} className={`p-5 rounded-xl border transition-all ${
                        payment.isActive ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900' : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 opacity-75'
                      }`}>
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                <h5 className="font-bold text-gray-900 dark:text-white text-base">{payment.name}</h5>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getCategoryColor(payment.category)}`}>
                                  {payment.category}
                                </span>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getFrequencyColor(payment.frequency)}`}>
                                  {payment.frequency}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2 lg:hidden">
                                <button
                                  onClick={() => handleToggleActive(payment)}
                                  className={`p-2 rounded-lg transition-colors ${
                                    payment.isActive 
                                      ? 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20' 
                                      : 'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                                  }`}
                                  title={payment.isActive ? 'Deactivate' : 'Activate'}
                                >
                                  {payment.isActive ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                                </button>
                                <button
                                  onClick={() => handleEditPayment(payment)}
                                  className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeletePayment(payment.id)}
                                  className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="text-gray-500 dark:text-gray-400 font-medium">Amount</p>
                                <p className="font-bold text-gray-900 dark:text-white text-lg">{fmt(payment.amount)}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">per {payment.frequency.slice(0, -2)}</p>
                              </div>
                              <div>
                                <p className="text-gray-500 dark:text-gray-400 font-medium">Next Payment</p>
                                <p className="font-semibold text-gray-900 dark:text-white">{formatDate(payment.nextDate)}</p>
                                <p className={`text-xs font-medium ${
                                  daysUntil <= 3 ? 'text-red-600 dark:text-red-400' :
                                  daysUntil <= 7 ? 'text-yellow-600 dark:text-yellow-400' :
                                  'text-green-600 dark:text-green-400'
                                }`}>
                                  {daysUntil <= 0 ? 'Due today' : `${daysUntil} days left`}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500 dark:text-gray-400 font-medium">Annual Cost</p>
                                <p className="font-bold text-gray-900 dark:text-white text-lg">{fmt(annualCost)}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">total per year</p>
                              </div>
                            </div>
                          </div>
                          
                          {/* Desktop Actions */}
                          <div className="hidden lg:flex items-center space-x-2 flex-shrink-0">
                            <button
                              onClick={() => handleToggleActive(payment)}
                              className={`p-3 rounded-xl transition-colors ${
                                payment.isActive 
                                  ? 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20' 
                                  : 'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                              }`}
                              title={payment.isActive ? 'Deactivate' : 'Activate'}
                            >
                              {payment.isActive ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6" />}
                            </button>
                            <button
                              onClick={() => handleEditPayment(payment)}
                              className="p-3 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors"
                            >
                              <Edit className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDeletePayment(payment.id)}
                              className="p-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recurring Payment Form */}
        <RecurringPaymentForm
          isOpen={showPaymentForm}
          onClose={() => {
            setShowPaymentForm(false);
            setEditingPayment(undefined);
          }}
          onSave={handlePaymentSave}
          payment={editingPayment}
        />
      </div>
    </div>
  );
};