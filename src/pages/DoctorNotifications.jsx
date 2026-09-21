import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { format, isValid } from 'date-fns';
import { MessageCircle } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonRows } from '../components/ui/Skeleton';
import Pagination from '../components/ui/Pagination';
import PageHeader from '../components/ui/PageHeader';
import Dropdown from '../components/ui/Dropdown';
import { ROUTES } from '../constants/routes';
import { useBranch } from '../context/BranchContext';
import { PAGE_SIZE } from '../constants/pagination';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'sent', label: 'Sent' },
  { value: 'failed', label: 'Failed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const TYPE_OPTIONS = [
  { value: '', label: 'All types' },
  { value: 'appointment_confirmation', label: 'Confirmation' },
  { value: 'appointment_reminder', label: 'Reminder' },
];

function appointmentIdOf(n) {
  const raw = n.appointmentId;
  if (!raw) return null;
  return raw._id || raw.id || raw;
}

function patientIdOf(n) {
  const fromLog = n.patientId;
  if (fromLog) return fromLog._id || fromLog.id || fromLog;
  const fromAppt = n.appointmentId?.patientId;
  if (!fromAppt) return null;
  return fromAppt._id || fromAppt.id || fromAppt;
}

function typeLabel(type) {
  if (type === 'appointment_confirmation') return 'Confirmation';
  if (type === 'appointment_reminder') return 'Reminder';
  return type ? String(type).replace(/_/g, ' ') : 'Reminder';
}

export default function DoctorNotifications() {
  const { branchId } = useBranch();
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [waBusyId, setWaBusyId] = useState(null);
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');

  const load = useCallback(
    (p = 1) => {
      setLoading(true);
      api
        .get('/notifications', {
          params: {
            page: p,
            limit: PAGE_SIZE,
            ...(status ? { status } : {}),
            ...(type ? { type } : {}),
          },
        })
        .then((res) => {
          setItems(res.data.notifications || []);
          setPage(res.data.page || p);
          setPages(res.data.pages || 1);
          setTotal(res.data.total || 0);
        })
        .catch(() => toast.error('Could not load reminders.'))
        .finally(() => setLoading(false));
    },
    [status, type]
  );

  useEffect(() => {
    load(1);
  }, [branchId, load]);

  const openWhatsApp = async (n) => {
    const aid = appointmentIdOf(n);
    if (!aid) {
      toast.error('No appointment linked to this reminder.');
      return;
    }
    setWaBusyId(n._id);
    try {
      await api.post(`/appointments/${aid}/whatsapp`);
      toast.success('WhatsApp template sent to the patient.');
      load(page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not send WhatsApp.');
    } finally {
      setWaBusyId(null);
    }
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Reminders"
        description="WhatsApp confirmation and reminder delivery log. Practice activity alerts are in Inbox."
        actions={
          <Link to={ROUTES.doctorInbox} className="btn-secondary">
            Inbox
          </Link>
        }
      />

      <div className="mb-4 grid sm:grid-cols-2 gap-3 max-w-xl">
        <div>
          <label className="label-field" htmlFor="reminder-status">
            Status
          </label>
          <Dropdown
            id="reminder-status"
            value={status}
            onChange={setStatus}
            options={STATUS_OPTIONS}
            ariaLabel="Filter by status"
          />
        </div>
        <div>
          <label className="label-field" htmlFor="reminder-type">
            Type
          </label>
          <Dropdown
            id="reminder-type"
            value={type}
            onChange={setType}
            options={TYPE_OPTIONS}
            ariaLabel="Filter by type"
          />
        </div>
      </div>

      {loading ? (
        <SkeletonRows count={PAGE_SIZE} />
      ) : items.length === 0 ? (
        <EmptyState
          title="No reminders found"
          description={
            status || type
              ? 'Try a different filter, or schedule a visit to create reminders.'
              : 'They appear after you schedule a visit.'
          }
        />
      ) : (
        <div className="card !p-0 overflow-hidden divide-y divide-line">
          {items.map((n) => {
            const scheduled = n.scheduledAt ? new Date(n.scheduledAt) : null;
            const aid = appointmentIdOf(n);
            const pid = patientIdOf(n);
            const phone = n.recipientPhone || n.appointmentId?.patientId?.phone;
            return (
              <article key={n._id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-ink">
                      {n.recipientName || n.appointmentId?.patientId?.name || 'Patient'}
                      {phone ? ` · ${phone}` : ''}
                    </p>
                    <p className="text-xs text-ink-faint mt-0.5 capitalize">
                      {typeLabel(n.notificationType)}
                      {n.channel ? ` · ${n.channel}` : ''}
                      {n.provider && n.provider !== 'internal' ? ` · ${n.provider}` : ''}
                    </p>
                    <p className="text-sm text-ink-muted mt-0.5">{n.message}</p>
                    {n.status === 'failed' && n.error ? (
                      <p className="text-xs text-red-600 mt-1">{n.error}</p>
                    ) : null}
                    <p className="text-xs text-ink-faint mt-1.5">
                      {scheduled && isValid(scheduled) ? format(scheduled, 'PPp') : '—'}
                    </p>
                  </div>
                  <span className="status-badge bg-[#f3efe8] text-ink-muted ring-line capitalize shrink-0">
                    {n.status}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {aid && (
                    <Link to={ROUTES.doctorAppointmentDetail(aid)} className="btn-secondary btn-sm">
                      Open appointment
                    </Link>
                  )}
                  {pid && (
                    <Link to={ROUTES.doctorPatientDetail(pid)} className="btn-secondary btn-sm">
                      Patient chart
                    </Link>
                  )}
                  {phone && (
                    <button
                      type="button"
                      className="btn-whatsapp btn-sm"
                      disabled={waBusyId === n._id}
                      onClick={() => openWhatsApp(n)}
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      {waBusyId === n._id ? 'Sending…' : 'Send WhatsApp'}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Pagination page={page} pages={pages} total={total} limit={PAGE_SIZE} onPage={load} />
    </div>
  );
}
