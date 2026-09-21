import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, isValid } from 'date-fns';
import api from './api';
import { paymentMethodLabel } from '../constants/payments';

function fmtMoney(n, symbol = 'Rs.') {
  const v = Number(n) || 0;
  const num = v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  // Standard PDF fonts lack ₹ — use Rs. for reliable download output.
  const sym = symbol === '₹' || !symbol ? 'Rs.' : String(symbol);
  return `${sym}${num}`;
}

function safeDate(value, pattern = 'dd MMM yyyy') {
  if (!value) return '—';
  const d = new Date(value);
  return isValid(d) ? format(d, pattern) : '—';
}

function loadImageAsDataUrl(url) {
  if (!url) return Promise.resolve(null);
  if (String(url).startsWith('data:image/')) return Promise.resolve(url);
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/**
 * Fetch invoice print payload and download a PDF in the current tab (no navigation).
 * Uses clinic print branding (logo, identity, tax label, terms, signature when available).
 */
export async function downloadInvoicePdf(invoiceId) {
  const res = await api.get(`/ops/print/invoice/${invoiceId}`);
  const { invoice, payments = [], branding = {} } = res.data || {};
  if (!invoice) throw new Error('Invoice not found.');

  const marginIn = Number(branding.marginLeftIn ?? branding.marginTopIn ?? 0.5) || 0.5;
  const margin = Math.min(28, Math.max(10, marginIn * 25.4));
  const doc = new jsPDF({
    unit: 'mm',
    format: branding.paperSize === 'A5' ? 'a5' : branding.paperSize === 'Letter' ? 'letter' : 'a4',
    orientation: branding.pageOrientation === 'landscape' ? 'landscape' : 'portrait',
  });
  const pageW = doc.internal.pageSize.getWidth();
  let y = margin;

  const [logoData, sigData] = await Promise.all([
    loadImageAsDataUrl(branding.logo),
    loadImageAsDataUrl(branding.signatureImage),
  ]);

  if (logoData && branding.includeHeader !== false) {
    try {
      const props = doc.getImageProperties(logoData);
      const maxH = 18;
      const maxW = 48;
      const ratio = props.width / props.height;
      let w = maxW;
      let h = w / ratio;
      if (h > maxH) {
        h = maxH;
        w = h * ratio;
      }
      doc.addImage(logoData, 'PNG', margin, y, w, h);
      y += h + 3;
    } catch {
      // continue without logo
    }
  }

  const clinicName = branding.clinicName || 'Clinic';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(Number(branding.headingFontSize) || 16);
  doc.setTextColor(20);
  doc.text(clinicName, margin, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(90);
  const taxLabel = branding.taxLabel || 'GST';
  const metaLines = [
    branding.address,
    [branding.phone, branding.email].filter(Boolean).join(' · '),
    branding.website || '',
    branding.gstNumber ? `${taxLabel}: ${branding.gstNumber}` : '',
    branding.registrationNumber ? `Reg: ${branding.registrationNumber}` : '',
  ].filter(Boolean);
  metaLines.forEach((line) => {
    doc.text(String(line), margin, y);
    y += 4.2;
  });

  y += 4;
  doc.setDrawColor(210);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  doc.setTextColor(20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(`INVOICE ${invoice.invoiceNumber || ''}`, margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(safeDate(invoice.invoiceDate), pageW - margin, y, { align: 'right' });
  y += 8;

  doc.setFontSize(10);
  doc.text(`Patient: ${invoice.patientId?.name || '—'}`, margin, y);
  y += 5;
  if (invoice.doctorId?.name) {
    doc.text(`Doctor: ${invoice.doctorId.name}`, margin, y);
    y += 5;
  }
  if (invoice.patientId?.phone) {
    doc.text(`Phone: ${invoice.patientId.phone}`, margin, y);
    y += 5;
  }
  y += 3;

  const symbol = branding.currencySymbol || 'Rs.';
  const body = (invoice.items || []).map((item) => [
    item.name || '—',
    String(item.quantity ?? ''),
    fmtMoney(item.unitPrice, symbol),
    fmtMoney(item.amount, symbol),
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Item', 'Qty', 'Price', 'Amount']],
    body: body.length ? body : [['—', '', '', '']],
    margin: { left: margin, right: margin },
    styles: { fontSize: Number(branding.contentFontSize) || 9, cellPadding: 2.2 },
    headStyles: { fillColor: [28, 36, 48], textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      1: { halign: 'center', cellWidth: 18 },
      2: { halign: 'right', cellWidth: 28 },
      3: { halign: 'right', cellWidth: 30 },
    },
  });

  y = (doc.lastAutoTable?.finalY || y) + 8;
  const boxX = pageW - margin - 70;
  const rows = [
    ['Subtotal', fmtMoney(invoice.subtotal, symbol)],
    ['Discount', fmtMoney(invoice.discount, symbol)],
    [taxLabel, fmtMoney(invoice.tax, symbol)],
    ['Total', fmtMoney(invoice.total, symbol)],
    ['Paid', fmtMoney(invoice.paidAmount, symbol)],
  ];
  if (Number(invoice.refundedAmount) > 0) {
    rows.push(['Refunded', fmtMoney(invoice.refundedAmount, symbol)]);
  }
  rows.push(['Due', fmtMoney(invoice.dueAmount, symbol)]);

  doc.setFontSize(9);
  rows.forEach(([label, value], idx) => {
    const isTotal = label === 'Total';
    doc.setFont('helvetica', isTotal ? 'bold' : 'normal');
    doc.text(label, boxX, y);
    doc.text(value, pageW - margin, y, { align: 'right' });
    y += isTotal ? 6 : 5;
    if (idx === 3) y += 1;
  });

  const completed = (payments || []).filter((p) => p.status === 'completed' || !p.status);
  if (completed.length) {
    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Payments', margin, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    completed.forEach((p) => {
      const line = `${fmtMoney(p.amount, symbol)} · ${paymentMethodLabel(p.paymentMethod)}${
        p.receiptNumber ? ` · ${p.receiptNumber}` : ''
      } · ${safeDate(p.paymentDate)}`;
      doc.text(line, margin, y);
      y += 4.5;
    });
  }

  const showRight = branding.showRightSignature !== false && branding.showSignature !== false;
  if (showRight || branding.showLeftSignature) {
    y += 14;
    if (y > 250) {
      doc.addPage();
      y = margin + 10;
    }
    if (sigData) {
      try {
        const props = doc.getImageProperties(sigData);
        const maxH = 12;
        const ratio = props.width / props.height;
        const h = maxH;
        const w = Math.min(40, h * ratio);
        if (showRight) doc.addImage(sigData, 'PNG', pageW - margin - w, y - 12, w, h);
        if (branding.showLeftSignature) doc.addImage(sigData, 'PNG', margin, y - 12, w, h);
      } catch {
        // ignore
      }
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(80);
    if (branding.showLeftSignature) {
      doc.text(branding.leftSignatureText || '_______________', margin, y + 4);
    }
    if (showRight) {
      const label = branding.rightSignatureText || branding.signatureLabel || 'Doctor signature';
      doc.text(label, pageW - margin, y + 4, { align: 'right' });
    }
    y += 10;
  }

  if (branding.terms && branding.includeFooter !== false) {
    y += 8;
    if (y > 270) {
      doc.addPage();
      y = margin;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(20);
    doc.text('Terms', margin, y);
    y += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(80);
    const terms = doc.splitTextToSize(String(branding.terms), pageW - margin * 2);
    doc.text(terms, margin, y);
  }

  const fileName = `${invoice.invoiceNumber || `invoice-${invoiceId}`}.pdf`;
  doc.save(fileName);
  return fileName;
}
