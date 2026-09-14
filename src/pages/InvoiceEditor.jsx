import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import PageHeader from '../components/ui/PageHeader';
import Money from '../components/ui/Money';
import Dropdown from '../components/ui/Dropdown';
import { ROUTES } from '../constants/routes';
import { useBranch } from '../context/BranchContext';
import RequiredMark from '../components/ui/RequiredMark';

const TYPES = ['consultation', 'treatment', 'medicine', 'lab_test', 'procedure', 'other'];

const emptyLine = () => ({ type: 'consultation', name: '', quantity: 1, unitPrice: 0, discount: 0 });

export default function InvoiceEditor() {
  const navigate = useNavigate();
  const { branchId } = useBranch();
  const [patients, setPatients] = useState([]);
  const [q, setQ] = useState('');
  const [patientId, setPatientId] = useState('');
  const [items, setItems] = useState([emptyLine()]);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (q.trim().length < 2) {
      setPatients([]);
      return;
    }
    const t = setTimeout(() => {
      api.get('/patients', { params: { search: q, limit: 8 } }).then((res) => setPatients(res.data.patients || [])).catch(() => {});
    }, 250);
    return () => clearTimeout(t);
  }, [q, branchId]);

  const subtotal = useMemo(
    () => items.reduce((s, i) => s + Math.max(0, (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0) - (Number(i.discount) || 0)), 0),
    [items]
  );
  const total = Math.max(0, subtotal - Number(discount || 0));

  const setItem = (idx, patch) => {
    setItems((prev) => prev.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!patientId) return toast.error('Select a patient.');
    setSaving(true);
    try {
      const res = await api.post('/billing', {
        patientId,
        items: items.filter((i) => i.name),
        discount: Number(discount) || 0,
        notes,
      });
      toast.success('Invoice created.');
      navigate(ROUTES.invoice(res.data.invoice._id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create invoice.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container">
      <PageHeader title="New invoice" description="Add services, medicines or procedures." />
      <form onSubmit={submit} className="space-y-4">
        <div className="card space-y-3">
          <label className="label-field">Patient <RequiredMark /></label>
          <input className="input-field" placeholder="Search patient name or phone" value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
            {patients.map((p) => (
              <button
                type="button"
                key={p._id}
                onClick={() => {
                  setPatientId(p._id);
                  setQ(p.name);
                }}
                className={`text-left px-3 py-2 rounded-lg text-sm ${patientId === p._id ? 'bg-[#f3efe8]' : 'hover:bg-[#faf8f3]'}`}
              >
                {p.name} · {p.phone}
              </button>
            ))}
          </div>
        </div>

        <div className="card space-y-3">
          <p className="section-label">Line items <RequiredMark /></p>
          {items.map((row, idx) => (
            <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
              <Dropdown
                className="sm:col-span-3"
                value={row.type}
                onChange={(type) => setItem(idx, { type })}
                ariaLabel="Line item type"
                options={TYPES.map((t) => ({ value: t, label: t.replace('_', ' ') }))}
              />
              <input className="input-field sm:col-span-4" placeholder="Description" value={row.name} onChange={(e) => setItem(idx, { name: e.target.value })} />
              <input className="input-field sm:col-span-1" type="number" min="0" placeholder="Qty" value={row.quantity} onChange={(e) => setItem(idx, { quantity: e.target.value })} />
              <input className="input-field sm:col-span-2" type="number" min="0" placeholder="Price" value={row.unitPrice} onChange={(e) => setItem(idx, { unitPrice: e.target.value })} />
              <input className="input-field sm:col-span-2" type="number" min="0" placeholder="Disc" value={row.discount} onChange={(e) => setItem(idx, { discount: e.target.value })} />
            </div>
          ))}
          <button type="button" className="btn-secondary" onClick={() => setItems((p) => [...p, emptyLine()])}>
            Add item
          </button>
        </div>

        <div className="card space-y-3">
          <label className="label-field">Invoice discount</label>
          <input className="input-field max-w-xs" type="number" min="0" value={discount} onChange={(e) => setDiscount(e.target.value)} />
          <textarea className="input-field" rows={2} placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <div className="flex justify-between text-sm">
            <span className="text-ink-muted">Subtotal</span>
            <Money value={subtotal} />
          </div>
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <Money value={total} />
          </div>
        </div>

        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Saving…' : 'Create invoice'}
        </button>
      </form>
    </div>
  );
}
