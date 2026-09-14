import { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { format, isValid, differenceInYears } from 'date-fns';
import {
  CalendarPlus,
  Phone,
  Mail,
  AlertTriangle,
  Plus,
} from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import PageLoader from '../components/PageLoader';
import { patientDisplayName, formatPatientCode } from '../utils/display';
import { ROUTES } from '../constants/routes';
import Dropdown from '../components/ui/Dropdown';
import DobDatepicker from '../components/DobDatepicker';
import UserAvatar from '../components/UserAvatar';
import StatusBadge from '../components/ui/StatusBadge';
import EmptyState from '../components/ui/EmptyState';
import RequiredMark from '../components/ui/RequiredMark';
import { normalizeIndianMobile, isValidEmail } from '../utils/validation';

const TABS = [
  'overview',
  'appointments',
  'medical',
  'medications',
  'allergies',
  'notes',
  'billing',
  'timeline',
];

function ageLabel(patient) {
  if (patient.age != null) return `${patient.age} yrs`;
  if (patient.dateOfBirth && isValid(new Date(patient.dateOfBirth))) {
    return `${differenceInYears(new Date(), new Date(patient.dateOfBirth))} yrs`;
  }
  return null;
}

export default function DoctorPatientDetail() {
  const { id } = useParams();
  const [tab, setTab] = useState('overview');
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState({ upcoming: [], past: [] });
  const [notes, setNotes] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [noteBody, setNoteBody] = useState('');
  const [form, setForm] = useState({});

  const load = useCallback(async () => {
    try {
      const res = await api.get(`/patients/${id}`);
      setPatient(res.data.patient);
      setAppointments(res.data.appointments || { upcoming: [], past: [] });
      setNotes(res.data.notes || []);
      setTimeline(res.data.timeline || []);
      api.get(`/billing/patient/${id}`).then((b) => setInvoices(b.data.invoices || [])).catch(() => setInvoices([]));
      const p = res.data.patient;
      setForm({
        firstName: p.firstName || '',
        lastName: p.lastName || '',
        preferredName: p.preferredName || '',
        phone: p.phone || '',
        email: p.email || '',
        gender: p.gender || '',
        dateOfBirth: p.dateOfBirth ? format(new Date(p.dateOfBirth), 'yyyy-MM-dd') : '',
        address: p.address || '',
        city: p.city || '',
        state: p.state || '',
        postalCode: p.postalCode || '',
        emergencyContactName: p.emergencyContact?.name || '',
        emergencyContactRelationship: p.emergencyContact?.relationship || '',
        emergencyContactPhone: p.emergencyContact?.phone || '',
        allergies: (p.clinical?.allergies || []).join(', '),
        conditions: (p.clinical?.conditions || []).join(', '),
        medications: (p.clinical?.medications || []).join(', '),
        alerts: (p.clinical?.alerts || []).join(', '),
        medicalHistory: p.clinical?.medicalHistory || p.medicalHistory || '',
        familyHistory: p.clinical?.familyHistory || '',
        surgeries: p.clinical?.surgeries || '',
        notes: p.notes || '',
      });
    } catch {
      toast.error('Patient not found.');
      setPatient(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const saveProfile = async (e) => {
    e.preventDefault();
    const phone = normalizeIndianMobile(form.phone);
    if (!phone) {
      toast.error('Mobile number must contain exactly 10 digits (+91).');
      return;
    }
    if (form.email && !isValidEmail(form.email)) {
      toast.error('Email address is invalid.');
      return;
    }
    setSaving(true);
    try {
      const res = await api.put(`/patients/${id}`, {
        ...form,
        phone,
        allergies: form.allergies,
        conditions: form.conditions,
        medications: form.medications,
        alerts: form.alerts,
      });
      setPatient(res.data.patient);
      toast.success('Patient updated successfully.');
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update patient.');
    } finally {
      setSaving(false);
    }
  };

  const addNote = async (e) => {
    e.preventDefault();
    if (!noteBody.trim()) return;
    try {
      await api.post(`/patients/${id}/notes`, { body: noteBody.trim() });
      setNoteBody('');
      toast.success('Note added.');
      await load();
      setTab('notes');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not add note.');
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <PageLoader message="Loading patient..." compact />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="page-container">
        <EmptyState
          title="Patient not found"
          description="This record may have been removed or you do not have access."
          action={
            <Link to={ROUTES.doctorPatients} className="btn-primary text-sm">
              Back to patients
            </Link>
          }
        />
      </div>
    );
  }

  const alerts = patient.clinical?.alerts || [];
  const age = ageLabel(patient);

  return (
    <div className="page-container">
      <div className="card mb-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <UserAvatar name={patientDisplayName(patient)} size="lg" />
            <div className="min-w-0">
              <p className="text-xs font-mono text-ink-faint mb-0.5">
                {formatPatientCode(patient.patientCode)}
              </p>
              <h2 className="text-lg sm:text-xl font-semibold text-ink">
                {patientDisplayName(patient)}
              </h2>
              {patient.createdAt && isValid(new Date(patient.createdAt)) && (
                <p className="text-xs text-ink-faint mt-1">
                  Registered: {format(new Date(patient.createdAt), 'd MMM yyyy, h:mm a')}
                </p>
              )}
              <p className="text-sm text-ink-muted mt-1 flex flex-wrap gap-x-3 gap-y-1">
                {age && <span>{age}</span>}
                {patient.gender && <span className="capitalize">{patient.gender.replace(/_/g, ' ')}</span>}
                {patient.phone && (
                  <span className="inline-flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" /> {patient.phone}
                  </span>
                )}
                {patient.email && (
                  <span className="inline-flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" /> {patient.email}
                  </span>
                )}
              </p>
              {alerts.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {alerts.map((a) => (
                    <span
                      key={a}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#f8eeee] text-[#8a3a32] ring-1 ring-[#e4c9c6]"
                    >
                      <AlertTriangle className="w-3 h-3" /> {a}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <Link
            to={`${ROUTES.doctorBook}?patientId=${patient._id}`}
            className="btn-primary shrink-0"
          >
            <CalendarPlus className="w-4 h-4" /> Schedule
          </Link>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto mb-4 pb-1">
        {TABS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`tab-chip ${
              tab === key ? 'bg-ink text-white' : 'bg-white text-ink-muted ring-1 ring-line'
            }`}
          >
            {key === 'medical' ? 'History' : key}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <form onSubmit={saveProfile} className="card space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              ['firstName', 'First name', 'text', true],
              ['lastName', 'Last name', 'text', true],
              ['preferredName', 'Preferred name'],
              ['phone', 'Phone', 'tel', true],
              ['email', 'Email', 'email'],
              ['dateOfBirth', 'Date of birth', 'dob'],
              ['gender', 'Gender', 'select', true],
              ['address', 'Address'],
              ['city', 'City'],
              ['state', 'State'],
              ['postalCode', 'ZIP / Postal'],
              ['emergencyContactName', 'Emergency contact'],
              ['emergencyContactRelationship', 'Relationship'],
              ['emergencyContactPhone', 'Emergency phone', 'tel'],
            ].map(([key, label, type, required]) => (
              <label key={key} htmlFor={`edit-${key}`} className="block text-sm">
                <span className="text-gray-600 font-medium">
                  {label} {required ? <RequiredMark /> : null}
                </span>
                {type === 'select' ? (
                  <Dropdown
                    id={`edit-${key}`}
                    className="mt-1"
                    required={required}
                    value={form[key]}
                    onChange={(next) => setForm({ ...form, [key]: next })}
                    placeholder="—"
                    ariaLabel={label}
                    options={[
                      { value: 'female', label: 'Female' },
                      { value: 'male', label: 'Male' },
                      { value: 'other', label: 'Other' },
                      { value: 'prefer_not_to_say', label: 'Prefer not to say' },
                    ]}
                  />
                ) : type === 'dob' ? (
                  <DobDatepicker
                    id={`edit-${key}`}
                    className="mt-1 w-full"
                    value={form[key]}
                    onChange={(next) => setForm({ ...form, [key]: next })}
                  />
                ) : (
                  <input
                    id={`edit-${key}`}
                    type={type || 'text'}
                    inputMode={type === 'tel' ? 'numeric' : undefined}
                    className="input-field mt-1"
                    value={form[key]}
                    required={required}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  />
                )}
              </label>
            ))}
          </div>
          <label className="block text-sm">
            <span className="text-gray-600 font-medium">Important alerts</span>
            <input
              className="input-field mt-1"
              placeholder="Comma-separated"
              value={form.alerts}
              onChange={(e) => setForm({ ...form, alerts: e.target.value })}
            />
          </label>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      )}

      {tab === 'appointments' && (
        <div className="space-y-4">
          <section className="card">
            <h3 className="text-sm font-semibold mb-3">Upcoming</h3>
            {!appointments.upcoming?.length ? (
              <p className="text-sm text-gray-500">No upcoming appointments.</p>
            ) : (
              <ul className="space-y-2">
                {appointments.upcoming.map((a) => (
                    <li key={a._id}>
                      <Link
                        to={ROUTES.doctorAppointmentDetail(a._id)}
                        className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 hover:bg-[#faf8f3]"
                      >
                        <span className="text-sm">
                          {isValid(new Date(a.appointmentDate))
                            ? format(new Date(a.appointmentDate), 'PPP')
                            : '—'}{' '}
                          · {a.timeSlot}
                        </span>
                        <StatusBadge status={a.status} />
                      </Link>
                    </li>
                  ))}
              </ul>
            )}
          </section>
          <section className="card">
            <h3 className="text-sm font-semibold mb-3">Past</h3>
            {!appointments.past?.length ? (
              <p className="text-sm text-gray-500">No past appointments.</p>
            ) : (
              <ul className="space-y-2">
                {appointments.past.map((a) => (
                    <li key={a._id}>
                      <Link
                        to={ROUTES.doctorAppointmentDetail(a._id)}
                        className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 hover:bg-[#faf8f3]"
                      >
                        <span className="text-sm">
                          {isValid(new Date(a.appointmentDate))
                            ? format(new Date(a.appointmentDate), 'PPP')
                            : '—'}{' '}
                          · {a.timeSlot}
                        </span>
                        <StatusBadge status={a.status} />
                      </Link>
                    </li>
                  ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {tab === 'medical' && (
        <form onSubmit={saveProfile} className="card space-y-3">
          <label className="block text-sm">
            <span className="font-medium text-ink">Conditions</span>
            <input
              className="input-field mt-1"
              value={form.conditions}
              onChange={(e) => setForm({ ...form, conditions: e.target.value })}
              placeholder="Comma-separated"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-ink">Medical history</span>
            <textarea
              className="input-field mt-1 min-h-[100px]"
              value={form.medicalHistory}
              onChange={(e) => setForm({ ...form, medicalHistory: e.target.value })}
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-ink">Family history</span>
            <textarea
              className="input-field mt-1 min-h-[80px]"
              value={form.familyHistory}
              onChange={(e) => setForm({ ...form, familyHistory: e.target.value })}
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-ink">Surgeries / procedures</span>
            <textarea
              className="input-field mt-1 min-h-[80px]"
              value={form.surgeries}
              onChange={(e) => setForm({ ...form, surgeries: e.target.value })}
            />
          </label>
          <button type="submit" className="btn-primary" disabled={saving}>
            Save
          </button>
        </form>
      )}

      {tab === 'medications' && (
        <form onSubmit={saveProfile} className="card space-y-3">
          <label className="block text-sm">
            <span className="font-medium text-ink">Current medications</span>
            <textarea
              className="input-field mt-1 min-h-[120px]"
              value={form.medications}
              onChange={(e) => setForm({ ...form, medications: e.target.value })}
              placeholder="One per line or comma-separated"
            />
          </label>
          <button type="submit" className="btn-primary" disabled={saving}>
            Save
          </button>
        </form>
      )}

      {tab === 'allergies' && (
        <form onSubmit={saveProfile} className="card space-y-3">
          <label className="block text-sm">
            <span className="font-medium text-ink">Allergies</span>
            <textarea
              className="input-field mt-1 min-h-[100px]"
              value={form.allergies}
              onChange={(e) => setForm({ ...form, allergies: e.target.value })}
              placeholder="Comma-separated"
            />
          </label>
          <button type="submit" className="btn-primary" disabled={saving}>
            Save
          </button>
        </form>
      )}

      {tab === 'notes' && (
        <div className="space-y-4">
          <form onSubmit={addNote} className="card space-y-3">
            <label className="block text-sm">
              <span className="font-medium text-ink">Add note <RequiredMark /></span>
              <textarea
                className="input-field mt-1 min-h-[90px]"
                value={noteBody}
                onChange={(e) => setNoteBody(e.target.value)}
                required
              />
            </label>
            <button type="submit" className="btn-primary !py-2 text-sm inline-flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> Add note
            </button>
          </form>
          <div className="space-y-2">
            {notes.length === 0 ? (
              <p className="text-sm text-gray-500 card">No clinical notes yet.</p>
            ) : (
              notes.map((n) => (
                <article key={n._id} className="card !p-4">
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{n.body}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {n.createdAt && isValid(new Date(n.createdAt))
                      ? format(new Date(n.createdAt), 'PPp')
                      : ''}
                  </p>
                </article>
              ))
            )}
          </div>
        </div>
      )}

      {tab === 'billing' && (
        <div className="space-y-2">
          <Link to={ROUTES.billingNew} className="btn-primary inline-flex mb-2">New invoice</Link>
          {!invoices.length ? (
            <p className="text-sm text-ink-muted card">No billing history.</p>
          ) : (
            invoices.map((inv) => (
              <Link key={inv._id} to={ROUTES.invoice(inv._id)} className="card !p-4 flex justify-between gap-3">
                <div>
                  <p className="font-medium">{inv.invoiceNumber}</p>
                  <p className="text-xs text-ink-faint">
                    {inv.invoiceDate && isValid(new Date(inv.invoiceDate))
                      ? format(new Date(inv.invoiceDate), 'dd MMM yyyy')
                      : ''}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p>₹{inv.total} · paid ₹{inv.paidAmount}</p>
                  {Number(inv.refundedAmount) > 0 ? (
                    <p className="text-ink-muted">refunded ₹{inv.refundedAmount}</p>
                  ) : null}
                  <p className="text-ink-muted capitalize">{inv.paymentStatus?.replace('_', ' ')}</p>
                </div>
              </Link>
            ))
          )}
        </div>
      )}

      {tab === 'timeline' && (
        <div className="card">
          {!timeline.length ? (
            <p className="text-sm text-gray-500">No timeline events yet.</p>
          ) : (
            <ol className="relative border-l border-[#ebe4d8] ml-2 space-y-4">
              {timeline.map((ev) => (
                <li key={ev._id} className="ml-4">
                  <div className="absolute -left-1.5 mt-1.5 w-3 h-3 rounded-full bg-[#d4af37] ring-4 ring-[#faf7f2]" />
                  <p className="text-sm font-semibold text-gray-900">{ev.title}</p>
                  {ev.detail && <p className="text-sm text-gray-600 mt-0.5">{ev.detail}</p>}
                  <p className="text-xs text-gray-400 mt-1">
                    {ev.createdAt && isValid(new Date(ev.createdAt))
                      ? format(new Date(ev.createdAt), 'PPp')
                      : ''}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}
