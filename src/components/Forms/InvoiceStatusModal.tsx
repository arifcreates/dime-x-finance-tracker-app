import React, { useState, useEffect } from 'react';
import { X, CheckCircle, DollarSign } from 'lucide-react';
import { Invoice, Account } from '../../types';
import { dataService } from '../../services/dataService';
import { generateId } from '../../utils/formatters';

interface InvoiceStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
  onUpdate: () => void;
}

export const InvoiceStatusModal: React.FC<InvoiceStatusModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onUpdate
}) => {
  const [selectedAccount, setSelectedAccount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);

  useEffect(() => {
    if (isOpen) {
      dataService.getAccounts().then(setAccounts);
    }
  }, [isOpen]);

  const handleMarkAsPaid = async () => {
    if (!selectedAccount) {
      alert('Please select an account to credit the payment to');
      return;
    }

    setIsProcessing(true);

    try {
      // Update invoice status
      const updatedInvoice = { ...invoice, status: 'paid' as const };
      dataService.saveInvoice(updatedInvoice);

      // Find the selected account
      const account = accounts.find(acc => acc.id === selectedAccount);
      if (account) {
        // Update account balance
        const updatedAccount = {
          ...account,
          balance: account.balance + invoice.amount
        };
        dataService.saveAccount(updatedAccount);

        // Create income transaction
        const transaction = {
          id: generateId(),
          date: new Date().toISOString().split('T')[0],
          description: `Invoice Payment - ${invoice.invoiceNumber}`,
          amount: invoice.amount,
          type: 'income' as const,
          category: 'Invoice Payment',
          account: account.name,
          status: 'completed' as const,
        };
        dataService.saveTransaction(transaction);
      }

      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating invoice status:', error);
      alert('Failed to update invoice status. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-700 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Mark as Paid</h2>
                <p className="text-white/80 text-sm">Invoice {invoice.invoiceNumber}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
              <div className="flex items-center space-x-3">
                <DollarSign className="h-8 w-8 text-green-600 dark:text-green-400" />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Payment Amount</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Invoice total</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                ${invoice.amount.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Credit Payment To Account
            </label>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              required
            >
              <option value="">Select account to credit</option>
              {accounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.name} - ${account.balance.toLocaleString()} ({account.type})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              The payment amount will be added to the selected account balance
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800 mb-6">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">What happens next:</h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Invoice status will be updated to "Paid"</li>
              <li>• Payment amount will be added to selected account</li>
              <li>• Income transaction will be automatically created</li>
              <li>• Account balance will be updated immediately</li>
            </ul>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-semibold"
              disabled={isProcessing}
            >
              Cancel
            </button>
            <button
              onClick={handleMarkAsPaid}
              disabled={!selectedAccount || isProcessing}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <span>Mark as Paid</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};