import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Monitor } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Pagination from '../components/ui/Pagination';
import PatientPicker from '../components/PatientPicker';
import RequiredMark from '../components/ui/RequiredMark';
import Dropdown from '../components/ui/Dropdown';
import { SkeletonRows } from '../components/ui/Skeleton';
import { ROUTES } from '../constants/routes';
import { useAuth } from '../context/AuthContext';
import { useBranch } from '../context/BranchContext';
import { PAGE_SIZE } from '../constants/pagination';

const POLL_MS = 5000;
const ACTION_BTN =
  'btn-sm flex-1 min-w-[calc(50%-0.25rem)] md:flex-none md:min-w-0 justify-center text-center leading-tight';

function TicketCard({ ticket: t, onStatus }) {
  return (
    <div className="card !p-3 sm:!p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between min-w-0 overflow-hidden">
      <div className="flex items-start justify-between gap-3 min-w-0 md:block md:flex-1">
        <div className="min-w-0">
          <p className="font-semibold text-ink truncate">
            #{t.tokenLabel} · {t.patientId?.name || 'Patient'}
          </p>
          <p className="text-sm text-ink-muted truncate">
            {t.doctorId?.name || 'Unassigned'}
            {t.roomLabel ? ` · ${t.roomLabel}` : ''}
          </p>
        </div>
        <Badge value={t.status} className="shrink-0 whitespace-nowrap md:hidden" />
      </div>

      <div className="flex flex-wrap gap-2 w-full min-w-0 md:w-auto md:justify-end md:shrink-0">
        <Badge value={t.status} className="hidden md:inline-flex self-center whitespace-nowrap" />
        {t.status === 'waiting' && (
          <button type="button" className={`btn-secondary ${ACTION_BTN}`} onClick={() => onStatus(t._id, 'called')}>
            Call
          </button>
        )}
        {['called', 'waiting'].includes(t.status) && (
          <button
            type="button"
            className={`btn-secondary ${ACTION_BTN}`}
            onClick={() => onStatus(t._id, 'in_consultation')}
          >
            Start
          </button>
        )}
        {t.status === 'in_consultation' && (
          <button
            type="button"
            className={`btn-primary ${ACTION_BTN} border border-[#1c2430]`}
            onClick={() => onStatus(t._id, 'completed')}
          >
            Complete
          </button>
        )}
        {['waiting', 'called'].includes(t.status) && (
          <>
            <button
              type="button"
              className={`btn-secondary ${ACTION_BTN}`}
              title="Patient was called but did not come. This token is closed."
              onClick={() => onStatus(t._id, 'no_show')}
            >
              Didn't arrive
            </button>
            <button type="button" className={`btn-secondary ${ACTION_BTN}`} onClick={() => onStatus(t._id, 'cancelled')}>
              Cancel
            </button>
          </>
        )}
        <Link
          to={ROUTES.print('queue_token', t._id)}
          className={`btn-secondary ${ACTION_BTN} text-xs`}
          target="_blank"
          rel="noreferrer"
        >
          Print token
        </Link>
      </div>
    </div>
  );
}

