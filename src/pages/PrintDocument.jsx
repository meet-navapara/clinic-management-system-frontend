import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { format, isValid } from 'date-fns';
import api from '../utils/api';
import Money from '../components/ui/Money';
import BackButton from '../components/ui/BackButton';
import { BRAND_NAME } from '../constants/branding';

function BrandHeader({ branding, branch }) {
  if (branding.includeHeader === false) {
    return <div className="print-header-spacer" aria-hidden style={{ minHeight: '0.25in' }} />;
  }

  return (
    <header className="print-header flex gap-4 items-start border-b border-line pb-3 mb-4">
      {branding.logo ? <img src={branding.logo} alt="" className="h-14 w-auto object-contain max-w-[140px]" /> : null}
      <div className="flex-1 min-w-0">
        <h1 className="print-heading font-semibold">{branding.clinicName}</h1>
        {branding.headerText && <p className="print-sub whitespace-pre-wrap">{branding.headerText}</p>}
        <p className="print-sub text-ink-muted">{branch?.address || branding.address}</p>
        <p className="print-sub text-ink-muted">
          {[branding.phone, branding.email, branding.website].filter(Boolean).join(' · ')}
        </p>
        {(branding.registrationNumber || branding.gstNumber) && (
          <p className="print-sub text-ink-faint">
            {branding.registrationNumber && `Reg. ${branding.registrationNumber} `}
            {branding.gstNumber && `${branding.taxLabel || 'GST'} ${branding.gstNumber}`}
          </p>
        )}
      </div>
    </header>
  );
}

