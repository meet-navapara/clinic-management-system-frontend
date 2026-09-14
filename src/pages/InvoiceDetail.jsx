import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { format, isValid } from 'date-fns';
import { Printer } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import PageHeader from '../components/ui/PageHeader';
import Badge from '../components/ui/Badge';
import Money from '../components/ui/Money';
import Modal from '../components/ui/Modal';
import Dropdown from '../components/ui/Dropdown';
import { Skeleton } from '../components/ui/Skeleton';
import { ROUTES } from '../constants/routes';
import { can, P } from '../constants/permissions';
import { useAuth } from '../context/AuthContext';
import RequiredMark from '../components/ui/RequiredMark';

const METHODS = ['cash', 'upi', 'card', 'bank_transfer', 'online', 'other'];

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

  const load = useCallback(() => {
    api
      .get(`/billing/${id}`)
      .then((res) => {
        setInvoice(res.data.invoice);
        setPayments(res.data.payments || []);
        setAmount(String(res.data.invoice?.dueAmount || ''));
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Invoice not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const collect = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post(`/billing/${id}/payments`, { amount: Number(amount), paymentMethod: method, transactionReference: ref });
      toast.success('Payment recorded.');
      setPayOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed.');
    } finally {
      setBusy(false);
    }
  };

  const refund = async () => {
    if (!window.confirm('Refund the paid amount and reverse inventory if applicable?')) return;
    setBusy(true);
    try {
      await api.post(`/billing/${id}/refund`, { reverseStock: true });
      toast.success('Refund recorded.');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Refund failed.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40" />
      </div>
    );
  }
  if (!invoice) return null;

  return (
    <div className="page-container">
      <PageHeader
        title={invoice.invoiceNumber}
        description={invoice.patientId?.name}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link to={ROUTES.print('invoice', invoice._id)} className="btn-secondary" target="_blank" rel="noreferrer">
              <Printer className="w-4 h-4" /> Print / PDF
            </Link>
            {can(user, P.BILLING_MANAGE) && invoice.dueAmount > 0 && invoice.paymentStatus !== 'cancelled' && (
              <button type="button" className="btn-primary" onClick={() => setPayOpen(true)}>
                Collect payment
              </button>
            )}
            {can(user, P.BILLING_MANAGE) && invoice.paidAmount > 0 && invoice.paymentStatus !== 'refunded' && (
              <button type="button" className="btn-danger" onClick={refund} disabled={busy}>
                Refund
              </button>
            )}
          </div>
        }
      />

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card space-y-3">
          <div className="flex justify-between gap-2">
            <Badge value={invoice.paymentStatus} />
            <span className="text-sm text-ink-muted">
              {invoice.invoiceDate && isValid(new Date(invoice.invoiceDate)) ? format(new Date(invoice.invoiceDate), 'dd MMM yyyy') : ''}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ink-faint">
                  <th className="py-2">Item</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Amt</th>
                </tr>
              </thead>
              <tbody>
                {(invoice.items || []).map((item, i) => (
                  <tr key={item._id || i} className="border-t border-line">
                    <td className="py-2">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-ink-faint capitalize">{item.type?.replace('_', ' ')}</p>
                    </td>
                    <td>{item.quantity}</td>
                    <td><Money value={item.unitPrice} /></td>
                    <td><Money value={item.amount} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-line pt-3 space-y-1 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><Money value={invoice.subtotal} /></div>
            <div className="flex justify-between"><span>Discount</span><Money value={invoice.discount} /></div>
            <div className="flex justify-between"><span>Tax</span><Money value={invoice.tax} /></div>
            <div className="flex justify-between font-semibold text-base"><span>Total</span><Money value={invoice.total} /></div>
            <div className="flex justify-between"><span>Paid</span><Money value={invoice.paidAmount} /></div>
            {Number(invoice.refundedAmount) > 0 && (
              <div className="flex justify-between text-ink-muted"><span>Refunded</span><Money value={invoice.refundedAmount} /></div>
            )}
            <div className="flex justify-between"><span>Due</span><Money value={invoice.dueAmount} /></div>
          </div>
        </div>
        <div className="card">
          <p className="section-label mb-3">Payments</p>
          {!payments.length && <p className="text-sm text-ink-muted">No payments yet.</p>}
          <ul className="space-y-3">
            {payments.map((p) => (
              <li key={p._id} className="text-sm">
                <div className="flex justify-between">
                  <span className="font-medium"><Money value={p.amount} /></span>
                  <Badge value={p.status} />
                </div>
                <p className="text-ink-muted capitalize">{p.paymentMethod?.replace('_', ' ')} · {p.receiptNumber}</p>
                {p.status === 'completed' && (
                  <Link to={ROUTES.print('receipt', p._id)} className="text-xs text-accent-700 font-semibold" target="_blank" rel="noreferrer">
                    Print receipt
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <Modal open={payOpen} title="Collect payment" onClose={() => setPayOpen(false)}>
        <form onSubmit={collect} className="space-y-3">
          <label className="label-field">Amount <RequiredMark /></label>
          <input className="input-field" type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          <label className="label-field">Method <RequiredMark /></label>
          <Dropdown
            value={method}
            onChange={setMethod}
            ariaLabel="Payment method"
            options={METHODS.map((m) => ({ value: m, label: m.replace('_', ' ') }))}
          />
          <input className="input-field" placeholder="UPI / txn reference" value={ref} onChange={(e) => setRef(e.target.value)} />
          <button type="submit" className="btn-primary w-full" disabled={busy}>{busy ? 'Saving…' : 'Record payment'}</button>
        </form>
      </Modal>
    </div>
  );
}
