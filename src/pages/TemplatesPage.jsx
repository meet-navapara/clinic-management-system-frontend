import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
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
  const canClinic = can(user, P.TEMPLATES_CLINIC);
  const canCreate = canClinic || can(user, P.TEMPLATES_OWN);

  const load = () => {
    setLoading(true);
    setError('');
    api
      .get('/templates')
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
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
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
    setSaving(true);
    try {
      if (editingId) {
        await api.patch(`/templates/${editingId}`, {
          name: form.name,
          type: form.type,
          fields: form.fields,
        });
        toast.success('Template updated.');
      } else {
        await api.post('/templates', {
          ...form,
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

  return (
    <div className="page-container">
      <PageHeader
        title="Clinical templates"
        description="Reusable notes for consultations, diagnosis, treatment and follow-up."
        actions={
          canCreate ? (
            <button type="button" className="btn-primary" onClick={openCreate}>
              <Plus className="w-4 h-4" /> New template
            </button>
          ) : null
        }
      />

      {loading ? (
        <SkeletonRows />
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
      ) : !rows.length ? (
        <EmptyState
          title="No templates yet"
          description="Save a general consultation template so you can load it during a visit."
          action={
            canCreate ? (
              <button type="button" className="btn-primary" onClick={openCreate}>
                Create template
              </button>
            ) : null
          }
        />
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {rows.map((t) => {
            const id = t?._id || t?.name;
            const fields = t?.fields && typeof t.fields === 'object' ? t.fields : {};
            const preview = fields.chiefComplaint || fields.diagnosis || fields.advice || fields.treatment || '';
            const canEdit =
              canClinic || (t?.ownerType === 'doctor' && String(t?.doctorId) === String(user?._id));
            return (
              <div key={id} className="card">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-ink">{t?.name || 'Untitled template'}</h3>
                  <Badge value={t?.ownerType === 'clinic' ? 'clinic' : 'mine'} />
                </div>
                <p className="text-sm text-ink-muted mt-1">{typeLabel(t?.type)}</p>
                {preview ? <p className="text-xs text-ink-faint mt-2 line-clamp-3">{preview}</p> : null}
                {canEdit && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    <button type="button" className="btn-secondary !min-h-9" onClick={() => openEdit(t)}>
                      Edit
                    </button>
                    <button type="button" className="btn-ghost !min-h-9 text-xs" onClick={() => deactivate(t)}>
                      Deactivate
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
            <label className="label-field">Name <RequiredMark /></label>
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
              <label className="label-field">Type <RequiredMark /></label>
              <Dropdown
                value={form.type}
                onChange={(type) => setForm({ ...form, type })}
                ariaLabel="Template type"
                options={TYPES.map((t) => ({ value: t.id, label: t.label }))}
              />
            </div>
            <div>
              <label className="label-field">Visibility <RequiredMark /></label>
              <Dropdown
                value={canClinic ? form.ownerType : 'doctor'}
                onChange={(ownerType) => setForm({ ...form, ownerType })}
                disabled={!canClinic || !!editingId}
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
