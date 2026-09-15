import { useEffect, useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import { can, P } from '../constants/permissions';
import { useAuth } from '../context/AuthContext';
import { useBranch } from '../context/BranchContext';
import RequiredMark from '../components/ui/RequiredMark';

const EMPTY_FORM = {
  name: '',
  phone: '',
  email: '',
  address: '',
  roomLabel: 'Room 1',
  tokenPrefix: '',
};

export default function BranchesPage() {
  const { user } = useAuth();
  const { reload } = useBranch();
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = () => {
    api
      .get('/branches', { params: { active: 'all' } })
      .then((res) => setRows(res.data.branches || []))
      .catch((err) => toast.error(err.response?.data?.message || 'Could not load branches.'));
  };
  useEffect(load, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  };

  const openEdit = (b) => {
    setEditingId(b._id);
    setForm({
      name: b.name || '',
      phone: b.phone || '',
      email: b.email || '',
      address: b.address || '',
      roomLabel: b.roomLabel || 'Room 1',
      tokenPrefix: b.tokenPrefix || '',
    });
    setOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await api.patch(`/branches/${editingId}`, form);
        toast.success('Branch updated.');
      } else {
        await api.post('/branches', form);
        toast.success('Branch created.');
      }
      setOpen(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      load();
      reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save branch.');
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (b) => {
    try {
      await api.patch(`/branches/${b._id}`, { isActive: !b.isActive });
      toast.success(b.isActive ? 'Branch deactivated.' : 'Branch activated.');
      load();
      reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed.');
    }
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Branches"
        description="Each branch has its own appointments, billing and stock."
        actions={
          can(user, P.BRANCHES_MANAGE) && (
            <button type="button" className="btn-primary" onClick={openCreate}>
              Add branch
            </button>
          )
        }
      />
      {!rows.length ? (
        <EmptyState title="No branches" />
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {rows.map((b) => (
            <div key={b._id} className="card">
              <div className="flex justify-between gap-2">
                <h3 className="font-semibold text-ink">{b.name}</h3>
                <Badge value={b.isActive ? 'active' : 'inactive'} />
              </div>
              <p className="text-sm text-ink-muted mt-1">{b.address || 'No address'}</p>
              <p className="text-sm text-ink-faint">
                {b.phone} {b.email}
              </p>
              <p className="text-xs text-ink-faint mt-2">
                Room: {b.roomLabel || '—'} · Token prefix: {b.tokenPrefix || '—'}
              </p>
              {can(user, P.BRANCHES_MANAGE) && (
                <div className="flex flex-wrap gap-2 mt-3">
                  <button type="button" className="btn-secondary !min-h-9" onClick={() => openEdit(b)}>
                    Edit
                  </button>
                  <button type="button" className="btn-ghost !min-h-9 text-xs" onClick={() => toggle(b)}>
                    {b.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <Modal
        open={open}
        title={editingId ? 'Edit branch' : 'New branch'}
        onClose={() => {
          setOpen(false);
          setEditingId(null);
          setForm(EMPTY_FORM);
        }}
      >
        <form onSubmit={save} className="space-y-3">
          {[
            ['name', 'Name', true],
            ['phone', 'Phone', false],
            ['email', 'Email', false],
            ['address', 'Address', false],
            ['roomLabel', 'Room label', false],
            ['tokenPrefix', 'Token prefix', false],
          ].map(([f, label, required]) => (
            <div key={f}>
              <label className="label-field" htmlFor={`branch-${f}`}>
                {label} {required ? <RequiredMark /> : null}
              </label>
              <input
                id={`branch-${f}`}
                className="input-field"
                required={required}
                placeholder={label}
                value={form[f]}
                onChange={(e) => setForm({ ...form, [f]: e.target.value })}
              />
            </div>
          ))}
          <button type="submit" className="btn-primary w-full" disabled={saving}>
            {saving ? 'Saving…' : editingId ? 'Update' : 'Create'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
