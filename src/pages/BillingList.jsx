import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format, isValid } from 'date-fns';
import { Plus, Search } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import PageHeader from '../components/ui/PageHeader';
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

const FILTERS = ['all', 'unpaid', 'partially_paid', 'paid', 'refunded'];

export default function BillingList() {
  const { user } = useAuth();
  const { branchId } = useBranch();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('all');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

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
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Could not load invoices.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, branchId]);

  return (
    <div className="page-container">
      <PageHeader
        title="Billing"
        description="Create invoices and collect payments."
        actions={
          can(user, P.BILLING_MANAGE) && (
            <Link to={ROUTES.billingNew} className="btn-primary">
              <Plus className="w-4 h-4" /> New invoice
            </Link>
          )
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex flex-wrap gap-2 flex-1">
          {FILTERS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatus(key)}
              className={`tab-chip ${status === key ? 'bg-ink text-white' : 'bg-white text-ink-muted ring-1 ring-line'}`}
            >
              {key.replace('_', ' ')}
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
          <input className="input-field !pl-9" placeholder="Invoice number" value={q} onChange={(e) => setQ(e.target.value)} />
        </form>
      </div>

      {loading ? (
        <SkeletonRows count={PAGE_SIZE} />
      ) : rows.length === 0 ? (
        <EmptyState title="No invoices" description="Create a bill from a visit or the front desk." />
      ) : (
        <>
          <div className="hidden md:block card !p-0 overflow-hidden">
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
                  </tr>
                </thead>
                <tbody>
                  {rows.map((inv) => (
                    <tr key={inv._id} className="cursor-pointer" onClick={() => navigate(ROUTES.invoice(inv._id))}>
                      <td className="font-medium">{inv.invoiceNumber}</td>
                      <td>{inv.patientId?.name || '—'}</td>
                      <td>{inv.invoiceDate && isValid(new Date(inv.invoiceDate)) ? format(new Date(inv.invoiceDate), 'dd MMM yyyy') : '—'}</td>
                      <td><Money value={inv.total} /></td>
                      <td>
                        <Money value={inv.paidAmount} />
                        {Number(inv.refundedAmount) > 0 ? (
                          <p className="text-xs text-ink-muted">Refunded <Money value={inv.refundedAmount} /></p>
                        ) : null}
                      </td>
                      <td><Money value={inv.dueAmount} /></td>
                      <td><Badge value={inv.paymentStatus} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="md:hidden space-y-2">
            {rows.map((inv) => (
              <Link key={inv._id} to={ROUTES.invoice(inv._id)} className="card block !p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-ink">{inv.invoiceNumber}</p>
                    <p className="text-sm text-ink-muted">{inv.patientId?.name}</p>
                  </div>
                  <Badge value={inv.paymentStatus} />
                </div>
                <div className="mt-2 flex justify-between text-sm">
                  <span>Total <Money value={inv.total} /></span>
                  <span className="text-ink-muted">Due <Money value={inv.dueAmount} /></span>
                </div>
              </Link>
            ))}
          </div>
          <Pagination page={page} pages={pages} total={total} limit={PAGE_SIZE} onPage={load} />
        </>
      )}
    </div>
  );
}
