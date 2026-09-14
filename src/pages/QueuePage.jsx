import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import { ROUTES } from '../constants/routes';
import { useAuth } from '../context/AuthContext';
import { useBranch } from '../context/BranchContext';

export default function QueuePage() {
  const { user } = useAuth();
  const { branchId, current } = useBranch();
  const [data, setData] = useState({ tickets: [], current: null, next: null });
  const [patients, setPatients] = useState([]);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const isDoctor = user?.role === 'doctor';
  const needsBranch = isDoctor && !branchId;

  const load = () => {
    if (needsBranch) {
      setData({ tickets: [], current: null, next: null });
      return;
    }
    api
      .get('/queue')
      .then((res) => setData(res.data))
      .catch((err) => {
        const msg = err.response?.data?.message || 'Queue failed.';
        // Branch selection is guided in-page — don't toast-spam.
        if (/select a specific branch/i.test(msg)) return;
        toast.error(msg);
      });
  };

  useEffect(load, [branchId, needsBranch]);

  useEffect(() => {
    if (needsBranch || q.trim().length < 2) {
      setPatients([]);
      return;
    }
    const t = setTimeout(() => {
      api.get('/patients', { params: { search: q, limit: 8 } }).then((res) => setPatients(res.data.patients || [])).catch(() => {});
    }, 250);
    return () => clearTimeout(t);
  }, [q, branchId, needsBranch]);

  const checkIn = async (patientId) => {
    if (needsBranch) {
      toast.error('Select a branch in the header first.');
      return;
    }
    try {
      const res = await api.post('/queue/check-in', { patientId });
      toast.success(`Token ${res.data.ticket.tokenLabel}`);
      setOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-in failed.');
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
      await api.post('/queue/call-next', {});
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'No patients waiting.');
    }
  };

  const tickets = data.tickets || [];

  return (
    <div className="page-container">
      <PageHeader
        title="Patient queue"
        description={
          current?.name
            ? `${current.name} · tokens stay in this branch only`
            : 'Choose a branch to run today\'s queue'
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              to={ROUTES.queueDisplay}
              className={`btn-secondary ${needsBranch ? 'pointer-events-none opacity-50' : ''}`}
              target="_blank"
              rel="noreferrer"
              aria-disabled={needsBranch}
            >
              TV display
            </Link>
            <button type="button" className="btn-secondary" onClick={callNext} disabled={needsBranch}>
              Call next
            </button>
            <button type="button" className="btn-primary" onClick={() => setOpen(true)} disabled={needsBranch}>
              Check in
            </button>
          </div>
        }
      />

      {needsBranch ? (
        <EmptyState
          title="Select a branch"
          description="Queue is branch-specific. Pick a branch from the header (not All branches) to view tokens, check in patients, and call next."
        />
      ) : (
        <>
          {data.current && (
            <div className="card mb-4 border-accent-400/40">
              <p className="section-label">Now serving</p>
              <p className="text-2xl font-semibold mt-1">TOKEN #{data.current.tokenLabel}</p>
              <p className="text-ink-muted">{data.current.patientId?.name}</p>
              {isDoctor && data.current.appointmentId && (
                <Link
                  to={ROUTES.doctorConsult(data.current.appointmentId._id || data.current.appointmentId)}
                  className="btn-primary mt-3 inline-flex"
                >
                  Start consultation
                </Link>
              )}
            </div>
          )}

          {!tickets.length ? (
            <EmptyState title="Queue is empty" description="Check in a patient to generate a token." />
          ) : (
            <div className="space-y-2">
              {tickets.map((t) => (
                <div key={t._id} className="card !p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">
                      #{t.tokenLabel} · {t.patientId?.name}
                    </p>
                    <p className="text-sm text-ink-muted">{t.doctorId?.name || 'Unassigned'}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge value={t.status} />
                    {t.status === 'waiting' && (
                      <button type="button" className="btn-secondary !min-h-9" onClick={() => setStatus(t._id, 'called')}>
                        Call
                      </button>
                    )}
                    {['called', 'waiting'].includes(t.status) && (
                      <button
                        type="button"
                        className="btn-secondary !min-h-9"
                        onClick={() => setStatus(t._id, 'in_consultation')}
                      >
                        Start
                      </button>
                    )}
                    {t.status === 'in_consultation' && (
                      <button type="button" className="btn-primary !min-h-9" onClick={() => setStatus(t._id, 'completed')}>
                        Complete
                      </button>
                    )}
                    {['waiting', 'called'].includes(t.status) && (
                      <>
                        <button type="button" className="btn-ghost !min-h-9" onClick={() => setStatus(t._id, 'no_show')}>
                          No show
                        </button>
                        <button type="button" className="btn-ghost !min-h-9" onClick={() => setStatus(t._id, 'cancelled')}>
                          Cancel
                        </button>
                      </>
                    )}
                    <Link
                      to={ROUTES.print('queue_token', t._id)}
                      className="btn-ghost !min-h-9 text-xs"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Print token
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <Modal open={open} title="Check in patient" onClose={() => setOpen(false)}>
        <input
          className="input-field mb-3"
          placeholder="Search patient"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {patients.map((p) => (
            <button
              type="button"
              key={p._id}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#f3efe8]"
              onClick={() => checkIn(p._id)}
            >
              {p.name} · {p.phone}
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}
