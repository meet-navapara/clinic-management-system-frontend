import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format, isValid } from 'date-fns';
import api from '../utils/api';
import Money from '../components/ui/Money';
import BackButton from '../components/ui/BackButton';
import { useAuth } from '../context/AuthContext';
import { getDashboardPath } from '../constants/routes';

function BrandHeader({ branding, branch }) {
  return (
    <header className="print-header flex gap-4 items-start border-b border-line pb-3 mb-4">
      {branding.logo ? <img src={branding.logo} alt="" className="h-14 w-auto object-contain" /> : null}
      <div>
        <h1 className="text-xl font-semibold">{branding.clinicName}</h1>
        {branding.headerText && <p className="text-sm">{branding.headerText}</p>}
        <p className="text-sm text-ink-muted">{branch?.address || branding.address}</p>
        <p className="text-sm text-ink-muted">
          {branding.phone} {branding.email} {branding.website}
        </p>
        {(branding.registrationNumber || branding.gstNumber) && (
          <p className="text-xs text-ink-faint">
            {branding.registrationNumber && `Reg. ${branding.registrationNumber} `}
            {branding.gstNumber && `${branding.taxLabel || 'GST'} ${branding.gstNumber}`}
          </p>
        )}
      </div>
    </header>
  );
}

function Footer({ branding }) {
  return (
    <footer className="print-footer mt-8 pt-3 border-t border-line text-xs text-ink-muted">
      {branding.terms && <p className="mb-2 whitespace-pre-wrap">{branding.terms}</p>}
      <p>{branding.footerText}</p>
    </footer>
  );
}

