import { useEffect, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import Dropdown from '../components/ui/Dropdown';
import Pagination from '../components/ui/Pagination';
import { SkeletonCards } from '../components/ui/Skeleton';
import { can, P } from '../constants/permissions';
import { useAuth } from '../context/AuthContext';
import { useBranch } from '../context/BranchContext';
import RequiredMark from '../components/ui/RequiredMark';
import { PAGE_SIZE } from '../constants/pagination';

const TYPES = [
  { id: 'all', label: 'All types' },
  { id: 'consultation', label: 'Consultation' },
  { id: 'diagnosis', label: 'Diagnosis' },
  { id: 'treatment', label: 'Treatment' },
  { id: 'prescription_instructions', label: 'Prescription instructions' },
  { id: 'followup_instructions', label: 'Follow-up instructions' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'all', label: 'All statuses' },
];

const TYPE_OPTIONS = TYPES.map((t) => ({ value: t.id, label: t.label }));

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
  const { branchId, current } = useBranch();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => emptyForm());
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('active');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const canClinic = can(user, P.TEMPLATES_CLINIC);
  const canCreate = canClinic || can(user, P.TEMPLATES_OWN);

  const load = (p = 1) => {
    setLoading(true);
    setError('');
    const params = { page: p, limit: PAGE_SIZE };
    if (statusFilter === 'all') params.active = 'all';
    else if (statusFilter === 'inactive') params.active = 'false';
    if (typeFilter !== 'all') params.type = typeFilter;
    if (search.trim()) params.q = search.trim();
    api
      .get('/templates', { params, skipCache: true })
      .then((res) => {
        setRows(Array.isArray(res.data?.templates) ? res.data.templates : []);
        setPage(res.data.page || 1);
        setPages(res.data.pages || 1);
        setTotal(res.data.total || 0);
      })
      .catch((err) => {
        setRows([]);
        setTotal(0);
        setPages(1);
        setError(err.response?.data?.message || 'Could not load templates.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter, statusFilter, search, branchId]);

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
      fields: {
        chiefComplaint: fields.chiefComplaint || '',
        symptoms: fields.symptoms || '',
        observation: fields.observation || '',
        diagnosis: fields.diagnosis || '',
        treatment: fields.treatment || '',
        advice: fields.advice || '',
        followUp: fields.followUp || '',
        instructions: fields.instructions || '',
      },
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
      load(page);
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
      load(page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not deactivate template.');
    }
  };

  const restore = async (t) => {
    try {
      await api.patch(`/templates/${t._id}`, { isActive: true });
      toast.success('Template restored.');
      load(page);
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
        description={
          current?.name
            ? `Reusable visit notes for ${current.name}. Load them during consultation to fill chief complaint, diagnosis, advice, and more.`
            : 'Reusable visit notes — load them during consultation to fill chief complaint, diagnosis, advice, and more.'
        }
        actions={
          canCreate ? (
            <button type="button" className="btn-primary shrink-0 w-auto justify-center" onClick={openCreate}>
              <Plus className="w-4 h-4" /> New template
            </button>
          ) : null
        }
        toolbar={
          <form
            className="relative min-w-0 flex-1 sm:min-w-[12rem] sm:max-w-xs"
            onSubmit={(e) => {
              e.preventDefault();
              setSearch(q.trim());
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
        }
        filters={
          <>
            <div className="min-w-0 flex-1 sm:flex-none sm:w-44">
              <Dropdown
                value={statusFilter}
                onChange={setStatusFilter}
                options={STATUS_OPTIONS}
                ariaLabel="Status filter"
              />
            </div>
            <div className="min-w-0 flex-1 sm:flex-none sm:w-52">
              <Dropdown
                value={typeFilter}
                onChange={setTypeFilter}
                options={TYPE_OPTIONS}
                ariaLabel="Type filter"
              />
            </div>
          </>
        }
      />

      {loading ? (
        <SkeletonCards count={6} className="!grid-cols-1 sm:!grid-cols-2 xl:!grid-cols-3" />
      ) : error ? (
        <EmptyState
          title="Templates unavailable"
          description={error}
          action={
            <button type="button" className="btn-secondary" onClick={() => load(page)}>
              Try again
            </button>
          }
        />
      ) : !rows.length ? (
        <EmptyState
          title={search.trim() || typeFilter !== 'all' || statusFilter !== 'active' ? 'No matches' : 'No templates yet'}
          description={
            search.trim() || typeFilter !== 'all' || statusFilter !== 'active'
              ? 'Try another search or filter.'
              : 'Save a consultation template so you can load it during a visit.'
          }
          action={
            canCreate && !search.trim() && typeFilter === 'all' && statusFilter === 'active' ? (
              <button type="button" className="btn-primary" onClick={openCreate}>
                Create template
              </button>
            ) : null
          }
        />
      ) : (
        <>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {rows.map((t) => {
            const id = t?._id || t?.name;
            const inactive = t?.isActive === false;
            const editable = canEditRow(t);
            const visibility = t?.ownerType === 'clinic' ? 'Clinic' : 'Only me';
            return (
              <div
                key={id}
                className={`card relative h-full flex flex-col ${inactive ? 'opacity-60' : ''}`}
              >
                <div className="flex justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-ink truncate">{t?.name || 'Untitled template'}</h3>
                    <p className="text-sm text-ink-muted mt-0.5">{typeLabel(t?.type)}</p>
                  </div>
                  <span
                    className={`inline-flex items-center justify-center h-6 min-w-[4.25rem] px-2 rounded-md text-[10px] font-bold uppercase tracking-[0.08em] ring-1 shrink-0 ${
                      inactive
                        ? 'bg-[#f3f3f4] text-[#52525b] ring-[#d4d4d8]/80'
                        : 'bg-[#eef6f1] text-[#2d5a40] ring-[#c5ddd0]/80'
                    }`}
                  >
                    {inactive ? 'Inactive' : 'Active'}
                  </span>
                </div>
                <p className="text-sm text-ink-faint mt-2 flex-1">Visibility: {visibility}</p>
                <div className="mt-auto pt-4">
                  <div className="flex flex-row flex-wrap items-center gap-2 pt-3 border-t border-line">
                    <button type="button" className="btn-secondary btn-sm" onClick={() => openEdit(t)}>
                      View
                    </button>
                    {editable ? (
                      inactive ? (
                        <button type="button" className="btn-primary btn-sm" onClick={() => restore(t)}>
                          Restore
                        </button>
                      ) : (
                        <button type="button" className="btn-danger btn-sm" onClick={() => deactivate(t)}>
                          Deactivate
                        </button>
                      )
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <Pagination page={page} pages={pages} total={total} limit={PAGE_SIZE} onPage={load} />
        </>
      )}

      <Modal
        open={open}
        title={
          !editingId
            ? 'Add New Template'
            : formEditable
              ? 'Edit template'
              : 'View template'
        }
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
