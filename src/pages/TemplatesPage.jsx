import { useEffect, useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import Dropdown from '../components/ui/Dropdown';
import { SkeletonRows } from '../components/ui/Skeleton';
import { can, P } from '../constants/permissions';
import { useAuth } from '../context/AuthContext';
import RequiredMark from '../components/ui/RequiredMark';

const TYPES = [
  { id: 'all', label: 'All types' },
  { id: 'consultation', label: 'Consultation' },
  { id: 'diagnosis', label: 'Diagnosis' },
  { id: 'treatment', label: 'Treatment' },
  { id: 'prescription_instructions', label: 'Prescription instructions' },
  { id: 'followup_instructions', label: 'Follow-up instructions' },
];

const FIELD_KEYS = [
  ['chiefComplaint', 'Chief complaint'],
  ['symptoms', 'Symptoms'],
  ['observation', 'Observation'],
  ['diagnosis', 'Diagnosis'],
  ['treatment', 'Treatment'],
  ['advice', 'Advice'],
  ['followUp', 'Follow-up'],
  ['instructions', 'Instructions'],
];

const emptyForm = () => ({
  name: '',
  type: 'consultation',
  ownerType: 'clinic',
  fields: {
    chiefComplaint: '',
    symptoms: '',
    observation: '',
    diagnosis: '',
    treatment: '',
    advice: '',
    followUp: '',
    instructions: '',
  },
});

const typeLabel = (type) => {
  const id = String(type || 'consultation');
  return TYPES.find((t) => t.id === id)?.label || id.replace(/_/g, ' ');
};

const previewText = (t) => {
  const fields = t?.fields && typeof t.fields === 'object' ? t.fields : {};
  return (
    fields.chiefComplaint ||
    fields.diagnosis ||
    fields.advice ||
    fields.treatment ||
    fields.instructions ||
    ''
  );
};

export default function TemplatesPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => emptyForm());
  const [q, setQ] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('active');
  const canClinic = can(user, P.TEMPLATES_CLINIC);
  const canCreate = canClinic || can(user, P.TEMPLATES_OWN);

  const load = () => {
    setLoading(true);
    setError('');
    const params = {};
    if (statusFilter === 'all' || statusFilter === 'inactive') params.active = 'all';
    if (typeFilter !== 'all') params.type = typeFilter;
    if (q.trim()) params.q = q.trim();
    api
      .get('/templates', { params })
      .then((res) => {
        let list = Array.isArray(res.data?.templates) ? res.data.templates : [];
        if (statusFilter === 'active') list = list.filter((t) => t?.isActive !== false);
        if (statusFilter === 'inactive') list = list.filter((t) => t?.isActive === false);
        setRows(list);
      })
      .catch((err) => {
        setRows([]);
        setError(err.response?.data?.message || 'Could not load templates.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter, statusFilter]);

  const filtered = useMemo(() => {
    if (!q.trim()) return rows;
    const needle = q.trim().toLowerCase();
    return rows.filter((t) => String(t?.name || '').toLowerCase().includes(needle));
  }, [rows, q]);

  const openCreate = () => {
    setEditingId(null);
    setForm({
      ...emptyForm(),
      ownerType: canClinic ? 'clinic' : 'doctor',
    });
    setOpen(true);
  };

  const openEdit = (t) => {
    const fields = t?.fields && typeof t.fields === 'object' ? t.fields : {};
    setEditingId(t._id);
    setForm({
      name: t.name || '',
      type: t.type || 'consultation',
      ownerType: t.ownerType === 'clinic' ? 'clinic' : 'doctor',
      fields: { ...emptyForm().fields, ...fields },
    });
    setOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Template name is required.');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        const payload = {
          name: form.name.trim(),
          type: form.type,
          fields: form.fields,
        };
        if (canClinic) payload.ownerType = form.ownerType;
        await api.patch(`/templates/${editingId}`, payload);
        toast.success('Template updated.');
      } else {
        await api.post('/templates', {
          ...form,
          name: form.name.trim(),
          ownerType: canClinic ? form.ownerType : 'doctor',
        });
        toast.success('Template saved.');
      }
      setOpen(false);
      setEditingId(null);
      setForm(emptyForm());
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const deactivate = async (t) => {
    if (!window.confirm(`Deactivate “${t.name}”? It will no longer appear in consultations.`)) return;
    try {
      await api.patch(`/templates/${t._id}`, { isActive: false });
      toast.success('Template deactivated.');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not deactivate template.');
    }
  };

  const restore = async (t) => {
    try {
      await api.patch(`/templates/${t._id}`, { isActive: true });
      toast.success('Template restored.');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not restore template.');
    }
  };

  const canEditRow = (t) =>
    canClinic || (t?.ownerType === 'doctor' && String(t?.doctorId) === String(user?._id));

  const editingRow = editingId ? rows.find((r) => String(r._id) === String(editingId)) : null;
  const formEditable = !editingId || (editingRow ? canEditRow(editingRow) : canCreate);

  return (
    <div className="page-container">
      <PageHeader
        title="Clinical templates"
        description="Reusable visit notes — load them during consultation to fill chief complaint, diagnosis, advice, and more."
        actions={
          canCreate ? (
            <button type="button" className="btn-primary" onClick={openCreate}>
              <Plus className="w-4 h-4" /> New template
            </button>
          ) : null
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <form
          className="relative flex-1 max-w-md"
          onSubmit={(e) => {
            e.preventDefault();
            load();
          }}
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" />
          <input
            className="input-field !pl-9"
            placeholder="Search by name"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </form>
        <select
          className="input-field sm:w-44"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Status filter"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="all">All statuses</option>
        </select>
        <select
          className="input-field sm:w-52"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          aria-label="Type filter"
        >
          {TYPES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <SkeletonRows count={8} />
      ) : error ? (
        <EmptyState
          title="Templates unavailable"
          description={error}
          action={
            <button type="button" className="btn-secondary" onClick={load}>
              Try again
            </button>
          }
        />
      ) : !filtered.length ? (
        <EmptyState
          title={q.trim() || typeFilter !== 'all' || statusFilter !== 'active' ? 'No matches' : 'No templates yet'}
          description={
            q.trim() || typeFilter !== 'all' || statusFilter !== 'active'
              ? 'Try another search or filter.'
              : 'Save a consultation template so you can load it during a visit.'
          }
          action={
            canCreate && !q.trim() && typeFilter === 'all' && statusFilter === 'active' ? (
              <button type="button" className="btn-primary" onClick={openCreate}>
                Create template
              </button>
            ) : null
          }
        />
      ) : (
        <>
          <p className="text-xs text-ink-faint mb-2">
            {filtered.length} template{filtered.length === 1 ? '' : 's'}
          </p>

          <div className="hidden md:block card !p-0 overflow-hidden">
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Template</th>
                    <th>Type</th>
                    <th>Visibility</th>
                    <th>Status</th>
                    <th>Preview</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t) => {
                    const id = t?._id || t?.name;
                    const inactive = t?.isActive === false;
                    const editable = canEditRow(t);
                    return (
                      <tr key={id} className={inactive ? 'opacity-60' : undefined}>
                        <td className="font-medium">{t?.name || 'Untitled template'}</td>
                        <td className="text-ink-muted">{typeLabel(t?.type)}</td>
                        <td>
                          <Badge value={t?.ownerType === 'clinic' ? 'clinic' : 'mine'} />
                        </td>
                        <td>
                          <Badge value={inactive ? 'inactive' : 'active'} />
                        </td>
                        <td className="text-ink-muted max-w-[16rem]">
                          <span className="line-clamp-2 text-sm">{previewText(t) || '—'}</span>
                        </td>
                        <td className="text-right whitespace-nowrap">
                          {editable ? (
                            inactive ? (
                              <button
                                type="button"
                                className="text-sm font-semibold text-accent-700"
                                onClick={() => restore(t)}
                              >
                                Restore
                              </button>
                            ) : (
                              <div className="inline-flex items-center gap-3 justify-end">
                                <button
                                  type="button"
                                  className="text-sm font-semibold text-accent-700"
                                  onClick={() => openEdit(t)}
                                >
                                  View
                                </button>
                                <button
                                  type="button"
                                  className="text-sm font-medium text-ink-muted hover:text-ink"
                                  onClick={() => deactivate(t)}
                                >
                                  Deactivate
                                </button>
                              </div>
                            )
                          ) : (
                            <button
                              type="button"
                              className="text-sm font-semibold text-accent-700"
                              onClick={() => openEdit(t)}
                            >
                              View
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="md:hidden space-y-2">
            {filtered.map((t) => {
              const id = t?._id || t?.name;
              const inactive = t?.isActive === false;
              const editable = canEditRow(t);
              return (
                <button
                  key={id}
                  type="button"
                  className={`card !p-4 block w-full text-left ${inactive ? 'opacity-60' : ''}`}
                  onClick={() => openEdit(t)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-ink">{t?.name || 'Untitled template'}</p>
                      <p className="text-sm text-ink-muted mt-0.5 capitalize">{typeLabel(t?.type)}</p>
                    </div>
                    <Badge value={inactive ? 'inactive' : 'active'} />
                  </div>
                  {previewText(t) ? (
                    <p className="text-xs text-ink-faint mt-2 line-clamp-2">{previewText(t)}</p>
                  ) : null}
                  {editable && !inactive ? (
                    <p className="text-xs text-ink-faint mt-2">Tap to edit · Deactivate from desktop</p>
                  ) : null}
                </button>
              );
            })}
          </div>
        </>
      )}

      <Modal
        open={open}
        title={editingId ? 'Edit template' : 'Add New Template'}
        onClose={() => {
          setOpen(false);
          setEditingId(null);
          setForm(emptyForm());
        }}
        wide
      >
        <form onSubmit={save} className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="label-field">
                Template Type <RequiredMark />
              </label>
              <Dropdown
                value={form.type}
                onChange={(type) => setForm({ ...form, type })}
                disabled={!formEditable}
                ariaLabel="Template type"
                options={TYPES.filter((t) => t.id !== 'all').map((t) => ({ value: t.id, label: t.label }))}
              />
            </div>
            <div>
              <label className="label-field">
                Visibility <RequiredMark />
              </label>
              <Dropdown
                value={canClinic ? form.ownerType : 'doctor'}
                onChange={(ownerType) => setForm({ ...form, ownerType })}
                disabled={!canClinic || !formEditable}
                ariaLabel="Visibility"
                options={[
                  { value: 'doctor', label: 'Only me' },
                  ...(canClinic ? [{ value: 'clinic', label: 'Shared with clinic' }] : []),
                ]}
              />
            </div>
          </div>
          <div>
            <label className="label-field">
              Template <RequiredMark />
            </label>
            <input
              className="input-field"
              required
              disabled={!formEditable}
              placeholder="e.g. General consultation"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="border-t border-line pt-3 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-faint">Fields</p>
            {FIELD_KEYS.map(([k, label]) => (
              <div key={k}>
                <label className="label-field">{label}</label>
                <textarea
                  className="input-field"
                  rows={2}
                  disabled={!formEditable}
                  placeholder={label}
                  value={form.fields?.[k] || ''}
                  onChange={(e) => setForm({ ...form, fields: { ...form.fields, [k]: e.target.value } })}
                />
              </div>
            ))}
          </div>
          <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-line">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setOpen(false);
                setEditingId(null);
                setForm(emptyForm());
              }}
            >
              Close
            </button>
            {formEditable && (
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving…' : editingId ? 'Update' : 'Save'}
              </button>
            )}
          </div>
        </form>
      </Modal>
    </div>
  );
}
