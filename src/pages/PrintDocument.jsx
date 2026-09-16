import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format, isValid } from 'date-fns';
import api from '../utils/api';
import Money from '../components/ui/Money';
import BackButton from '../components/ui/BackButton';
import PrintLetterhead from '../components/print/PrintLetterhead';
import { BRAND_NAME } from '../constants/branding';
import { useAuth } from '../context/AuthContext';
import { getDashboardPath } from '../constants/routes';

function SignatureBlock({ branding }) {
  const showLeft = Boolean(branding.showLeftSignature);
  const showRight = branding.showRightSignature !== false && branding.showSignature !== false;
  if (!showLeft && !showRight) return null;

  return (
    <div className="print-signatures mt-14 flex justify-between gap-8 text-[12px]">
      <div className="flex-1">
        {showLeft && (
          <div>
            {branding.signatureImage ? (
              <img src={branding.signatureImage} alt="" className="h-12 max-w-[160px] object-contain mb-1" />
            ) : null}
            <p className="whitespace-pre-wrap text-ink-muted">
              {branding.leftSignatureText || '_______________'}
            </p>
          </div>
        )}
      </div>
      <div className="flex-1 text-right">
        {showRight && (
          <div className="inline-block text-right">
            {branding.signatureImage ? (
              <img
                src={branding.signatureImage}
                alt=""
                className="h-12 max-w-[160px] object-contain mb-1 ml-auto"
              />
            ) : null}
            <p className="whitespace-pre-wrap text-ink-muted">
              {branding.rightSignatureText || branding.signatureLabel || 'Doctor signature'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function DocumentFooter({ branding }) {
  if (branding.includeFooter === false && !branding.showPoweredBy) return null;
  return (
    <div className="mt-6">
      <PrintLetterhead branding={branding} mode="document" section="footer" />
      {branding.showPoweredBy && (
        <p className="text-center text-[10px] text-ink-faint mt-3">Powered by {BRAND_NAME}</p>
      )}
    </div>
  );
}

export default function PrintDocument() {
  const { type: typeParam, id } = useParams();
  const type = typeParam || 'preview';
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    const url = type === 'preview' ? '/ops/print/preview' : `/ops/print/${type}/${id}`;
    api.get(url).then((res) => setData(res.data)).catch(() => setData({ error: true }));
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

  const leavePrint = () => {
    if (window.opener && !window.opener.closed) {
      window.close();
      return;
    }
    const idx = window.history.state?.idx;
    if (typeof idx === 'number' && idx > 0) {
      navigate(-1);
      return;
    }
    navigate(getDashboardPath(user?.role, user));
  };

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
        <BackButton to={getDashboardPath(user?.role, user)} />
        <button type="button" className="btn-primary" onClick={() => window.print()}>
          Print / Save PDF
        </button>
        <button type="button" className="btn-secondary" onClick={leavePrint}>
          Close
        </button>
      </div>
      <article className="print-sheet mx-auto max-w-[210mm]" style={sheetStyle}>
        <PrintLetterhead
          branding={branding}
          branch={data.invoice?.branchId || data.appointment?.branchId || data.ticket?.branchId}
          mode="document"
          section="header"
        />

        {type === 'preview' && data.preview && (
          <>
            <h2 className="print-heading font-semibold mb-2">{data.preview.title}</h2>
            <p className="print-sub mb-4">
              Patient: {data.preview.patientName} · Doctor: {data.preview.doctorName}
              {data.preview.dateLabel ? ` · ${data.preview.dateLabel}` : ''}
            </p>
            <div className="space-y-2 mb-6">
              {(data.preview.lines || []).map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
            <SignatureBlock branding={branding} />
          </>
        )}

        {type === 'invoice' && data.invoice && (
          <>
            <div className="flex items-baseline justify-between gap-3 mb-3 border-b border-line pb-2">
              <h2 className="print-heading font-semibold tracking-wide">
                INVOICE {data.invoice.invoiceNumber}
              </h2>
              <p className="print-sub text-ink-faint">
                {data.invoice.invoiceDate && isValid(new Date(data.invoice.invoiceDate))
                  ? format(new Date(data.invoice.invoiceDate), 'dd MMM yyyy')
                  : ''}
              </p>
            </div>
            <p className="print-sub mb-4">
              Patient: <strong>{data.invoice.patientId?.name}</strong>
              {data.invoice.doctorId?.name ? ` · Doctor: ${data.invoice.doctorId.name}` : ''}
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
            <div className="flex items-baseline justify-between gap-3 mb-3 border-b border-line pb-2">
              <h2 className="print-heading font-semibold tracking-wide">PRESCRIPTION</h2>
              <p className="print-sub text-ink-faint">
                {data.prescription.createdAt && isValid(new Date(data.prescription.createdAt))
                  ? format(new Date(data.prescription.createdAt), 'dd MMM yyyy')
                  : ''}
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-2 print-sub mb-4">
              <div>
                <p>
                  <span className="text-ink-faint">Patient: </span>
                  <strong>{data.prescription.patientId?.name}</strong>
                  {data.prescription.patientId?.age ? ` · ${data.prescription.patientId.age} yrs` : ''}
                </p>
                {data.prescription.patientId?.gender ? (
                  <p className="capitalize text-ink-muted">Gender: {data.prescription.patientId.gender}</p>
                ) : null}
              </div>
              <div className="sm:text-right">
                <p>
                  <span className="text-ink-faint">Doctor: </span>
                  <strong>{data.prescription.doctorId?.name}</strong>
                </p>
                <p className="text-ink-muted">
                  {[data.prescription.doctorId?.qualification, data.prescription.doctorId?.specialization]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>
            </div>
            <table className="w-full mb-4 text-sm">
              <thead>
                <tr className="border-b border-line text-left">
                  <th className="py-1.5 pr-2 w-8">#</th>
                  <th className="py-1.5 pr-2">Medicine</th>
                  <th className="py-1.5 pr-2">Dosage</th>
                  <th className="py-1.5 pr-2">Frequency</th>
                  <th className="py-1.5 pr-2">Duration</th>
                  <th className="py-1.5">Notes</th>
                </tr>
              </thead>
              <tbody>
                {(data.prescription.items || []).map((m, i) => (
                  <tr key={i} className="border-b border-line align-top">
                    <td className="py-2 pr-2 text-ink-faint">{i + 1}</td>
                    <td className="py-2 pr-2 font-medium">{m.name}</td>
                    <td className="py-2 pr-2">{m.dosage || '—'}</td>
                    <td className="py-2 pr-2">{m.frequency || '—'}</td>
                    <td className="py-2 pr-2">{m.duration || '—'}</td>
                    <td className="py-2 text-ink-muted">{m.instructions || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.prescription.followUpInstructions && (
              <p className="print-sub mb-2">
                <strong>Follow-up:</strong> {data.prescription.followUpInstructions}
              </p>
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

        <DocumentFooter branding={branding} />
      </article>
    </div>
  );
}
