import { useEffect, useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Pagination from '../components/ui/Pagination';
import { SkeletonRows } from '../components/ui/Skeleton';
import { useBranch } from '../context/BranchContext';
import { STAFF_TYPES, STAFF_TYPE_PERMISSIONS, ACCESS_MODULES, togglePermission } from '../constants/permissions';

const TYPES = ['doctor', ...STAFF_TYPES];

const emptyForm = () => ({
  name: '',
  email: '',
  phone: '',
  password: '',
  staffType: 'receptionist',
  branchIds: [],
  loginEnabled: true,
  permissions: [...STAFF_TYPE_PERMISSIONS.receptionist],
});

function staffLabel(s) {
  if (s.role === 'doctor') return 'Doctor';
  const type = s.staffType || s.customRoleName || s.role || '';
  return String(type).replace(/_/g, ' ');
}

function branchLabel(s) {
  const list = Array.isArray(s.branchIds) ? s.branchIds : [];
  if (!list.length) {
    const d = s.defaultBranchId;
    if (d && typeof d === 'object') return d.name || '—';
    return '—';
  }
  return list
    .map((b) => (typeof b === 'object' ? b.name : null))
    .filter(Boolean)
    .join(', ') || '—';
}

function accessCount(s) {
  if (s.role === 'doctor') return 'All';
  const n = (s.permissions || []).length;
  return n ? `${n}` : '0';
}

export default function StaffPage() {
  const { branches, branchId } = useBranch();
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  const load = (p = 1) => {
    setLoading(true);
    const params = { page: p, limit: 20 };
    if (branchId) params.branchId = branchId;
    api.get('/staff', { params })
      .then((res) => {
        setRows(res.data.staff || []);
        setPages(res.data.pages || 1);
        setPage(res.data.page || 1);
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Could not load staff.'))
      .finally(() => setLoading(false));
  };
  useEffect(() => load(1), [branchId]); // eslint-disable-line react-hooks/exhaustive-deps

  const applyPreset = (staffType) => {
    setForm((prev) => ({
      ...prev,
      staffType,
      permissions: staffType === 'doctor' ? [] : [...(STAFF_TYPE_PERMISSIONS[staffType] || [])],
      loginEnabled: staffType === 'doctor' ? true : prev.loginEnabled,
    }));
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setOpen(true);
  };

  const openEdit = (s) => {
    setEditing(s);
    const primary =
      (s.defaultBranchId && String(s.defaultBranchId._id || s.defaultBranchId)) ||
      (s.branchIds || []).map((b) => String(b._id || b))[0] ||
      '';
    setForm({
      name: s.name || '',
      email: s.email || '',
      phone: s.phone || '',
      password: '',
      staffType: s.role === 'doctor' ? 'doctor' : s.staffType || 'other',
      branchIds: primary ? [primary] : [],
      loginEnabled: s.role === 'doctor' ? true : Boolean(s.loginEnabled),
      permissions: [...(s.permissions || [])],
    });
    setOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        phone: form.phone,
        staffType: form.staffType,
        branchIds: form.branchIds,
        defaultBranchId: form.branchIds[0] || null,
        loginEnabled: form.staffType === 'doctor' ? true : form.loginEnabled,
        permissions: form.staffType === 'doctor' ? [] : form.permissions,
      };
      if (!editing) {
        payload.email = form.email;
        payload.password = form.password;
        await api.post('/staff', payload);
        toast.success(form.staffType === 'doctor' ? 'Doctor added.' : 'Staff added.');
      } else {
        if (form.password) payload.password = form.password;
        await api.patch(`/staff/${editing.id || editing._id}`, payload);
        toast.success('Staff updated.');
      }
      setOpen(false);
      load(editing ? page : 1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save staff.');
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (s, staffStatus) => {
    try {
      await api.patch(`/staff/${s.id || s._id}`, { staffStatus });
      toast.success(`Marked ${staffStatus}.`);
      load(page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed.');
    }
  };

  const isDoctorRow = form.staffType === 'doctor';
  const showPassword = !isDoctorRow && (form.loginEnabled || Boolean(form.password));
  const branchOptions = (() => {
    const map = new Map(branches.map((b) => [String(b._id), b]));
    if (editing) {
      const current =
        editing.defaultBranchId ||
        (Array.isArray(editing.branchIds) ? editing.branchIds[0] : null);
      if (current && typeof current === 'object' && current._id && !map.has(String(current._id))) {
        map.set(String(current._id), current);
      }
    }
    return [...map.values()];
  })();

  return (
    <div className="page-container">
      <PageHeader
        title="Staff"
        description="Clinic staff records and additional doctors. Enable login and set module access for each staff member."
        actions={<button type="button" className="btn-primary" onClick={openCreate}>Add staff</button>}
      />
      {loading ? <SkeletonRows /> : !rows.length ? <EmptyState title="No staff yet" /> : (
        <>
          <div className="space-y-2 md:hidden">
            {rows.map((s) => (
              <div key={s._id || s.id} className="card !p-4">
                <p className="font-semibold">{s.name}</p>
                <p className="text-sm text-ink-muted capitalize">{staffLabel(s)} · {s.email}</p>
                <p className="text-xs text-ink-faint mt-1">{branchLabel(s)} · Login {s.role === 'doctor' || s.loginEnabled ? 'enabled' : 'disabled'}</p>
                <div className="flex gap-2 mt-2">
                  <Badge value={s.staffStatus} />
                  {s.role !== 'doctor' && (
                    <button type="button" className="btn-ghost !min-h-8 text-xs" onClick={() => openEdit(s)}>Manage Access</button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="hidden md:block card !p-0 overflow-hidden">
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Branch</th>
                    <th>Email</th>
                    <th>Login</th>
                    <th>Status</th>
                    <th>Access</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((s) => (
                    <tr key={s._id || s.id}>
                      <td className="font-medium">{s.name}</td>
                      <td className="capitalize">{staffLabel(s)}</td>
                      <td className="text-ink-muted">{branchLabel(s)}</td>
                      <td>{s.email}</td>
                      <td>{s.role === 'doctor' || s.loginEnabled ? 'Enabled' : 'Disabled'}</td>
                      <td><Badge value={s.staffStatus} /></td>
                      <td>{accessCount(s)}{s.role === 'doctor' ? '' : ' modules'}</td>
                      <td>
                        <div className="flex gap-2">
                          {s.role !== 'doctor' && (
                            <button type="button" className="btn-ghost !min-h-8 text-xs" onClick={() => openEdit(s)}>Edit</button>
                          )}
                          {s.staffStatus !== 'inactive' && <button type="button" className="btn-ghost !min-h-8 text-xs" onClick={() => setStatus(s, 'inactive')}>Disable</button>}
                          {s.staffStatus !== 'active' && <button type="button" className="btn-ghost !min-h-8 text-xs" onClick={() => setStatus(s, 'active')}>Activate</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination page={page} pages={pages} onPage={load} />
        </>
      )}
      <Modal open={open} title={editing ? 'Manage access' : 'Add staff'} onClose={() => setOpen(false)} wide>
        <form onSubmit={submit} className="space-y-3">
          <input className="input-field" required placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="input-field" required type="email" placeholder="Email / username" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} disabled={Boolean(editing)} />
          <input className="input-field" required placeholder="Mobile" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <label className="block text-sm text-ink-muted">
            Staff type
            <select className="input-field mt-1" value={form.staffType} onChange={(e) => applyPreset(e.target.value)} disabled={editing?.role === 'doctor'}>
              {TYPES.map((r) => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
            </select>
          </label>
          <label className="block text-sm text-ink-muted">
            Branch
            <select
              className="input-field mt-1"
              required={!isDoctorRow}
              value={form.branchIds[0] || ''}
              onChange={(e) => setForm({ ...form, branchIds: e.target.value ? [e.target.value] : [] })}
            >
              <option value="">{isDoctorRow ? 'Optional' : 'Select branch'}</option>
              {branchOptions.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}{b.isActive === false ? ' (disabled)' : ''}
                </option>
              ))}
            </select>
          </label>
          {!isDoctorRow && (
            <p className="text-xs text-ink-faint">Staff operate only in their assigned branch.</p>
          )}

          {!isDoctorRow && (
            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={form.loginEnabled}
                onChange={(e) => setForm({ ...form, loginEnabled: e.target.checked })}
              />
              Login access enabled
            </label>
          )}

          {(showPassword || (!editing && (isDoctorRow || form.loginEnabled))) && (
            <input
              className="input-field"
              type="password"
              minLength={6}
              required={
                (!editing && (isDoctorRow || form.loginEnabled)) ||
                (Boolean(editing) && form.loginEnabled && !editing.loginEnabled)
              }
              placeholder={editing ? 'New password (leave blank to keep)' : 'Unique password (not the doctor password)'}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          )}

          {!isDoctorRow && (
            <div className="border border-line rounded-xl p-3">
              <div className="flex items-center justify-between gap-2 mb-2">
                <p className="text-sm font-semibold text-ink">Access</p>
                <button
                  type="button"
                  className="btn-ghost !min-h-8 text-xs"
                  onClick={() => applyPreset(form.staffType)}
                >
                  Apply {form.staffType} preset
                </button>
              </div>
              <p className="text-xs text-ink-faint mb-3">Preset is a starting point. Change any module below.</p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {ACCESS_MODULES.map((m) => {
                  const viewOn = form.permissions.includes(m.view);
                  const manageOn = m.manage ? form.permissions.includes(m.manage) : false;
                  return (
                    <div key={m.id} className="flex flex-wrap items-center gap-3 text-sm border-b border-line/60 pb-2 last:border-0">
                      <span className="flex-1 min-w-[8rem] text-ink">{m.label}</span>
                      <label className="inline-flex items-center gap-1 text-ink-muted">
                        <input
                          type="checkbox"
                          checked={viewOn}
                          onChange={(e) => setForm({ ...form, permissions: togglePermission(form.permissions, m.view, e.target.checked) })}
                        />
                        {m.manage ? 'View' : 'Allow'}
                      </label>
                      {m.manage && (
                        <label className="inline-flex items-center gap-1 text-ink-muted">
                          <input
                            type="checkbox"
                            checked={manageOn}
                            onChange={(e) => {
                              let next = togglePermission(form.permissions, m.manage, e.target.checked);
                              if (e.target.checked) next = togglePermission(next, m.view, true);
                              setForm({ ...form, permissions: next });
                            }}
                          />
                          Create / Edit
                        </label>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <button type="submit" className="btn-primary w-full" disabled={saving}>
            {saving ? 'Saving...' : editing ? 'Save access' : isDoctorRow ? 'Add doctor' : 'Add staff'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
