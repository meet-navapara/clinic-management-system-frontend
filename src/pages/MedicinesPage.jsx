import { useEffect, useState } from 'react';
import { Pencil, Trash2, Plus } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import Pagination from '../components/ui/Pagination';
import { SkeletonRows } from '../components/ui/Skeleton';
import { can, P } from '../constants/permissions';
import { useAuth } from '../context/AuthContext';
import { useBranch } from '../context/BranchContext';
import { confirmAction } from '../utils/display';

const EMPTY_FORM = {
  name: '',
  type: '',
  strength: '',
  strengthUnit: '',
  salt: '',
  company: '',
  durationValue: '',
  durationType: 'day(s)',
  dosageMorning: '',
  dosageNoon: '',
  dosageNight: '',
  beforeFood: false,
  afterFood: false,
  instructions: '',
};

const DURATION_TYPES = ['day(s)', 'week(s)', 'month(s)'];

function strengthLabel(m) {
  const parts = [m.strength, m.strengthUnit].filter(Boolean);
  return parts.join(' ') || '—';
}

function typeLabel(m) {
  return String(m.dosageForm || '').toUpperCase() || '—';
}

function parseDuration(defaultDuration = '') {
  const raw = String(defaultDuration || '').trim();
  if (!raw) return { durationValue: '', durationType: 'day(s)' };
  const match = raw.match(/^(\S+)\s+(.+)$/);
  if (!match) return { durationValue: raw, durationType: 'day(s)' };
  const type = DURATION_TYPES.includes(match[2]) ? match[2] : 'day(s)';
  return { durationValue: match[1], durationType: type };
}

function stripFoodPrefix(instructions = '') {
  return String(instructions || '')
    .replace(/^Before food\.\s*After food\.\s*/i, '')
    .replace(/^After food\.\s*Before food\.\s*/i, '')
    .replace(/^Before food\.?\s*/i, '')
    .replace(/^After food\.?\s*/i, '')
    .trim();
}

function medicineToForm(m) {
  const duration = parseDuration(m.defaultDuration);
  return {
    name: m.name || '',
    type: m.dosageForm || '',
    strength: m.strength || '',
    strengthUnit: m.strengthUnit || '',
    salt: m.genericName || '',
    company: m.manufacturer || '',
    durationValue: duration.durationValue,
    durationType: duration.durationType,
    dosageMorning: m.dosageMorning || '',
    dosageNoon: m.dosageNoon || '',
    dosageNight: m.dosageNight || '',
    beforeFood: Boolean(m.beforeFood),
    afterFood: Boolean(m.afterFood),
    instructions: stripFoodPrefix(m.instructions),
  };
}

function buildPayload(form) {
  return {
    name: form.name.trim(),
    type: form.type.trim(),
    dosageForm: form.type.trim(),
    strength: form.strength.trim(),
    strengthUnit: form.strengthUnit.trim(),
    salt: form.salt.trim(),
    genericName: form.salt.trim(),
    company: form.company.trim(),
    manufacturer: form.company.trim(),
    durationValue: form.durationValue.trim(),
    durationType: form.durationType,
    dosageMorning: form.dosageMorning.trim(),
    dosageNoon: form.dosageNoon.trim(),
    dosageNight: form.dosageNight.trim(),
    beforeFood: form.beforeFood,
    afterFood: form.afterFood,
    instructions: form.instructions.trim(),
  };
}

