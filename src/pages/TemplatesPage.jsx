import { useEffect, useMemo, useState } from 'react';
import { Plus, RotateCcw, Search } from 'lucide-react';
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
  const [showInactive, setShowInactive] = useState(false);
  const canClinic = can(user, P.TEMPLATES_CLINIC);
  const canCreate = canClinic || can(user, P.TEMPLATES_OWN);

  const load = () => {
    setLoading(true);
    setError('');
    const params = {};
    if (showInactive) params.active = 'all';
    if (typeFilter !== 'all') params.type = typeFilter;
    if (q.trim()) params.q = q.trim();
    api
      .get('/templates', { params })
      .then((res) => {
        const list = Array.isArray(res.data?.templates) ? res.data.templates : [];
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
  }, [typeFilter, showInactive]);

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
        <div className="sm:w-56">
          <Dropdown
            value={typeFilter}
            onChange={setTypeFilter}
            ariaLabel="Filter by type"
            options={TYPES.map((t) => ({ value: t.id, label: t.label }))}
          />
        </div>
        {canCreate && (
          <label className="inline-flex items-center gap-2 text-sm text-ink-muted whitespace-nowrap">
            <input
              type="checkbox"
              className="rounded border-line"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
            />
            Show inactive
          </label>
        )}
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
          title={q.trim() || typeFilter !== 'all' ? 'No matches' : 'No templates yet'}
          description={
            q.trim() || typeFilter !== 'all'
              ? 'Try another name or type filter.'
              : 'Save a consultation template so you can load it during a visit.'
          }
          action={
            canCreate && !q.trim() && typeFilter === 'all' ? (
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
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map((t) => {
              const id = t?._id || t?.name;
              const fields = t?.fields && typeof t.fields === 'object' ? t.fields : {};
              const preview =
                fields.chiefComplaint || fields.diagnosis || fields.advice || fields.treatment || '';
              const inactive = t?.isActive === false;
              const canEdit =
                canClinic || (t?.ownerType === 'doctor' && String(t?.doctorId) === String(user?._id));
              return (
                <div key={id} className={`card ${inactive ? 'opacity-60' : ''}`}>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-ink">{t?.name || 'Untitled template'}</h3>
                    <div className="flex flex-wrap gap-1 justify-end">
                      <Badge value={t?.ownerType === 'clinic' ? 'clinic' : 'mine'} />
                      {inactive ? <Badge value="inactive" /> : null}
                    </div>
                  </div>
                  <p className="text-sm text-ink-muted mt-1">{typeLabel(t?.type)}</p>
                  {preview ? <p className="text-xs text-ink-faint mt-2 line-clamp-3">{preview}</p> : null}
                  {canEdit && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {inactive ? (
                        <button type="button" className="btn-secondary btn-sm" onClick={() => restore(t)}>
                          <RotateCcw className="w-3.5 h-3.5" /> Restore
                        </button>
                      ) : (
                        <>
                          <button type="button" className="btn-secondary btn-sm" onClick={() => openEdit(t)}>
                            Edit
                          </button>
                          <button type="button" className="btn-ghost btn-sm" onClick={() => deactivate(t)}>
                            Deactivate
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      <Modal
        open={open}
        title={editingId ? 'Edit template' : 'New template'}
        onClose={() => {
          setOpen(false);
          setEditingId(null);
          setForm(emptyForm());
        }}
        wide
      >
        <form onSubmit={save} className="space-y-3">
          <div>
            <label className="label-field">
              Name <RequiredMark />
            </label>
            <input
              className="input-field"
              required
              placeholder="e.g. General consultation"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            <div>
              <label className="label-field">
                Type <RequiredMark />
              </label>
              <Dropdown
                value={form.type}
                onChange={(type) => setForm({ ...form, type })}
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
                disabled={!canClinic}
                ariaLabel="Visibility"
                options={[
                  { value: 'doctor', label: 'Only me' },
                  ...(canClinic ? [{ value: 'clinic', label: 'Shared with clinic' }] : []),
                ]}
              />
            </div>
          </div>
          {FIELD_KEYS.map(([k, label]) => (
            <div key={k}>
              <label className="label-field">{label}</label>
              <textarea
                className="input-field"
                rows={2}
                placeholder={label}
                value={form.fields?.[k] || ''}
                onChange={(e) => setForm({ ...form, fields: { ...form.fields, [k]: e.target.value } })}
              />
            </div>
          ))}
          <button type="submit" className="btn-primary w-full" disabled={saving}>
            {saving ? 'Saving…' : editingId ? 'Update template' : 'Save template'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
