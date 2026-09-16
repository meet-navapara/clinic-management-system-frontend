import { useEffect, useId, useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import Modal from './ui/Modal';
import Dropdown from './ui/Dropdown';
import Checkbox from './ui/Checkbox';
import RequiredMark from './ui/RequiredMark';

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

export default function MedicineFormModal({ open, onClose, editing = null, onSaved }) {
  const uid = useId();
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    if (!open) return;
    setForm(editing ? medicineToForm(editing) : EMPTY_FORM);
  }, [open, editing]);

  const close = () => {
    if (saving) return;
    onClose?.();
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
      const res = editing?._id
        ? await api.patch(`/medicines/${editing._id}`, payload)
        : await api.post('/medicines', payload);
      toast.success(editing?._id ? 'Medicine updated successfully.' : 'Medicine added successfully.');
      onSaved?.(res.data.medicine, { created: !editing?._id });
      onClose?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save medicine.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} title={editing ? 'Edit medicine' : 'Medicine Add'} onClose={close} wide>
      <form onSubmit={save} className="space-y-4" noValidate>
        <fieldset disabled={saving} className="space-y-4 border-0 p-0 m-0 min-w-0">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor={`${uid}-name`} className="label-field">
                Name <RequiredMark />
              </label>
              <input
                id={`${uid}-name`}
                className="input-field"
                required
                placeholder="E.g. Crocin"
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
              />
            </div>
            <div>
              <label htmlFor={`${uid}-type`} className="label-field">
                Type <RequiredMark />
              </label>
              <input
                id={`${uid}-type`}
                className="input-field"
                required
                placeholder="E.g. Tablet"
                value={form.type}
                onChange={(e) => setField('type', e.target.value)}
              />
            </div>
            <div>
              <label htmlFor={`${uid}-strength`} className="label-field">
                Strength
              </label>
              <input
                id={`${uid}-strength`}
                className="input-field"
                placeholder="E.g. 100"
                value={form.strength}
                onChange={(e) => setField('strength', e.target.value)}
              />
            </div>
            <div>
              <label htmlFor={`${uid}-strengthUnit`} className="label-field">
                Unit
              </label>
              <input
                id={`${uid}-strengthUnit`}
                className="input-field"
                placeholder="E.g. mg"
                value={form.strengthUnit}
                onChange={(e) => setField('strengthUnit', e.target.value)}
              />
            </div>
            <div>
              <label htmlFor={`${uid}-salt`} className="label-field">
                Salt <RequiredMark />
              </label>
              <input
                id={`${uid}-salt`}
                className="input-field"
                required
                placeholder="E.g. Azithromycin"
                value={form.salt}
                onChange={(e) => setField('salt', e.target.value)}
              />
            </div>
            <div>
              <label htmlFor={`${uid}-company`} className="label-field">
                Company
              </label>
              <input
                id={`${uid}-company`}
                className="input-field"
                placeholder="E.g. Sun Pharmaceutical"
                value={form.company}
                onChange={(e) => setField('company', e.target.value)}
              />
            </div>
            <div>
              <label htmlFor={`${uid}-duration`} className="label-field">
                Duration
              </label>
              <input
                id={`${uid}-duration`}
                className="input-field"
                placeholder="E.g. 1"
                value={form.durationValue}
                onChange={(e) => setField('durationValue', e.target.value)}
              />
            </div>
            <div>
              <label htmlFor={`${uid}-durationType`} className="label-field">
                Duration Type
              </label>
              <Dropdown
                id={`${uid}-durationType`}
                value={form.durationType}
                onChange={(durationType) => setField('durationType', durationType)}
                ariaLabel="Duration type"
                options={DURATION_TYPES}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 xs:grid-cols-3 gap-3">
            <div>
              <label htmlFor={`${uid}-morning`} className="label-field">
                Morning
              </label>
              <input
                id={`${uid}-morning`}
                className="input-field"
                placeholder="E.g. 1"
                value={form.dosageMorning}
                onChange={(e) => setField('dosageMorning', e.target.value)}
              />
            </div>
            <div>
              <label htmlFor={`${uid}-noon`} className="label-field">
                Noon
              </label>
              <input
                id={`${uid}-noon`}
                className="input-field"
                placeholder="E.g. 1"
                value={form.dosageNoon}
                onChange={(e) => setField('dosageNoon', e.target.value)}
              />
            </div>
            <div>
              <label htmlFor={`${uid}-night`} className="label-field">
                Night
              </label>
              <input
                id={`${uid}-night`}
                className="input-field"
                placeholder="E.g. 1"
                value={form.dosageNight}
                onChange={(e) => setField('dosageNight', e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Checkbox
              variant="chip"
              checked={form.beforeFood}
              onChange={(e) => setField('beforeFood', e.target.checked)}
            >
              Before food
            </Checkbox>
            <Checkbox
              variant="chip"
              checked={form.afterFood}
              onChange={(e) => setField('afterFood', e.target.checked)}
            >
              After food
            </Checkbox>
          </div>

          <div>
            <label htmlFor={`${uid}-instructions`} className="label-field">
              Instructions
            </label>
            <textarea
              id={`${uid}-instructions`}
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
  );
}
