import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBranch } from '../context/BranchContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { format, isValid } from 'date-fns';
import {
  Calendar,
  CalendarPlus,
  Users,
  UserPlus,
  Bell,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { ROUTES } from '../constants/routes';
import { patientDisplayName } from '../utils/display';
import StatCard from '../components/ui/StatCard';
import EmptyState from '../components/ui/EmptyState';
import StatusBadge from '../components/ui/StatusBadge';
import { SkeletonCards, SkeletonRows } from '../components/ui/Skeleton';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function DoctorDashboard() {
  const { user } = useAuth();
  const { branchId } = useBranch();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = () => {
    setLoading(true);
    setError(false);
    api
      .get('/appointments/dashboard-stats')
      .then((res) => setStats(res.data.stats))
      .catch(() => {
        setError(true);
        toast.error('Could not load dashboard.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [branchId]);

  const name = user?.name?.replace(/^Dr\.?\s*/i, '') || '';
  const today = stats?.today || {};
  const patients = stats?.patients || {};
  const appointments = stats?.appointments || {};

  return (
    <div className="page-container">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="section-label mb-1">{format(new Date(), 'EEEE, MMMM d')}</p>
          <h2 className="page-title">
            {greeting()}, Dr. {name}
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={ROUTES.doctorPatientNew} className="btn-secondary !min-h-10">
            <UserPlus className="w-4 h-4" /> Add patient
          </Link>
          <Link to={ROUTES.doctorBook} className="btn-primary">
            <CalendarPlus className="w-4 h-4" /> Schedule
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="space-y-5">
          <SkeletonCards />
          <SkeletonRows />
        </div>
      ) : error ? (
        <EmptyState
          title="Unable to load dashboard"
          description="Check your connection and try again."
          action={
            <button type="button" className="btn-secondary" onClick={load}>
              Try again
            </button>
          }
        />
      ) : (
        <>
          <section className="mb-6">
            <h3 className="text-sm font-semibold text-ink mb-3">Today</h3>
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
              <StatCard label="Appointments" value={today.total ?? 0} icon={Calendar} />
              <StatCard label="Pending today" value={today.scheduled ?? 0} icon={Clock} />
              <StatCard label="Completed" value={today.completed ?? 0} icon={CheckCircle} />
              <StatCard
                label="Patients"
                value={patients.total ?? 0}
                icon={Users}
                hint={`${patients.newThisWeek ?? 0} new this week · ${patients.returning ?? 0} returning`}
              />
            </div>
            {(stats?.revenue || stats?.queue) && (
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mt-3">
                <StatCard
                  label="Own collected"
                  value={`₹${Number(stats.revenue?.paid || 0).toLocaleString('en-IN')}`}
                  hint="From your invoices"
                />
                <StatCard
                  label="Outstanding"
                  value={`₹${Number(stats.revenue?.due || 0).toLocaleString('en-IN')}`}
                />
                <StatCard
                  label="Queue now"
                  value={stats.queue?.length ?? 0}
                  hint={stats.queue?.length ? 'Waiting / in consult' : undefined}
                />
                <StatCard label="Prescriptions" value={stats.prescriptions?.total ?? 0} />
              </div>
            )}
            {(today.cancelled > 0 || today.noShow > 0) && (
              <p className="text-xs text-ink-faint mt-2">
                Today also: {today.cancelled > 0 ? `${today.cancelled} cancelled` : ''}
                {today.cancelled > 0 && today.noShow > 0 ? ' · ' : ''}
                {today.noShow > 0 ? `${today.noShow} no-show` : ''}
              </p>
            )}
          </section>

          <div className="grid xl:grid-cols-2 gap-6">
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-ink">Today’s schedule</h3>
                <Link to={ROUTES.doctorCalendar} className="text-xs font-semibold text-accent-700 hover:underline">
                  Open calendar
                </Link>
              </div>
              {!!stats?.queue?.length && (
                <div className="card mb-3 !p-4">
                  <div className="flex justify-between items-center mb-2">
                    <p className="section-label">
                      Queue · {stats.queue.length} active
                    </p>
                    <Link to={ROUTES.queue} className="text-xs font-semibold text-accent-700">
                      Open queue
                    </Link>
                  </div>
                  <p className="text-lg font-semibold">TOKEN #{stats.queue[0].tokenLabel}</p>
                  <p className="text-sm text-ink-muted">{stats.queue[0].patientId?.name}</p>
                  {stats.queue.length > 1 && (
                    <p className="text-xs text-ink-faint mt-1">
                      Next: {stats.queue.slice(1, 4).map((t) => `#${t.tokenLabel}`).join(', ')}
                      {stats.queue.length > 4 ? '…' : ''}
                    </p>
                  )}
                  {stats.queue[0].appointmentId && (
                    <Link
                      to={ROUTES.doctorConsult(stats.queue[0].appointmentId._id || stats.queue[0].appointmentId)}
                      className="btn-primary !min-h-9 mt-2 inline-flex text-sm"
                    >
                      Start consultation
                    </Link>
                  )}
                </div>
              )}
              {!today.appointments?.length ? (
                <EmptyState
                  icon={Calendar}
                  title="No appointments today"
                  description="Schedule a visit to see it here."
                  action={
                    <Link to={ROUTES.doctorBook} className="btn-primary text-sm">
                      Schedule one
                    </Link>
                  }
                />
              ) : (
                <div className="card !p-0 overflow-hidden divide-y divide-line">
                  {today.appointments.map((appt) => {
                    const patient = appt.patientId || appt.patient;
                    return (
                      <Link
                        key={appt._id}
                        to={ROUTES.doctorAppointmentDetail(appt._id)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-[#faf8f3]"
                      >
                        <p className="w-14 shrink-0 text-sm font-semibold text-ink tabular-nums">{appt.timeSlot}</p>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-ink truncate">{patientDisplayName(patient)}</p>
                          <p className="text-xs text-ink-muted truncate">
                            {appt.appointmentType || 'Consultation'}
                          </p>
                        </div>
                        <StatusBadge status={appt.status} />
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>

            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-ink">Upcoming (from tomorrow)</h3>
                <Link
                  to={ROUTES.doctorNotifications}
                  className="text-xs font-semibold text-accent-700 hover:underline inline-flex items-center gap-1"
                >
                  <Bell className="w-3.5 h-3.5" /> Reminders
                </Link>
              </div>
              {!appointments.next?.length ? (
                <EmptyState title="No upcoming visits" description="Future bookings will appear here." />
              ) : (
                <div className="card !p-0 overflow-hidden divide-y divide-line">
                  {appointments.next.map((appt) => {
                    const patient = appt.patientId || appt.patient;
                    const d = new Date(appt.appointmentDate);
                    return (
                      <Link
                        key={appt._id}
                        to={ROUTES.doctorAppointmentDetail(appt._id)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-[#faf8f3]"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-ink truncate">{patientDisplayName(patient)}</p>
                          <p className="text-xs text-ink-muted">
                            {isValid(d) ? format(d, 'EEE, MMM d') : '—'} · {appt.timeSlot}
                          </p>
                        </div>
                        <StatusBadge status={appt.status} />
                      </Link>
                    );
                  })}
                </div>
              )}

              {patients.recent?.length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-ink">Recent patients</h3>
                    <Link to={ROUTES.doctorPatients} className="text-xs font-semibold text-accent-700 hover:underline">
                      All patients
                    </Link>
                  </div>
                  <div className="card !p-0 overflow-hidden divide-y divide-line">
                    {patients.recent.map((p) => (
                      <Link
                        key={p._id}
                        to={ROUTES.doctorPatientDetail(p._id)}
                        className="flex items-center justify-between gap-2 px-4 py-3 hover:bg-[#faf8f3]"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-ink truncate">{p.name}</p>
                          <p className="text-xs text-ink-faint font-mono">{p.patientCode || '—'}</p>
                        </div>
                        <span className="text-xs text-ink-faint shrink-0">
                          {p.createdAt && isValid(new Date(p.createdAt))
                            ? format(new Date(p.createdAt), 'MMM d')
                            : ''}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
