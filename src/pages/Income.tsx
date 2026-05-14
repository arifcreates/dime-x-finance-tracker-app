import React, { useState, useEffect } from 'react';
import { FileText, Plus, DollarSign, Edit, Trash2, Eye, CheckCircle } from 'lucide-react';
import { InvoiceForm } from '../components/Forms/InvoiceForm';
import { TransactionForm } from '../components/Forms/TransactionForm';
import { InvoiceStatusModal } from '../components/Forms/InvoiceStatusModal';
import { Invoice, Transaction } from '../types';
import { dataService } from '../services/dataService';
import { formatCurrency, formatDate } from '../utils/formatters';

export const Income: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | undefined>();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | undefined>();
  const [activeTab, setActiveTab] = useState<'invoices' | 'income'>('invoices');

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setInvoices(dataService.getInvoices());
    setTransactions(dataService.getTransactions().filter(t => t.type === 'income'));
  };

  const handleInvoiceSave = () => {
    refreshData();
    setEditingInvoice(undefined);
  };

  const handleIncomeSave = () => {
    refreshData();
  };

  const handleDeleteInvoice = (id: string) => {
    if (confirm('Are you sure you want to delete this invoice?')) {
      dataService.deleteInvoice(id);
      refreshData();
    }
  };

  const handleDeleteTransaction = (id: string) => {
    if (confirm('Are you sure you want to delete this income record?')) {
      dataService.deleteTransaction(id);
      refreshData();
    }
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setShowInvoiceForm(true);
  };

  const handleStatusChange = (invoice: Invoice, newStatus: string) => {
    if (newStatus === 'paid') {
      setSelectedInvoice(invoice);
      setShowStatusModal(true);
    } else {
      // For other status changes, update directly
      const updatedInvoice = { ...invoice, status: newStatus as Invoice['status'] };
      dataService.saveInvoice(updatedInvoice);
      refreshData();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      case 'sent':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
      case 'overdue':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400';
    }
  };

  const totalInvoiceAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const paidAmount = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0);
  const pendingAmount = totalInvoiceAmount - paidAmount;
  const totalIncomeRecords = transactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-3 sm:p-4 lg:p-6 pb-20 lg:pb-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        
        {/* Header */}
        <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-2xl sm:rounded-[1.75rem] border border-gray-100 dark:border-gray-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Income & Invoices</h3>
              <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base">Manage your income streams and client invoices</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button
                onClick={() => setShowInvoiceForm(true)}
                className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all font-medium shadow-lg shadow-blue-500/25"
              >
                <Plus className="h-4 w-4" />
                <span>Create Invoice</span>
              </button>
              <button
                onClick={() => setShowIncomeForm(true)}
                className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all font-medium shadow-lg shadow-green-500/25"
              >
                <DollarSign className="h-4 w-4" />
                <span>Add Income</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
            <h4 className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Invoiced</h4>
            <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalInvoiceAmount)}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{invoices.length} invoices</p>
          </div>
          <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
            <h4 className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Amount Paid</h4>
            <p className="text-lg sm:text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(paidAmount)}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Received payments</p>
          </div>
          <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
            <h4 className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Pending Amount</h4>
            <p className="text-lg sm:text-2xl font-bold text-orange-600 dark:text-orange-400">{formatCurrency(pendingAmount)}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Outstanding invoices</p>
          </div>
          <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
            <h4 className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Direct Income</h4>
            <p className="text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(totalIncomeRecords)}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{transactions.length} records</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl sm:rounded-[1.75rem] border border-gray-100 dark:border-gray-800">
          <div className="border-b border-gray-100 dark:border-gray-800">
            <nav className="flex space-x-4 sm:space-x-8 px-4 sm:px-6">
              <button
                onClick={() => setActiveTab('invoices')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'invoices'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Invoices ({invoices.length})
              </button>
              <button
                onClick={() => setActiveTab('income')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'income'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Income Records ({transactions.length})
              </button>
            </nav>
          </div>

          <div className="p-4 sm:p-6">
            {activeTab === 'invoices' ? (
              <div className="space-y-4">
                {invoices.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <FileText className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 mb-4">No invoices created yet</p>
                    <button
                      onClick={() => setShowInvoiceForm(true)}
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all font-medium"
                    >
                      Create Your First Invoice
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Mobile Cards */}
                    <div className="block lg:hidden space-y-4">
                      {invoices.map((invoice) => {
                        const client = dataService.getClients().find(c => c.id === invoice.clientId);
                        return (
                          <div key={invoice.id} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <p className="font-semibold text-gray-900 dark:text-white">{invoice.invoiceNumber}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{client?.name || 'Unknown Client'}</p>
                              </div>
                              <select
                                value={invoice.status}
                                onChange={(e) => handleStatusChange(invoice, e.target.value)}
                                className={`px-2 py-1 rounded-full text-xs font-medium border-0 ${getStatusColor(invoice.status)}`}
                              >
                                <option value="draft">Draft</option>
                                <option value="sent">Sent</option>
                                <option value="paid">Paid</option>
                                <option value="overdue">Overdue</option>
                              </select>
                            </div>
                            <div className="flex justify-between items-center mb-3">
                              <span className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(invoice.amount)}</span>
                              <span className="text-sm text-gray-500 dark:text-gray-400">Due: {formatDate(invoice.dueDate)}</span>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditInvoice(invoice)}
                                className="flex-1 p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                              >
                                <Edit className="h-4 w-4 mx-auto" />
                              </button>
                              <button
                                onClick={() => handleDeleteInvoice(invoice.id)}
                                className="flex-1 p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              >
                                <Trash2 className="h-4 w-4 mx-auto" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Desktop Table */}
                    <div className="hidden lg:block overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-100 dark:border-gray-800">
                            <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Invoice #</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Client</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Amount</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Date</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Due Date</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Status</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoices.map((invoice) => {
                            const client = dataService.getClients().find(c => c.id === invoice.clientId);
                            return (
                              <tr key={invoice.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{invoice.invoiceNumber}</td>
                                <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{client?.name || 'Unknown Client'}</td>
                                <td className="py-3 px-4 font-semibold text-gray-900 dark:text-white">{formatCurrency(invoice.amount)}</td>
                                <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{formatDate(invoice.date)}</td>
                                <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{formatDate(invoice.dueDate)}</td>
                                <td className="py-3 px-4">
                                  <select
                                    value={invoice.status}
                                    onChange={(e) => handleStatusChange(invoice, e.target.value)}
                                    className={`px-3 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${getStatusColor(invoice.status)}`}
                                  >
                                    <option value="draft">Draft</option>
                                    <option value="sent">Sent</option>
                                    <option value="paid">Paid</option>
                                    <option value="overdue">Overdue</option>
                                  </select>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => handleEditInvoice(invoice)}
                                      className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteInvoice(invoice.id)}
                                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <DollarSign className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 mb-4">No income records yet</p>
                    <button
                      onClick={() => setShowIncomeForm(true)}
                      className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all font-medium"
                    >
                      Add Your First Income
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                            <div className="mb-2 sm:mb-0">
                              <p className="font-medium text-gray-900 dark:text-white truncate">{transaction.description}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{transaction.category} • {formatDate(transaction.date)} • {transaction.account}</p>
                            </div>
                            <div className="flex items-center space-x-3">
                              <p className="font-semibold text-green-600 dark:text-green-400 text-lg">{formatCurrency(transaction.amount)}</p>
                              <button
                                onClick={() => handleDeleteTransaction(transaction.id)}
                                className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Forms */}
        <InvoiceForm
          isOpen={showInvoiceForm}
          onClose={() => {
            setShowInvoiceForm(false);
            setEditingInvoice(undefined);
          }}
          onSave={handleInvoiceSave}
          invoice={editingInvoice}
        />

        <TransactionForm
          isOpen={showIncomeForm}
          onClose={() => setShowIncomeForm(false)}
          onSave={handleIncomeSave}
          type="income"
        />

        {selectedInvoice && (
          <InvoiceStatusModal
            isOpen={showStatusModal}
            onClose={() => {
              setShowStatusModal(false);
              setSelectedInvoice(undefined);
            }}
            invoice={selectedInvoice}
            onUpdate={refreshData}
          />
        )}
      </div>
    </div>
  );
};