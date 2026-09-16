import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import PageHeader from '../components/ui/PageHeader';
import Dropdown from '../components/ui/Dropdown';
import Checkbox from '../components/ui/Checkbox';
import MedicineFormModal from '../components/MedicineFormModal';
import { ROUTES } from '../constants/routes';
import { SkeletonDetail } from '../components/ui/Skeleton';
import LoadingOverlay from '../components/ui/LoadingOverlay';

const FIELDS = [
  ['chiefComplaint', 'Chief complaint'],
  ['symptoms', 'Symptoms'],
  ['observation', 'Observation'],
  ['diagnosis', 'Diagnosis'],
  ['treatment', 'Treatment'],
  ['advice', 'Advice'],
  ['followUp', 'Follow-up'],
];

const ADD_NEW_MEDICINE = '__add_new__';
const EMPTY_MED = { medicineId: '', name: '', dosage: '', frequency: '', duration: '', instructions: '' };

function medicineLabel(m) {
  const strength = [m.strength, m.strengthUnit].filter(Boolean).join(' ');
  return [m.name, strength].filter(Boolean).join(' ').trim();
}

function rowFromMedicine(m) {
  return {
    medicineId: m._id,
    name: medicineLabel(m),
    genericName: m.genericName || '',
    dosage: m.defaultDosage || '',
    frequency: m.defaultFrequency || '',
    duration: m.defaultDuration || '',
    instructions: m.instructions || '',
  };
}

