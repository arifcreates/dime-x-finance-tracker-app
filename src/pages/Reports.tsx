import React, { useState } from 'react';
import { TrendingUp, Download, Filter, FileSpreadsheet, Calendar } from 'lucide-react';
import { dataService } from '../services/dataService';
import { formatCurrency } from '../utils/formatters';
import * as XLSX from 'xlsx';

export const Reports: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });

  const exportToExcel = async () => {
    setIsExporting(true);
    
    try {
      // Get all data
      const [transactions, accounts, invoices, emis, creditCards, recurringPayments, clients] = await Promise.all([
        dataService.getTransactions(),
        dataService.getAccounts(),
        dataService.getInvoices(),
        dataService.getEMIs(),
        dataService.getCreditCards(),
        dataService.getRecurringPayments(),
        dataService.getClients(),
      ]);

      // Filter transactions by date range
      const filteredTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        const fromDate = new Date(dateRange.from);
        const toDate = new Date(dateRange.to);
        return transactionDate >= fromDate && transactionDate <= toDate;
      });

      // Create workbook
      const workbook = XLSX.utils.book_new();

      // Summary Sheet
      const summaryData = [
        ['Financial Summary Report'],
        ['Generated on:', new Date().toLocaleDateString()],
        ['Period:', `${dateRange.from} to ${dateRange.to}`],
        [],
        ['OVERVIEW'],
        ['Total Income:', formatCurrency(filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0))],
        ['Total Expenses:', formatCurrency(filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0))],
        ['Net Cash Flow:', formatCurrency(filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0) - filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0))],
        ['Total Account Balance:', formatCurrency(accounts.reduce((sum, acc) => sum + acc.balance, 0))],
        [],
        ['ACCOUNTS BREAKDOWN'],
        ['Account Name', 'Type', 'Balance', 'Currency'],
        ...accounts.map(acc => [acc.name, acc.type, acc.balance, acc.currency]),
      ];
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

      // Transactions Sheet
      const transactionData = [
        ['Date', 'Description', 'Amount', 'Type', 'Category', 'Account', 'Status'],
        ...filteredTransactions.map(t => [
          t.date,
          t.description,
          t.amount,
          t.type,
          t.category,
          t.account,
          t.status
        ])
      ];
      const transactionSheet = XLSX.utils.aoa_to_sheet(transactionData);
      XLSX.utils.book_append_sheet(workbook, transactionSheet, 'Transactions');

      // Income Analysis Sheet
      const incomeTransactions = filteredTransactions.filter(t => t.type === 'income');
      const incomeByCategory = incomeTransactions.reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);
      
      const incomeData = [
        ['Income Analysis'],
        [],
        ['Category', 'Amount', 'Percentage'],
        ...Object.entries(incomeByCategory).map(([category, amount]) => [
          category,
          amount,
          `${((amount / incomeTransactions.reduce((sum, t) => sum + t.amount, 0)) * 100).toFixed(1)}%`
        ])
      ];
      const incomeSheet = XLSX.utils.aoa_to_sheet(incomeData);
      XLSX.utils.book_append_sheet(workbook, incomeSheet, 'Income Analysis');

      // Expense Analysis Sheet
      const expenseTransactions = filteredTransactions.filter(t => t.type === 'expense');
      const expenseByCategory = expenseTransactions.reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);
      
      const expenseData = [
        ['Expense Analysis'],
        [],
        ['Category', 'Amount', 'Percentage'],
        ...Object.entries(expenseByCategory).map(([category, amount]) => [
          category,
          amount,
          `${((amount / expenseTransactions.reduce((sum, t) => sum + t.amount, 0)) * 100).toFixed(1)}%`
        ])
      ];
      const expenseSheet = XLSX.utils.aoa_to_sheet(expenseData);
      XLSX.utils.book_append_sheet(workbook, expenseSheet, 'Expense Analysis');

      // Invoices Sheet
      const invoiceData = [
        ['Invoice Number', 'Client', 'Date', 'Due Date', 'Amount', 'Status'],
        ...invoices.map(inv => {
          const client = clients.find(c => c.id === inv.clientId);
          return [
            inv.invoiceNumber,
            client?.name || 'Unknown',
            inv.date,
            inv.dueDate,
            inv.amount,
            inv.status
          ];
        })
      ];
      const invoiceSheet = XLSX.utils.aoa_to_sheet(invoiceData);
      XLSX.utils.book_append_sheet(workbook, invoiceSheet, 'Invoices');

      // EMIs & Loans Sheet
      const emiData = [
        ['Loan Name', 'Principal', 'Interest Rate', 'Tenure (months)', 'Monthly EMI', 'Remaining Balance', 'Next Due Date'],
        ...emis.map(emi => [
          emi.name,
          emi.principal,
          `${emi.interestRate}%`,
          emi.tenure,
          emi.monthlyAmount,
          emi.remainingBalance,
          emi.nextDueDate
        ])
      ];
      const emiSheet = XLSX.utils.aoa_to_sheet(emiData);
      XLSX.utils.book_append_sheet(workbook, emiSheet, 'EMIs & Loans');

      // Credit Cards Sheet
      const creditCardData = [
        ['Card Name', 'Credit Limit', 'Current Balance', 'Available Credit', 'Utilization %', 'Minimum Due', 'Due Date', 'Interest Rate'],
        ...creditCards.map(card => [
          card.name,
          card.creditLimit,
          card.currentBalance,
          card.creditLimit - card.currentBalance,
          `${((card.currentBalance / card.creditLimit) * 100).toFixed(1)}%`,
          card.minimumDue,
          card.dueDate,
          `${card.interestRate}%`
        ])
      ];
      const creditCardSheet = XLSX.utils.aoa_to_sheet(creditCardData);
      XLSX.utils.book_append_sheet(workbook, creditCardSheet, 'Credit Cards');

      // Recurring Payments Sheet
      const recurringData = [
        ['Payment Name', 'Amount', 'Frequency', 'Category', 'Next Date', 'Annual Cost', 'Status'],
        ...recurringPayments.map(payment => [
          payment.name,
          payment.amount,
          payment.frequency,
          payment.category,
          payment.nextDate,
          payment.frequency === 'monthly' ? payment.amount * 12 : payment.amount,
          payment.isActive ? 'Active' : 'Inactive'
        ])
      ];
      const recurringSheet = XLSX.utils.aoa_to_sheet(recurringData);
      XLSX.utils.book_append_sheet(workbook, recurringSheet, 'Recurring Payments');

      // Clients Sheet
      const clientData = [
        ['Client Name', 'Email', 'Phone', 'Address'],
        ...clients.map(client => [
          client.name,
          client.email,
          client.phone,
          client.address
        ])
      ];
      const clientSheet = XLSX.utils.aoa_to_sheet(clientData);
      XLSX.utils.book_append_sheet(workbook, clientSheet, 'Clients');

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `FinanceFlow_Report_${timestamp}.xlsx`;

      // Write and download file
      XLSX.writeFile(workbook, filename);
      
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export report. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-3 sm:p-4 lg:p-6 pb-20 lg:pb-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        
        <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Reports & Analytics</h3>
              <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">Export comprehensive financial reports</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button 
                onClick={exportToExcel}
                disabled={isExporting}
                className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium shadow-lg shadow-green-500/25 disabled:opacity-50"
              >
                {isExporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Exporting...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    <span>Export Excel</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Date Range Selector */}
        <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
          <h4 className="text-base font-bold text-gray-900 dark:text-white mb-4">Report Period</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">From Date</label>
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">To Date</label>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Report Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-4">
              <FileSpreadsheet className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-2">Comprehensive Export</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">Export all financial data across multiple sheets with detailed analysis</p>
          </div>

          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mb-4">
              <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-2">Financial Analysis</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">Income and expense breakdowns with category-wise analysis</p>
          </div>

          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-4">
              <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-2">Custom Date Range</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">Generate reports for any specific time period</p>
          </div>
        </div>

        {/* Export Includes */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
          <h4 className="text-base font-bold text-gray-900 dark:text-white mb-4">Export Includes</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              'Financial Summary',
              'All Transactions',
              'Income Analysis',
              'Expense Analysis',
              'Invoice Details',
              'EMI & Loan Data',
              'Credit Card Info',
              'Recurring Payments',
              'Client Information',
              'Account Balances'
            ].map((item) => (
              <div key={item} className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};