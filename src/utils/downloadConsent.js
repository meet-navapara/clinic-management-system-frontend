import { jsPDF } from 'jspdf';
import { format, isValid } from 'date-fns';
import api from './api';

function safeDate(value, pattern = 'dd MMM yyyy, HH:mm') {
  if (!value) return '';
  const d = new Date(value);
  return isValid(d) ? format(d, pattern) : '';
}

/**
 * Fetch consent print payload and download a PDF in the current tab (no navigation).
 */
export async function downloadConsentPdf(recordId) {
  const res = await api.get(`/ops/print/consent/${recordId}`);
  const { record, branding = {} } = res.data || {};
  if (!record) throw new Error('Consent not found.');

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 16;
  const maxW = pageW - margin * 2;
  let y = margin;

  const clinicName = branding.clinicName || 'Clinic';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(clinicName, margin, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(90);
  const meta = [branding.address, [branding.phone, branding.email].filter(Boolean).join(' · ')].filter(Boolean);
  meta.forEach((line) => {
    doc.text(String(line), margin, y);
    y += 4;
  });

  y += 3;
  doc.setDrawColor(210);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  doc.setTextColor(20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  const titleLines = doc.splitTextToSize(String(record.titleSnapshot || 'Consent'), maxW);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 6 + 2;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(
    `Version ${record.version || 1} · ${String(record.status || '').replace(/_/g, ' ')}`,
    margin,
    y
  );
  y += 7;

  doc.setTextColor(20);
  doc.setFontSize(10);
  const bodyLines = doc.splitTextToSize(String(record.bodySnapshot || ''), maxW);
  for (const line of bodyLines) {
    if (y > pageH - 40) {
      doc.addPage();
      y = margin;
    }
    doc.text(line, margin, y);
    y += 5;
  }

  y += 6;
  if (y > pageH - 50) {
    doc.addPage();
    y = margin;
  }

  doc.setFont('helvetica', 'bold');
  doc.text(`Patient: ${record.patientId?.name || '—'}`, margin, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  if (record.signerName) {
    doc.text(`Signer: ${record.signerName}`, margin, y);
    y += 5;
  }
  const signed = safeDate(record.signedAt);
  if (signed) {
    doc.text(`Signed: ${signed}`, margin, y);
    y += 5;
  }

  if (record.signatureDataUrl && String(record.signatureDataUrl).startsWith('data:image/')) {
    y += 4;
    if (y > pageH - 40) {
      doc.addPage();
      y = margin;
    }
    try {
      const fmt = record.signatureDataUrl.includes('image/jpeg') ? 'JPEG' : 'PNG';
      doc.addImage(record.signatureDataUrl, fmt, margin, y, 60, 22);
      y += 26;
    } catch {
      doc.setFontSize(9);
      doc.setTextColor(120);
      doc.text('(Signature on file)', margin, y);
    }
  }

  const safeName = String(record.titleSnapshot || 'consent')
    .replace(/[^\w\-]+/g, '_')
    .slice(0, 40);
  const fileName = `${safeName}-${record.patientId?.patientCode || record._id || 'form'}.pdf`;
  doc.save(fileName);
  return fileName;
}
