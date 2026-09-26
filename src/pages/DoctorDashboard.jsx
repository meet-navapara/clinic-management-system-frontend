import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBranch } from '../context/BranchContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { format, isValid, isSameDay } from 'date-fns';
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
import { PAGE_SIZE } from '../constants/pagination';

const PERIODS = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function periodTitle(period) {
  if (period === 'week') return 'This week';
  if (period === 'month') return 'This month';
  return 'Today';
}

function formatApptWhen(appt, period) {
  const d = new Date(appt.appointmentDate);
  if (!isValid(d)) return appt.timeSlot || '—';
  if (period === 'today' || isSameDay(d, new Date())) return appt.timeSlot || '—';
  return `${format(d, 'EEE, MMM d')} · ${appt.timeSlot || '—'}`;
}

export default function DoctorDashboard() {
  const { user } = useAuth();
  const { branchId } = useBranch();
  const [period, setPeriod] = useState('today');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = (selectedPeriod = period) => {
    setLoading(true);
    setError(false);
    api
      .get('/appointments/dashboard-stats', { params: { period: selectedPeriod } })
      .then((res) => setStats(res.data.stats))
      .catch(() => {
        setError(true);
        toast.error('Could not load dashboard.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(period);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId, period]);

  const name = user?.name?.replace(/^Dr\.?\s*/i, '') || '';
  const range = stats?.period || stats?.today || {};
  const patients = stats?.patients || {};
  const appointments = stats?.appointments || {};
  const title = periodTitle(period);
  const patientCount =
    period === 'today' ? patients.total ?? 0 : range.patients ?? patients.inPeriod ?? 0;
  const SCHEDULE_LIMIT = period === 'today' ? 20 : 10;
  const allScheduleAppts = Array.isArray(range.appointments) ? range.appointments : [];
  const scheduleAppts =
    period === 'today'
      ? allScheduleAppts.slice(0, SCHEDULE_LIMIT)
      : allScheduleAppts.slice(-SCHEDULE_LIMIT);
  const scheduleTotal = allScheduleAppts.length;
  const scheduleHidden = Math.max(0, scheduleTotal - scheduleAppts.length);

  return (
    <div className="page-container">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="section-label mb-1">{format(new Date(), 'EEEE, MMMM d')}</p>
          <h2 className="page-title">
            {greeting()}, Dr. {name}
          </h2>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="inline-flex rounded-[10px] border border-[#e5e7eb] bg-white p-0.5">
            {PERIODS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriod(p.id)}
                className={`min-h-8 px-3 rounded-[8px] text-sm font-medium transition-colors duration-150 ${
                  period === p.id ? 'bg-[#1c2430] text-white' : 'text-[#6b7280] hover:text-[#1c2430]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <Link to={ROUTES.doctorPatientNew} className="btn-secondary">
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
          <SkeletonRows count={PAGE_SIZE} />
        </div>
      ) : error ? (
        <EmptyState
          title="Unable to load dashboard"
          description="Check your connection and try again."
          action={
            <button type="button" className="btn-secondary" onClick={() => load(period)}>
              Try again
            </button>
          }
        />
      ) : (
        <>
          <section className="mb-6">
            <h3 className="text-sm font-semibold text-ink mb-3">{title}</h3>
            <div className="stat-grid">
              <StatCard
                label="Appointments"
                value={range.total ?? 0}
                icon={Calendar}
                to={ROUTES.doctorCalendar}
              />
              <StatCard
                label={period === 'today' ? 'Pending today' : 'Pending'}
                value={range.scheduled ?? 0}
                icon={Clock}
                to={ROUTES.doctorCalendar}
              />
              <StatCard
                label="Completed"
                value={range.completed ?? 0}
                icon={CheckCircle}
                to={ROUTES.doctorCalendar}
              />
              <StatCard
                label={period === 'today' ? 'Patients' : 'Patients seen'}
                value={patientCount}
                icon={Users}
                to={ROUTES.doctorPatients}
              />
            </div>
            {(range.cancelled > 0 || range.noShow > 0) && (
              <p className="text-xs text-ink-faint mt-2">
                Also: {range.cancelled > 0 ? `${range.cancelled} cancelled` : ''}
                {range.cancelled > 0 && range.noShow > 0 ? ' · ' : ''}
                {range.noShow > 0 ? `${range.noShow} no-show` : ''}
              </p>
            )}
          </section>

          <div className="grid xl:grid-cols-2 gap-6">
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-ink">
                  {period === 'today' ? 'Today’s schedule' : `${title} schedule`}
                </h3>
                <Link to={ROUTES.doctorCalendar} className="text-xs font-semibold text-accent-700 hover:underline">
                  Open calendar
                </Link>
              </div>
              {!scheduleAppts.length ? (
                <EmptyState
                  icon={Calendar}
                  title={`No appointments ${period === 'today' ? 'today' : `this ${period}`}`}
                  description="Schedule a visit to see it here."
                  action={
                    <Link to={ROUTES.doctorBook} className="btn-primary text-sm">
                      Schedule one
                    </Link>
                  }
                />
              ) : (
                <>
                  <div className="card !p-0 overflow-hidden divide-y divide-line">
                    {scheduleAppts.map((appt) => {
                      const patient = appt.patientId || appt.patient;
                      return (
                        <Link
                          key={appt._id}
                          to={ROUTES.doctorAppointmentDetail(appt._id)}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-[#faf8f3]"
                        >
                          <p className="w-[7.5rem] shrink-0 text-sm font-semibold text-ink tabular-nums">
                            {formatApptWhen(appt, period)}
                          </p>
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
                  {scheduleHidden > 0 && (
                    <div className="mt-2 flex items-center justify-between gap-2 px-0.5">
                      <p className="text-xs text-ink-faint">
                        Showing {scheduleAppts.length} of {scheduleTotal}
                      </p>
                      <Link
                        to={ROUTES.doctorCalendar}
                        className="text-xs font-semibold text-accent-700 hover:underline"
                      >
                        View all in calendar
                      </Link>
                    </div>
                  )}
                </>
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