export default function ConsultationPage() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [form, setForm] = useState({});
  const [meds, setMeds] = useState([{ ...EMPTY_MED }]);
  const [catalog, setCatalog] = useState([]);
  const [addOpen, setAddOpen] = useState(false);
  const [addRowIndex, setAddRowIndex] = useState(0);
  const [createInvoice, setCreateInvoice] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadCatalog = () => {
    api
      .get('/medicines', { params: { limit: 100 } })
      .then((res) => setCatalog(res.data.medicines || []))
      .catch((err) => toast.error(err.response?.data?.message || 'Could not load medicines.'));
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api
        .get(`/appointments/${appointmentId}`)
        .then((res) => {
          setAppointment(res.data.appointment);
          const p = res.data.appointment?.patientId;
          setForm((f) => ({ ...f, patientId: p?._id || p, appointmentId }));
        })
        .catch(() => toast.error('Appointment not found.')),
      api
        .get('/consultations/appointment/' + appointmentId)
        .then((res) => {
          if (res.data.consultation) setForm((f) => ({ ...f, ...res.data.consultation }));
          if (res.data.prescription?.items?.length) setMeds(res.data.prescription.items);
        })
        .catch((err) => {
          if (err.response?.status !== 404) {
            toast.error(err.response?.data?.message || 'Could not load consultation.');
          }
        }),
      api
        .get('/templates', { params: { type: 'consultation' } })
        .then((res) => setTemplates(res.data.templates || []))
        .catch((err) => toast.error(err.response?.data?.message || 'Could not load templates.')),
      api
        .get('/medicines', { params: { limit: 100 } })
        .then((res) => setCatalog(res.data.medicines || []))
        .catch((err) => toast.error(err.response?.data?.message || 'Could not load medicines.')),
    ]).finally(() => setLoading(false));
  }, [appointmentId]);

  const applyTemplate = (id) => {
    const t = templates.find((x) => x._id === id);
    if (!t) return;
    setForm((f) => ({ ...f, ...t.fields, templateId: id }));
  };

  const applyMedicine = (index, medicine) => {
    setMeds((prev) => prev.map((row, idx) => (idx === index ? rowFromMedicine(medicine) : row)));
    setCatalog((prev) => {
      if (prev.some((item) => String(item._id) === String(medicine._id))) return prev;
      return [medicine, ...prev];
    });
  };

  const pickFromCatalog = (index, id) => {
    if (id === ADD_NEW_MEDICINE) {
      setAddRowIndex(index);
      setAddOpen(true);
      return;
    }
    const medicine = catalog.find((item) => String(item._id) === String(id));
    if (medicine) applyMedicine(index, medicine);
  };

  const medicineOptionsFor = (row) => {
    const options = catalog.map((item) => ({
      value: String(item._id),
      label: medicineLabel(item),
      description: item.genericName || '',
    }));
    const selectedId = row.medicineId ? String(row.medicineId) : '';
    if (selectedId && !options.some((opt) => opt.value === selectedId)) {
      options.unshift({ value: selectedId, label: row.name || 'Selected medicine' });
    }
    return options;
  };

  const save = async (status) => {
    setSaving(true);
    try {
      const patientId = form.patientId || appointment?.patientId?._id || appointment?.patientId;
      const res = await api.post('/consultations', {
        ...form,
        patientId,
        appointmentId,
        medicines: meds.filter((m) => m.name),
        status,
        createInvoice: status === 'completed' && createInvoice,
      });
      toast.success(status === 'completed' ? 'Consultation saved.' : 'Draft saved.');
      if (status === 'completed' && res.data.prescription) {
        window.open(ROUTES.print('prescription', res.data.prescription._id), '_blank');
      }
      navigate(ROUTES.doctorAppointmentDetail(appointmentId));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const patient = appointment?.patientId;

  if (loading) return <SkeletonDetail />;

  return (
    <div className="page-container relative">
      <LoadingOverlay show={saving} message="Saving…" />
      <PageHeader title="Consultation" description={patient?.name || ''} />
      <div className="card space-y-3 mb-4">
        <label className="label-field">Use template</label>
        <Dropdown
          value={form.templateId || ''}
          onChange={(id) => applyTemplate(id)}
          placeholder="Select template"
          ariaLabel="Template"
          options={templates.map((t) => ({ value: String(t._id), label: t.name }))}
        />
        {FIELDS.map(([k, label]) => (
          <div key={k}>
            <label className="label-field">{label}</label>
            <textarea className="input-field" rows={2} value={form[k] || ''} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
          </div>
        ))}
      </div>
      <div className="card space-y-3 mb-4">
        <p className="section-label">Prescription</p>
        {meds.map((m, i) => (
          <div key={i} className="grid sm:grid-cols-2 gap-2">
            <div className="sm:col-span-2">
              <Dropdown
                searchable
                value={m.medicineId ? String(m.medicineId) : ''}
                onChange={(id) => pickFromCatalog(i, id)}
                placeholder="Select medicine"
                searchPlaceholder="Type medicine name"
                ariaLabel={`Medicine ${i + 1}`}
                emptyMessage="No medicines"
                options={medicineOptionsFor(m)}
                footerOption={{ value: ADD_NEW_MEDICINE, label: 'Add New' }}
              />
            </div>
            <input className="input-field" placeholder="Dosage" value={m.dosage} onChange={(e) => setMeds((p) => p.map((r, idx) => idx === i ? { ...r, dosage: e.target.value } : r))} />
            <input className="input-field" placeholder="Frequency" value={m.frequency} onChange={(e) => setMeds((p) => p.map((r, idx) => idx === i ? { ...r, frequency: e.target.value } : r))} />
            <input className="input-field" placeholder="Duration" value={m.duration} onChange={(e) => setMeds((p) => p.map((r, idx) => idx === i ? { ...r, duration: e.target.value } : r))} />
            <input className="input-field" placeholder="Instructions" value={m.instructions} onChange={(e) => setMeds((p) => p.map((r, idx) => idx === i ? { ...r, instructions: e.target.value } : r))} />
          </div>
        ))}
        <button type="button" className="btn-secondary" onClick={() => setMeds((p) => [...p, { ...EMPTY_MED }])}>Add medicine</button>
      </div>
      <div className="mb-4">
        <Checkbox checked={createInvoice} onChange={(e) => setCreateInvoice(e.target.checked)}>
          Create consultation invoice when completing
        </Checkbox>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-secondary" disabled={saving} onClick={() => save('draft')}>Save draft</button>
        <button type="button" className="btn-primary" disabled={saving} onClick={() => save('completed')}>Complete consultation</button>
      </div>

      <MedicineFormModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSaved={(medicine) => {
          applyMedicine(addRowIndex, medicine);
          loadCatalog();
        }}
      />
    </div>
  );
}
