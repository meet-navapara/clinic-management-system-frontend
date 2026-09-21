import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { format, isValid } from 'date-fns';
import { Banknote, CreditCard, Download, Printer, Smartphone, Wallet } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import Badge from '../components/ui/Badge';
import Money from '../components/ui/Money';
import Modal from '../components/ui/Modal';
import { SkeletonDetail } from '../components/ui/Skeleton';
import LoadingOverlay from '../components/ui/LoadingOverlay';
import { ROUTES } from '../constants/routes';
import { can, P } from '../constants/permissions';
import { useAuth } from '../context/AuthContext';
import RequiredMark from '../components/ui/RequiredMark';
import { PAYMENT_METHODS, paymentMethodLabel } from '../constants/payments';
import { downloadInvoicePdf } from '../utils/downloadInvoice';

const METHOD_ICON = {
  cash: Banknote,
  upi: Smartphone,
  card: CreditCard,
  bank_transfer: Wallet,
  online: Wallet,
  other: Wallet,
};

export default function InvoiceDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [invoice, setInvoice] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payOpen, setPayOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('cash');
  const [ref, setRef] = useState('');
  const [busy, setBusy] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    return api
      .get(`/billing/${id}`)
      .then((res) => {
        setInvoice(res.data.invoice);
        setPayments(res.data.payments || []);
        setAmount(String(res.data.invoice?.dueAmount || ''));
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Invoice not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  const refresh = useCallback(() => {
    api
      .get(`/billing/${id}`)
      .then((res) => {
        setInvoice(res.data.invoice);
        setPayments(res.data.payments || []);
        setAmount(String(res.data.invoice?.dueAmount || ''));
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Invoice not found.'));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const paidByMethod = useMemo(() => {
    const map = {};
    for (const p of payments) {
      if (p.status !== 'completed') continue;
      const key = p.paymentMethod || 'other';
      map[key] = (map[key] || 0) + Number(p.amount || 0);
    }
    return PAYMENT_METHODS.map((m) => ({
      ...m,
      amount: Math.round((map[m.id] || 0) * 100) / 100,
    })).filter((m) => m.amount > 0);
  }, [payments]);

  const collect = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post(`/billing/${id}/payments`, {
        amount: Number(amount),
        paymentMethod: method,
        transactionReference: ref,
      });
      toast.success('Payment recorded.');
      setPayOpen(false);
      setRef('');
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed.');
    } finally {
      setBusy(false);
    }
  };

  const refund = async () => {
    if (!window.confirm('Refund the paid amount?')) return;
    setBusy(true);
    try {
      await api.post(`/billing/${id}/refund`, {});
      toast.success('Refund recorded.');
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Refund failed.');
    } finally {
      setBusy(false);
    }
  };

  const cancelInvoice = async () => {
    if (!window.confirm('Cancel this unpaid invoice?')) return;
    setBusy(true);
    try {
      await api.post(`/billing/${id}/cancel`);
      toast.success('Invoice cancelled.');
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cancel failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      await downloadInvoicePdf(id);
      toast.success(`${invoice?.invoiceNumber || 'Invoice'} downloaded`);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Download failed.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return <SkeletonDetail />;
  }
  if (!invoice) return null;

  const due = Number(invoice.dueAmount) || 0;
  const paid = Number(invoice.paidAmount) || 0;
  const total = Number(invoice.total) || 0;
  const progress = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;

  return (
    <div className="page-container relative">
      <LoadingOverlay show={busy} message="Processing…" />

      <section className="relative overflow-hidden rounded-[22px] mb-5 border border-[#e4e0d8] bg-gradient-to-br from-[#1c2430] via-[#243040] to-[#3d5a80] text-white shadow-[0_20px_50px_-28px_rgba(28,36,48,0.65)]">
        <div
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#c9a227]/25 blur-3xl"
          aria-hidden
        />
        <div className="relative p-5 sm:p-7">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">Invoice</p>
              <h1 className="mt-2 text-[28px] sm:text-[36px] font-semibold tracking-tight leading-none">
                {invoice.invoiceNumber}
              </h1>
              <p className="mt-2 text-sm text-white/70">
                {invoice.patientId?.name || 'Patient'}
                {invoice.invoiceDate && isValid(new Date(invoice.invoiceDate))
                  ? ` · ${format(new Date(invoice.invoiceDate), 'dd MMM yyyy')}`
                  : ''}
              </p>
              <div className="mt-4">
                <Badge value={invoice.paymentStatus} />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleDownload}
                disabled={downloading}
                className="inline-flex items-center justify-center gap-2 min-h-10 px-4 rounded-[12px] bg-white text-[#1c2430] text-sm font-semibold hover:bg-[#f7f3ea] disabled:opacity-60"
              >
                <Download className="w-4 h-4" />
                {downloading ? 'Saving…' : 'Download PDF'}
              </button>
              <Link
                to={ROUTES.print('invoice', invoice._id)}
                className="inline-flex items-center justify-center gap-2 min-h-10 px-4 rounded-[12px] border border-white/20 bg-white/10 text-sm font-semibold text-white hover:bg-white/15"
                target="_blank"
                rel="noreferrer"
              >
                <Printer className="w-4 h-4" /> Print
              </Link>
              {can(user, P.BILLING_MANAGE) && due > 0 && invoice.paymentStatus !== 'cancelled' && (
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 min-h-10 px-4 rounded-[12px] border border-white/25 bg-[#c9a227] text-[#1c2430] text-sm font-semibold hover:bg-[#d4b03a]"
                  onClick={() => {
                    setAmount(String(due));
                    setPayOpen(true);
                  }}
                >
                  Collect payment
                </button>
              )}
              {can(user, P.BILLING_MANAGE) && paid > 0 && invoice.paymentStatus !== 'refunded' && (
                <button
                  type="button"
                  className="inline-flex items-center justify-center min-h-10 px-4 rounded-[12px] border border-rose-300/40 bg-rose-500/15 text-sm font-semibold text-[#ffd4d0] hover:bg-rose-500/25"
                  onClick={refund}
                  disabled={busy}
                >
                  Refund
                </button>
              )}
              {can(user, P.BILLING_MANAGE) &&
                paid <= 0 &&
                invoice.paymentStatus !== 'cancelled' && (
                  <button
                    type="button"
                    className="inline-flex items-center justify-center min-h-10 px-4 rounded-[12px] border border-white/20 bg-white/5 text-sm font-semibold text-white/80 hover:bg-white/10"
                    onClick={cancelInvoice}
                    disabled={busy}
                  >
                    Cancel
                  </button>
                )}
            </div>
          </div>

          <div className="mt-7 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total', value: total },
              { label: 'Paid', value: paid },
              { label: 'Due', value: due, accent: due > 0 },
              { label: 'Refunded', value: Number(invoice.refundedAmount) || 0 },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-[16px] border border-white/10 bg-white/5 backdrop-blur-sm px-4 py-3.5"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/55">{s.label}</p>
                <p
                  className={`mt-2 text-[24px] font-semibold tabular-nums tracking-tight leading-none ${
                    s.accent ? 'text-[#f0d78c]' : 'text-white'
                  }`}
                >
                  <Money value={s.value} className={s.accent ? 'text-[#f0d78c]' : 'text-white'} />
                </p>
              </div>
            ))}
          </div>

          <div className="mt-5">
            <div className="flex justify-between text-[12px] text-white/55 mb-1.5">
              <span>Collection progress</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#c9a227] to-[#e8d48b] transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {paidByMethod.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-3">
              {paidByMethod.map((m) => {
                const Icon = METHOD_ICON[m.id] || Wallet;
                return (
                  <div
                    key={m.id}
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-sm"
                  >
                    <Icon className="w-3.5 h-3.5 text-white/70" />
                    <span className="text-white/65">{m.short}</span>
                    <Money value={m.amount} className="text-white font-semibold" />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-[18px] border border-[#e7e2d8] bg-white p-5 shadow-[0_12px_40px_-28px_rgba(28,36,48,0.35)] space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">Line items</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ink-faint">
                  <th className="py-2 font-medium">Item</th>
                  <th className="font-medium">Qty</th>
                  <th className="font-medium">Price</th>
                  <th className="font-medium">Amt</th>
                </tr>
              </thead>
              <tbody>
                {(invoice.items || []).map((item, i) => (
                  <tr key={item._id || i} className="border-t border-line">
                    <td className="py-2.5">
                      <p className="font-medium text-ink">{item.name}</p>
                      <p className="text-xs text-ink-faint capitalize">{item.type?.replace('_', ' ')}</p>
                    </td>
                    <td>{item.quantity}</td>
                    <td>
                      <Money value={item.unitPrice} />
                    </td>
                    <td>
                      <Money value={item.amount} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-line pt-3 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-muted">Subtotal</span>
              <Money value={invoice.subtotal} />
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">Discount</span>
              <Money value={invoice.discount} />
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">Tax</span>
              <Money value={invoice.tax} />
            </div>
            <div className="flex justify-between font-semibold text-base pt-1">
              <span>Total</span>
              <Money value={invoice.total} />
            </div>
          </div>
        </div>

        <div className="rounded-[18px] border border-[#e7e2d8] bg-white p-5 shadow-[0_12px_40px_-28px_rgba(28,36,48,0.35)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint mb-4">Payment history</p>
          {!payments.length && <p className="text-sm text-ink-muted">No payments yet.</p>}
          <ul className="space-y-3">
            {payments.map((p) => {
              const Icon = METHOD_ICON[p.paymentMethod] || Wallet;
              return (
                <li
                  key={p._id}
                  className="rounded-[14px] border border-[#eee9df] bg-[#fbfaf7] p-3"
                >
                  <div className="flex justify-between gap-2 items-start">
                    <div>
                      <p className="font-semibold text-ink">
                        <Money value={p.amount} />
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-muted">
                        <Icon className="w-3.5 h-3.5" />
                        {paymentMethodLabel(p.paymentMethod)}
                      </p>
                    </div>
                    <Badge value={p.status} />
                  </div>
                  <p className="mt-2 text-xs text-ink-faint">
                    {p.receiptNumber || '—'}
                    {p.paymentDate && isValid(new Date(p.paymentDate))
                      ? ` · ${format(new Date(p.paymentDate), 'dd MMM yyyy, HH:mm')}`
                      : ''}
                  </p>
                  {p.transactionReference ? (
                    <p className="mt-1 text-xs text-ink-muted">Ref: {p.transactionReference}</p>
                  ) : null}
                  {p.status === 'completed' && (
                    <Link
                      to={ROUTES.print('receipt', p._id)}
                      className="mt-2 inline-block text-xs text-accent-700 font-semibold"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Print receipt
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <Modal open={payOpen} title="Collect payment" onClose={() => setPayOpen(false)}>
        <form onSubmit={collect} className="space-y-4">
          <div>
            <label className="label-field">
              Amount <RequiredMark />
            </label>
            <input
              className="input-field text-lg font-semibold tabular-nums"
              type="number"
              min="0.01"
              step="0.01"
              max={due || undefined}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            <p className="mt-1 text-xs text-ink-faint">
              Due <Money value={due} />
            </p>
          </div>

          <div>
            <label className="label-field">
              Method <RequiredMark />
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PAYMENT_METHODS.map((m) => {
                const Icon = METHOD_ICON[m.id] || Wallet;
                const active = method === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMethod(m.id)}
                    className={`flex items-center gap-2 rounded-[12px] border px-3 py-2.5 text-sm font-medium transition-colors ${
                      active
                        ? 'border-[#1c2430] bg-[#1c2430] text-white'
                        : 'border-[#e4e0d8] bg-white text-ink hover:bg-[#fbfaf7]'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {m.short}
                  </button>
                );
              })}
            </div>
          </div>

          {(method === 'upi' || method === 'card' || method === 'bank_transfer' || method === 'online') && (
            <div>
              <label className="label-field">Transaction reference</label>
              <input
                className="input-field"
                placeholder={method === 'upi' ? 'UPI ref / UTR' : 'Txn / auth code'}
                value={ref}
                onChange={(e) => setRef(e.target.value)}
              />
            </div>
          )}

          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {busy ? 'Saving…' : `Record ${paymentMethodLabel(method)} payment`}
          </button>
        </form>
      </Modal>
    </div>
  );
}
