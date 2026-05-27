import React, { useState, useEffect, useCallback } from 'react';
import { DraggableCard } from '../components/Dashboard/DraggableCard';
import { RecentTransactions } from '../components/Dashboard/RecentTransactions';
import { CashFlowChart } from '../components/Dashboard/CashFlowChart';
import { UpcomingAlerts } from '../components/Dashboard/UpcomingAlerts';
import { TransactionForm } from '../components/Forms/TransactionForm';
import { InvoiceForm } from '../components/Forms/InvoiceForm';
import { TransactionsModal } from '../components/Dashboard/TransactionsModal';
import { TrendingUp, TrendingDown, Wallet, Plus, DollarSign, Activity, PieChart } from 'lucide-react';
import { getDaysUntilDate } from '../utils/formatters';
import { Transaction, Account, EMI, CreditCard, RecurringPayment } from '../types';
import { dataService } from '../services/dataService';
import { useCurrencyFormat } from '../hooks/useCurrencyFormat';

interface DashboardProps {
  transactions: Transaction[];
  onQuickAction?: (action: string) => void;
  quickActionRequest?: { action: string; id: number } | null;
  onQuickActionHandled?: () => void;
  onUpdate?: () => void;
  user?: any;
}

interface DashboardCard {
  id: string;
  type: string;
  title: string;
  component: React.ReactNode;
  className: string;
}