export default function QueuePage() {
  const { user } = useAuth();
  const { branchId, current } = useBranch();
  const [tickets, setTickets] = useState([]);
  const [serving, setServing] = useState(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [waitingCount, setWaitingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [patientId, setPatientId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [roomLabel, setRoomLabel] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [checkingIn, setCheckingIn] = useState(false);
  const isDoctor = user?.role === 'doctor';
  const needsBranch = isDoctor && !branchId;
  const rooms = Array.isArray(current?.rooms) ? current.rooms.filter(Boolean) : [];

  const applyQueue = (res, requestedPage) => {
    const nextPages = res.data.pages || 1;
    const nextPage = res.data.page || requestedPage || 1;
    if (nextPage > nextPages) {
      setPage(nextPages);
      return false;
    }
    setTickets(res.data.tickets || []);
    setServing(res.data.current || null);
    setWaitingCount(res.data.waitingCount || 0);
    setTotal(res.data.total || 0);
    setPages(nextPages);
    setPage(nextPage);
    return true;
  };

  const load = (pageNum = page, { showLoading = false } = {}) => {
    if (needsBranch) {
      setTickets([]);
      setServing(null);
      setTotal(0);
      setPages(1);
      setWaitingCount(0);
      setLoading(false);
      return;
    }
    if (showLoading) setLoading(true);
    const params = { page: pageNum, limit: PAGE_SIZE };
    if (isDoctor) params.mine = '1';
    else if (doctorId) params.doctorId = doctorId;

    api
      .get('/queue', { params })
      .then((res) => applyQueue(res, pageNum))
      .catch((err) => {
        const msg = err.response?.data?.message || 'Queue failed.';
        if (/select a specific branch/i.test(msg)) return;
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setPage(1);
  }, [branchId, doctorId]);

  useEffect(() => {
    load(page, { showLoading: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, branchId, needsBranch, doctorId, isDoctor]);

  useEffect(() => {
    if (needsBranch) return undefined;
    const id = setInterval(() => load(page), POLL_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, branchId, needsBranch, doctorId, isDoctor]);

  useEffect(() => {
    if (isDoctor || needsBranch) return;
    api
      .get('/doctors')
      .then((res) => setDoctors(res.data.doctors || []))
      .catch(() => setDoctors([]));
  }, [isDoctor, needsBranch, branchId]);

  const closeCheckIn = () => {
    setOpen(false);
    setPatientId('');
    setRoomLabel('');
    setCheckingIn(false);
  };

  const checkIn = async () => {
    if (needsBranch) {
      toast.error('Select a branch in the header first.');
      return;
    }
    if (!patientId) {
      toast.error('Select a patient to check in.');
      return;
    }
    setCheckingIn(true);
    try {
      const payload = { patientId };
      if (!isDoctor && doctorId) payload.doctorId = doctorId;
      if (roomLabel) payload.roomLabel = roomLabel;
      const res = await api.post('/queue/check-in', payload);
      toast.success(
        res.data.alreadyCheckedIn
          ? `Already in queue · Token ${res.data.ticket.tokenLabel}`
          : `Token ${res.data.ticket.tokenLabel}`
      );
      closeCheckIn();
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-in failed.');
      setCheckingIn(false);
    }
  };

  const setStatus = async (id, status) => {
    try {
      await api.patch(`/queue/${id}/status`, { status });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed.');
    }
  };

  const callNext = async () => {
    if (needsBranch) {
      toast.error('Select a branch in the header first.');
      return;
    }
    try {
      const body = {};
      if (!isDoctor && doctorId) body.doctorId = doctorId;
      await api.post('/queue/call-next', body);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'No patients waiting.');
    }
  };

  const doctorOptions = [
    { value: '', label: isDoctor ? 'My queue' : 'All doctors' },
    ...doctors.map((d) => ({
      value: String(d._id),
      label: d.name?.startsWith('Dr') ? d.name : `Dr. ${d.name}`,
    })),
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="Patient queue"
        description={
          current?.name
            ? `${current.name} · tokens stay in this branch only`
            : "Choose a branch to run today's queue"
        }
        actions={
          <div className="grid grid-cols-2 gap-2 w-full md:flex md:w-auto md:flex-wrap">
            <Link
              to={ROUTES.queueDisplay}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary w-full md:w-auto inline-flex items-center justify-center gap-1.5"
            >
              <Monitor className="w-4 h-4" /> TV display
            </Link>
            <button
              type="button"
              className="btn-secondary w-full md:w-auto"
              onClick={callNext}
              disabled={needsBranch}
            >
              Call next
            </button>
            <button
              type="button"
              className="btn-primary w-full md:w-auto border border-[#1c2430] col-span-2 md:col-span-1"
              onClick={() => {
                setPatientId('');
                setRoomLabel(rooms[0] || current?.roomLabel || '');
                setOpen(true);
              }}
              disabled={needsBranch}
            >
              Check in
            </button>
          </div>
        }
      />

      {!isDoctor && !needsBranch && doctors.length > 0 && (
        <div className="mb-4 max-w-xs">
          <label className="label-field" htmlFor="queue-doctor-filter">
            Doctor lane
          </label>
          <Dropdown
            id="queue-doctor-filter"
            value={doctorId}
            onChange={setDoctorId}
            options={doctorOptions}
            ariaLabel="Filter queue by doctor"
          />
        </div>
      )}

      {needsBranch ? (
        <EmptyState
          title="Select a branch"
          description="Queue is branch-specific. Pick a branch from the header (not All branches) to view tokens, check in patients, and call next."
        />
      ) : loading ? (
        <SkeletonRows count={PAGE_SIZE} />
      ) : (
        <>
          {serving && (
            <div className="card mb-4 border-accent-400/40 min-w-0 overflow-hidden">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="section-label">Now serving</p>
                  <p className="text-xl sm:text-2xl font-semibold mt-1 break-words">
                    TOKEN #{serving.tokenLabel}
                  </p>
                  <p className="text-ink-muted truncate">{serving.patientId?.name}</p>
                </div>
                {isDoctor && serving.appointmentId && (
                  <Link
                    to={ROUTES.doctorConsult(serving.appointmentId._id || serving.appointmentId)}
                    className="btn-primary w-full sm:w-auto shrink-0 inline-flex border border-[#1c2430]"
                  >
                    Start consultation
                  </Link>
                )}
              </div>
            </div>
          )}

          {!tickets.length ? (
            <EmptyState title="Queue is empty" description="Check in a patient to generate a token." />
          ) : (
            <>
              <p className="text-xs text-ink-faint mb-2">
                {waitingCount} waiting · {total} token{total === 1 ? '' : 's'}
                {isDoctor ? ' · your lane' : ''}
              </p>
              <div className="space-y-2">
                {tickets.map((t) => (
                  <TicketCard key={t._id} ticket={t} onStatus={setStatus} />
                ))}
              </div>
              <div className="pb-[max(0.5rem,env(safe-area-inset-bottom))]">
                <Pagination page={page} pages={pages} total={total} limit={PAGE_SIZE} onPage={setPage} />
              </div>
            </>
          )}
        </>
      )}

      <Modal open={open} title="Check in patient" onClose={closeCheckIn}>
        <label className="label-field" htmlFor="queue-checkin-patient">
          Patient <RequiredMark />
        </label>
        <PatientPicker
          id="queue-checkin-patient"
          value={patientId}
          onChange={setPatientId}
          disabled={checkingIn}
        />
        {!isDoctor && doctors.length > 0 && (
          <div className="mt-3">
            <label className="label-field" htmlFor="queue-checkin-doctor">
              Doctor
            </label>
            <Dropdown
              id="queue-checkin-doctor"
              value={doctorId}
              onChange={setDoctorId}
              options={doctorOptions.filter((o) => o.value)}
              placeholder="Patient's doctor (default)"
              ariaLabel="Assign doctor for check-in"
              disabled={checkingIn}
            />
          </div>
        )}
        {rooms.length > 0 && (
          <div className="mt-3">
            <label className="label-field" htmlFor="queue-checkin-room">
              Room
            </label>
            <Dropdown
              id="queue-checkin-room"
              value={roomLabel}
              onChange={setRoomLabel}
              options={rooms.map((r) => ({ value: r, label: r }))}
              placeholder="Room"
              ariaLabel="Room for token"
              disabled={checkingIn}
            />
          </div>
        )}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-4">
          <button type="button" className="btn-secondary w-full sm:w-auto" onClick={closeCheckIn} disabled={checkingIn}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary w-full sm:w-auto border border-[#1c2430]"
            onClick={checkIn}
            disabled={!patientId || checkingIn}
          >
            {checkingIn ? 'Checking in…' : 'Check in'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
