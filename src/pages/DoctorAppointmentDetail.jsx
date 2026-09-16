import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { format, isValid } from 'date-fns';
import {
  CheckCircle,
  Phone,
  Mail,
  XCircle,
  UserX,
  RefreshCw,
  MessageCircle,
  Printer,
  ListOrdered,
} from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import Datepicker from '../components/Datepicker';
import RequiredMark from '../components/ui/RequiredMark';
import { useAuth } from '../context/AuthContext';
import { useBranch } from '../context/BranchContext';
import { ACTIVE_APPOINTMENT_STATUSES } from '../constants/appointmentStatus';
import { ROUTES } from '../constants/routes';
import { patientDisplayName, confirmAction } from '../utils/display';
import StatusBadge from '../components/ui/StatusBadge';
import EmptyState from '../components/ui/EmptyState';
import UserAvatar from '../components/UserAvatar';
import { SkeletonDetail } from '../components/ui/Skeleton';
import LoadingOverlay from '../components/ui/LoadingOverlay';
import { normalizeAppointmentStatus } from '../constants/appointmentStatus';
import { can, P } from '../constants/permissions';

function Field({ label, children }) {
  return (
    <div>
      <p className="section-label mb-1">{label}</p>
      <p className="text-sm font-medium text-ink">{children}</p>
    </div>
  );
}

