import React, { useState, useEffect } from 'react';
import { CreditCard as CreditCardIcon, Plus, Calculator, Edit, Trash2, Calendar, DollarSign, TrendingDown, AlertCircle } from 'lucide-react';
import { EMIForm } from '../components/Forms/EMIForm';
import { CreditCardForm } from '../components/Forms/CreditCardForm';
import { EMI as EMIType, CreditCard } from '../types';
import { dataService } from '../services/dataService';
import { formatCurrency, formatDate, getDaysUntilDate } from '../utils/formatters';
import { useCurrencyFormat } from '../hooks/useCurrencyFormat';

export const EMI: React.FC = () => {
  const fmt = useCurrencyFormat();
  const [emis, setEMIs] = useState<EMIType[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [showEMIForm, setShowEMIForm] = useState(false);
  const [showCreditCardForm, setShowCreditCardForm] = useState(false);
  const [editingEMI, setEditingEMI] = useState<EMIType | undefined>();
  const [editingCard, setEditingCard] = useState<CreditCard | undefined>();
  const [activeTab, setActiveTab] = useState<'emis' | 'cards'>('emis');

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    const [emiList, cardList] = await Promise.all([dataService.getEMIs(), dataService.getCreditCards()]);
    setEMIs(emiList);
    setCreditCards(cardList);
  };

  const handleEMISave = () => {
    refreshData();
    setEditingEMI(undefined);
  };

  const handleCreditCardSave = () => {
    refreshData();
    setEditingCard(undefined);
  };

  const handleDeleteEMI = (id: string) => {
    if (confirm('Are you sure you want to delete this EMI?')) {
      dataService.deleteEMI(id);
      refreshData();
    }
  };

  const handleDeleteCard = (id: string) => {
    if (confirm('Are you sure you want to delete this credit card?')) {
      dataService.deleteCreditCard(id);
      refreshData();
    }
  };

  const handleEditEMI = (emi: EMIType) => {
    setEditingEMI(emi);
    setShowEMIForm(true);
  };

  const handleEditCard = (card: CreditCard) => {
    setEditingCard(card);
    setShowCreditCardForm(true);
  };

  // Calculate totals
  const totalEMIAmount = emis.reduce((sum, emi) => sum + emi.monthlyAmount, 0);
  const totalRemainingBalance = emis.reduce((sum, emi) => sum + emi.remainingBalance, 0);
  const totalCreditLimit = creditCards.reduce((sum, card) => sum + card.creditLimit, 0);
  const totalCreditUsed = creditCards.reduce((sum, card) => sum + card.currentBalance, 0);
  const totalMinimumDue = creditCards.reduce((sum, card) => sum + card.minimumDue, 0);

  const getUtilizationColor = (utilization: number) => {
    if (utilization > 80) return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
    if (utilization > 50) return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30';
    return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
  };

  const getRemainingMonths = (emi: EMIType) => {
    if (emi.monthlyAmount === 0) return 0;
    return Math.ceil(emi.remainingBalance / emi.monthlyAmount);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 lg:p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Loans & Credit Cards</h1>
            <p className="text-gray-500 dark:text-gray-400">Manage your EMIs, loans, and credit card payments</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button
              onClick={() => setShowEMIForm(true)}
              className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-800 transition-all font-semibold shadow-lg shadow-blue-500/25 hover:scale-[1.02] transform duration-200"
            >
              <Plus className="h-4 w-4" />
              <span>Add EMI</span>
            </button>
            <button
              onClick={() => setShowCreditCardForm(true)}
              className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-700 text-white rounded-2xl hover:from-purple-700 hover:to-pink-800 transition-all font-semibold shadow-lg shadow-purple-500/25 hover:scale-[1.02] transform duration-200"
            >
              <Plus className="h-4 w-4" />
              <span>Add Card</span>
            </button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-900 p-5 rounded-[1.5rem] shadow-sm border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <Calculator className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-full">
                {emis.length} EMIs
              </span>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-xs font-medium mb-1">Monthly EMI</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{fmt(totalEMIAmount)}</p>
          </div>

          <div className="bg-white dark:bg-gray-900 p-5 rounded-[1.5rem] shadow-sm border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <span className="text-xs font-medium text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded-full">
                Outstanding
              </span>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-xs font-medium mb-1">Remaining Balance</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{fmt(totalRemainingBalance)}</p>
          </div>

          <div className="bg-white dark:bg-gray-900 p-5 rounded-[1.5rem] shadow-sm border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                <CreditCardIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded-full">
                {creditCards.length} Cards
              </span>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-xs font-medium mb-1">Credit Used</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{fmt(totalCreditUsed)}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">of {fmt(totalCreditLimit)} limit</p>
          </div>

          <div className="bg-white dark:bg-gray-900 p-5 rounded-[1.5rem] shadow-sm border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <span className="text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-full">
                Due Soon
              </span>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-xs font-medium mb-1">Minimum Due</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{fmt(totalMinimumDue)}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-900 rounded-[1.75rem] shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="border-b border-gray-100 dark:border-gray-800">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('emis')}
                className={`py-5 px-1 border-b-2 font-semibold text-sm transition-colors ${
                  activeTab === 'emis'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                EMIs & Loans ({emis.length})
              </button>
              <button
                onClick={() => setActiveTab('cards')}
                className={`py-5 px-1 border-b-2 font-semibold text-sm transition-colors ${
                  activeTab === 'cards'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Credit Cards ({creditCards.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'emis' ? (
              <div className="space-y-4">
                {emis.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4">
                      <Calculator className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No EMIs Added</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">Start tracking your loans and EMI payments</p>
                    <button
                      onClick={() => setShowEMIForm(true)}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-800 transition-all font-semibold shadow-lg shadow-blue-500/25"
                    >
                      Add Your First EMI
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {emis.map((emi) => {
                      const remainingMonths = getRemainingMonths(emi);
                      const daysUntilDue = getDaysUntilDate(emi.nextDueDate);
                      const progressPercentage = ((emi.principal - emi.remainingBalance) / emi.principal) * 100;
                      
                      return (
                        <div key={emi.id} className="group bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-700/50 p-5 rounded-[1.5rem] border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-gray-800/50 transition-all duration-200 hover:-translate-y-1">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                                <Calculator className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div>
                                <h4 className="font-bold text-gray-900 dark:text-white">{emi.name}</h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {remainingMonths} months remaining
                                </p>
                              </div>
                            </div>
                            <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleEditEMI(emi)}
                                className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteEMI(emi.id)}
                                className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Monthly EMI</p>
                                <p className="text-lg font-bold text-gray-900 dark:text-white">{fmt(emi.monthlyAmount)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Remaining</p>
                                <p className="text-lg font-bold text-orange-600 dark:text-orange-400">{fmt(emi.remainingBalance)}</p>
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Loan Progress</span>
                                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{progressPercentage.toFixed(1)}%</span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div 
                                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-500"
                                  style={{ width: `${progressPercentage}%` }}
                                ></div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                              <div className="flex items-center space-x-2">
                                <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                                <span className="text-xs text-gray-600 dark:text-gray-400">
                                  Next due: {formatDate(emi.nextDueDate)}
                                </span>
                              </div>
                              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                daysUntilDue <= 3 ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                                daysUntilDue <= 7 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                                'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                              }`}>
                                {daysUntilDue <= 0 ? 'Due today' : `${daysUntilDue} days`}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {creditCards.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4">
                      <CreditCardIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No Credit Cards Added</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">Track your credit card balances and payments</p>
                    <button
                      onClick={() => setShowCreditCardForm(true)}
                      className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-700 text-white rounded-2xl hover:from-purple-700 hover:to-pink-800 transition-all font-semibold shadow-lg shadow-purple-500/25"
                    >
                      Add Your First Card
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {creditCards.map((card) => {
                      const utilizationPercentage = (card.currentBalance / card.creditLimit) * 100;
                      const daysUntilDue = getDaysUntilDate(card.dueDate);
                      const availableCredit = card.creditLimit - card.currentBalance;
                      
                      return (
                        <div key={card.id} className="group bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-700/50 p-5 rounded-[1.5rem] border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-gray-800/50 transition-all duration-200 hover:-translate-y-1">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                                <CreditCardIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                              </div>
                              <div>
                                <h4 className="font-bold text-gray-900 dark:text-white">{card.name}</h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {fmt(availableCredit)} available
                                </p>
                              </div>
                            </div>
                            <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleEditCard(card)}
                                className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteCard(card.id)}
                                className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Current Balance</p>
                                <p className="text-lg font-bold text-gray-900 dark:text-white">{fmt(card.currentBalance)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Minimum Due</p>
                                <p className="text-lg font-bold text-red-600 dark:text-red-400">{fmt(card.minimumDue)}</p>
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Credit Utilization</span>
                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${getUtilizationColor(utilizationPercentage)}`}>
                                  {utilizationPercentage.toFixed(1)}%
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full transition-all duration-500 ${
                                    utilizationPercentage > 80 ? 'bg-gradient-to-r from-red-500 to-red-600' :
                                    utilizationPercentage > 50 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                                    'bg-gradient-to-r from-green-500 to-green-600'
                                  }`}
                                  style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
                                ></div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                              <div className="flex items-center space-x-2">
                                <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                                <span className="text-xs text-gray-600 dark:text-gray-400">
                                  Due: {formatDate(card.dueDate)}
                                </span>
                              </div>
                              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                daysUntilDue <= 3 ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                                daysUntilDue <= 7 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                                'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                              }`}>
                                {daysUntilDue <= 0 ? 'Due today' : `${daysUntilDue} days`}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Forms */}
        <EMIForm
          isOpen={showEMIForm}
          onClose={() => {
            setShowEMIForm(false);
            setEditingEMI(undefined);
          }}
          onSave={handleEMISave}
          emi={editingEMI}
        />

        <CreditCardForm
          isOpen={showCreditCardForm}
          onClose={() => {
            setShowCreditCardForm(false);
            setEditingCard(undefined);
          }}
          onSave={handleCreditCardSave}
          card={editingCard}
        />
      </div>
    </div>
  );
};
