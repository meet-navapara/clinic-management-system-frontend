import { useEffect, useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Pagination from '../components/ui/Pagination';
import Dropdown from '../components/ui/Dropdown';
import Checkbox from '../components/ui/Checkbox';
import PasswordInput from '../components/PasswordInput';
import { SkeletonRows } from '../components/ui/Skeleton';
import { useBranch } from '../context/BranchContext';
import { STAFF_TYPES, STAFF_TYPE_PERMISSIONS, ACCESS_MODULES, togglePermission } from '../constants/permissions';
import RequiredMark from '../components/ui/RequiredMark';
import { PAGE_SIZE } from '../constants/pagination';
import {
  normalizeIndianMobile,
  formatIndianMobileInput,
  isValidEmail,
  meetsPasswordComplexity,
  STRONG_PASSWORD_MESSAGE,
} from '../utils/validation';

const TYPES = ['doctor', ...STAFF_TYPES];
const FIELD_ORDER = ['name', 'email', 'phone', 'staffType', 'branch', 'password'];

function FieldError({ id, message }) {
  if (!message) return null;
  return (
    <p id={id} className="text-xs text-red-600 mt-1" role="alert">
      {message}
    </p>
  );
}

function passwordIsRequired(form, editing) {
  const isDoctor = form.staffType === 'doctor';
  if (!editing) return isDoctor || form.loginEnabled;
  return !isDoctor && form.loginEnabled && !editing.loginEnabled;
}

function validateStaffForm(form, editing) {
  const errors = {};
  const isDoctor = form.staffType === 'doctor';

  const name = form.name.trim();
  if (!name) errors.name = 'Full name is required.';
  else if (name.length > 120) errors.name = 'Name is too long.';

  if (!editing) {
    const email = form.email.trim();
    if (!email) errors.email = 'Email is required.';
    else if (!isValidEmail(email)) errors.email = 'Please enter a valid email address.';
  }

  if (!form.phone.trim()) errors.phone = 'Mobile number is required.';
  else if (!normalizeIndianMobile(form.phone)) {
    errors.phone = 'Mobile number must be exactly 10 digits.';
  }

  if (!form.staffType) errors.staffType = 'Staff type is required.';

  if (!isDoctor && !form.branchIds[0]) errors.branch = 'Branch is required.';

  const needPassword = passwordIsRequired(form, editing);
  if (needPassword && !form.password) errors.password = 'Password is required.';
  else if (form.password) {
    if (form.password.length < 6) errors.password = 'Password must be at least 6 characters.';
    else if (!meetsPasswordComplexity(form.password)) errors.password = STRONG_PASSWORD_MESSAGE;
  }

  return errors;
}

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
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  const load = (p = 1) => {
    setLoading(true);
    const params = { page: p, limit: PAGE_SIZE };
    if (branchId) params.branchId = branchId;
    if (statusFilter === 'disabled') params.status = 'inactive';
    else if (statusFilter === 'active') params.status = 'active';
    api.get('/staff', { params })
      .then((res) => {
        setRows(res.data.staff || []);
        setPages(res.data.pages || 1);
        setPage(res.data.page || 1);
        setTotal(res.data.total || 0);
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Could not load staff.'))
      .finally(() => setLoading(false));
  };
  useEffect(() => load(1), [branchId, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const clearFieldError = (name) => {
    setFieldErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const applyPreset = (staffType) => {
    setForm((prev) => ({
      ...prev,
      staffType,
      permissions: staffType === 'doctor' ? [] : [...(STAFF_TYPE_PERMISSIONS[staffType] || [])],
      loginEnabled: staffType === 'doctor' ? true : prev.loginEnabled,
    }));
    clearFieldError('staffType');
    if (staffType === 'doctor') clearFieldError('branch');
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setFieldErrors({});
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
    setFieldErrors({});
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setFieldErrors({});
  };

  const submit = async (e) => {
    e.preventDefault();
    const errors = validateStaffForm(form, editing);
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      const firstKey = FIELD_ORDER.find((key) => errors[key]) || Object.keys(errors)[0];
      document.getElementById(`staff-${firstKey}`)?.focus();
      toast.error(errors[firstKey]);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        staffType: form.staffType,
        branchIds: form.branchIds,
        defaultBranchId: form.branchIds[0] || null,
        loginEnabled: form.staffType === 'doctor' ? true : form.loginEnabled,
        permissions: form.staffType === 'doctor' ? [] : form.permissions,
      };
      if (!editing) {
        payload.email = form.email.trim();
        payload.password = form.password;
        await api.post('/staff', payload);
        toast.success(form.staffType === 'doctor' ? 'Doctor added.' : 'Staff added.');
      } else {
        if (form.password) payload.password = form.password;
        await api.patch(`/staff/${editing.id || editing._id}`, payload);
        toast.success('Staff updated.');
      }
      closeModal();
      load(editing ? page : 1);
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      if (apiErrors && typeof apiErrors === 'object' && !Array.isArray(apiErrors)) {
        const mapped = { ...apiErrors };
        if (mapped.branchIds && !mapped.branch) mapped.branch = mapped.branchIds;
        setFieldErrors(mapped);
        const firstKey = FIELD_ORDER.find((key) => mapped[key]) || Object.keys(mapped)[0];
        document.getElementById(`staff-${firstKey}`)?.focus();
      }
      toast.error(err.response?.data?.message || 'Could not save staff.');
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (s, staffStatus) => {
    try {
      await api.patch(`/staff/${s.id || s._id}`, { staffStatus });
      toast.success(
        staffStatus === 'inactive'
          ? 'Staff disabled. Super Admin can approve them again.'
          : 'Staff approved.'
      );
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
      <div className="flex flex-wrap gap-2 mb-4">
        {[
          { id: 'all', label: 'All' },
          { id: 'active', label: 'Active' },
          { id: 'disabled', label: 'Disabled' },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setStatusFilter(item.id)}
            className={`tab-chip ${
              statusFilter === item.id ? 'bg-ink text-white' : 'bg-white text-ink-muted ring-1 ring-line'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      {loading ? <SkeletonRows count={PAGE_SIZE} /> : !rows.length ? (
        <EmptyState
          title={statusFilter === 'disabled' ? 'No disabled staff' : 'No staff yet'}
          description={
            statusFilter === 'disabled'
              ? 'Disabled staff appear here until they are approved again.'
              : undefined
          }
        />
      ) : (
        <>
          <div className="space-y-2 md:hidden">
            {rows.map((s) => (
              <div key={s._id || s.id} className="card !p-4">
                <p className="font-semibold">{s.name}</p>
                <p className="text-sm text-ink-muted capitalize">{staffLabel(s)} · {s.email}</p>
                <p className="text-xs text-ink-faint mt-1">{branchLabel(s)} · Login {s.role === 'doctor' || s.loginEnabled ? 'enabled' : 'disabled'}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge value={s.staffStatus} />
                  {s.role !== 'doctor' && (
                    <button type="button" className="btn-ghost btn-sm" onClick={() => openEdit(s)}>Manage Access</button>
                  )}
                  {s.staffStatus !== 'inactive' && (
                    <button type="button" className="btn-ghost btn-sm" onClick={() => setStatus(s, 'inactive')}>
                      Disable
                    </button>
                  )}
                  {s.staffStatus !== 'active' && (
                    <button type="button" className="btn-primary btn-sm" onClick={() => setStatus(s, 'active')}>
                      Approve
                    </button>
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
                            <button type="button" className="btn-ghost btn-sm" onClick={() => openEdit(s)}>Edit</button>
                          )}
                          {s.staffStatus !== 'inactive' && <button type="button" className="btn-ghost btn-sm" onClick={() => setStatus(s, 'inactive')}>Disable</button>}
                          {s.staffStatus !== 'active' && <button type="button" className="btn-primary btn-sm" onClick={() => setStatus(s, 'active')}>Approve</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination page={page} pages={pages} total={total} limit={PAGE_SIZE} onPage={load} />
        </>
      )}
      <Modal open={open} title={editing ? 'Manage access' : 'Add staff'} onClose={closeModal} wide>
        <form onSubmit={submit} className="space-y-3" noValidate>
          <fieldset disabled={saving} className="space-y-3 border-0 p-0 m-0 min-w-0">
          <div>
            <label htmlFor="staff-name" className="label-field">
              Full name <RequiredMark />
            </label>
            <input
              id="staff-name"
              name="name"
              className="input-field"
              placeholder="Full name"
              value={form.name}
              onChange={(e) => {
                setForm({ ...form, name: e.target.value });
                clearFieldError('name');
              }}
              required
              maxLength={120}
              autoComplete="name"
              aria-invalid={Boolean(fieldErrors.name)}
              aria-describedby={fieldErrors.name ? 'staff-name-error' : undefined}
            />
            <FieldError id="staff-name-error" message={fieldErrors.name} />
          </div>
          <div>
            <label htmlFor="staff-email" className="label-field">
              Email <RequiredMark />
            </label>
            <input
              id="staff-email"
              name="email"
              className="input-field"
              type="email"
              placeholder="Email / username"
              value={form.email}
              onChange={(e) => {
                setForm({ ...form, email: e.target.value });
                clearFieldError('email');
              }}
              required
              disabled={Boolean(editing)}
              autoComplete="email"
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? 'staff-email-error' : undefined}
            />
            <FieldError id="staff-email-error" message={fieldErrors.email} />
          </div>
          <div>
            <label htmlFor="staff-phone" className="label-field">
              Mobile <RequiredMark />
            </label>
            <input
              id="staff-phone"
              name="phone"
              className="input-field"
              placeholder="9876543210"
              value={form.phone}
              onChange={(e) => {
                setForm({ ...form, phone: formatIndianMobileInput(e.target.value) });
                clearFieldError('phone');
              }}
              required
              inputMode="numeric"
              maxLength={10}
              autoComplete="tel"
              aria-invalid={Boolean(fieldErrors.phone)}
              aria-describedby={fieldErrors.phone ? 'staff-phone-error' : undefined}
            />
            <FieldError id="staff-phone-error" message={fieldErrors.phone} />
          </div>
          <div>
            <label htmlFor="staff-staffType" className="label-field">
              Staff type <RequiredMark />
            </label>
            <Dropdown
              id="staff-staffType"
              className="mt-0"
              value={form.staffType}
              onChange={applyPreset}
              disabled={editing?.role === 'doctor'}
              ariaLabel="Staff type"
              options={TYPES.map((r) => ({ value: r, label: r.replace(/_/g, ' ') }))}
            />
            <FieldError id="staff-staffType-error" message={fieldErrors.staffType} />
          </div>
          <div>
            <label htmlFor="staff-branch" className="label-field">
              Branch {!isDoctorRow ? <RequiredMark /> : null}
            </label>
            <Dropdown
              id="staff-branch"
              className="mt-0"
              required={!isDoctorRow}
              value={form.branchIds[0] || ''}
              onChange={(id) => {
                setForm({ ...form, branchIds: id ? [id] : [] });
                clearFieldError('branch');
              }}
              placeholder={isDoctorRow ? 'Optional' : 'Select branch'}
              ariaLabel="Branch"
              options={branchOptions.map((b) => ({
                value: String(b._id),
                label: `${b.name}${b.isActive === false ? ' (disabled)' : ''}`,
              }))}
            />
            <FieldError id="staff-branch-error" message={fieldErrors.branch} />
          </div>
          {!isDoctorRow && (
            <p className="text-xs text-ink-faint">Staff operate only in their assigned branch.</p>
          )}

          {!isDoctorRow && (
            <Checkbox
              checked={form.loginEnabled}
              onChange={(e) => {
                setForm({ ...form, loginEnabled: e.target.checked });
                if (!e.target.checked) clearFieldError('password');
              }}
            >
              Login access enabled
            </Checkbox>
          )}

          {(showPassword || (!editing && (isDoctorRow || form.loginEnabled))) && (
            <div>
              <label htmlFor="staff-password" className="label-field">
                Password {passwordIsRequired(form, editing) ? <RequiredMark /> : null}
              </label>
              <PasswordInput
                id="staff-password"
                name="password"
                value={form.password}
                onChange={(e) => {
                  setForm({ ...form, password: e.target.value });
                  clearFieldError('password');
                }}
                minLength={6}
                required={passwordIsRequired(form, editing)}
                placeholder={editing ? 'New password (leave blank to keep)' : 'Enter password'}
                autoComplete="new-password"
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? 'staff-password-error' : undefined}
              />
              <FieldError id="staff-password-error" message={fieldErrors.password} />
            </div>
          )}

          {!isDoctorRow && (
            <div className="border border-line rounded-xl p-3">
              <div className="flex items-center justify-between gap-2 mb-2">
                <p className="text-sm font-semibold text-ink">Access</p>
                <button
                  type="button"
                  className="btn-ghost btn-sm"
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
                      <Checkbox
                        variant="inline"
                        className="text-ink-muted"
                        checked={viewOn}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            permissions: togglePermission(form.permissions, m.view, e.target.checked),
                          })
                        }
                      >
                        {m.manage ? 'View' : 'Allow'}
                      </Checkbox>
                      {m.manage && (
                        <Checkbox
                          variant="inline"
                          className="text-ink-muted"
                          checked={manageOn}
                          onChange={(e) => {
                            let next = togglePermission(form.permissions, m.manage, e.target.checked);
                            if (e.target.checked) next = togglePermission(next, m.view, true);
                            setForm({ ...form, permissions: next });
                          }}
                        >
                          Create / Edit
                        </Checkbox>
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
          </fieldset>
        </form>
      </Modal>
    </div>
  );
}