export default function DoctorAppointmentDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { branchId } = useBranch();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleSlot, setRescheduleSlot] = useState('');
  const [slots, setSlots] = useState([]);
  const [waBusy, setWaBusy] = useState(false);
  const [queueBusy, setQueueBusy] = useState(false);

  const load = useCallback(async () => {
    if (!id || id === 'new') {
      setLoading(false);
      setAppointment(null);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get(`/appointments/${id}`);
      setAppointment(res.data.appointment);
      setReminders(res.data.reminders || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Appointment not found.', {
        id: `appointment-${id}`,
      });
      setAppointment(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id === 'new') {
      navigate(ROUTES.doctorBook, { replace: true });
      return;
    }
    load();
  }, [id, load, navigate]);

  useEffect(() => {
    const doctorId =
      appointment?.doctor?._id ||
      appointment?.doctor?.id ||
      appointment?.doctor ||
      (user?.role === 'doctor' ? user?.id || user?._id : '');
    if (!rescheduleOpen || !rescheduleDate || !doctorId) return;
    const duration = appointment?.durationMinutes || 30;
    api
      .get(`/doctors/${doctorId}/availability`, {
        params: { date: rescheduleDate, durationMinutes: duration },
      })
      .then((res) => {
        setSlots(res.data.availableSlots || []);
        setRescheduleSlot('');
      })
      .catch(() => setSlots([]));
  }, [rescheduleOpen, rescheduleDate, user, appointment?.durationMinutes, appointment?.doctor]);

  const updateStatus = async (status, needsConfirm = false) => {
    if (needsConfirm && !confirmAction(`Mark this appointment as ${status.replace('_', '-')}?`)) {
      return;
    }
    setBusy(true);
    try {
      const res = await api.patch(`/appointments/${id}/status`, { status });
      setAppointment(res.data.appointment);
      toast.success('Status updated.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleReschedule = async (e) => {
    e.preventDefault();
    if (!rescheduleDate || !rescheduleSlot) {
      toast.error('Pick a date and time.');
      return;
    }
    setBusy(true);
    try {
      const res = await api.patch(`/appointments/${id}/reschedule`, {
        appointmentDate: rescheduleDate,
        timeSlot: rescheduleSlot,
      });
      setAppointment(res.data.appointment);
      setRescheduleOpen(false);
      toast.success('Rescheduled.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reschedule failed.');
    } finally {
      setBusy(false);
    }
  };

  const openWhatsApp = async () => {
    setWaBusy(true);
    try {
      const res = await api.get(`/appointments/${id}/whatsapp`);
      if (res.data.whatsappUrl) {
        window.open(res.data.whatsappUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not open WhatsApp.');
    } finally {
      setWaBusy(false);
    }
  };

  const checkInToQueue = async () => {
    if (!branchId && user?.role === 'doctor') {
      toast.error('Select a branch in the header first.');
      return;
    }
    const patient = appointment?.patientId || appointment?.patient;
    const patientId = patient?._id || patient?.id;
    if (!patientId) {
      toast.error('Patient missing on this appointment.');
      return;
    }
    setQueueBusy(true);
    try {
      const doctorRef = appointment?.doctor;
      const doctorId = doctorRef?._id || doctorRef?.id || doctorRef || undefined;
      const res = await api.post('/queue/check-in', {
        patientId,
        appointmentId: id,
        ...(doctorId ? { doctorId } : {}),
      });
      toast.success(
        res.data.alreadyCheckedIn
          ? `Already in queue · Token ${res.data.ticket.tokenLabel}`
          : `Checked in · Token ${res.data.ticket.tokenLabel}`
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Queue check-in failed.');
    } finally {
      setQueueBusy(false);
    }
  };

  if (loading) {
    return <SkeletonDetail />;
  }

  if (!appointment) {
    return (
      <div className="page-container">
        <EmptyState
          title="Appointment not found"
          description="This visit may have been removed or you may not have access."
          action={
            <Link to={ROUTES.doctorDashboard} className="btn-primary text-sm">
              Back to dashboard
            </Link>
          }
        />
      </div>
    );
  }

  const patient = appointment.patientId || appointment.patient;
  const patientId = patient?._id || patient?.id;
  const doctor = appointment.doctor;
  const status = normalizeAppointmentStatus(appointment.status);
  const canManage = can(user, P.APPOINTMENTS_MANAGE);
  const canQueue = can(user, P.QUEUE_MANAGE);
  const canAct = canManage && ACTIVE_APPOINTMENT_STATUSES.includes(status);
  const dateObj = new Date(appointment.appointmentDate);

  return (
    <div className="page-container relative">
      <LoadingOverlay show={busy || queueBusy} message="Updating…" />
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h2 className="page-title">Appointment</h2>
            <StatusBadge status={status} />
          </div>
          <p className="text-sm text-ink-muted">
            {isValid(dateObj) ? format(dateObj, 'EEEE, MMMM d, yyyy') : '—'} · {appointment.timeSlot}
            {doctor?.name ? ` · Dr. ${String(doctor.name).replace(/^Dr\.?\s*/i, '')}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Link
            to={ROUTES.print('appointment_slip', id)}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary"
          >
            <Printer className="w-4 h-4" /> Print slip
          </Link>
          {patient?.phone && (
            <button
              type="button"
              className="btn-whatsapp"
              disabled={waBusy}
              onClick={openWhatsApp}
            >
              <MessageCircle className="w-4 h-4" />
              {waBusy ? 'Opening…' : 'Notify on WhatsApp'}
            </button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <section className="card">
          <p className="section-label mb-3">Patient</p>
          <div className="flex items-start gap-3">
            <UserAvatar name={patientDisplayName(patient)} profilePhoto={patient?.profilePhoto} size="md" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-ink">{patientDisplayName(patient)}</p>
              {patient?.patientCode && (
                <p className="text-xs font-mono text-ink-faint mt-0.5">{patient.patientCode}</p>
              )}
              <div className="mt-2 flex flex-col gap-1 text-sm text-ink-muted">
                {patient?.phone && (
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" /> {patient.phone}
                  </span>
                )}
                {patient?.email && (
                  <span className="inline-flex items-center gap-1.5 truncate">
                    <Mail className="w-3.5 h-3.5" /> {patient.email}
                  </span>
                )}
              </div>
              {patientId && (
                <Link
                  to={ROUTES.doctorPatientDetail(patientId)}
                  className="btn-secondary btn-sm !py-1.5 text-xs mt-3 inline-flex"
                >
                  View patient record
                </Link>
              )}
            </div>
          </div>
        </section>

        <section className="card">
          <p className="section-label mb-3">Visit summary</p>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Date">
              {isValid(dateObj) ? format(dateObj, 'MMM d, yyyy') : '—'}
            </Field>
            <Field label="Time">{appointment.timeSlot}</Field>
            <Field label="Duration">{appointment.durationMinutes || 30} min</Field>
            <Field label="Type">{appointment.appointmentType || 'Consultation'}</Field>
            <Field label="Doctor">
              {doctor?.name ? `Dr. ${String(doctor.name).replace(/^Dr\.?\s*/i, '')}` : user?.name || '—'}
            </Field>
            <Field label="Status">
              <StatusBadge status={status} />
            </Field>
          </div>
        </section>
      </div>

      <section className="card mb-4">
        <p className="section-label mb-3">Visit information</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium text-ink-muted mb-1">Reason</p>
            <p className="text-sm text-ink">{appointment.reason || '—'}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-ink-muted mb-1">Notes</p>
            <p className="text-sm text-ink whitespace-pre-wrap">{appointment.notes || '—'}</p>
          </div>
        </div>
        {patientId && (
          <p className="text-xs text-ink-faint mt-4">
            Full history, medications, and clinical notes live on the{' '}
            <Link to={ROUTES.doctorPatientDetail(patientId)} className="text-accent-700 font-medium hover:underline">
              patient record
            </Link>
            .
          </p>
        )}
      </section>

      {canAct && (
        <section className="card mb-4">
          <p className="section-label mb-3">Actions</p>
          <div className="flex flex-wrap gap-2">
            {user?.role === 'doctor' && (
              <Link to={ROUTES.doctorConsult(id)} className="btn-primary">
                Start consultation
              </Link>
            )}
            {canQueue && (
              <button
                type="button"
                className="btn-secondary"
                disabled={busy || queueBusy}
                onClick={checkInToQueue}
              >
                <ListOrdered className="w-4 h-4" />
                {queueBusy ? 'Checking in…' : 'Check in to queue'}
              </button>
            )}
            <button
              type="button"
              className="btn-primary"
              disabled={busy}
              onClick={() => updateStatus('completed', true)}
            >
              <CheckCircle className="w-4 h-4" /> Complete visit
            </button>
            {status !== 'confirmed' && (
              <button
                type="button"
                className="btn-secondary"
                disabled={busy}
                onClick={() => updateStatus('confirmed')}
              >
                Confirm
              </button>
            )}
            <button
              type="button"
              className="btn-secondary"
              disabled={busy}
              onClick={() => {
                setRescheduleOpen((v) => !v);
                setRescheduleDate(isValid(dateObj) ? format(dateObj, 'yyyy-MM-dd') : '');
              }}
            >
              <RefreshCw className="w-4 h-4" /> Reschedule
            </button>
            <button
              type="button"
              className="btn-secondary"
              disabled={busy}
              title="Patient was expected but did not come. This visit is closed."
              onClick={() => updateStatus('no_show', true)}
            >
              <UserX className="w-4 h-4" /> Didn't arrive
            </button>
            <button
              type="button"
              className="btn-danger"
              disabled={busy}
              onClick={() => updateStatus('cancelled', true)}
            >
              <XCircle className="w-4 h-4" /> Cancel
            </button>
          </div>

          {rescheduleOpen && (
            <form onSubmit={handleReschedule} className="mt-4 pt-4 border-t border-line space-y-3">
              <div>
                <label className="label-field">New date <RequiredMark /></label>
                <Datepicker value={rescheduleDate} onChange={setRescheduleDate} required />
              </div>
              {rescheduleDate && (
                <div className="flex flex-wrap gap-2">
                  {slots.length === 0 ? (
                    <p className="text-sm text-ink-muted">No free slots this day.</p>
                  ) : (
                    slots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setRescheduleSlot(slot)}
                        className={`slot-chip ${
                          rescheduleSlot === slot
                            ? 'bg-ink text-white ring-ink'
                            : 'bg-white text-ink ring-line hover:ring-accent-400'
                        }`}
                      >
                        {slot}
                      </button>
                    ))
                  )}
                </div>
              )}
              <button type="submit" className="btn-primary" disabled={busy}>
                Save new time
              </button>
            </form>
          )}
        </section>
      )}

      <section className="card">
        <p className="section-label mb-3">Reminders</p>
        {reminders.length === 0 ? (
          <p className="text-sm text-ink-muted">No reminder logs for this visit.</p>
        ) : (
          <ul className="divide-y divide-line">
            {reminders.map((r) => {
              const when = r.scheduledAt ? new Date(r.scheduledAt) : null;
              return (
                <li key={r._id} className="py-2.5 first:pt-0 last:pb-0 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-ink capitalize">
                      {r.notificationType?.replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs text-ink-faint mt-0.5">
                      {when && isValid(when) ? format(when, 'PPp') : '—'}
                      {r.channel ? ` · ${r.channel}` : ''}
                    </p>
                  </div>
                  <span className="status-badge bg-[#f3efe8] text-ink-muted ring-line capitalize">{r.status}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
