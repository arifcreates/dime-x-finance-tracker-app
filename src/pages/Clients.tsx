import React, { useEffect, useMemo, useState } from 'react';
import { Building2, Edit, Mail, Phone, Plus, Search, Trash2, UserRound, X } from 'lucide-react';
import { Client, Invoice } from '../types';
import { dataService } from '../services/dataService';
import { formatDate } from '../utils/formatters';
import { formatInvoiceMoney } from '../utils/invoiceUtils';

interface ClientFormState {
  id?: string;
  name: string;
  email: string;
  phone: string;
  address: string;
}

const emptyClient: ClientFormState = {
  name: '',
  email: '',
  phone: '',
  address: '',
};

const inputClass = 'w-full rounded-[10px] border border-gray-200 bg-white px-4 py-3 text-gray-950 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:border-gray-500 dark:focus:ring-gray-800';

const getCurrencyBreakdown = (invoices: Invoice[]) => {
  const totals = invoices.reduce<Record<string, number>>((acc, invoice) => {
    const currency = invoice.currency || 'USD';
    acc[currency] = (acc[currency] || 0) + invoice.amount;
    return acc;
  }, {});

  const entries = Object.entries(totals);
  if (entries.length === 0) return formatInvoiceMoney(0);

  return entries
    .map(([currency, amount]) => formatInvoiceMoney(amount, currency))
    .join(' + ');
};

