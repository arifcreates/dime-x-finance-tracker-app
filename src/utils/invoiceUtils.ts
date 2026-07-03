import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Client, Invoice } from '../types';
import { formatCurrency, formatDate } from './formatters';
import { businessProfileService } from '../services/businessProfileService';

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

// Sequential invoice numbers: PREFIX-YYYY-001, counting per prefix and year.
export const getNextInvoiceNumber = (invoices: Invoice[], prefix = 'INV'): string => {
  const year = new Date().getFullYear();
  const pattern = new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-${year}-(\\d+)$`, 'i');
  const maxCounter = invoices.reduce((max, invoice) => {
    const match = invoice.invoiceNumber?.match(pattern);
    return match ? Math.max(max, parseInt(match[1], 10)) : max;
  }, 0);
  return `${prefix}-${year}-${String(maxCounter + 1).padStart(3, '0')}`;
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

// Brand tokens for the invoice document. Change these to rebrand the whole PDF.
const INVOICE_BRAND = {
  accent: '#4F46E5', // primary accent (monogram, amount-due band, links)
  ink: '#0B0B0F', // primary text
  muted: '#6B7280', // secondary text
  faint: '#9CA3AF', // tertiary text
  line: '#E7E7EA', // hairlines and borders
  soft: '#F7F7F8', // soft surface fills
};

const statusBadge = (status: Invoice['status']) => {
  const map: Record<Invoice['status'], { bg: string; fg: string; label: string }> = {
    paid: { bg: '#ECFDF5', fg: '#047857', label: 'Paid' },
    overdue: { bg: '#FEF2F2', fg: '#B91C1C', label: 'Overdue' },
    sent: { bg: '#EFF6FF', fg: '#1D4ED8', label: 'Sent' },
    draft: { bg: '#F3F4F6', fg: '#374151', label: 'Draft' },
  };
  return map[status] || map.draft;
};

const monogram = (name?: string) => {
  const cleaned = String(name || '').trim();
  if (!cleaned) return 'IN';
  const parts = cleaned.split(/\s+/).filter(Boolean);
  const initials = parts.length >= 2 ? parts[0][0] + parts[1][0] : cleaned.slice(0, 2);
  return initials.toUpperCase();
};

const buildInvoiceDocumentHtml = (invoice: Invoice, client?: Client) => {
  const profile = businessProfileService.getProfile();
  const currency = invoice.currency || 'USD';
  const totals = calculateInvoiceTotals(invoice);
  const billToName = invoice.billToName || client?.name || 'Client';
  const billToEmail = invoice.billToEmail || client?.email || '';
  const billToPhone = invoice.billToPhone || client?.phone || '';
  const billToAddress = invoice.billToAddress || client?.address || '';
  const companyName = invoice.companyName || profile.companyName || 'Your Company';
  const companyEmail = invoice.companyEmail || profile.companyEmail;
  const companyPhone = invoice.companyPhone || profile.companyPhone;
  const companyAddress = invoice.companyAddress || profile.companyAddress;
  const accent = profile.accentColor || INVOICE_BRAND.accent;
  const badge = statusBadge(invoice.status);
  const isPaid = invoice.status === 'paid';

  const rows = invoice.items
    .map(
      (item, index) => `
        <tr>
          <td class="desc"><span class="idx">${index + 1}</span>${escapeHtml(item.description) || '<span class="faint">Item</span>'}</td>
          <td class="num">${escapeHtml(item.quantity)}</td>
          <td class="num">${formatInvoiceMoney(item.rate, currency)}</td>
          <td class="num strong">${formatInvoiceMoney(item.amount, currency)}</td>
        </tr>`
    )
    .join('');

  const discountRow =
    totals.discountAmount > 0
      ? `<div class="total-row"><span>Discount${invoice.discountType === 'percentage' ? ` (${escapeHtml(invoice.discountValue || 0)}%)` : ''}</span><span>-${formatInvoiceMoney(totals.discountAmount, currency)}</span></div>`
      : '';
  const taxRow =
    totals.taxAmount > 0
      ? `<div class="total-row"><span>Tax (${escapeHtml(invoice.taxRate || 0)}%)</span><span>${formatInvoiceMoney(totals.taxAmount, currency)}</span></div>`
      : '';

  // All selectors are scoped under .dimex-invoice-doc: this markup is mounted
  // offscreen in the live app document, so bare selectors would leak into the app.
  return `
    <style>
      .dimex-invoice-doc {
        --accent: ${accent};
        --ink: ${INVOICE_BRAND.ink};
        --muted: ${INVOICE_BRAND.muted};
        --faint: ${INVOICE_BRAND.faint};
        --line: ${INVOICE_BRAND.line};
        --soft: ${INVOICE_BRAND.soft};
        width: 794px;
        background: #fff;
        color: var(--ink);
        font-family: 'Inter', 'General Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        -webkit-font-smoothing: antialiased;
        font-feature-settings: 'tnum' 1;
      }
      .dimex-invoice-doc * { box-sizing: border-box; }
      .dimex-invoice-doc .band { height: 6px; background: linear-gradient(90deg, var(--accent), var(--ink)); }
      .dimex-invoice-doc .inner { padding: 44px 48px 40px; }
      .dimex-invoice-doc .head { display: flex; justify-content: space-between; align-items: flex-start; gap: 28px; }
      .dimex-invoice-doc .brand { display: flex; gap: 14px; align-items: center; }
      .dimex-invoice-doc .mono {
        width: 52px; height: 52px; border-radius: 14px; flex: none;
        background: var(--accent); color: #fff; font-weight: 800; font-size: 20px;
        display: flex; align-items: center; justify-content: center; letter-spacing: .02em;
      }
      .dimex-invoice-doc .logo { height: 52px; max-width: 180px; object-fit: contain; flex: none; }
      .dimex-invoice-doc .brand .name { font-size: 18px; font-weight: 700; line-height: 1.2; }
      .dimex-invoice-doc .brand .sub { color: var(--muted); font-size: 13px; margin-top: 2px; }
      .dimex-invoice-doc .doc { text-align: right; }
      .dimex-invoice-doc .doc .label { font-size: 26px; font-weight: 800; letter-spacing: -.01em; }
      .dimex-invoice-doc .doc .no { color: var(--muted); font-size: 13px; margin-top: 2px; }
      .dimex-invoice-doc .pill {
        display: inline-block; margin-top: 10px; padding: 5px 12px; border-radius: 999px;
        font-size: 12px; font-weight: 700; letter-spacing: .02em;
        background: ${badge.bg}; color: ${badge.fg};
      }
      .dimex-invoice-doc .meta { display: flex; gap: 10px; margin-top: 30px; }
      .dimex-invoice-doc .meta .cell { flex: 1; border: 1px solid var(--line); border-radius: 12px; padding: 12px 14px; }
      .dimex-invoice-doc .meta .k { color: var(--faint); font-size: 11px; text-transform: uppercase; letter-spacing: .07em; }
      .dimex-invoice-doc .meta .v { font-size: 14px; font-weight: 600; margin-top: 4px; }
      .dimex-invoice-doc .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 26px; margin-top: 30px; }
      .dimex-invoice-doc .parties h3 { margin: 0 0 8px; font-size: 11px; text-transform: uppercase; letter-spacing: .08em; color: var(--faint); }
      .dimex-invoice-doc .parties .who { font-size: 15px; font-weight: 700; }
      .dimex-invoice-doc .parties p { margin: 3px 0 0; color: var(--muted); font-size: 13px; line-height: 1.5; }
      .dimex-invoice-doc table { width: 100%; border-collapse: collapse; margin-top: 30px; }
      .dimex-invoice-doc thead th {
        text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .06em;
        color: var(--faint); font-weight: 600; padding: 0 0 10px; border-bottom: 1px solid var(--line);
      }
      .dimex-invoice-doc thead th.num { text-align: right; }
      .dimex-invoice-doc tbody td { padding: 13px 0; border-bottom: 1px solid var(--soft); font-size: 14px; vertical-align: top; }
      .dimex-invoice-doc tbody tr:last-child td { border-bottom: 1px solid var(--line); }
      .dimex-invoice-doc td.num { text-align: right; white-space: nowrap; }
      .dimex-invoice-doc td.strong { font-weight: 600; }
      .dimex-invoice-doc td.desc { color: var(--ink); }
      .dimex-invoice-doc td .idx { display: inline-block; min-width: 20px; color: var(--faint); font-size: 12px; }
      .dimex-invoice-doc .faint { color: var(--faint); }
      .dimex-invoice-doc tr { page-break-inside: avoid; }
      .dimex-invoice-doc .foot { display: flex; justify-content: space-between; gap: 30px; margin-top: 24px; align-items: flex-start; }
      .dimex-invoice-doc .terms { flex: 1; }
      .dimex-invoice-doc .terms h3 { margin: 0 0 6px; font-size: 11px; text-transform: uppercase; letter-spacing: .08em; color: var(--faint); }
      .dimex-invoice-doc .card { border: 1px solid var(--line); border-radius: 12px; padding: 14px 16px; background: var(--soft); color: var(--muted); font-size: 13px; line-height: 1.5; margin-top: 8px; }
      .dimex-invoice-doc .totals { width: 300px; flex: none; }
      .dimex-invoice-doc .total-row { display: flex; justify-content: space-between; padding: 8px 0; color: var(--muted); font-size: 14px; }
      .dimex-invoice-doc .total-row span:last-child { color: var(--ink); font-weight: 600; }
      .dimex-invoice-doc .due {
        margin-top: 14px; border-radius: 14px; padding: 16px 18px; color: #fff;
        background: ${isPaid ? '#047857' : INVOICE_BRAND.ink};
        display: flex; justify-content: space-between; align-items: center;
        page-break-inside: avoid;
      }
      .dimex-invoice-doc .due .lab { font-size: 12px; text-transform: uppercase; letter-spacing: .06em; opacity: .7; }
      .dimex-invoice-doc .due .amt { font-size: 24px; font-weight: 800; margin-top: 2px; }
      .dimex-invoice-doc .due .accent-dot { width: 10px; height: 10px; border-radius: 999px; background: var(--accent); }
      .dimex-invoice-doc .signoff { margin-top: 34px; padding-top: 18px; border-top: 1px solid var(--line); display: flex; justify-content: space-between; align-items: center; color: var(--faint); font-size: 12px; }
      .dimex-invoice-doc .signoff .thanks { color: var(--ink); font-weight: 600; font-size: 13px; }
    </style>
    <div class="band"></div>
    <div class="inner">
      <header class="head">
        <div class="brand">
          ${profile.logoDataUrl
            ? `<img class="logo" src="${profile.logoDataUrl}" alt="${escapeHtml(companyName)} logo" />`
            : `<div class="mono">${escapeHtml(monogram(companyName))}</div>`}
          <div>
            <div class="name">${escapeHtml(companyName)}</div>
            ${companyEmail ? `<div class="sub">${escapeHtml(companyEmail)}</div>` : ''}
            ${companyPhone ? `<div class="sub">${escapeHtml(companyPhone)}</div>` : ''}
          </div>
        </div>
        <div class="doc">
          <div class="label">Invoice</div>
          <div class="no">${escapeHtml(invoice.invoiceNumber)}</div>
          <span class="pill">${escapeHtml(badge.label)}</span>
        </div>
      </header>

      <section class="meta">
        <div class="cell"><div class="k">Issued</div><div class="v">${formatDate(invoice.date)}</div></div>
        <div class="cell"><div class="k">Due</div><div class="v">${formatDate(invoice.dueDate)}</div></div>
        <div class="cell"><div class="k">Currency</div><div class="v">${escapeHtml(currency)}</div></div>
      </section>

      <section class="parties">
        <div>
          <h3>From</h3>
          <div class="who">${escapeHtml(companyName)}</div>
          ${companyAddress ? `<p>${blockLines(companyAddress)}</p>` : ''}
        </div>
        <div>
          <h3>Bill To</h3>
          <div class="who">${escapeHtml(billToName)}</div>
          ${billToEmail ? `<p>${escapeHtml(billToEmail)}</p>` : ''}
          ${billToPhone ? `<p>${escapeHtml(billToPhone)}</p>` : ''}
          ${billToAddress ? `<p>${blockLines(billToAddress)}</p>` : ''}
        </div>
      </section>

      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th class="num">Qty</th>
            <th class="num">Rate</th>
            <th class="num">Amount</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <div class="foot">
        <div class="terms">
          ${invoice.bankDetails ? `<h3>Payment details</h3><div class="card">${blockLines(invoice.bankDetails)}</div>` : ''}
          ${invoice.notes ? `<h3 style="margin-top:14px;">Notes</h3><div class="card">${blockLines(invoice.notes)}</div>` : ''}
        </div>
        <div class="totals">
          <div class="total-row"><span>Subtotal</span><span>${formatInvoiceMoney(totals.subtotal, currency)}</span></div>
          ${discountRow}
          ${taxRow}
          <div class="due">
            <div>
              <div class="lab">${isPaid ? 'Amount paid' : 'Amount due'}</div>
              <div class="amt">${formatInvoiceMoney(totals.total, currency)}</div>
            </div>
            <div class="accent-dot"></div>
          </div>
        </div>
      </div>

      <div class="signoff">
        <span class="thanks">Thank you for your business.</span>
        <span>${escapeHtml(invoice.invoiceNumber)} · Generated with Dime-x</span>
      </div>
    </div>
  `;
};

const INTER_FONT_LINK_ID = 'dimex-invoice-inter-font';

const ensureInterFont = async () => {
  if (!document.getElementById(INTER_FONT_LINK_ID)) {
    const link = document.createElement('link');
    link.id = INTER_FONT_LINK_ID;
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap';
    document.head.appendChild(link);
  }
  try {
    await Promise.race([
      document.fonts.ready,
      new Promise((resolve) => setTimeout(resolve, 1500)),
    ]);
  } catch {
    // Fall back to system fonts if font loading fails.
  }
};

// Renders the invoice offscreen and saves it directly as a .pdf file.
export const downloadInvoicePdf = async (invoice: Invoice, client?: Client) => {
  await ensureInterFont();

  // Mounted at the top-left behind the app (not offscreen: html2canvas skips
  // elements outside the viewport origin) so the capture has real pixels.
  const container = document.createElement('div');
  container.className = 'dimex-invoice-doc';
  container.style.position = 'absolute';
  container.style.left = '0';
  container.style.top = '0';
  container.style.zIndex = '-9999';
  container.style.pointerEvents = 'none';
  container.innerHTML = buildInvoiceDocumentHtml(invoice, client);
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      windowWidth: 794,
    });

    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imageHeight = (canvas.height * pageWidth) / canvas.width;
    const imageData = canvas.toDataURL('image/jpeg', 0.98);

    let heightLeft = imageHeight;
    let position = 0;
    pdf.addImage(imageData, 'JPEG', 0, position, pageWidth, imageHeight);
    heightLeft -= pageHeight;
    while (heightLeft > 0) {
      position -= pageHeight;
      pdf.addPage();
      pdf.addImage(imageData, 'JPEG', 0, position, pageWidth, imageHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`${invoice.invoiceNumber || 'invoice'}.pdf`);
  } catch (error) {
    console.error('Invoice PDF error:', error);
    alert('Could not generate the invoice PDF. Please try again.');
  } finally {
    container.remove();
  }
};
