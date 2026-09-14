import { useEffect, useState } from 'react';
import { format, isValid } from 'date-fns';
import api from '../utils/api';
import toast from 'react-hot-toast';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import { can, P } from '../constants/permissions';
import { useAuth } from '../context/AuthContext';
import { useBranch } from '../context/BranchContext';

export default function InventoryPage() {
  const { user } = useAuth();
  const { branchId } = useBranch();
  const [summary, setSummary] = useState(null);
  const [lots, setLots] = useState([]);
  const [open, setOpen] = useState(false);
  const [meds, setMeds] = useState([]);
  const [form, setForm] = useState({ medicineId: '', batchNumber: '', quantity: '', purchasePrice: '', expiryDate: '', supplier: '' });

  const load = () => {
    api.get('/inventory/summary').then((res) => setSummary(res.data.summary)).catch(() => {});
    api.get('/inventory/lots').then((res) => setLots(res.data.lots || [])).catch(() => {});
  };
  useEffect(load, [branchId]);

  useEffect(() => {
    if (!open) return;
    api.get('/medicines', { params: { limit: 100 } }).then((res) => setMeds(res.data.medicines || [])).catch(() => {});
  }, [open]);

  const stockIn = async (e) => {
    e.preventDefault();
    if (!branchId) return toast.error('Select a specific branch first (not All branches).');
    try {
      await api.post('/inventory/stock-in', form);
      toast.success('Stock added.');
      setOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Stock in failed.');
    }
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Inventory"
        description="Branch-wise medicine stock, batches and expiry."
        actions={can(user, P.INVENTORY_MANAGE) && <button type="button" className="btn-primary" onClick={() => setOpen(true)}>Stock in</button>}
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <div className="card !p-4"><p className="section-label">SKUs</p><p className="text-2xl font-semibold mt-1">{summary?.skuCount ?? '—'}</p></div>
        <div className="card !p-4"><p className="section-label">Units</p><p className="text-2xl font-semibold mt-1">{summary?.units ?? '—'}</p></div>
        <div className="card !p-4"><p className="section-label">Low stock</p><p className="text-2xl font-semibold mt-1">{summary?.lowStock?.length ?? 0}</p></div>
        <div className="card !p-4"><p className="section-label">Expiring</p><p className="text-2xl font-semibold mt-1">{summary?.expiring?.length ?? 0}</p></div>
      </div>

      {!!summary?.lowStock?.length && (
        <section className="mb-5">
          <h3 className="text-sm font-semibold mb-2">Low stock</h3>
          <div className="card space-y-2">
            {summary.lowStock.map((m) => (
              <p key={m.medicineId} className="text-sm">{m.name} — remaining {m.remaining} (min {m.minimum})</p>
            ))}
          </div>
        </section>
      )}

      {!lots.length ? <EmptyState title="No lots" description="Add stock for a branch." /> : (
        <div className="space-y-2">
          {lots.map((lot) => (
            <div key={lot._id} className="card !p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <p className="font-medium">{lot.medicineId?.name} {lot.medicineId?.strength}</p>
                <p className="text-sm text-ink-muted">Batch {lot.batchNumber} · Qty {lot.quantity}</p>
              </div>
              <p className="text-sm text-ink-faint">
                Exp {lot.expiryDate && isValid(new Date(lot.expiryDate)) ? format(new Date(lot.expiryDate), 'dd MMM yyyy') : '—'}
              </p>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} title="Stock in" onClose={() => setOpen(false)}>
        <form onSubmit={stockIn} className="space-y-3">
          <select className="input-field" required value={form.medicineId} onChange={(e) => setForm({ ...form, medicineId: e.target.value })}>
            <option value="">Select medicine</option>
            {meds.map((m) => <option key={m._id} value={m._id}>{m.name} {m.strength}</option>)}
          </select>
          <input className="input-field" required placeholder="Batch number" value={form.batchNumber} onChange={(e) => setForm({ ...form, batchNumber: e.target.value })} />
          <input className="input-field" required type="number" min="1" placeholder="Quantity" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
          <input className="input-field" type="number" placeholder="Purchase price" value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })} />
          <input className="input-field" type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} />
          <input className="input-field" placeholder="Supplier" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
          <button type="submit" className="btn-primary w-full">Add stock</button>
        </form>
      </Modal>
    </div>
  );
}
