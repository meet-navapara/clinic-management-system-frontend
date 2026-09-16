import { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
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
import { SkeletonCards } from '../components/ui/Skeleton';
import LoadingOverlay from '../components/ui/LoadingOverlay';
import { formatIndianMobileInput } from '../utils/validation';

const EMPTY_FORM = {
  name: '',
  phone: '',
  email: '',
  address: '',
  rooms: ['Room 1'],
  roomLabel: 'Room 1',
  tokenPrefix: '',
};

function roomsFromBranch(b) {
  const list = Array.isArray(b?.rooms) ? b.rooms.filter(Boolean) : [];
  if (list.length) return list.map(String);
  if (b?.roomLabel) return [String(b.roomLabel)];
  return ['Room 1'];
}

export default function BranchesPage() {
  const { user } = useAuth();
  const { reload } = useBranch();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [newRoom, setNewRoom] = useState('');
  const [saving, setSaving] = useState(false);

  const load = (showLoader = false) => {
    if (showLoader) setLoading(true);
    api
      .get('/branches', { params: { active: 'all' } })
      .then((res) => setRows(res.data.branches || []))
      .catch((err) => toast.error(err.response?.data?.message || 'Could not load branches.'))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    load(true);
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setNewRoom('');
    setOpen(true);
  };

  const openEdit = (b) => {
    const rooms = roomsFromBranch(b);
    setEditingId(b._id);
    setForm({
      name: b.name || '',
      phone: b.phone || '',
      email: b.email || '',
      address: b.address || '',
      rooms,
      roomLabel: b.roomLabel || rooms[0] || 'Room 1',
      tokenPrefix: b.tokenPrefix || '',
    });
    setNewRoom('');
    setOpen(true);
  };

  const addRoom = () => {
    const label = newRoom.trim().slice(0, 80);
    if (!label) return;
    if (form.rooms.some((r) => r.toLowerCase() === label.toLowerCase())) {
      toast.error('Room already added.');
      return;
    }
    setForm((prev) => ({
      ...prev,
      rooms: [...prev.rooms, label],
      roomLabel: prev.roomLabel || label,
    }));
    setNewRoom('');
  };

  const removeRoom = (label) => {
    setForm((prev) => {
      const rooms = prev.rooms.filter((r) => r !== label);
      const nextRooms = rooms.length ? rooms : ['Room 1'];
      return {
        ...prev,
        rooms: nextRooms,
        roomLabel: nextRooms.includes(prev.roomLabel) ? prev.roomLabel : nextRooms[0],
      };
    });
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.rooms.length) {
      toast.error('Add at least one room.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        phone: form.phone,
        email: form.email,
        address: form.address,
        rooms: form.rooms,
        roomLabel: form.roomLabel || form.rooms[0],
        tokenPrefix: form.tokenPrefix,
      };
      if (editingId) {
        await api.patch(`/branches/${editingId}`, payload);
        toast.success('Branch updated.');
      } else {
        await api.post('/branches', payload);
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
    <div className="page-container relative">
      <LoadingOverlay show={saving} message="Saving…" />
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
      {loading ? (
        <SkeletonCards count={6} className="!grid-cols-1 sm:!grid-cols-2 xl:!grid-cols-3" />
      ) : !rows.length ? (
        <EmptyState title="No branches" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {rows.map((b) => {
            const rooms = roomsFromBranch(b);
            return (
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
                  Rooms: {rooms.join(', ')} · Default: {b.roomLabel || rooms[0]} · Token: {b.tokenPrefix || '—'}
                </p>
                {can(user, P.BRANCHES_MANAGE) && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    <button type="button" className="btn-secondary btn-sm" onClick={() => openEdit(b)}>
                      Edit
                    </button>
                    <button type="button" className="btn-ghost btn-sm" onClick={() => toggle(b)}>
                      {b.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <Modal
        open={open}
        title={editingId ? 'Edit branch' : 'New branch'}
        onClose={() => {
          setOpen(false);
          setEditingId(null);
          setForm(EMPTY_FORM);
          setNewRoom('');
        }}
      >
        <form onSubmit={save} className="space-y-3">
          {[
            ['name', 'Name', true],
            ['phone', 'Phone', false],
            ['email', 'Email', false],
            ['address', 'Address', false],
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
                placeholder={f === 'phone' ? '9876543210' : label}
                value={form[f]}
                inputMode={f === 'phone' ? 'numeric' : undefined}
                maxLength={f === 'phone' ? 10 : undefined}
                onChange={(e) =>
                  setForm({
                    ...form,
                    [f]: f === 'phone' ? formatIndianMobileInput(e.target.value) : e.target.value,
                  })
                }
              />
            </div>
          ))}

          <div>
            <label className="label-field">
              Rooms <RequiredMark />
            </label>
            <p className="text-xs text-ink-faint mb-2">
              Add every consult room / OPD for this branch. These appear on patient admit &amp; queue.
            </p>
            <div className="flex flex-wrap gap-2 mb-2">
              {form.rooms.map((room) => (
                <span
                  key={room}
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${
                    form.roomLabel === room
                      ? 'bg-[#f5edd8] text-ink ring-[#d4af37]'
                      : 'bg-white text-ink-muted ring-line'
                  }`}
                >
                  <button
                    type="button"
                    className="hover:underline"
                    title="Set as default room"
                    onClick={() => setForm((prev) => ({ ...prev, roomLabel: room }))}
                  >
                    {room}
                    {form.roomLabel === room ? ' · default' : ''}
                  </button>
                  <button
                    type="button"
                    className="p-0.5 rounded hover:bg-red-50 text-ink-faint hover:text-red-600"
                    aria-label={`Remove ${room}`}
                    onClick={() => removeRoom(room)}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                className="input-field grow"
                placeholder="e.g. OPD, Consult 2, Ward A"
                value={newRoom}
                maxLength={80}
                onChange={(e) => setNewRoom(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addRoom();
                  }
                }}
              />
              <button type="button" className="btn-secondary shrink-0" onClick={addRoom}>
                <Plus className="w-4 h-4" /> Add room
              </button>
            </div>
          </div>

          <button type="submit" className="btn-primary w-full" disabled={saving}>
            {saving ? 'Saving…' : editingId ? 'Update' : 'Create'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