function SignatureBlock({ branding }) {
  const showLeft = Boolean(branding.showLeftSignature);
  const showRight = branding.showRightSignature !== false && branding.showSignature !== false;
  if (!showLeft && !showRight) return null;

  return (
    <div className="print-signatures mt-12 flex justify-between gap-8 print-sub">
      <div className="flex-1">
        {showLeft && (
          <>
            {branding.signatureImage && !branding.leftSignatureText ? (
              <img src={branding.signatureImage} alt="" className="h-12 object-contain mb-1" />
            ) : null}
            <p className="whitespace-pre-wrap">{branding.leftSignatureText || '_______________'}</p>
          </>
        )}
      </div>
      <div className="flex-1 text-right">
        {showRight && (
          <>
            {branding.signatureImage ? (
              <img src={branding.signatureImage} alt="" className="h-12 object-contain mb-1 ml-auto" />
            ) : null}
            <p className="whitespace-pre-wrap">
              {branding.rightSignatureText || branding.signatureLabel || 'Authorized signature'}
              {!branding.rightSignatureText && !branding.signatureImage ? (
                <>
                  <br />
                  _______________
                </>
              ) : null}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function Footer({ branding }) {
  if (branding.includeFooter === false && !branding.showPoweredBy) return null;

  return (
    <footer className="print-footer mt-8 pt-3 border-t border-line print-sub text-ink-muted">
      {branding.includeFooter !== false && (
        <>
          {branding.terms && <p className="mb-2 whitespace-pre-wrap">{branding.terms}</p>}
          {branding.footerText && <p className="whitespace-pre-wrap">{branding.footerText}</p>}
        </>
      )}
      {branding.showPoweredBy && (
        <p className="text-center text-[10px] text-ink-faint mt-3">Powered by {BRAND_NAME}</p>
      )}
    </footer>
  );
}

export default function PrintDocument() {
  const { type, id } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get(`/ops/print/${type}/${id}`).then((res) => setData(res.data)).catch(() => setData({ error: true }));
  }, [type, id]);

  const sheetStyle = useMemo(() => {
    const b = data?.branding;
    if (!b) return {};
    return {
      paddingTop: `${b.marginTopIn ?? 0.5}in`,
      paddingBottom: `${b.marginBottomIn ?? 0.5}in`,
      paddingLeft: `${b.marginLeftIn ?? 0.5}in`,
      paddingRight: `${b.marginRightIn ?? 0.5}in`,
      fontSize: `${b.contentFontSize ?? 12}px`,
      '--print-heading-size': `${b.headingFontSize ?? 14}px`,
      '--print-sub-size': `${b.subContentFontSize ?? 11}px`,
    };
  }, [data?.branding]);

  useEffect(() => {
    if (!data?.branding) return undefined;
    const b = data.branding;
    const size = b.paperSize === 'A5' ? 'A5' : b.paperSize === 'Letter' ? 'letter' : 'A4';
    const orient = b.pageOrientation === 'landscape' ? 'landscape' : 'portrait';
    const style = document.createElement('style');
    style.setAttribute('data-print-page', '1');
    style.textContent = `@page { size: ${size} ${orient}; margin: 0; }`;
    document.head.appendChild(style);
    return () => style.remove();
  }, [data?.branding]);

  if (!data) return <div className="p-8">Loading document…</div>;
  if (data.error) return <div className="p-8">Document not found.</div>;

  const { branding } = data;
  const paper =
    branding.paperSize === 'receipt'
      ? 'print-receipt'
      : branding.paperSize === 'A5'
        ? 'print-a5'
        : branding.paperSize === 'Letter'
          ? 'print-letter'
          : 'print-a4';

  return (
    <div
      className={`print-root ${paper} bg-white min-h-dvh text-ink ${branding.coloredPrint === false ? 'print-grayscale' : ''}`}
    >
      <div className="print-toolbar no-print sticky top-0 z-10 bg-canvas border-b border-line px-4 py-2 flex items-center gap-2">
        <BackButton to={-1} />
        <button type="button" className="btn-primary" onClick={() => window.print()}>
          Print / Save PDF
        </button>
        <button type="button" className="btn-secondary" onClick={() => window.close()}>
          Close
        </button>
      </div>
      <article className="print-sheet mx-auto max-w-[210mm]" style={sheetStyle}>
        <BrandHeader branding={branding} branch={data.invoice?.branchId || data.appointment?.branchId} />

        {type === 'invoice' && data.invoice && (
          <>
            <h2 className="print-heading font-semibold mb-2">Invoice {data.invoice.invoiceNumber}</h2>
            <p className="print-sub mb-4">
              Patient: {data.invoice.patientId?.name} · Doctor: {data.invoice.doctorId?.name}
              {data.invoice.invoiceDate && isValid(new Date(data.invoice.invoiceDate))
                ? ` · ${format(new Date(data.invoice.invoiceDate), 'dd MMM yyyy')}`
                : ''}
            </p>
            <table className="w-full mb-4" style={{ fontSize: 'inherit' }}>
              <thead>
                <tr className="border-b">
                  <th className="text-left py-1">Item</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Amt</th>
                </tr>
              </thead>
              <tbody>
                {(data.invoice.items || []).map((item, i) => (
                  <tr key={i} className="border-b border-line">
                    <td className="py-1">{item.name}</td>
                    <td className="text-center">{item.quantity}</td>
                    <td className="text-right">
                      <Money value={item.unitPrice} symbol={branding.currencySymbol} />
                    </td>
                    <td className="text-right">
                      <Money value={item.amount} symbol={branding.currencySymbol} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="ml-auto w-56 space-y-1" style={{ fontSize: 'inherit' }}>
              <div className="flex justify-between">
                <span>Subtotal</span>
                <Money value={data.invoice.subtotal} symbol={branding.currencySymbol} />
              </div>
              <div className="flex justify-between">
                <span>Discount</span>
                <Money value={data.invoice.discount} symbol={branding.currencySymbol} />
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <Money value={data.invoice.tax} symbol={branding.currencySymbol} />
              </div>
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <Money value={data.invoice.total} symbol={branding.currencySymbol} />
              </div>
              <div className="flex justify-between">
                <span>Paid</span>
                <Money value={data.invoice.paidAmount} symbol={branding.currencySymbol} />
              </div>
              {Number(data.invoice.refundedAmount) > 0 && (
                <div className="flex justify-between">
                  <span>Refunded</span>
                  <Money value={data.invoice.refundedAmount} symbol={branding.currencySymbol} />
                </div>
              )}
              <div className="flex justify-between">
                <span>Due</span>
                <Money value={data.invoice.dueAmount} symbol={branding.currencySymbol} />
              </div>
            </div>
            {data.payments?.[0] && (
              <p className="print-sub mt-3">Payment: {data.payments.map((p) => p.paymentMethod).join(', ')}</p>
            )}
            <SignatureBlock branding={branding} />
          </>
        )}

        {type === 'receipt' && data.payment && (
          <>
            <h2 className="print-heading font-semibold mb-2">Receipt {data.payment.receiptNumber}</h2>
            <p>Patient: {data.invoice?.patientId?.name}</p>
            <p>
              Amount: <Money value={data.payment.amount} symbol={branding.currencySymbol} />
            </p>
            <p className="capitalize">Method: {data.payment.paymentMethod?.replace('_', ' ')}</p>
            <p>
              Date:{' '}
              {data.payment.paymentDate && isValid(new Date(data.payment.paymentDate))
                ? format(new Date(data.payment.paymentDate), 'dd MMM yyyy p')
                : ''}
            </p>
            <SignatureBlock branding={branding} />
          </>
        )}

        {type === 'prescription' && data.prescription && (
          <>
            <h2 className="print-heading font-semibold mb-2">Prescription</h2>
            <p className="print-sub mb-1">
              Patient: {data.prescription.patientId?.name}{' '}
              {data.prescription.patientId?.age ? `· ${data.prescription.patientId.age} yrs` : ''}
            </p>
            <p className="print-sub mb-4">
              Doctor: {data.prescription.doctorId?.name} {data.prescription.doctorId?.qualification}
            </p>
            <ol className="list-decimal pl-5 space-y-2">
              {(data.prescription.items || []).map((m, i) => (
                <li key={i}>
                  <strong>{m.name}</strong> — {m.dosage} {m.frequency} {m.duration}
                  {m.instructions ? ` (${m.instructions})` : ''}
                </li>
              ))}
            </ol>
            {data.prescription.followUpInstructions && (
              <p className="mt-4">Follow-up: {data.prescription.followUpInstructions}</p>
            )}
            <SignatureBlock branding={branding} />
          </>
        )}

        {type === 'consultation' && data.consultation && (
          <>
            <h2 className="print-heading font-semibold mb-2">Consultation summary</h2>
            <p className="print-sub mb-3">
              {data.consultation.patientId?.name} · {data.consultation.doctorId?.name}
            </p>
            {['chiefComplaint', 'symptoms', 'observation', 'diagnosis', 'treatment', 'advice', 'followUp'].map((k) =>
              data.consultation[k] ? (
                <p key={k} className="mb-2">
                  <strong className="capitalize">{k.replace(/([A-Z])/g, ' $1')}: </strong>
                  {data.consultation[k]}
                </p>
              ) : null
            )}
            <SignatureBlock branding={branding} />
          </>
        )}

        {type === 'consent' && data.record && (
          <>
            <h2 className="print-heading font-semibold mb-2">{data.record.titleSnapshot}</h2>
            <p className="print-sub text-ink-faint mb-3">
              Version {data.record.version} · {data.record.status}
            </p>
            <div className="whitespace-pre-wrap mb-4">{data.record.bodySnapshot}</div>
            <p>Patient: {data.record.patientId?.name}</p>
            {data.record.signedAt && (
              <p>Signed: {format(new Date(data.record.signedAt), 'dd MMM yyyy p')}</p>
            )}
            {data.record.signatureDataUrl && (
              <img src={data.record.signatureDataUrl} alt="Signature" className="h-16 mt-3" />
            )}
          </>
        )}

        {type === 'queue_token' && data.ticket && (
          <div className="text-center py-8">
            <p className="uppercase tracking-widest print-sub">Token</p>
            <p className="text-5xl font-semibold my-4">#{data.ticket.tokenLabel}</p>
            <p className="print-sub">{data.ticket.roomLabel}</p>
          </div>
        )}

        {type === 'appointment_slip' && data.appointment && (
          <>
            <h2 className="print-heading font-semibold mb-2">Appointment slip</h2>
            <p>Patient: {data.appointment.patientId?.name}</p>
            <p>Doctor: {data.appointment.doctor?.name}</p>
            <p>
              {data.appointment.appointmentDate && isValid(new Date(data.appointment.appointmentDate))
                ? format(new Date(data.appointment.appointmentDate), 'EEEE, dd MMM yyyy')
                : ''}{' '}
              at {data.appointment.timeSlot}
            </p>
          </>
        )}

        <Footer branding={branding} />
      </article>
    </div>
  );
}
