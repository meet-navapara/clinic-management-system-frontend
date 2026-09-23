import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format, isValid } from 'date-fns';
import { Banknote, CreditCard, Download, Plus, Search, Smartphone, Wallet } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import EmptyState from '../components/ui/EmptyState';
import Pagination from '../components/ui/Pagination';
import Badge from '../components/ui/Badge';
import Money from '../components/ui/Money';
import { SkeletonRows } from '../components/ui/Skeleton';
import { ROUTES } from '../constants/routes';
import { can, P } from '../constants/permissions';
import { useAuth } from '../context/AuthContext';
import { useBranch } from '../context/BranchContext';
import { PAGE_SIZE } from '../constants/pagination';
import { fillMethodBreakdown } from '../constants/payments';
import { downloadInvoicePdf } from '../utils/downloadInvoice';
import ComingSoonPage from '../components/ui/ComingSoonPage';
import { BILLING_COMING_SOON } from '../constants/featureFlags';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'unpaid', label: 'Unpaid' },
  { id: 'partially_paid', label: 'Partial' },
  { id: 'paid', label: 'Paid' },
  { id: 'refunded', label: 'Refunded' },
  { id: 'cancelled', label: 'Cancelled' },
];

const METHOD_ICON = {
  cash: Banknote,
  upi: Smartphone,
  card: CreditCard,
  bank_transfer: Wallet,
  online: Wallet,
  other: Wallet,
};

