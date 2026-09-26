import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import PageHeader from '../components/ui/PageHeader';
import Dropdown from '../components/ui/Dropdown';
import Checkbox from '../components/ui/Checkbox';
import EmptyState from '../components/ui/EmptyState';
import { ROUTES } from '../constants/routes';
import { SkeletonDetail } from '../components/ui/Skeleton';
import LoadingOverlay from '../components/ui/LoadingOverlay';
import { useAuth } from '../context/AuthContext';
import { can, P } from '../constants/permissions';

const FIELDS = [
  ['chiefComplaint', 'Chief complaint'],
  ['symptoms', 'Symptoms'],
  ['observation', 'Observation'],
  ['diagnosis', 'Diagnosis'],
  ['treatment', 'Treatment'],
  ['advice', 'Advice'],
  ['followUp', 'Follow-up'],
  ['instructions', 'Instructions'],
];

const newMedRow = () => ({
  key: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  name: '',
  dosage: '',
  frequency: '',
  duration: '',
  instructions: '',
});

const TYPE_SHORT = {
  consultation: 'Consult',
  diagnosis: 'Diagnosis',
  treatment: 'Treatment',
  prescription_instructions: 'Rx notes',
  followup_instructions: 'Follow-up',
};

export default function ConsultationPage() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [appointment, setAppointment] = useState(null);
  const [apptMissing, setApptMissing] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [form, setForm] = useState({});
  const [meds, setMeds] = useState([newMedRow()]);
  const [createInvoice, setCreateInvoice] = useState(() => can(user, P.BILLING_MANAGE));
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const canBill = can(user, P.BILLING_MANAGE);

  useEffect(() => {
    setLoading(true);
    setApptMissing(false);
    Promise.all([
      api
        .get(`/appointments/${appointmentId}`)
        .then((res) => {
          setAppointment(res.data.appointment);
          const p = res.data.appointment?.patientId;
          setForm((f) => ({ ...f, patientId: p?._id || p, appointmentId }));
        })
        .catch(() => {
          setAppointment(null);
          setApptMissing(true);
          toast.error('Appointment not found.');
        }),
      api
        .get('/consultations/appointment/' + appointmentId)
        .then((res) => {
          if (res.data.consultation) setForm((f) => ({ ...f, ...res.data.consultation }));
          if (res.data.prescription?.items?.length) {
            setMeds(
              res.data.prescription.items.map((item) => ({
                ...newMedRow(),
                name: item.name || '',
                dosage: item.dosage || '',
                frequency: item.frequency || '',
                duration: item.duration || '',
                instructions: item.instructions || '',
              }))
            );
          }
        })
        .catch((err) => {
          if (err.response?.status !== 404) {
            toast.error(err.response?.data?.message || 'Could not load consultation.');
          }
        }),
      api
        .get('/templates')
        .then((res) => setTemplates(res.data.templates || []))
        .catch((err) => toast.error(err.response?.data?.message || 'Could not load templates.')),
    ]).finally(() => setLoading(false));
  }, [appointmentId]);

  const applyTemplate = (id) => {
    if (!id) {
      setForm((f) => ({ ...f, templateId: '' }));
      return;
    }
    const t = templates.find((x) => String(x._id) === String(id));
    if (!t) return;
    const next = {};
    const fields = t.fields && typeof t.fields === 'object' ? t.fields : {};
    for (const [key] of FIELDS) {
      const value = String(fields[key] || '').trim();
      if (value) next[key] = value;
    }
    setForm((f) => ({ ...f, ...next, templateId: id }));
    toast.success(`Applied “${t.name}” (filled fields only).`);
  };

  const updateMed = (index, key, value) => {
    setMeds((prev) => prev.map((row, idx) => (idx === index ? { ...row, [key]: value } : row)));
  };

  const save = async (status) => {
    const patientId = form.patientId || appointment?.patientId?._id || appointment?.patientId;
    if (!patientId) {
      toast.error('Patient is missing for this appointment.');
      return;
    }
    setSaving(true);
    try {
      const medicines = meds
        .filter((m) => String(m.name || '').trim())
        .map((m) => ({
          name: String(m.name).trim(),
          dosage: String(m.dosage || '').trim(),
          frequency: String(m.frequency || '').trim(),
          duration: String(m.duration || '').trim(),
          instructions: String(m.instructions || '').trim(),
        }));
      const res = await api.post('/consultations', {
        ...form,
        patientId,
        appointmentId,
        medicines,
        status,
        createInvoice: status === 'completed' && createInvoice && canBill,
      });
      toast.success(status === 'completed' ? 'Consultation saved.' : 'Draft saved.');
      if (status === 'completed' && res.data.prescription?._id) {
        window.open(ROUTES.print('prescription', res.data.prescription._id), '_blank', 'noopener,noreferrer');
      }
      if (status === 'completed') {
        navigate(ROUTES.doctorAppointmentDetail(appointmentId));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const patient = appointment?.patientId;

  if (loading) return <SkeletonDetail />;

  if (apptMissing || !appointment) {
    return (
      <div className="page-container">
        <PageHeader title="Consultation" />
        <EmptyState
          title="Appointment not found"
          description="This visit link is invalid or the appointment was removed. Open the appointment from the calendar again."
        />
        <div className="mt-4">
          <button type="button" className="btn-secondary" onClick={() => navigate(ROUTES.doctorCalendar)}>
            Back to calendar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container relative">
      <LoadingOverlay show={saving} message="Saving…" />
      <PageHeader title="Consultation" description={patient?.name || ''} />
      <div className="card space-y-3 mb-4">
        <label className="label-field">Use template</label>
        <Dropdown
          value={form.templateId ? String(form.templateId) : ''}
          onChange={(id) => applyTemplate(id)}
          placeholder="Select template"
          ariaLabel="Template"
          options={[
            { value: '', label: 'None — clear selection' },
            ...templates.map((t) => ({
              value: String(t._id),
              label: `${t.name}${TYPE_SHORT[t.type] ? ` · ${TYPE_SHORT[t.type]}` : ''}${
                t.ownerType === 'clinic' ? ' · Clinic' : ''
              }`,
            })),
          ]}
        />
        <p className="text-xs text-ink-faint">
          Applying fills only fields that have text in the template — empty template fields won’t clear what you already wrote.
        </p>
        {FIELDS.map(([k, label]) => (
          <div key={k}>
            <label className="label-field">{label}</label>
            <textarea
              className="input-field"
              rows={2}
              value={form[k] || ''}
              onChange={(e) => setForm({ ...form, [k]: e.target.value })}
            />
          </div>
        ))}
      </div>
      <div className="card space-y-3 mb-4">
        <p className="section-label">Prescription</p>
        <p className="text-xs text-ink-faint -mt-1">
          Write medicines here for this visit only — no separate medicine catalog.
        </p>
        {meds.map((m, i) => (
          <div key={m.key} className="grid sm:grid-cols-2 gap-2 rounded-[12px] border border-line p-3">
            <div className="sm:col-span-2">
              <input
                className="input-field font-medium"
                placeholder="Medicine name"
                value={m.name}
                onChange={(e) => updateMed(i, 'name', e.target.value)}
              />
            </div>
            <input
              className="input-field"
              placeholder="Dosage"
              value={m.dosage}
              onChange={(e) => updateMed(i, 'dosage', e.target.value)}
            />
            <input
              className="input-field"
              placeholder="Frequency"
              value={m.frequency}
              onChange={(e) => updateMed(i, 'frequency', e.target.value)}
            />
            <input
              className="input-field"
              placeholder="Duration"
              value={m.duration}
              onChange={(e) => updateMed(i, 'duration', e.target.value)}
            />
            <input
              className="input-field"
              placeholder="Instructions"
              value={m.instructions}
              onChange={(e) => updateMed(i, 'instructions', e.target.value)}
            />
            {meds.length > 1 && (
              <button
                type="button"
                className="inline-flex items-center justify-center h-9 w-9 rounded-lg text-ink-muted hover:text-[#9b2c2c] hover:bg-[#fef2f2] transition-colors sm:col-span-2 justify-self-start"
                aria-label="Delete medicine line"
                title="Delete"
                onClick={() => setMeds((prev) => prev.filter((_, idx) => idx !== i))}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
        <button type="button" className="btn-secondary" onClick={() => setMeds((p) => [...p, newMedRow()])}>
          Add medicine line
        </button>
      </div>
      <div className="mb-4">
        {canBill ? (
          <Checkbox checked={createInvoice} onChange={(e) => setCreateInvoice(e.target.checked)}>
            Create consultation invoice when completing
          </Checkbox>
        ) : (
          <p className="text-xs text-ink-faint">Invoice will not be created — billing access is required.</p>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-secondary" disabled={saving} onClick={() => save('draft')}>
          Save draft
        </button>
        <button type="button" className="btn-primary" disabled={saving} onClick={() => save('completed')}>
          Complete consultation
        </button>
      </div>
    </div>
  );
}