export const Clients: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<ClientFormState>(emptyClient);

  const refreshData = async () => {
    const [loadedClients, loadedInvoices] = await Promise.all([
      dataService.getClients(),
      dataService.getInvoices(),
    ]);
    setClients(loadedClients);
    setInvoices(loadedInvoices);
  };

  useEffect(() => {
    refreshData();
  }, []);

  const clientSummaries = useMemo(() => {
    return clients.map((client) => {
      const clientInvoices = invoices.filter((invoice) => invoice.clientId === client.id);
      const paidInvoices = clientInvoices.filter((invoice) => invoice.status === 'paid');
      const pendingInvoices = clientInvoices.filter((invoice) => invoice.status !== 'paid');
      const latestInvoice = [...clientInvoices].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

      return {
        client,
        invoices: clientInvoices,
        paidInvoices,
        pendingInvoices,
        latestInvoice,
      };
    });
  }, [clients, invoices]);

  const filteredClients = clientSummaries.filter(({ client }) => {
    const search = query.trim().toLowerCase();
    if (!search) return true;

    return [client.name, client.email, client.phone, client.address]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(search));
  });

  const totalBusiness = getCurrencyBreakdown(invoices.filter((invoice) => invoice.status === 'paid'));
  const pendingBusiness = getCurrencyBreakdown(invoices.filter((invoice) => invoice.status !== 'paid'));

  const openCreateForm = () => {
    setFormData(emptyClient);
    setShowForm(true);
  };

  const openEditForm = (client: Client) => {
    setFormData(client);
    setShowForm(true);
  };

  const handleSaveClient = async (event?: React.FormEvent) => {
    event?.preventDefault();

    const client: Client = {
      id: formData.id || Date.now().toString(36) + Math.random().toString(36).slice(2),
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      address: formData.address.trim(),
    };

    await dataService.saveClient(client);
    setShowForm(false);
    setFormData(emptyClient);
    refreshData();
  };

  const handleDeleteClient = async (client: Client) => {
    const invoiceCount = invoices.filter((invoice) => invoice.clientId === client.id).length;
    const message = invoiceCount > 0
      ? `Delete ${client.name}? Their ${invoiceCount} invoice${invoiceCount === 1 ? '' : 's'} will stay in history, but the client profile will be removed.`
      : `Delete ${client.name}?`;

    if (!confirm(message)) return;
    await dataService.deleteClient(client.id);
    refreshData();
  };

  return (
    <div className="min-h-screen bg-[#f7f7f4] dark:bg-gray-900 p-3 sm:p-4 lg:p-6 pb-20 lg:pb-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        <section className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-2xl border border-black/[0.07] dark:border-gray-800">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold tracking-tight text-gray-950 dark:text-white">Clients</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Keep client details, invoices, and business value in one place.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search clients"
                  className="h-11 w-full sm:w-72 rounded-[10px] border border-gray-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>
              <button
                onClick={openCreateForm}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] bg-black px-4 text-sm font-semibold text-white transition hover:bg-gray-800 dark:bg-white dark:text-black"
              >
                <Plus className="h-4 w-4" />
                Add Client
              </button>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="rounded-2xl border border-black/[0.07] bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Clients</p>
            <p className="mt-2 text-2xl font-semibold text-gray-950 dark:text-white">{clients.length}</p>
          </div>
          <div className="rounded-2xl border border-black/[0.07] bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Paid Business</p>
            <p className="mt-2 text-xl font-semibold text-gray-950 dark:text-white">{totalBusiness}</p>
          </div>
          <div className="rounded-2xl border border-black/[0.07] bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Pending</p>
            <p className="mt-2 text-xl font-semibold text-gray-950 dark:text-white">{pendingBusiness}</p>
          </div>
        </section>

        {filteredClients.length === 0 ? (
          <section className="rounded-2xl border border-black/[0.07] bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-900">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
              <UserRound className="h-6 w-6 text-gray-500" />
            </div>
            <p className="mt-4 font-semibold text-gray-950 dark:text-white">No clients found</p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Create a client profile when you invoice or add one here.</p>
          </section>
        ) : (
          <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {filteredClients.map(({ client, invoices: clientInvoices, paidInvoices, pendingInvoices, latestInvoice }) => (
              <article key={client.id} className="rounded-2xl border border-black/[0.07] bg-white p-4 sm:p-5 dark:border-gray-800 dark:bg-gray-900">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex items-start gap-3">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-black text-white dark:bg-white dark:text-black">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="truncate text-lg font-semibold text-gray-950 dark:text-white">{client.name}</h4>
                      <div className="mt-2 space-y-1 text-sm text-gray-500 dark:text-gray-400">
                        {client.email && <p className="flex items-center gap-2"><Mail className="h-4 w-4" /> <span className="truncate">{client.email}</span></p>}
                        {client.phone && <p className="flex items-center gap-2"><Phone className="h-4 w-4" /> <span>{client.phone}</span></p>}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 gap-2">
                    <button
                      onClick={() => openEditForm(client)}
                      className="rounded-[10px] p-2 text-gray-600 transition hover:bg-gray-100 hover:text-gray-950 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                      aria-label="Edit client"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteClient(client)}
                      className="rounded-[10px] p-2 text-red-500 transition hover:bg-red-50 dark:hover:bg-red-900/20"
                      aria-label="Delete client"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {client.address && (
                  <p className="mt-4 rounded-xl bg-gray-50 p-3 text-sm leading-relaxed text-gray-600 dark:bg-gray-800 dark:text-gray-300">{client.address}</p>
                )}

                <div className="mt-5 grid grid-cols-3 gap-2">
                  <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Invoices</p>
                    <p className="mt-1 text-lg font-semibold text-gray-950 dark:text-white">{clientInvoices.length}</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Paid</p>
                    <p className="mt-1 text-sm font-semibold text-gray-950 dark:text-white">{getCurrencyBreakdown(paidInvoices)}</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Pending</p>
                    <p className="mt-1 text-sm font-semibold text-gray-950 dark:text-white">{getCurrencyBreakdown(pendingInvoices)}</p>
                  </div>
                </div>

                <div className="mt-5 border-t border-gray-100 pt-4 dark:border-gray-800">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-gray-950 dark:text-white">Invoice History</p>
                    {latestInvoice && <p className="text-xs text-gray-500 dark:text-gray-400">Latest {formatDate(latestInvoice.date)}</p>}
                  </div>
                  {clientInvoices.length === 0 ? (
                    <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">No invoices yet.</p>
                  ) : (
                    <div className="mt-3 space-y-2">
                      {clientInvoices.slice(0, 4).map((invoice) => (
                        <div key={invoice.id} className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 px-3 py-2 text-sm dark:border-gray-800">
                          <div className="min-w-0">
                            <p className="truncate font-medium text-gray-950 dark:text-white">{invoice.invoiceNumber}</p>
                            <p className="text-xs capitalize text-gray-500 dark:text-gray-400">{invoice.status}</p>
                          </div>
                          <p className="flex-shrink-0 font-semibold text-gray-950 dark:text-white">{formatInvoiceMoney(invoice.amount, invoice.currency)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </section>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="mb-1.5 flex max-h-[calc(100dvh-var(--mobile-browser-bottom,0px)-0.75rem)] w-[calc(100%-0.75rem)] max-w-lg flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900 sm:mb-0">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
              <h4 className="text-lg font-semibold text-gray-950 dark:text-white">{formData.id ? 'Edit Client' : 'Add Client'}</h4>
              <button
                onClick={() => setShowForm(false)}
                className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSaveClient} className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
              <input
                required
                value={formData.name}
                onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                placeholder="Company or client name"
                className={inputClass}
              />
              <input
                type="email"
                value={formData.email}
                onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                placeholder="Email"
                className={inputClass}
              />
              <input
                value={formData.phone}
                onChange={(event) => setFormData({ ...formData, phone: event.target.value })}
                placeholder="Phone"
                className={inputClass}
              />
              <textarea
                value={formData.address}
                onChange={(event) => setFormData({ ...formData, address: event.target.value })}
                placeholder="Address or company details"
                rows={4}
                className={inputClass}
              />
            </form>
            <div className="grid grid-cols-2 gap-3 border-t border-gray-100 p-5 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-[10px] border border-gray-200 px-4 py-3 font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveClient()}
                className="rounded-[10px] bg-black px-4 py-3 font-semibold text-white transition hover:bg-gray-800 dark:bg-white dark:text-black"
              >
                Save Client
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
