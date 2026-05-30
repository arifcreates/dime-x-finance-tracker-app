import { Client, Invoice } from '../types';
import { formatCurrency, formatDate } from './formatters';

const invoiceMetaFields = [
  'currency',
  'companyName',
  'companyEmail',
  'companyPhone',
  'companyAddress',
  'billToName',
  'billToEmail',
  'billToPhone',
  'billToAddress',
  'notes',
  'bankDetails',
  'taxRate',
  'taxAmount',
  'discountType',
  'discountValue',
  'discountAmount',
  'subtotal',
] as const;

export type InvoiceMetadata = Pick<Invoice, typeof invoiceMetaFields[number]>;

export const getInvoiceMetadata = (invoice: Invoice): InvoiceMetadata => {
  return invoiceMetaFields.reduce((metadata, field) => {
    if (invoice[field] !== undefined) {
      metadata[field] = invoice[field] as never;
    }
    return metadata;
  }, {} as InvoiceMetadata);
};

export const calculateInvoiceTotals = (invoice: Pick<Invoice, 'items' | 'discountType' | 'discountValue' | 'taxRate'>) => {
  const subtotal = invoice.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const discountValue = Math.max(0, Number(invoice.discountValue) || 0);
  const rawDiscount = invoice.discountType === 'percentage' ? subtotal * (discountValue / 100) : discountValue;
  const discountAmount = Math.min(subtotal, rawDiscount);
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxRate = Math.max(0, Number(invoice.taxRate) || 0);
  const taxAmount = taxableAmount * (taxRate / 100);
  const total = taxableAmount + taxAmount;

  return { subtotal, discountAmount, taxableAmount, taxAmount, total };
};

export const formatInvoiceMoney = (amount: number, currency = 'USD') => {
  return formatCurrency(amount || 0, currency || 'USD');
};

const escapeHtml = (value?: string | number) =>
  String(value ?? '').replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return entities[char];
  });

const blockLines = (value?: string) =>
  escapeHtml(value)
    .split('\n')
    .filter(Boolean)
    .join('<br />');

export const downloadInvoicePdf = (invoice: Invoice, client?: Client) => {
  const currency = invoice.currency || 'USD';
  const totals = calculateInvoiceTotals(invoice);
  const billToName = invoice.billToName || client?.name || 'Client';
  const billToEmail = invoice.billToEmail || client?.email || '';
  const billToPhone = invoice.billToPhone || client?.phone || '';
  const billToAddress = invoice.billToAddress || client?.address || '';
  const win = window.open('', '_blank', 'noopener,noreferrer,width=900,height=1000');

  if (!win) {
    alert('Please allow pop-ups to download the invoice PDF.');
    return;
  }

  const rows = invoice.items
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.description)}</td>
          <td>${escapeHtml(item.quantity)}</td>
          <td>${formatInvoiceMoney(item.rate, currency)}</td>
          <td>${formatInvoiceMoney(item.amount, currency)}</td>
        </tr>`
    )
    .join('');

  win.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>${escapeHtml(invoice.invoiceNumber)} PDF</title>
        <style>
          * { box-sizing: border-box; }
          body { margin: 0; padding: 40px; color: #111827; font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f7f7f5; }
          .page { max-width: 820px; margin: 0 auto; padding: 44px; background: #fff; border: 1px solid #e5e7eb; border-radius: 18px; }
          .top { display: flex; justify-content: space-between; gap: 32px; align-items: flex-start; padding-bottom: 28px; border-bottom: 1px solid #e5e7eb; }
          h1 { margin: 0; font-size: 40px; letter-spacing: 0; }
          h2 { margin: 0 0 10px; font-size: 14px; color: #6b7280; text-transform: uppercase; letter-spacing: .08em; }
          p { margin: 0; line-height: 1.55; }
          .muted { color: #6b7280; }
          .section { margin-top: 28px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th, td { padding: 14px 0; border-bottom: 1px solid #e5e7eb; text-align: left; vertical-align: top; }
          th { color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: .06em; }
          th:nth-child(2), th:nth-child(3), th:nth-child(4), td:nth-child(2), td:nth-child(3), td:nth-child(4) { text-align: right; }
          .totals { width: 320px; margin-left: auto; margin-top: 24px; }
          .total-row { display: flex; justify-content: space-between; padding: 9px 0; color: #374151; }
          .grand { margin-top: 8px; padding-top: 16px; border-top: 1px solid #111827; color: #111827; font-size: 22px; font-weight: 700; }
          .notes { padding: 18px; border: 1px solid #e5e7eb; border-radius: 12px; background: #fafafa; }
          @media print {
            body { padding: 0; background: #fff; }
            .page { border: 0; border-radius: 0; max-width: none; }
          }
        </style>
      </head>
      <body>
        <main class="page">
          <section class="top">
            <div>
              <h1>Invoice</h1>
              <p class="muted">${escapeHtml(invoice.invoiceNumber)}</p>
            </div>
            <div>
              <p><strong>Date:</strong> ${formatDate(invoice.date)}</p>
              <p><strong>Due:</strong> ${formatDate(invoice.dueDate)}</p>
              <p><strong>Status:</strong> ${escapeHtml(invoice.status)}</p>
              <p><strong>Currency:</strong> ${escapeHtml(currency)}</p>
            </div>
          </section>

          <section class="section grid">
            <div>
              <h2>From</h2>
              <p><strong>${escapeHtml(invoice.companyName || 'Company')}</strong></p>
              ${invoice.companyEmail ? `<p>${escapeHtml(invoice.companyEmail)}</p>` : ''}
              ${invoice.companyPhone ? `<p>${escapeHtml(invoice.companyPhone)}</p>` : ''}
              ${invoice.companyAddress ? `<p>${blockLines(invoice.companyAddress)}</p>` : ''}
            </div>
            <div>
              <h2>Bill To</h2>
              <p><strong>${escapeHtml(billToName)}</strong></p>
              ${billToEmail ? `<p>${escapeHtml(billToEmail)}</p>` : ''}
              ${billToPhone ? `<p>${escapeHtml(billToPhone)}</p>` : ''}
              ${billToAddress ? `<p>${blockLines(billToAddress)}</p>` : ''}
            </div>
          </section>

          <section class="section">
            <h2>Items</h2>
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Qty</th>
                  <th>Rate</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
            <div class="totals">
              <div class="total-row"><span>Subtotal</span><strong>${formatInvoiceMoney(totals.subtotal, currency)}</strong></div>
              <div class="total-row"><span>Discount</span><strong>-${formatInvoiceMoney(totals.discountAmount, currency)}</strong></div>
              <div class="total-row"><span>Tax (${escapeHtml(invoice.taxRate || 0)}%)</span><strong>${formatInvoiceMoney(totals.taxAmount, currency)}</strong></div>
              <div class="total-row grand"><span>Total</span><span>${formatInvoiceMoney(totals.total, currency)}</span></div>
            </div>
          </section>

          ${invoice.bankDetails ? `<section class="section"><h2>Bank Details</h2><div class="notes">${blockLines(invoice.bankDetails)}</div></section>` : ''}
          ${invoice.notes ? `<section class="section"><h2>Notes</h2><div class="notes">${blockLines(invoice.notes)}</div></section>` : ''}
        </main>
        <script>
          window.onload = () => setTimeout(() => window.print(), 250);
        </script>
      </body>
    </html>
  `);
  win.document.close();
};
