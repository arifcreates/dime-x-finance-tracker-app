import React, { useState, useEffect } from 'react';
import { Download, Plus, Trash2, X } from 'lucide-react';
import { Client, Invoice, InvoiceItem } from '../../types';
import { generateId } from '../../utils/formatters';
import { dataService } from '../../services/dataService';
import { useCurrency } from '../../contexts/CurrencyContext';
import { calculateInvoiceTotals, downloadInvoicePdf, formatInvoiceMoney } from '../../utils/invoiceUtils';

interface InvoiceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (invoice: Invoice) => void;
  invoice?: Invoice;
}

const currencyOptions = ['USD', 'INR', 'EUR', 'GBP', 'AED', 'CAD', 'AUD', 'SGD'];
const fieldClass = 'w-full rounded-[10px] border border-gray-200 bg-white px-4 py-3 text-gray-950 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:border-gray-500 dark:focus:ring-gray-800';
const selectClass = `${fieldClass} pr-10`;
const dateClass = `${fieldClass} pr-10`;
const sectionCardClass = 'rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 sm:p-5';
const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2';

export const InvoiceForm: React.FC<InvoiceFormProps> = ({
  isOpen,
  onClose,
  onSave,
  invoice,
}) => {
  const { currency: defaultCurrency } = useCurrency();

  const createInitialFormData = (source?: Invoice) => ({
    clientId: source?.clientId || '',
    invoiceNumber: source?.invoiceNumber || `INV-${Date.now()}`,
    date: source?.date || new Date().toISOString().split('T')[0],
    dueDate: source?.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: source?.status || 'draft' as Invoice['status'],
    currency: source?.currency || defaultCurrency || 'USD',
    companyName: source?.companyName || '',
    companyEmail: source?.companyEmail || '',
    companyPhone: source?.companyPhone || '',
    companyAddress: source?.companyAddress || '',
    billToName: source?.billToName || '',
    billToEmail: source?.billToEmail || '',
    billToPhone: source?.billToPhone || '',
    billToAddress: source?.billToAddress || '',
    notes: source?.notes || '',
    bankDetails: source?.bankDetails || '',
    taxRate: source?.taxRate ?? 0,
    discountType: source?.discountType || 'fixed' as Invoice['discountType'],
    discountValue: source?.discountValue ?? 0,
  });

  const [formData, setFormData] = useState(createInitialFormData(invoice));
  const [items, setItems] = useState<InvoiceItem[]>(
    invoice?.items?.length ? invoice.items : [{ description: '', quantity: 1, rate: 0, amount: 0 }]
  );
  const [showClientForm, setShowClientForm] = useState(false);
  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [clients, setClients] = useState<Client[]>(() => dataService.getCachedClients());

  useEffect(() => {
    if (!isOpen) return;
    setFormData(createInitialFormData(invoice));
    setItems(invoice?.items?.length ? invoice.items : [{ description: '', quantity: 1, rate: 0, amount: 0 }]);
    dataService.getClients().then(setClients);
  }, [isOpen, invoice, defaultCurrency]);

  const selectedClient = clients.find((client) => client.id === formData.clientId);

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    if (field === 'quantity' || field === 'rate') {
      updatedItems[index].amount = (Number(updatedItems[index].quantity) || 0) * (Number(updatedItems[index].rate) || 0);
    }

    setItems(updatedItems);
  };

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, rate: 0, amount: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const applyClientToBillTo = (clientId: string) => {
    const client = clients.find((item) => item.id === clientId);
    setFormData({
      ...formData,
      clientId,
      billToName: client?.name || formData.billToName,
      billToEmail: client?.email || formData.billToEmail,
      billToPhone: client?.phone || formData.billToPhone,
      billToAddress: client?.address || formData.billToAddress,
    });
  };

  const addClient = async () => {
    const client: Client = {
      id: generateId(),
      ...newClient,
    };

    await dataService.saveClient(client);
    const updatedClients = [...clients, client];
    setClients(updatedClients);
    setFormData({
      ...formData,
      clientId: client.id,
      billToName: client.name,
      billToEmail: client.email,
      billToPhone: client.phone,
      billToAddress: client.address,
    });
    setNewClient({ name: '', email: '', phone: '', address: '' });
    setShowClientForm(false);
  };

  const buildInvoice = (): Invoice => {
    const draftInvoice: Invoice = {
      id: invoice?.id || generateId(),
      ...formData,
      items,
      amount: 0,
    };
    const totals = calculateInvoiceTotals(draftInvoice);

    return {
      ...draftInvoice,
      subtotal: totals.subtotal,
      discountAmount: totals.discountAmount,
      taxAmount: totals.taxAmount,
      amount: totals.total,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newInvoice = buildInvoice();

    await dataService.saveInvoice(newInvoice);
    onSave(newInvoice);
    onClose();
  };

  const handleDownload = () => {
    downloadInvoicePdf(buildInvoice(), selectedClient);
  };

  if (!isOpen) return null;

  const totals = calculateInvoiceTotals({ ...formData, items });
  const money = (amount: number) => formatInvoiceMoney(amount, formData.currency);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 overscroll-contain">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-[calc(100%-0.75rem)] sm:w-full max-w-5xl h-[calc(100dvh-var(--mobile-browser-bottom,0px)-0.75rem)] sm:h-auto sm:max-h-[90vh] mb-1.5 sm:mb-0 overflow-hidden flex flex-col border border-gray-200 dark:border-gray-800 shadow-2xl">
        <div className="flex items-center justify-between px-5 py-5 sm:px-6 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
          <div>
            <h3 className="text-xl font-semibold text-gray-950 dark:text-white">
              {invoice ? 'Edit Invoice' : 'Create Invoice'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Add billing, tax, payment details, and export a PDF.</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="min-h-0 flex-1 overflow-y-auto overscroll-contain modal-scroll px-5 py-5 sm:px-6 space-y-6">
          <section className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Invoice Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-2">
                <label className={labelClass}>Client</label>
                <div className="flex gap-2">
                  <select
                    required
                    value={formData.clientId}
                    onChange={(e) => applyClientToBillTo(e.target.value)}
                    className={selectClass}
                  >
                    <option value="">Select client</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>{client.name}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowClientForm(true)}
                    className="h-12 w-12 flex-shrink-0 rounded-[10px] bg-black text-white hover:bg-gray-800 transition-colors dark:bg-white dark:text-black"
                    aria-label="Add client"
                  >
                    <Plus className="h-5 w-5 mx-auto" />
                  </button>
                </div>
              </div>

              <div>
                <label className={labelClass}>Invoice Number</label>
                <input
                  type="text"
                  required
                  value={formData.invoiceNumber}
                  onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                  className={fieldClass}
                />
              </div>

              <div>
                <label className={labelClass}>Currency</label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className={selectClass}
                >
                  {currencyOptions.map((currency) => (
                    <option key={currency} value={currency}>{currency}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Invoice Date</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className={dateClass}
                />
              </div>

              <div>
                <label className={labelClass}>Due Date</label>
                <input
                  type="date"
                  required
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className={dateClass}
                />
              </div>

              <div>
                <label className={labelClass}>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as Invoice['status'] })}
                  className={selectClass}
                >
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className={sectionCardClass}>
              <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">From / Company Details</h4>
              <div className="mt-4 space-y-4">
              <input className={fieldClass} placeholder="Company name" value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input className={fieldClass} placeholder="Company email" type="email" value={formData.companyEmail} onChange={(e) => setFormData({ ...formData, companyEmail: e.target.value })} />
                <input className={fieldClass} placeholder="Company phone" value={formData.companyPhone} onChange={(e) => setFormData({ ...formData, companyPhone: e.target.value })} />
              </div>
              <textarea className={fieldClass} placeholder="Company address" rows={3} value={formData.companyAddress} onChange={(e) => setFormData({ ...formData, companyAddress: e.target.value })} />
              </div>
            </div>

            <div className={sectionCardClass}>
              <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Bill To</h4>
              <div className="mt-4 space-y-4">
              <input className={fieldClass} placeholder="Client or company name" value={formData.billToName} onChange={(e) => setFormData({ ...formData, billToName: e.target.value })} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input className={fieldClass} placeholder="Billing email" type="email" value={formData.billToEmail} onChange={(e) => setFormData({ ...formData, billToEmail: e.target.value })} />
                <input className={fieldClass} placeholder="Billing phone" value={formData.billToPhone} onChange={(e) => setFormData({ ...formData, billToPhone: e.target.value })} />
              </div>
              <textarea className={fieldClass} placeholder="Billing address" rows={3} value={formData.billToAddress} onChange={(e) => setFormData({ ...formData, billToAddress: e.target.value })} />
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between gap-3 mb-4">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Invoice Items</h4>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-2 px-3 py-2 bg-black text-white rounded-[10px] hover:bg-gray-800 transition-colors dark:bg-white dark:text-black"
              >
                <Plus className="h-4 w-4" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:items-end">
                    <div className="sm:col-span-5">
                      <label className="block sm:hidden text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Description</label>
                      <input
                        type="text"
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                        className={fieldClass}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:contents">
                      <div className="sm:col-span-2">
                        <label className="block sm:hidden text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Qty</label>
                        <input
                          type="number"
                          placeholder="Qty"
                          min="0"
                          value={item.quantity || ''}
                          onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                          className={fieldClass}
                          required
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block sm:hidden text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Rate</label>
                        <input
                          type="number"
                          placeholder="Rate"
                          min="0"
                          step="0.01"
                          value={item.rate || ''}
                          onChange={(e) => updateItem(index, 'rate', parseFloat(e.target.value) || 0)}
                          className={fieldClass}
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-[1fr_auto] gap-3 sm:contents">
                      <div className="sm:col-span-2">
                        <label className="block sm:hidden text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Amount</label>
                        <input
                          type="text"
                          value={money(item.amount)}
                          readOnly
                          className={`${fieldClass} bg-gray-50 dark:bg-gray-800`}
                        />
                      </div>
                      <div className="sm:col-span-1 flex items-end">
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="w-full sm:w-auto p-3 text-red-600 hover:bg-red-50 rounded-[10px] transition-colors disabled:opacity-40 dark:hover:bg-red-900/20"
                          disabled={items.length === 1}
                          aria-label="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Payment & Adjustments</h4>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
              <div className={sectionCardClass}>
                <label className={labelClass}>Bank Account Details</label>
                <textarea
                  className={`${fieldClass} min-h-[170px]`}
                  rows={6}
                  placeholder="Account name, bank, IBAN/account number, payment instructions"
                  value={formData.bankDetails}
                  onChange={(e) => setFormData({ ...formData, bankDetails: e.target.value })}
                />
              </div>

              <div className={sectionCardClass}>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className={labelClass}>Discount</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.discountValue || ''}
                      onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) || 0 })}
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Type</label>
                    <select
                      value={formData.discountType}
                      onChange={(e) => setFormData({ ...formData, discountType: e.target.value as Invoice['discountType'] })}
                      className={selectClass}
                    >
                      <option value="fixed">Fixed</option>
                      <option value="percentage">Percent</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Tax Rate (%)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.taxRate || ''}
                      onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
                      className={fieldClass}
                    />
                  </div>
                </div>

                <div className="mt-5 rounded-xl bg-gray-50 p-4 dark:bg-gray-800/70">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-gray-600 dark:text-gray-400">
                      <span>Subtotal</span>
                      <span>{money(totals.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600 dark:text-gray-400">
                      <span>Discount</span>
                      <span>-{money(totals.discountAmount)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600 dark:text-gray-400">
                      <span>Tax</span>
                      <span>{money(totals.taxAmount)}</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-3 text-lg font-semibold text-gray-950 dark:text-white">
                      <span>Total</span>
                      <span>{money(totals.total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={sectionCardClass}>
              <label className={labelClass}>Notes</label>
              <textarea
                className={`${fieldClass} min-h-[120px]`}
                rows={4}
                placeholder="Payment terms, project notes, thank-you message"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </section>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 border border-gray-200 text-gray-700 rounded-[10px] hover:bg-gray-50 transition-colors dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 text-gray-900 rounded-[10px] hover:bg-gray-50 transition-colors dark:border-gray-700 dark:text-white dark:hover:bg-gray-800"
            >
              <Download className="h-4 w-4" />
              <span>Download PDF</span>
            </button>
            <button
              type="submit"
              className="px-4 py-3 bg-black text-white rounded-[10px] hover:bg-gray-800 transition-colors dark:bg-white dark:text-black"
            >
              {invoice ? 'Update Invoice' : 'Create Invoice'}
            </button>
          </div>
        </form>

        {showClientForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 w-full max-w-md border border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-950 dark:text-white">Add New Client</h4>
                <button
                  onClick={() => setShowClientForm(false)}
                  className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Client name"
                  value={newClient.name}
                  onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                  className={fieldClass}
                  required
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={newClient.email}
                  onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                  className={fieldClass}
                />
                <input
                  type="tel"
                  placeholder="Phone"
                  value={newClient.phone}
                  onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                  className={fieldClass}
                />
                <textarea
                  placeholder="Address"
                  value={newClient.address}
                  onChange={(e) => setNewClient({ ...newClient, address: e.target.value })}
                  className={fieldClass}
                  rows={3}
                />

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowClientForm(false)}
                    className="px-4 py-3 border border-gray-200 text-gray-700 rounded-[10px] hover:bg-gray-50 transition-colors dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={addClient}
                    className="px-4 py-3 bg-black text-white rounded-[10px] hover:bg-gray-800 transition-colors disabled:opacity-40 dark:bg-white dark:text-black"
                    disabled={!newClient.name}
                  >
                    Add Client
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