export default function BillingList() {
  const { user } = useAuth();
  const { branchId, current } = useBranch();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('all');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [collections, setCollections] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  const handleDownload = async (e, inv) => {
    e.preventDefault();
    e.stopPropagation();
    if (!inv?._id || downloadingId) return;
    setDownloadingId(inv._id);
    try {
      await downloadInvoicePdf(inv._id);
      toast.success(`${inv.invoiceNumber || 'Invoice'} downloaded`);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Download failed.');
    } finally {
      setDownloadingId(null);
    }
  };

  const load = (p = page) => {
    setLoading(true);
    const params = { page: p, limit: PAGE_SIZE };
    if (status !== 'all') params.status = status;
    if (q.trim()) params.q = q.trim();
    api
      .get('/billing', { params })
      .then((res) => {
        setRows(res.data.invoices || []);
        setPages(res.data.pages || 1);
        setPage(res.data.page || 1);
        setTotal(res.data.total || 0);
        setCollections(res.data.collections || null);
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Could not load invoices.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (BILLING_COMING_SOON) {
      setLoading(false);
      return;
    }
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, branchId]);

  const methods = useMemo(
    () => fillMethodBreakdown(collections?.byMethod || []),
    [collections]
  );
  const highlight = methods.filter((m) => ['cash', 'upi', 'card'].includes(m.id));

  if (BILLING_COMING_SOON) {
    return (
      <ComingSoonPage
        title="Billing"
        description="Invoices and payments will open here soon. Your existing billing setup stays in place."
      />
    );
  }

  return (
    <div className="page-container">
      <section className="relative overflow-hidden rounded-[22px] mb-5 border border-[#e4e0d8] bg-gradient-to-br from-[#1c2430] via-[#243040] to-[#3d5a80] text-white shadow-[0_20px_50px_-28px_rgba(28,36,48,0.65)]">
        <div
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#c9a227]/25 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-white/10 blur-2xl"
          aria-hidden
        />
        <div className="relative p-5 sm:p-7">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
                Collections {collections?.label ? `· ${collections.label}` : '· Today'}
              </p>
              <h1 className="mt-2 text-[32px] sm:text-[40px] font-semibold tracking-tight leading-none">
                Billing
              </h1>
              <p className="mt-2 text-sm text-white/70 max-w-md">
                {current?.name
                  ? `${current.name} · invoices and payments for this branch`
                  : 'All branches · create bills and track cash, UPI, and card'}
              </p>
              <p className="mt-5 text-[13px] uppercase tracking-[0.14em] text-white/50">Net collected</p>
              <p className="mt-1 text-[40px] sm:text-[48px] font-semibold tabular-nums tracking-tight leading-none">
                <Money value={collections?.collected || 0} className="text-white" />
              </p>
              <p className="mt-2 text-sm text-white/60">
                {collections?.paymentCount || 0} payment
                {(collections?.paymentCount || 0) === 1 ? '' : 's'} ·{' '}
                <span className="text-[#f0d78c]">
                  <Money value={collections?.outstanding || 0} className="text-[#f0d78c]" /> outstanding
                </span>
              </p>
            </div>
            {can(user, P.BILLING_MANAGE) && (
              <Link
                to={ROUTES.billingNew}
                className="inline-flex items-center justify-center gap-2 min-h-11 px-5 rounded-[12px] bg-white text-[#1c2430] text-sm font-semibold hover:bg-[#f7f3ea] transition-colors"
              >
                <Plus className="w-4 h-4" /> New invoice
              </Link>
            )}
          </div>

          <div className="mt-7 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {highlight.map((m, idx) => {
              const Icon = METHOD_ICON[m.id] || Wallet;
              return (
                <div
                  key={m.id}
                  className="rounded-[16px] border border-white/10 bg-white/5 backdrop-blur-sm px-4 py-3.5"
                  style={{ animation: `fadeIn 0.45s ease ${idx * 80}ms both` }}
                >
                  <div className="flex items-center gap-2 text-white/65">
                    <Icon className="w-4 h-4" />
                    <span className="text-[12px] font-semibold uppercase tracking-[0.12em]">{m.short}</span>
                  </div>
                  <p className="mt-2 text-[26px] font-semibold tabular-nums tracking-tight leading-none">
                    <Money value={m.amount} className="text-white" />
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[12px] text-white/55">
            {methods
              .filter((m) => !['cash', 'upi', 'card'].includes(m.id))
              .map((m) => (
                <span key={m.id}>
                  {m.label}: <Money value={m.amount} className="text-white/80" />
                </span>
              ))}
          </div>
        </div>
      </section>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex flex-wrap gap-2 flex-1">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setStatus(item.id)}
              className={`tab-chip ${
                status === item.id ? 'bg-ink text-white' : 'bg-white text-ink-muted ring-1 ring-line'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <form
          className="relative sm:w-64"
          onSubmit={(e) => {
            e.preventDefault();
            load(1);
          }}
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" />
          <input
            className="input-field !pl-9"
            placeholder="Search invoice number"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </form>
      </div>

      {loading ? (
        <SkeletonRows count={PAGE_SIZE} />
      ) : rows.length === 0 ? (
        <EmptyState title="No invoices" description="Create a bill from a visit or the front desk." />
      ) : (
        <>
          <p className="text-xs text-ink-faint mb-2">
            {total} invoice{total === 1 ? '' : 's'}
            {pages > 1 ? ` · page ${page} of ${pages}` : ''}
          </p>
          <div className="hidden md:block overflow-hidden rounded-[18px] border border-[#e7e2d8] bg-white shadow-[0_12px_40px_-28px_rgba(28,36,48,0.35)]">
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Patient</th>
                    <th>Date</th>
                    <th>Total</th>
                    <th>Paid</th>
                    <th>Due</th>
                    <th>Status</th>
                    <th className="text-right">Invoice</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((inv) => (
                    <tr
                      key={inv._id}
                      className="cursor-pointer hover:bg-[#fbfaf7]"
                      onClick={() => navigate(ROUTES.invoice(inv._id))}
                    >
                      <td className="font-semibold text-ink">{inv.invoiceNumber}</td>
                      <td>{inv.patientId?.name || '—'}</td>
                      <td className="text-ink-muted">
                        {inv.invoiceDate && isValid(new Date(inv.invoiceDate))
                          ? format(new Date(inv.invoiceDate), 'dd MMM yyyy')
                          : '—'}
                      </td>
                      <td>
                        <Money value={inv.total} />
                      </td>
                      <td>
                        <Money value={inv.paidAmount} />
                        {Number(inv.refundedAmount) > 0 ? (
                          <p className="text-xs text-ink-muted">
                            Refunded <Money value={inv.refundedAmount} />
                          </p>
                        ) : null}
                      </td>
                      <td>
                        <Money
                          value={inv.dueAmount}
                          className={Number(inv.dueAmount) > 0 ? 'text-[#8a3a32] font-semibold' : ''}
                        />
                      </td>
                      <td>
                        <Badge value={inv.paymentStatus} />
                      </td>
                      <td className="text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={(e) => handleDownload(e, inv)}
                          disabled={downloadingId === inv._id}
                          className="inline-flex items-center gap-1.5 rounded-[10px] border border-[#e4e0d8] bg-[#fbfaf7] px-2.5 py-1.5 text-xs font-semibold text-ink hover:bg-white hover:border-[#1c2430]/40 transition-colors disabled:opacity-60"
                          title={`Download ${inv.invoiceNumber}`}
                        >
                          <Download className="w-3.5 h-3.5" />
                          {downloadingId === inv._id ? 'Saving…' : 'Download'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="md:hidden space-y-2">
            {rows.map((inv) => (
              <div
                key={inv._id}
                className="rounded-[16px] border border-[#e7e2d8] bg-white p-4 shadow-[0_8px_24px_-20px_rgba(28,36,48,0.4)]"
              >
                <Link to={ROUTES.invoice(inv._id)} className="block">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-ink">{inv.invoiceNumber}</p>
                      <p className="text-sm text-ink-muted">{inv.patientId?.name}</p>
                    </div>
                    <Badge value={inv.paymentStatus} />
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-ink-faint">Total</p>
                      <Money value={inv.total} className="font-semibold" />
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-ink-faint">Paid</p>
                      <Money value={inv.paidAmount} />
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-ink-faint">Due</p>
                      <Money
                        value={inv.dueAmount}
                        className={Number(inv.dueAmount) > 0 ? 'font-semibold text-[#8a3a32]' : ''}
                      />
                    </div>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={(e) => handleDownload(e, inv)}
                  disabled={downloadingId === inv._id}
                  className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-[12px] border border-[#e4e0d8] bg-[#fbfaf7] px-3 py-2.5 text-sm font-semibold text-ink disabled:opacity-60"
                >
                  <Download className="w-4 h-4" />
                  {downloadingId === inv._id ? 'Saving…' : 'Download invoice'}
                </button>
              </div>
            ))}
          </div>
          <Pagination page={page} pages={pages} total={total} limit={PAGE_SIZE} onPage={load} />
        </>
      )}
    </div>
  );
}
