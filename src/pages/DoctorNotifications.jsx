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

const STATUS_TONE = {
  scheduled: 'bg-[#f4f0e8] text-[#6b6254] border-[#e2d8c4]',
  sent: 'bg-[#ecf7f1] text-[#18794a] border-[#b9dfc8]',
  failed: 'bg-[#fdf0ee] text-[#9b2c2c] border-[#e8c5c0]',
  cancelled: 'bg-[#f3f3f4] text-[#6b7280] border-[#e0e0e3]',
};

const TYPE_TONE = {
  Confirmation: 'bg-[#ecf7f1] text-[#18794a] border-[#b9dfc8]',
  Reminder: 'bg-[#eef3f9] text-[#2f5f8f] border-[#c5d5e8]',
};

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

function visitLabel(n) {
  const d = n.appointmentId?.appointmentDate ? new Date(n.appointmentId.appointmentDate) : null;
  if (!d || !isValid(d)) return '—';
  const date = format(d, 'MMM d');
  const time = n.appointmentId?.timeSlot;
  return time ? `${date} · ${time}` : date;
}

function Chip({ children, className = '' }) {
  return (
    <span
      className={`inline-flex items-center justify-center w-[7.25rem] h-7 px-2 rounded-full text-[10px] font-bold uppercase tracking-[0.08em] border ${className}`}
    >
      {children}
    </span>
  );
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
      toast.success('WhatsApp sent.');
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
        description="WhatsApp confirmations and visit reminders."
        actions={
          <Link to={ROUTES.doctorInbox} className="btn-secondary w-full sm:w-auto justify-center basis-full sm:basis-auto">
            Inbox
          </Link>
        }
        toolbar={
          <>
            <div className="min-w-0 flex-1 sm:flex-none sm:w-44">
              <label className="sr-only" htmlFor="reminder-status">
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
            <div className="min-w-0 flex-1 sm:flex-none sm:w-44">
              <label className="sr-only" htmlFor="reminder-type">
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
          </>
        }
      />

      {loading ? (
        <SkeletonRows count={PAGE_SIZE} />
      ) : items.length === 0 ? (
        <EmptyState
          title="No reminders"
          description={
            status || type
              ? 'Try a different filter.'
              : 'Reminders appear after you schedule a visit.'
          }
        />
      ) : (
        <>
          {/* Desktop / tablet table — fixed columns + full grid borders */}
          <div className="hidden md:block overflow-hidden rounded-xl border border-[#d8d2c8] bg-white shadow-[0_1px_2px_rgba(28,36,48,0.04)]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[56rem] table-fixed border-collapse text-sm">
                <colgroup>
                  <col className="w-[18%]" />
                  <col className="w-[14%]" />
                  <col className="w-[14%]" />
                  <col className="w-[14%]" />
                  <col className="w-[14%]" />
                  <col className="w-[26%]" />
                </colgroup>
                <thead>
                  <tr className="bg-[#f3efe8]">
                    {['Patient', 'Phone', 'Type', 'Visit', 'Status', 'Actions'].map((label) => (
                      <th
                        key={label}
                        className="px-3 py-3 text-left text-[11px] font-bold uppercase tracking-[0.1em] text-[#6b6254] border-b border-[#d8d2c8] border-r border-[#e4dfd6] last:border-r-0 whitespace-nowrap"
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((n, idx) => {
                    const aid = appointmentIdOf(n);
                    const pid = patientIdOf(n);
                    const phone = n.recipientPhone || n.appointmentId?.patientId?.phone || '—';
                    const name = n.recipientName || n.appointmentId?.patientId?.name || 'Patient';
                    const kind = typeLabel(n.notificationType);
                    const statusKey = String(n.status || '').toLowerCase();
                    const busy = waBusyId === n._id;
                    const rowBg = idx % 2 === 0 ? 'bg-white' : 'bg-[#faf8f4]';

                    return (
                      <tr key={n._id} className={`${rowBg} hover:bg-[#f5f1ea] transition-colors`}>
                        <td className="px-3 py-2.5 border-b border-r border-[#e4dfd6] align-middle text-left">
                          <p className="font-semibold text-ink truncate" title={name}>
                            {name}
                          </p>
                          {n.status === 'failed' && n.error ? (
                            <p className="text-[11px] text-[#9b2c2c] mt-0.5 line-clamp-1">{n.error}</p>
                          ) : null}
                        </td>
                        <td className="px-3 py-2.5 border-b border-r border-[#e4dfd6] align-middle text-left text-ink-muted whitespace-nowrap tabular-nums">
                          {phone}
                        </td>
                        <td className="px-3 py-2.5 border-b border-r border-[#e4dfd6] align-middle text-left">
                          <Chip className={TYPE_TONE[kind] || TYPE_TONE.Reminder}>{kind}</Chip>
                        </td>
                        <td className="px-3 py-2.5 border-b border-r border-[#e4dfd6] align-middle text-left text-ink-muted whitespace-nowrap">
                          {visitLabel(n)}
                        </td>
                        <td className="px-3 py-2.5 border-b border-r border-[#e4dfd6] align-middle text-left">
                          <Chip className={STATUS_TONE[statusKey] || STATUS_TONE.scheduled}>
                            {n.status || '—'}
                          </Chip>
                        </td>
                        <td className="px-3 py-2.5 border-b border-[#e4dfd6] align-middle text-left">
                          <div className="inline-flex items-center justify-start gap-1.5 flex-nowrap">
                            {aid ? (
                              <Link
                                to={ROUTES.doctorAppointmentDetail(aid)}
                                className="inline-flex items-center justify-center h-8 min-w-[5.5rem] px-2 rounded-md text-[11px] font-semibold text-ink bg-white border border-[#d8d2c8] hover:border-[#c9a227]/60"
                              >
                                Appointment
                              </Link>
                            ) : null}
                            {pid ? (
                              <Link
                                to={ROUTES.doctorPatientDetail(pid)}
                                className="inline-flex items-center justify-center h-8 min-w-[4.5rem] px-2 rounded-md text-[11px] font-semibold text-ink bg-white border border-[#d8d2c8] hover:border-[#c9a227]/60"
                              >
                                Patient
                              </Link>
                            ) : null}
                            {phone && phone !== '—' ? (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => openWhatsApp(n)}
                                className="inline-flex items-center justify-center gap-1 h-8 min-w-[6.5rem] px-2.5 rounded-md text-[11px] font-semibold text-white bg-[#25D366] hover:bg-[#20bd5a] disabled:opacity-60"
                                aria-label={`Send WhatsApp to ${name}`}
                              >
                                <MessageCircle className="w-3.5 h-3.5" aria-hidden />
                                {busy ? 'Sending…' : 'WhatsApp'}
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile stacked cards */}
          <div className="md:hidden space-y-2">
            {items.map((n) => {
              const aid = appointmentIdOf(n);
              const pid = patientIdOf(n);
              const phone = n.recipientPhone || n.appointmentId?.patientId?.phone;
              const name = n.recipientName || n.appointmentId?.patientId?.name || 'Patient';
              const kind = typeLabel(n.notificationType);
              const statusKey = String(n.status || '').toLowerCase();
              const busy = waBusyId === n._id;

              return (
                <article key={n._id} className="card !p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink truncate">{name}</p>
                      <p className="mt-0.5 text-xs text-ink-muted">
                        {[phone, visitLabel(n)].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    <Chip className={STATUS_TONE[statusKey] || STATUS_TONE.scheduled}>
                      {n.status || '—'}
                    </Chip>
                  </div>
                  <div className="mt-2">
                    <Chip className={TYPE_TONE[kind] || TYPE_TONE.Reminder}>{kind}</Chip>
                  </div>
                  <div className="mt-3 flex items-center gap-1.5">
                    {aid ? (
                      <Link
                        to={ROUTES.doctorAppointmentDetail(aid)}
                        className="inline-flex items-center min-h-8 px-2 rounded-md text-[11px] font-semibold text-ink bg-[#f3f1ec] border border-line"
                      >
                        Appointment
                      </Link>
                    ) : null}
                    {pid ? (
                      <Link
                        to={ROUTES.doctorPatientDetail(pid)}
                        className="inline-flex items-center min-h-8 px-2 rounded-md text-[11px] font-semibold text-ink bg-[#f3f1ec] border border-line"
                      >
                        Patient
                      </Link>
                    ) : null}
                    {phone ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => openWhatsApp(n)}
                        className="ml-auto inline-flex items-center gap-1 min-h-8 px-2.5 rounded-md text-[11px] font-semibold text-white bg-[#25D366]"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        {busy ? '…' : 'WhatsApp'}
                      </button>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}

      <Pagination page={page} pages={pages} total={total} limit={PAGE_SIZE} onPage={load} />
    </div>
  );
}