export default function MedicinesPage() {
  const { user } = useAuth();
  const { branchId } = useBranch();
  const canManage = can(user, P.MEDICINE_MANAGE);
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = (p = 1) => {
    setLoading(true);
    api
      .get('/medicines', { params: { page: p, q, limit: 20 } })
      .then((res) => {
        setRows(res.data.medicines || []);
        setPages(res.data.pages || 1);
        setPage(res.data.page || 1);
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Load failed.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  };

  const openEdit = (m) => {
    setEditing(m);
    setForm(medicineToForm(m));
    setOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Medicine name is required.');
      return;
    }
    if (!form.type.trim()) {
      toast.error('Medicine type is required.');
      return;
    }
    if (!form.salt.trim()) {
      toast.error('Salt is required.');
      return;
    }
    setSaving(true);
    try {
      const payload = buildPayload(form);
      if (editing?._id) {
        await api.patch(`/medicines/${editing._id}`, payload);
        toast.success('Medicine updated successfully.');
      } else {
        await api.post('/medicines', payload);
        toast.success('Medicine added successfully.');
      }
      closeModal();
      load(page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save medicine.');
    } finally {
      setSaving(false);
    }
  };

  const removeMedicine = async (m) => {
    const ok = await confirmAction(`Remove “${m.name}” from the medicine master?`);
    if (!ok) return;
    try {
      await api.patch(`/medicines/${m._id}`, { isActive: false });
      toast.success('Medicine removed.');
      load(page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not remove medicine.');
    }
  };

  const rowOffset = (page - 1) * 20;

  return (
    <div className="page-container">
      <PageHeader
        title="Medicine master"
        actions={
          canManage && (
            <button type="button" className="btn-primary" onClick={openAdd}>
              <Plus className="w-4 h-4" aria-hidden /> Add new
            </button>
          )
        }
      />

      <form
        className="mb-4"
        onSubmit={(e) => {
          e.preventDefault();
          load(1);
        }}
      >
        <input
          className="input-field max-w-md"
          placeholder="Search name, salt, or company"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </form>

      {loading ? (
        <SkeletonRows />
      ) : !rows.length ? (
        <EmptyState
          title="No medicines"
          description="Add medicines to use in prescriptions and inventory."
          action={
            canManage && (
              <button type="button" className="btn-primary" onClick={openAdd}>
                Add new
              </button>
            )
          }
        />
      ) : (
        <>
          <div className="hidden md:block card !p-0 overflow-hidden">
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="w-12">#</th>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Strength</th>
                    <th>Salt</th>
                    <th>Company</th>
                    {canManage && <th className="text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((m, index) => (
                    <tr key={m._id}>
                      <td className="text-ink-faint tabular-nums">{rowOffset + index + 1}</td>
                      <td className="font-medium text-ink">{m.name}</td>
                      <td className="uppercase text-ink-muted">{typeLabel(m)}</td>
                      <td className="text-ink-muted whitespace-nowrap">{strengthLabel(m)}</td>
                      <td className="text-ink-muted">{m.genericName || '—'}</td>
                      <td className="text-ink-muted">{m.manufacturer || '—'}</td>
                      {canManage && (
                        <td>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              className="btn-ghost !min-h-9 !px-2 text-sky-700"
                              aria-label={`Edit ${m.name}`}
                              onClick={() => openEdit(m)}
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              className="btn-ghost !min-h-9 !px-2 text-red-600"
                              aria-label={`Delete ${m.name}`}
                              onClick={() => removeMedicine(m)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="md:hidden space-y-2">
            {rows.map((m, index) => (
              <div key={m._id} className="card !p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-ink-faint tabular-nums">#{rowOffset + index + 1}</p>
                    <p className="font-semibold text-ink truncate">{m.name}</p>
                    <p className="text-sm text-ink-muted mt-1 uppercase">{typeLabel(m)}</p>
                    <p className="text-xs text-ink-faint mt-1">
                      {strengthLabel(m)} · {m.genericName || '—'}
                    </p>
                    <p className="text-xs text-ink-faint">{m.manufacturer || '—'}</p>
                  </div>
                  {canManage && (
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        className="btn-ghost !min-h-9 !px-2 text-sky-700"
                        aria-label={`Edit ${m.name}`}
                        onClick={() => openEdit(m)}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        className="btn-ghost !min-h-9 !px-2 text-red-600"
                        aria-label={`Delete ${m.name}`}
                        onClick={() => removeMedicine(m)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <Pagination page={page} pages={pages} onPage={load} />

      <Modal
        open={open}
        title={editing ? 'Edit medicine' : 'Medicine Add'}
        onClose={closeModal}
        wide
      >
        <form onSubmit={save} className="space-y-4" noValidate>
          <fieldset disabled={saving} className="space-y-4 border-0 p-0 m-0 min-w-0">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="med-name" className="label-field">
                  Name <span className="text-red-600">*</span>
                </label>
                <input
                  id="med-name"
                  className="input-field"
                  required
                  placeholder="E.g. Crocin"
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="med-type" className="label-field">
                  Type <span className="text-red-600">*</span>
                </label>
                <input
                  id="med-type"
                  className="input-field"
                  required
                  placeholder="E.g. Tablet"
                  value={form.type}
                  onChange={(e) => setField('type', e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="med-strength" className="label-field">
                  Strength
                </label>
                <input
                  id="med-strength"
                  className="input-field"
                  placeholder="E.g. 100"
                  value={form.strength}
                  onChange={(e) => setField('strength', e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="med-strengthUnit" className="label-field">
                  Unit
                </label>
                <input
                  id="med-strengthUnit"
                  className="input-field"
                  placeholder="E.g. mg"
                  value={form.strengthUnit}
                  onChange={(e) => setField('strengthUnit', e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="med-salt" className="label-field">
                  Salt <span className="text-red-600">*</span>
                </label>
                <input
                  id="med-salt"
                  className="input-field"
                  required
                  placeholder="E.g. Azithromycin"
                  value={form.salt}
                  onChange={(e) => setField('salt', e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="med-company" className="label-field">
                  Company
                </label>
                <input
                  id="med-company"
                  className="input-field"
                  placeholder="E.g. Sun Pharmaceutical"
                  value={form.company}
                  onChange={(e) => setField('company', e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="med-duration" className="label-field">
                  Duration
                </label>
                <input
                  id="med-duration"
                  className="input-field"
                  placeholder="E.g. 1"
                  value={form.durationValue}
                  onChange={(e) => setField('durationValue', e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="med-durationType" className="label-field">
                  Duration Type
                </label>
                <select
                  id="med-durationType"
                  className="input-field"
                  value={form.durationType}
                  onChange={(e) => setField('durationType', e.target.value)}
                >
                  {DURATION_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label htmlFor="med-morning" className="label-field">
                  Morning
                </label>
                <input
                  id="med-morning"
                  className="input-field"
                  placeholder="E.g. 1"
                  value={form.dosageMorning}
                  onChange={(e) => setField('dosageMorning', e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="med-noon" className="label-field">
                  Noon
                </label>
                <input
                  id="med-noon"
                  className="input-field"
                  placeholder="E.g. 1"
                  value={form.dosageNoon}
                  onChange={(e) => setField('dosageNoon', e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="med-night" className="label-field">
                  Night
                </label>
                <input
                  id="med-night"
                  className="input-field"
                  placeholder="E.g. 1"
                  value={form.dosageNight}
                  onChange={(e) => setField('dosageNight', e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-5">
              <label className="inline-flex items-center gap-2 text-sm text-ink cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-line"
                  checked={form.beforeFood}
                  onChange={(e) => setField('beforeFood', e.target.checked)}
                />
                Before food
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-ink cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-line"
                  checked={form.afterFood}
                  onChange={(e) => setField('afterFood', e.target.checked)}
                />
                After food
              </label>
            </div>

            <div>
              <label htmlFor="med-instructions" className="label-field">
                Instructions
              </label>
              <textarea
                id="med-instructions"
                className="input-field"
                rows={3}
                placeholder="Medicines Instructions..."
                value={form.instructions}
                onChange={(e) => setField('instructions', e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center min-h-10 px-6 rounded-md text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : editing ? 'UPDATE' : 'ADD'}
            </button>
          </fieldset>
        </form>
      </Modal>
    </div>
  );
}