export const Dashboard: React.FC<DashboardProps> = ({
  transactions: initialTransactions,
  onQuickAction,
  quickActionRequest,
  onQuickActionHandled,
  onUpdate,
  user
}) => {
  const fmt = useCurrencyFormat();
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [emis, setEmis] = useState<EMI[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [recurringPayments, setRecurringPayments] = useState<RecurringPayment[]>([]);
  const [thisMonthIncome, setThisMonthIncome] = useState(0);
  const [thisMonthExpenses, setThisMonthExpenses] = useState(0);
  const [cashFlow, setCashFlow] = useState(0);
  const [totalBalance, setTotalBalance] = useState(0);
  const [lastMonthIncome, setLastMonthIncome] = useState(0);
  const [lastMonthExpenses, setLastMonthExpenses] = useState(0);
  const [incomeByCategory, setIncomeByCategory] = useState<Record<string, number>>({});
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [showTransactionsModal, setShowTransactionsModal] = useState(false);
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('income');
  const [cardOrder, setCardOrder] = useState<string[]>([]);

  const loadData = async () => {
    const [
      txns, accs, emiList, cards, payments,
      income, expenses, flow, balance,
      lmIncome, lmExpenses, incByCat
    ] = await Promise.all([
      dataService.getTransactions(),
      dataService.getAccounts(),
      dataService.getEMIs(),
      dataService.getCreditCards(),
      dataService.getRecurringPayments(),
      dataService.getMonthlyIncome(),
      dataService.getMonthlyExpenses(),
      dataService.getCashFlow(),
      dataService.getTotalBalance(),
      dataService.getMonthlyIncome(new Date().getMonth() === 0 ? 11 : new Date().getMonth() - 1, new Date().getMonth() === 0 ? new Date().getFullYear() - 1 : new Date().getFullYear()),
      dataService.getMonthlyExpenses(new Date().getMonth() === 0 ? 11 : new Date().getMonth() - 1, new Date().getMonth() === 0 ? new Date().getFullYear() - 1 : new Date().getFullYear()),
      dataService.getIncomeByCategory(),
    ]);

    setTransactions(txns);
    setAccounts(accs);
    setEmis(emiList);
    setCreditCards(cards);
    setRecurringPayments(payments);
    setThisMonthIncome(income);
    setThisMonthExpenses(expenses);
    setCashFlow(flow);
    setTotalBalance(balance);
    setLastMonthIncome(lmIncome);
    setLastMonthExpenses(lmExpenses);
    setIncomeByCategory(incByCat);
  };

  useEffect(() => {
    loadData();

    // Load saved card order or use default
    try {
      const savedOrder = localStorage.getItem('dashboardCardOrder');
      setCardOrder(savedOrder ? JSON.parse(savedOrder) : [
        'hero-balance',
        'quick-actions',
        'upcoming-payments',
        'account-breakdown',
        'cash-flow-chart',
        'income-breakdown',
        'recent-transactions'
      ]);
    } catch (error) {
      console.warn('Ignoring invalid dashboard card order:', error);
      localStorage.removeItem('dashboardCardOrder');
      setCardOrder([
        'hero-balance',
        'quick-actions',
        'upcoming-payments',
        'account-breakdown',
        'cash-flow-chart',
        'income-breakdown',
        'recent-transactions'
      ]);
    }
  }, []);

  const refreshData = () => {
    loadData();
  };

  const openQuickAction = useCallback((action: string) => {
    switch (action) {
      case 'add-income':
        setTransactionType('income');
        setShowTransactionForm(true);
        break;
      case 'add-expense':
        setTransactionType('expense');
        setShowTransactionForm(true);
        break;
      case 'create-invoice':
        setShowInvoiceForm(true);
        break;
      case 'record-payment':
        setTransactionType('income');
        setShowTransactionForm(true);
        break;
    }
  }, []);

  useEffect(() => {
    if (quickActionRequest) {
      openQuickAction(quickActionRequest.action);
      onQuickActionHandled?.();
    }
  }, [quickActionRequest, openQuickAction, onQuickActionHandled]);

  const handleQuickAction = (action: string) => {
    openQuickAction(action);
  };

  const handleViewAllTransactions = () => {
    setShowTransactionsModal(true);
  };

  const handleViewAllPayments = () => {
    // Navigate to EMI/recurring payments page - implement navigation logic
    console.log('Navigate to payments page');
  };

  const handleTransactionSave = () => {
    refreshData();
    onUpdate?.();
  };

  const handleInvoiceSave = () => {
    refreshData();
    onUpdate?.();
  };

  const moveCard = useCallback((dragIndex: number, hoverIndex: number) => {
    setCardOrder((prevOrder) => {
      const newOrder = [...prevOrder];
      const draggedCard = newOrder[dragIndex];
      newOrder.splice(dragIndex, 1);
      newOrder.splice(hoverIndex, 0, draggedCard);
      
      // Save to localStorage
      localStorage.setItem('dashboardCardOrder', JSON.stringify(newOrder));
      
      return newOrder;
    });
  }, []);

  const incomeChange = lastMonthIncome > 0 ? ((thisMonthIncome - lastMonthIncome) / lastMonthIncome * 100).toFixed(1) : '0';
  const expenseChange = lastMonthExpenses > 0 ? ((thisMonthExpenses - lastMonthExpenses) / lastMonthExpenses * 100).toFixed(1) : '0';

  const totalIncome = Object.values(incomeByCategory).reduce((sum, amount) => sum + amount, 0);

  // Sample alerts with real data and due dates
  const alerts = [
    ...emis.map(emi => ({
      id: emi.id,
      type: 'emi' as const,
      title: emi.name,
      amount: emi.monthlyAmount,
      dueDate: emi.nextDueDate,
      urgency: getDaysUntilDate(emi.nextDueDate) <= 3 ? 'high' as const : 'medium' as const,
    })),
    ...creditCards.map(card => ({
      id: card.id,
      type: 'credit-card' as const,
      title: card.name,
      amount: card.minimumDue,
      dueDate: card.dueDate,
      urgency: getDaysUntilDate(card.dueDate) <= 3 ? 'high' as const : 'medium' as const,
    })),
    ...recurringPayments.filter(p => p.isActive).map(payment => ({
      id: payment.id,
      type: 'subscription' as const,
      title: payment.name,
      amount: payment.amount,
      dueDate: payment.nextDate,
      urgency: getDaysUntilDate(payment.nextDate) <= 3 ? 'high' as const : 'low' as const,
    })),
  ].sort((a, b) => getDaysUntilDate(a.dueDate) - getDaysUntilDate(b.dueDate));

  // Define all dashboard cards
  const dashboardCards: Record<string, DashboardCard> = {
    'hero-balance': {
      id: 'hero-balance',
      type: 'hero',
      title: 'Balance Overview',
      className: 'lg:col-span-12',
      component: (
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 sm:p-6 lg:p-8 text-gray-950 dark:text-white border border-gray-100 dark:border-gray-800 shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center">
                  <Wallet className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700 dark:text-gray-200" />
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-xs font-medium">Total Balance</p>
                  <p className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">{fmt(totalBalance)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-gray-500 dark:text-gray-400 text-xs font-medium">Cash Flow</p>
                <p className={`text-lg font-semibold ${cashFlow >= 0 ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                  {fmt(cashFlow)}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-6 h-6 bg-white dark:bg-gray-900 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-3 w-3 text-gray-600 dark:text-gray-300" />
                  </div>
                  <span className="text-gray-500 dark:text-gray-400 text-xs font-bold bg-white dark:bg-gray-900 px-2 py-1 rounded-full">
                    +{incomeChange}%
                  </span>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-xs font-medium mb-1">Monthly Income</p>
                <p className="text-lg font-bold">{fmt(thisMonthIncome)}</p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-6 h-6 bg-white dark:bg-gray-900 rounded-lg flex items-center justify-center">
                    <TrendingDown className="h-3 w-3 text-gray-600 dark:text-gray-300" />
                  </div>
                  <span className="text-gray-500 dark:text-gray-400 text-xs font-bold bg-white dark:bg-gray-900 px-2 py-1 rounded-full">
                    +{expenseChange}%
                  </span>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-xs font-medium mb-1">Monthly Expenses</p>
                <p className="text-lg font-bold">{fmt(thisMonthExpenses)}</p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-6 h-6 bg-white dark:bg-gray-900 rounded-lg flex items-center justify-center">
                    <Activity className="h-3 w-3 text-gray-600 dark:text-gray-300" />
                  </div>
                  <span className="text-xs font-bold px-2 py-1 rounded-full text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900">
                    {cashFlow > 0 ? 'Positive' : 'Negative'}
                  </span>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-xs font-medium mb-1">Cash Flow</p>
                <p className="text-lg font-bold">{fmt(Math.abs(cashFlow))}</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    'quick-actions': {
      id: 'quick-actions',
      type: 'actions',
      title: 'Quick Actions',
      className: 'lg:col-span-6',
      component: (
        <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 h-full">
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 tracking-tight">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleQuickAction('add-income')}
              className="group flex flex-col items-center justify-center p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 hover:from-green-100 hover:to-green-200 dark:hover:from-green-800/30 dark:hover:to-green-700/30 rounded-xl transition-all duration-300 hover:scale-[1.02] border border-green-200/50 dark:border-green-700/50"
            >
              <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform shadow-lg shadow-green-500/25">
                <Plus className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-gray-900 dark:text-white text-sm">Add Income</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium text-center">Record new income</span>
            </button>
            
            <button
              onClick={() => handleQuickAction('add-expense')}
              className="group flex flex-col items-center justify-center p-4 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 hover:from-red-100 hover:to-red-200 dark:hover:from-red-800/30 dark:hover:to-red-700/30 rounded-xl transition-all duration-300 hover:scale-[1.02] border border-red-200/50 dark:border-red-700/50"
            >
              <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform shadow-lg shadow-red-500/25">
                <Plus className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-gray-900 dark:text-white text-sm">Add Expense</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium text-center">Track spending</span>
            </button>
            
            <button
              onClick={() => handleQuickAction('create-invoice')}
              className="group flex flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-800/30 dark:hover:to-blue-700/30 rounded-xl transition-all duration-300 hover:scale-[1.02] border border-blue-200/50 dark:border-blue-700/50"
            >
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform shadow-lg shadow-blue-500/25">
                <Plus className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-gray-900 dark:text-white text-sm">Create Invoice</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium text-center">Bill your clients</span>
            </button>
            
            <button
              onClick={() => handleQuickAction('record-payment')}
              className="group flex flex-col items-center justify-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 hover:from-purple-100 hover:to-purple-200 dark:hover:from-purple-800/30 dark:hover:to-purple-700/30 rounded-xl transition-all duration-300 hover:scale-[1.02] border border-purple-200/50 dark:border-purple-700/50"
            >
              <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform shadow-lg shadow-purple-500/25">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-gray-900 dark:text-white text-sm">Record Payment</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium text-center">Log received payment</span>
            </button>
          </div>
        </div>
      )
    },
    'upcoming-payments': {
      id: 'upcoming-payments',
      type: 'alerts',
      title: 'Upcoming Payments',
      className: 'lg:col-span-6',
      component: (
        <UpcomingAlerts alerts={alerts} />
      )
    },
    'account-breakdown': {
      id: 'account-breakdown',
      type: 'accounts',
      title: 'Account Breakdown',
      className: 'lg:col-span-12',
      component: (
        <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-base font-bold text-gray-900 dark:text-white tracking-tight">Accounts</h3>
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full">
              {accounts.length} accounts
            </span>
          </div>
          
          {accounts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Wallet className="h-8 w-8 text-gray-400 dark:text-gray-500" />
              </div>
              <p className="font-bold text-gray-900 dark:text-white mb-1">No accounts yet</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Add accounts to see breakdown</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Desktop: 4 cards per row */}
              <div className="hidden lg:grid lg:grid-cols-4 gap-4">
                {accounts.map(account => (
                  <div key={account.id} className="group p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-700/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-gray-800/50 transition-all duration-300">
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${
                        account.type === 'savings' ? 'bg-green-500 text-white' :
                        account.type === 'current' ? 'bg-blue-500 text-white' :
                        account.type === 'cash' ? 'bg-yellow-500 text-black' :
                        'bg-purple-500 text-white'
                      }`}>
                        <Wallet className="h-6 w-6" />
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900 dark:text-white">{fmt(account.balance)}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                          {totalBalance > 0 ? ((account.balance / totalBalance) * 100).toFixed(1) : 0}%
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-bold text-gray-900 dark:text-white text-sm truncate">{account.name}</h4>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold ${
                        account.type === 'savings' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                        account.type === 'current' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                        account.type === 'cash' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                        'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                      }`}>
                        {account.type.charAt(0).toUpperCase() + account.type.slice(1)}
                      </span>
                      
                      <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                        <div 
                          className={`h-1 rounded-full transition-all duration-700 ${
                            account.type === 'savings' ? 'bg-gradient-to-r from-green-400 to-green-500' :
                            account.type === 'current' ? 'bg-gradient-to-r from-blue-400 to-blue-500' :
                            account.type === 'cash' ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
                            'bg-gradient-to-r from-purple-400 to-purple-500'
                          }`}
                          style={{ width: `${Math.min((account.balance / totalBalance) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tablet: 3 cards per row */}
              <div className="hidden md:grid lg:hidden md:grid-cols-3 gap-4">
                {accounts.map(account => (
                  <div key={account.id} className="group p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-700/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-gray-800/50 transition-all duration-300">
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${
                        account.type === 'savings' ? 'bg-green-500 text-white' :
                        account.type === 'current' ? 'bg-blue-500 text-white' :
                        account.type === 'cash' ? 'bg-yellow-500 text-black' :
                        'bg-purple-500 text-white'
                      }`}>
                        <Wallet className="h-6 w-6" />
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900 dark:text-white">{fmt(account.balance)}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                          {totalBalance > 0 ? ((account.balance / totalBalance) * 100).toFixed(1) : 0}%
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-bold text-gray-900 dark:text-white text-sm truncate">{account.name}</h4>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold ${
                        account.type === 'savings' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                        account.type === 'current' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                        account.type === 'cash' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                        'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                      }`}>
                        {account.type.charAt(0).toUpperCase() + account.type.slice(1)}
                      </span>
                      
                      <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                        <div 
                          className={`h-1 rounded-full transition-all duration-700 ${
                            account.type === 'savings' ? 'bg-gradient-to-r from-green-400 to-green-500' :
                            account.type === 'current' ? 'bg-gradient-to-r from-blue-400 to-blue-500' :
                            account.type === 'cash' ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
                            'bg-gradient-to-r from-purple-400 to-purple-500'
                          }`}
                          style={{ width: `${Math.min((account.balance / totalBalance) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mobile: 2 cards per row */}
              <div className="md:hidden grid grid-cols-2 gap-3">
                {accounts.map(account => (
                  <div key={account.id} className="group p-3 bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-700/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-gray-800/50 transition-all duration-300">
                    <div className="flex items-center justify-between mb-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-sm ${
                        account.type === 'savings' ? 'bg-green-500 text-white' :
                        account.type === 'current' ? 'bg-blue-500 text-white' :
                        account.type === 'cash' ? 'bg-yellow-500 text-black' :
                        'bg-purple-500 text-white'
                      }`}>
                        <Wallet className="h-4 w-4" />
                      </div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{fmt(account.balance)}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-bold text-gray-900 dark:text-white text-xs truncate">{account.name}</h4>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold ${
                        account.type === 'savings' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                        account.type === 'current' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                        account.type === 'cash' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                        'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                      }`}>
                        {account.type.charAt(0).toUpperCase() + account.type.slice(1)}
                      </span>
                      
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                          {totalBalance > 0 ? ((account.balance / totalBalance) * 100).toFixed(1) : 0}%
                        </p>
                        <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                          <div 
                            className={`h-1 rounded-full transition-all duration-700 ${
                              account.type === 'savings' ? 'bg-gradient-to-r from-green-400 to-green-500' :
                              account.type === 'current' ? 'bg-gradient-to-r from-blue-400 to-blue-500' :
                              account.type === 'cash' ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
                              'bg-gradient-to-r from-purple-400 to-purple-500'
                            }`}
                            style={{ width: `${Math.min((account.balance / totalBalance) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )
    },
    'cash-flow-chart': {
      id: 'cash-flow-chart',
      type: 'chart',
      title: 'Cash Flow Trend',
      className: 'lg:col-span-12',
      component: (
        <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-base font-bold text-gray-900 dark:text-white tracking-tight">Cash Flow Trend</h3>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full">Last 6 months</span>
            </div>
          </div>
          <div className="h-64">
            <CashFlowChart transactions={transactions} />
          </div>
        </div>
      )
    },
    'income-breakdown': {
      id: 'income-breakdown',
      type: 'pie-chart',
      title: 'Income Breakdown',
      className: 'lg:col-span-12',
      component: (
        <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-base font-bold text-gray-900 dark:text-white tracking-tight">Income Sources</h3>
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <PieChart className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
          </div>
          
          {Object.keys(incomeByCategory).length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <PieChart className="h-6 w-6 text-gray-400 dark:text-gray-500" />
              </div>
              <p className="font-bold text-gray-900 dark:text-white mb-1 text-sm">No income data</p>
              <p className="text-gray-500 dark:text-gray-400 text-xs font-medium">Add income to see breakdown</p>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(incomeByCategory)
                .sort(([,a], [,b]) => b - a)
                .map(([category, amount], index) => {
                  const percentage = totalIncome > 0 ? ((amount / totalIncome) * 100) : 0;
                  const colors = [
                    'bg-green-500',
                    'bg-blue-500', 
                    'bg-purple-500',
                    'bg-orange-500',
                    'bg-pink-500',
                    'bg-indigo-500'
                  ];
                  const bgColors = [
                    'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
                    'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
                    'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
                    'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
                    'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400',
                    'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                  ];
                  
                  return (
                    <div key={category} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`}></div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white text-sm">{category}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{fmt(amount)}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${bgColors[index % bgColors.length]}`}>
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                  );
                })}
              
              {/* Total */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900 dark:text-white">Total Income</span>
                  <span className="font-bold text-green-600 dark:text-green-400">{fmt(totalIncome)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )
    },
    'recent-transactions': {
      id: 'recent-transactions',
      type: 'transactions',
      title: 'Recent Transactions',
      className: 'lg:col-span-12',
      component: (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
          <RecentTransactions 
            transactions={transactions} 
            onUpdate={refreshData} 
            onViewAll={handleViewAllTransactions}
          />
        </div>
      )
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-3 sm:p-4 lg:p-6 pb-32 lg:pb-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        
        {/* Welcome Header */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
            Good morning, {user?.name || 'John'} 👋
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">
            Here's what's happening with your finances today
          </p>
        </div>

        {/* Draggable Dashboard Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          {cardOrder.map((cardId, index) => {
            const card = dashboardCards[cardId];
            if (!card) return null;

            return (
              <DraggableCard
                key={card.id}
                id={card.id}
                index={index}
                moveCard={moveCard}
                className={card.className}
              >
                {card.component}
              </DraggableCard>
            );
          })}
        </div>

        {/* Forms */}
        <TransactionForm
          isOpen={showTransactionForm}
          onClose={() => setShowTransactionForm(false)}
          onSave={handleTransactionSave}
          type={transactionType}
        />

        <InvoiceForm
          isOpen={showInvoiceForm}
          onClose={() => setShowInvoiceForm(false)}
          onSave={handleInvoiceSave}
        />

        <TransactionsModal
          isOpen={showTransactionsModal}
          onClose={() => setShowTransactionsModal(false)}
          transactions={transactions}
          onUpdate={refreshData}
        />
      </div>
    </div>
  );
};