export default function PrintDocument() {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get(`/ops/print/${type}/${id}`).then((res) => setData(res.data)).catch(() => setData({ error: true }));
  }, [type, id]);

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
  const paper = branding.paperSize === 'receipt' ? 'print-receipt' : branding.paperSize === 'A5' ? 'print-a5' : 'print-a4';

  return (
    <div className={`print-root ${paper} bg-white min-h-dvh text-ink`}>
      <div className="print-toolbar no-print sticky top-0 z-10 bg-canvas border-b border-line px-4 py-2 flex items-center gap-2">
        <BackButton to={getDashboardPath(user?.role, user)} />
        <button type="button" className="btn-primary" onClick={() => window.print()}>Print / Save PDF</button>
        <button type="button" className="btn-secondary" onClick={leavePrint}>Close</button>
      </div>
      <article className="print-sheet mx-auto p-6 max-w-[210mm]">
        <BrandHeader branding={branding} branch={data.invoice?.branchId || data.appointment?.branchId} />

        {type === 'invoice' && data.invoice && (
          <>
            <h2 className="text-lg font-semibold mb-2">Invoice {data.invoice.invoiceNumber}</h2>
            <p className="text-sm mb-4">
              Patient: {data.invoice.patientId?.name} · Doctor: {data.invoice.doctorId?.name}
              {data.invoice.invoiceDate && isValid(new Date(data.invoice.invoiceDate))
                ? ` · ${format(new Date(data.invoice.invoiceDate), 'dd MMM yyyy')}`
                : ''}
            </p>
            <table className="w-full text-sm mb-4">
              <thead>
                <tr className="border-b"><th className="text-left py-1">Item</th><th>Qty</th><th>Price</th><th>Amt</th></tr>
              </thead>
              <tbody>
                {(data.invoice.items || []).map((item, i) => (
                  <tr key={i} className="border-b border-line">
                    <td className="py-1">{item.name}</td>
                    <td className="text-center">{item.quantity}</td>
                    <td className="text-right"><Money value={item.unitPrice} symbol={branding.currencySymbol} /></td>
                    <td className="text-right"><Money value={item.amount} symbol={branding.currencySymbol} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="ml-auto w-56 text-sm space-y-1">
              <div className="flex justify-between"><span>Subtotal</span><Money value={data.invoice.subtotal} symbol={branding.currencySymbol} /></div>
              <div className="flex justify-between"><span>Discount</span><Money value={data.invoice.discount} symbol={branding.currencySymbol} /></div>
              <div className="flex justify-between"><span>Tax</span><Money value={data.invoice.tax} symbol={branding.currencySymbol} /></div>
              <div className="flex justify-between font-semibold"><span>Total</span><Money value={data.invoice.total} symbol={branding.currencySymbol} /></div>
              <div className="flex justify-between"><span>Paid</span><Money value={data.invoice.paidAmount} symbol={branding.currencySymbol} /></div>
              {Number(data.invoice.refundedAmount) > 0 && (
                <div className="flex justify-between"><span>Refunded</span><Money value={data.invoice.refundedAmount} symbol={branding.currencySymbol} /></div>
              )}
              <div className="flex justify-between"><span>Due</span><Money value={data.invoice.dueAmount} symbol={branding.currencySymbol} /></div>
            </div>
            {data.payments?.[0] && <p className="text-sm mt-3">Payment: {data.payments.map((p) => p.paymentMethod).join(', ')}</p>}
            {branding.showSignature && <p className="mt-12 text-sm">{branding.signatureLabel}<br />_______________</p>}
          </>
        )}

        {type === 'receipt' && data.payment && (
          <>
            <h2 className="text-lg font-semibold mb-2">Receipt {data.payment.receiptNumber}</h2>
            <p className="text-sm">Patient: {data.invoice?.patientId?.name}</p>
            <p className="text-sm">Amount: <Money value={data.payment.amount} symbol={branding.currencySymbol} /></p>
            <p className="text-sm capitalize">Method: {data.payment.paymentMethod?.replace('_', ' ')}</p>
            <p className="text-sm">Date: {data.payment.paymentDate && isValid(new Date(data.payment.paymentDate)) ? format(new Date(data.payment.paymentDate), 'dd MMM yyyy p') : ''}</p>
            {branding.showSignature && <p className="mt-12 text-sm">Received by<br />_______________</p>}
          </>
        )}

        {type === 'prescription' && data.prescription && (
          <>
            <h2 className="text-lg font-semibold mb-2">Prescription</h2>
            <p className="text-sm mb-1">Patient: {data.prescription.patientId?.name} {data.prescription.patientId?.age ? `· ${data.prescription.patientId.age} yrs` : ''}</p>
            <p className="text-sm mb-4">Doctor: {data.prescription.doctorId?.name} {data.prescription.doctorId?.qualification}</p>
            <ol className="list-decimal pl-5 text-sm space-y-2">
              {(data.prescription.items || []).map((m, i) => (
                <li key={i}>
                  <strong>{m.name}</strong> — {m.dosage} {m.frequency} {m.duration}
                  {m.instructions ? ` (${m.instructions})` : ''}
                </li>
              ))}
            </ol>
            {data.prescription.followUpInstructions && <p className="text-sm mt-4">Follow-up: {data.prescription.followUpInstructions}</p>}
            {branding.showSignature && <p className="mt-12 text-sm">{branding.signatureLabel}<br />_______________</p>}
          </>
        )}

        {type === 'consultation' && data.consultation && (
          <>
            <h2 className="text-lg font-semibold mb-2">Consultation summary</h2>
            <p className="text-sm mb-3">{data.consultation.patientId?.name} · {data.consultation.doctorId?.name}</p>
            {['chiefComplaint', 'symptoms', 'observation', 'diagnosis', 'treatment', 'advice', 'followUp'].map((k) =>
              data.consultation[k] ? (
                <p key={k} className="text-sm mb-2">
                  <strong className="capitalize">{k.replace(/([A-Z])/g, ' $1')}: </strong>
                  {data.consultation[k]}
                </p>
              ) : null
            )}
            {branding.showSignature && <p className="mt-12 text-sm">{branding.signatureLabel}<br />_______________</p>}
          </>
        )}

        {type === 'consent' && data.record && (
          <>
            <h2 className="text-lg font-semibold mb-2">{data.record.titleSnapshot}</h2>
            <p className="text-xs text-ink-faint mb-3">Version {data.record.version} · {data.record.status}</p>
            <div className="text-sm whitespace-pre-wrap mb-4">{data.record.bodySnapshot}</div>
            <p className="text-sm">Patient: {data.record.patientId?.name}</p>
            {data.record.signedAt && <p className="text-sm">Signed: {format(new Date(data.record.signedAt), 'dd MMM yyyy p')}</p>}
            {data.record.signatureDataUrl && <img src={data.record.signatureDataUrl} alt="Signature" className="h-16 mt-3" />}
          </>
        )}

        {type === 'queue_token' && data.ticket && (
          <div className="text-center py-8">
            <p className="text-sm uppercase tracking-widest">Token</p>
            <p className="text-5xl font-semibold my-4">#{data.ticket.tokenLabel}</p>
            <p className="text-sm">{data.ticket.roomLabel}</p>
          </div>
        )}

        {type === 'appointment_slip' && data.appointment && (
          <>
            <h2 className="text-lg font-semibold mb-2">Appointment slip</h2>
            <p className="text-sm">Patient: {data.appointment.patientId?.name}</p>
            <p className="text-sm">Doctor: {data.appointment.doctor?.name}</p>
            <p className="text-sm">
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
