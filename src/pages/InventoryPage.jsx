import { useEffect, useState } from 'react';
import { format, isValid } from 'date-fns';
import api from '../utils/api';
import toast from 'react-hot-toast';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import Dropdown from '../components/ui/Dropdown';
import { can, P } from '../constants/permissions';
import { useAuth } from '../context/AuthContext';
import { useBranch } from '../context/BranchContext';
import RequiredMark from '../components/ui/RequiredMark';
import Pagination from '../components/ui/Pagination';
import { SkeletonCards, SkeletonRows } from '../components/ui/Skeleton';
import LoadingOverlay from '../components/ui/LoadingOverlay';
import { PAGE_SIZE } from '../constants/pagination';


const EMPTY_STOCK = {
  medicineId: '',
  batchNumber: '',
  quantity: '',
  purchasePrice: '',
  expiryDate: '',
  supplier: '',
};

export default function InventoryPage() {
  const { user } = useAuth();
  const { branchId } = useBranch();
  const [summary, setSummary] = useState(null);
  const [lots, setLots] = useState([]);
  const [lotPage, setLotPage] = useState(1);
  const [lotPages, setLotPages] = useState(1);
  const [lotTotal, setLotTotal] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [txPage, setTxPage] = useState(1);
  const [txPages, setTxPages] = useState(1);
  const [txTotal, setTxTotal] = useState(0);
  const [open, setOpen] = useState(false);
  const [adjustLot, setAdjustLot] = useState(null);
  const [adjustForm, setAdjustForm] = useState({ quantity: '', reason: '', type: 'adjustment' });
  const [meds, setMeds] = useState([]);
  const [form, setForm] = useState(EMPTY_STOCK);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const canManage = can(user, P.INVENTORY_MANAGE);

  const loadSummary = () =>
    api
      .get('/inventory/summary')
      .then((res) => setSummary(res.data.summary))
      .catch((err) => toast.error(err.response?.data?.message || 'Could not load inventory summary.'));

  const loadLots = (p = 1) =>
    api
      .get('/inventory/lots', { params: { page: p, limit: PAGE_SIZE } })
      .then((res) => {
        setLots(res.data.lots || []);
        setLotPage(res.data.page || p);
        setLotPages(res.data.pages || 1);
        setLotTotal(res.data.total || 0);
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Could not load lots.'));

  const loadTransactions = (p = 1) =>
    api
      .get('/inventory/transactions', { params: { page: p, limit: PAGE_SIZE } })
      .then((res) => {
        setTransactions(res.data.transactions || []);
        setTxPage(res.data.page || p);
        setTxPages(res.data.pages || 1);
        setTxTotal(res.data.total || 0);
      })
      .catch(() => setTransactions([]));

  const load = (showLoader = false) => {
    if (showLoader) setLoading(true);
    Promise.all([loadSummary(), loadLots(1), loadTransactions(1)]).finally(() => setLoading(false));
  };
  useEffect(() => {
    load(true);
  }, [branchId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return;
    api
      .get('/medicines', { params: { limit: 100 } })
      .then((res) => setMeds(res.data.medicines || []))
      .catch((err) => toast.error(err.response?.data?.message || 'Could not load medicines.'));
  }, [open]);

  const stockIn = async (e) => {
    e.preventDefault();
    if (!branchId) return toast.error('Select a specific branch first (not All branches).');
    setSaving(true);
    try {
      await api.post('/inventory/stock-in', form);
      toast.success('Stock added.');
      setOpen(false);
      setForm(EMPTY_STOCK);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Stock in failed.');
    } finally {
      setSaving(false);
    }
  };

  const openAdjust = (lot) => {
    setAdjustLot(lot);
    setAdjustForm({ quantity: '', reason: '', type: 'adjustment' });
  };

  const submitAdjust = async (e) => {
    e.preventDefault();
    if (!adjustLot) return;
    setSaving(true);
    try {
      await api.post('/inventory/adjust', {
        lotId: adjustLot._id,
        quantity: Number(adjustForm.quantity),
        reason: adjustForm.reason || 'Manual adjustment',
        type: adjustForm.type,
      });
      toast.success('Stock adjusted.');
      setAdjustLot(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Adjust failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container relative">
      <LoadingOverlay show={saving} message="Saving…" />
      <PageHeader
        title="Inventory"
        description="Branch-wise medicine stock, batches and expiry."
        actions={
          canManage && (
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                setForm(EMPTY_STOCK);
                setOpen(true);
              }}
            >
              Stock in
            </button>
          )
        }
      />
      {loading ? (
        <>
          <SkeletonCards count={4} className="mb-5" />
          <SkeletonRows count={PAGE_SIZE} />
        </>
      ) : (
        <>
      <div className="stat-grid mb-5">
        <div className="card !p-4">
          <p className="section-label">SKUs</p>
          <p className="text-2xl font-semibold mt-1">{summary?.skuCount ?? '—'}</p>
        </div>
        <div className="card !p-4">
          <p className="section-label">Units</p>
          <p className="text-2xl font-semibold mt-1">{summary?.units ?? '—'}</p>
        </div>
        <div className="card !p-4">
          <p className="section-label">Low stock</p>
          <p className="text-2xl font-semibold mt-1">{summary?.lowStock?.length ?? 0}</p>
        </div>
        <div className="card !p-4">
          <p className="section-label">Expiring</p>
          <p className="text-2xl font-semibold mt-1">{summary?.expiring?.length ?? 0}</p>
        </div>
      </div>

      {!!summary?.lowStock?.length && (
        <section className="mb-5">
          <h3 className="text-sm font-semibold mb-2">Low stock</h3>
          <div className="card space-y-2">
            {summary.lowStock.map((m) => (
              <p key={m.medicineId} className="text-sm">
                {m.name} — remaining {m.remaining} (min {m.minimum})
              </p>
            ))}
          </div>
        </section>
      )}

      <h3 className="text-sm font-semibold mb-2">Lots</h3>
      {!lots.length ? (
        <EmptyState title="No lots" description="Add stock for a branch." />
      ) : (
        <div className="space-y-2 mb-2">
          {lots.map((lot) => (
            <div key={lot._id} className="card !p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <p className="font-medium">
                  {lot.medicineId?.name} {lot.medicineId?.strength}
                </p>
                <p className="text-sm text-ink-muted">
                  Batch {lot.batchNumber} · Qty {lot.quantity}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-sm text-ink-faint">
                  Exp {lot.expiryDate && isValid(new Date(lot.expiryDate)) ? format(new Date(lot.expiryDate), 'dd MMM yyyy') : '—'}
                </p>
                {canManage && Number(lot.quantity) > 0 && (
                  <button type="button" className="btn-secondary btn-sm" onClick={() => openAdjust(lot)}>
                    Adjust
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <Pagination
        className="mb-6"
        page={lotPage}
        pages={lotPages}
        total={lotTotal}
        limit={PAGE_SIZE}
        onPage={loadLots}
      />

      <h3 className="text-sm font-semibold mb-2">Recent transactions</h3>
      {!transactions.length ? (
        <EmptyState title="No transactions yet" description="Stock in and adjustments will show here." />
      ) : (
        <div className="space-y-2">
          {transactions.map((tx) => (
            <div key={tx._id} className="card !p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <p className="font-medium">
                  {tx.medicineId?.name} {tx.medicineId?.strength}
                </p>
                <p className="text-sm text-ink-muted capitalize">
                  {String(tx.type || '').replace(/_/g, ' ')}
                  {tx.reason ? ` · ${tx.reason}` : ''}
                </p>
              </div>
              <div className="text-sm text-right">
                <p className={Number(tx.quantity) < 0 ? 'text-red-700 font-medium' : 'text-emerald-700 font-medium'}>
                  {Number(tx.quantity) > 0 ? '+' : ''}
                  {tx.quantity}
                </p>
                <p className="text-ink-faint">
                  {tx.createdAt && isValid(new Date(tx.createdAt)) ? format(new Date(tx.createdAt), 'dd MMM yyyy HH:mm') : ''}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
      <Pagination page={txPage} pages={txPages} total={txTotal} limit={PAGE_SIZE} onPage={loadTransactions} />
        </>
      )}

      <Modal
        open={open}
        title="Stock in"
        onClose={() => {
          setOpen(false);
          setForm(EMPTY_STOCK);
        }}
      >
        <form onSubmit={stockIn} className="space-y-3">
          <div>
            <label className="label-field">
              Medicine <RequiredMark />
            </label>
            <Dropdown
              required
              searchable
              value={form.medicineId}
              onChange={(medicineId) => setForm({ ...form, medicineId })}
              placeholder="Select medicine"
              searchPlaceholder="Type medicine name"
              ariaLabel="Medicine"
              options={meds.map((m) => ({
                value: String(m._id),
                label: [m.name, m.strength].filter(Boolean).join(' '),
              }))}
            />
          </div>
          <div>
            <label className="label-field">
              Batch number <RequiredMark />
            </label>
            <input
              className="input-field"
              required
              placeholder="Batch number"
              value={form.batchNumber}
              onChange={(e) => setForm({ ...form, batchNumber: e.target.value })}
            />
          </div>
          <div>
            <label className="label-field">
              Quantity <RequiredMark />
            </label>
            <input
              className="input-field"
              required
              type="number"
              min="1"
              placeholder="Quantity"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            />
          </div>
          <div>
            <label className="label-field">Purchase price</label>
            <input
              className="input-field"
              type="number"
              placeholder="Purchase price"
              value={form.purchasePrice}
              onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })}
            />
          </div>
          <div>
            <label className="label-field">Expiry date</label>
            <input
              className="input-field"
              type="date"
              value={form.expiryDate}
              onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
            />
          </div>
          <div>
            <label className="label-field">Supplier</label>
            <input
              className="input-field"
              placeholder="Supplier"
              value={form.supplier}
              onChange={(e) => setForm({ ...form, supplier: e.target.value })}
            />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={saving}>
            {saving ? 'Saving…' : 'Add stock'}
          </button>
        </form>
      </Modal>

      <Modal open={!!adjustLot} title="Adjust stock" onClose={() => setAdjustLot(null)}>
        {adjustLot && (
          <form onSubmit={submitAdjust} className="space-y-3">
            <p className="text-sm text-ink-muted">
              {adjustLot.medicineId?.name} · Batch {adjustLot.batchNumber} · Available {adjustLot.quantity}
            </p>
            <div>
              <label className="label-field">Type</label>
              <Dropdown
                value={adjustForm.type}
                onChange={(type) => setAdjustForm({ ...adjustForm, type })}
                ariaLabel="Adjustment type"
                options={[
                  { value: 'adjustment', label: 'Adjustment (reduce)' },
                  { value: 'stock_out', label: 'Stock out' },
                ]}
              />
            </div>
            <div>
              <label className="label-field">
                Quantity to remove <RequiredMark />
              </label>
              <input
                className="input-field"
                required
                type="number"
                min="1"
                max={adjustLot.quantity}
                placeholder="Quantity"
                value={adjustForm.quantity}
                onChange={(e) => setAdjustForm({ ...adjustForm, quantity: e.target.value })}
              />
            </div>
            <div>
              <label className="label-field">
                Reason <RequiredMark />
              </label>
              <input
                className="input-field"
                required
                placeholder="e.g. Damaged / expired / count correction"
                value={adjustForm.reason}
                onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
              />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={saving}>
              {saving ? 'Saving…' : 'Apply adjustment'}
            </button>
          </form>
        )}
      </Modal>
    </div>
  );
}
