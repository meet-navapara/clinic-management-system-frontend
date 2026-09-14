import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import PageHeader from '../components/ui/PageHeader';
import { ROUTES } from '../constants/routes';

const FIELDS = [
  ['chiefComplaint', 'Chief complaint'],
  ['symptoms', 'Symptoms'],
  ['observation', 'Observation'],
  ['diagnosis', 'Diagnosis'],
  ['treatment', 'Treatment'],
  ['advice', 'Advice'],
  ['followUp', 'Follow-up'],
];

export default function ConsultationPage() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [form, setForm] = useState({});
  const [meds, setMeds] = useState([{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
  const [q, setQ] = useState('');
  const [hits, setHits] = useState([]);
  const [hitIndex, setHitIndex] = useState(0);
  const [createInvoice, setCreateInvoice] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get(`/appointments/${appointmentId}`).then((res) => {
      setAppointment(res.data.appointment);
      const p = res.data.appointment?.patientId;
      setForm((f) => ({ ...f, patientId: p?._id || p, appointmentId }));
    }).catch(() => toast.error('Appointment not found.'));
    api.get('/consultations/appointment/' + appointmentId).then((res) => {
      if (res.data.consultation) setForm((f) => ({ ...f, ...res.data.consultation }));
      if (res.data.prescription?.items?.length) setMeds(res.data.prescription.items);
    }).catch(() => {});
    api.get('/templates', { params: { type: 'consultation' } }).then((res) => setTemplates(res.data.templates || [])).catch(() => {});
  }, [appointmentId]);

  useEffect(() => {
    if (q.trim().length < 2) {
      setHits([]);
      return;
    }
    const t = setTimeout(() => {
      api.get('/medicines/search', { params: { q } }).then((res) => setHits(res.data.medicines || [])).catch(() => {});
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  const applyTemplate = (id) => {
    const t = templates.find((x) => x._id === id);
    if (!t) return;
    setForm((f) => ({ ...f, ...t.fields, templateId: id }));
  };

  const pickMed = (m) => {
    const strength = [m.strength, m.strengthUnit].filter(Boolean).join(' ');
    setMeds((prev) => {
      const next = [...prev];
      next[hitIndex] = {
        medicineId: m._id,
        name: `${m.name} ${strength}`.trim(),
        genericName: m.genericName || '',
        dosage: m.defaultDosage || '',
        frequency: m.defaultFrequency || '',
        duration: m.defaultDuration || '',
        instructions: m.instructions || '',
      };
      return next;
    });
    setQ('');
    setHits([]);
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

  return (
    <div className="page-container max-w-3xl">
      <PageHeader title="Consultation" description={patient?.name || ''} />
      <div className="card space-y-3 mb-4">
        <label className="label-field">Use template</label>
        <select className="input-field" onChange={(e) => applyTemplate(e.target.value)} defaultValue="">
          <option value="">Select template</option>
          {templates.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
        </select>
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
            <input
              className="input-field sm:col-span-2"
              placeholder="Medicine name — type to search"
              value={m.name}
              onChange={(e) => {
                setHitIndex(i);
                setQ(e.target.value);
                setMeds((prev) => prev.map((row, idx) => (idx === i ? { ...row, name: e.target.value } : row)));
              }}
            />
            {hitIndex === i && hits.length > 0 && (
              <div className="sm:col-span-2 border border-line rounded-lg overflow-hidden">
                {hits.map((h) => (
                  <button type="button" key={h._id} className="w-full text-left px-3 py-2 text-sm hover:bg-[#f3efe8]" onClick={() => pickMed(h)}>
                    {h.name} {[h.strength, h.strengthUnit].filter(Boolean).join(' ')}{' '}
                    {h.genericName ? `· ${h.genericName}` : ''}
                  </button>
                ))}
              </div>
            )}
            <input className="input-field" placeholder="Dosage" value={m.dosage} onChange={(e) => setMeds((p) => p.map((r, idx) => idx === i ? { ...r, dosage: e.target.value } : r))} />
            <input className="input-field" placeholder="Frequency" value={m.frequency} onChange={(e) => setMeds((p) => p.map((r, idx) => idx === i ? { ...r, frequency: e.target.value } : r))} />
            <input className="input-field" placeholder="Duration" value={m.duration} onChange={(e) => setMeds((p) => p.map((r, idx) => idx === i ? { ...r, duration: e.target.value } : r))} />
            <input className="input-field" placeholder="Instructions" value={m.instructions} onChange={(e) => setMeds((p) => p.map((r, idx) => idx === i ? { ...r, instructions: e.target.value } : r))} />
          </div>
        ))}
        <button type="button" className="btn-secondary" onClick={() => setMeds((p) => [...p, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }])}>Add medicine</button>
      </div>
      <label className="flex items-center gap-2 text-sm mb-4">
        <input type="checkbox" checked={createInvoice} onChange={(e) => setCreateInvoice(e.target.checked)} />
        Create consultation invoice when completing
      </label>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-secondary" disabled={saving} onClick={() => save('draft')}>Save draft</button>
        <button type="button" className="btn-primary" disabled={saving} onClick={() => save('completed')}>Complete consultation</button>
      </div>
    </div>
  );
}
