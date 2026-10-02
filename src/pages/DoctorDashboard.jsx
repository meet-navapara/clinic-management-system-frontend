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
import DateRangeFilter from '../components/ui/DateRangeFilter';
import { SkeletonCards, SkeletonRows } from '../components/ui/Skeleton';
import { PAGE_SIZE } from '../constants/pagination';
import { isSingleDayRange, resolveDateRange } from '../utils/dateRangePresets';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatApptWhen(appt, range) {
  const d = new Date(appt.appointmentDate);
  if (!isValid(d)) return appt.timeSlot || '—';
  if (isSingleDayRange(range) || isSameDay(d, new Date())) return appt.timeSlot || '—';
  return `${format(d, 'EEE, MMM d')} · ${appt.timeSlot || '—'}`;
}

export default function DoctorDashboard() {
  const { user } = useAuth();
  const { branchId } = useBranch();
  const [range, setRange] = useState(() => resolveDateRange('thisMonth'));
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = (selectedRange = range) => {
    setLoading(true);
    setError(false);
    api
      .get('/appointments/dashboard-stats', {
        params: { from: selectedRange.from, to: selectedRange.to },
      })
      .then((res) => setStats(res.data.stats))
      .catch(() => {
        setError(true);
        toast.error('Could not load dashboard.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(range);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId, range.from, range.to]);

  const name = user?.name?.replace(/^Dr\.?\s*/i, '') || '';
  const periodStats = stats?.period || stats?.today || {};
  const patients = stats?.patients || {};
  const appointments = stats?.appointments || {};
  const title = range.label || 'Selected period';
  const singleDay = isSingleDayRange(range);
  const patientCount = periodStats.patients ?? patients.inPeriod ?? 0;
  const completedCount = periodStats.completed ?? 0;
  const SCHEDULE_LIMIT = singleDay ? 20 : 10;
  const allScheduleAppts = Array.isArray(periodStats.appointments) ? periodStats.appointments : [];
  const scheduleAppts = singleDay
    ? allScheduleAppts.slice(0, SCHEDULE_LIMIT)
    : allScheduleAppts.slice(-SCHEDULE_LIMIT);
  const scheduleTotal = allScheduleAppts.length;
  const scheduleHidden = Math.max(0, scheduleTotal - scheduleAppts.length);

  return (
    <div className="page-container">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
        <div className="min-w-0 shrink-0">
          <p className="section-label mb-1">{format(new Date(), 'EEEE, MMMM d')}</p>
          <h2 className="page-title">
            {greeting()}, Dr. {name}
          </h2>
        </div>
        <div className="flex flex-col gap-2 w-full md:w-auto md:flex-row md:items-center md:justify-end">
          <DateRangeFilter
            value={range}
            onChange={setRange}
            className="w-full md:w-[13.5rem]"
            align="end"
          />
          <div className="flex flex-row gap-2 w-full md:w-auto">
            <Link to={ROUTES.doctorPatientNew} className="btn-secondary flex-1 md:flex-none justify-center">
              <UserPlus className="w-4 h-4" /> Add patient
            </Link>
            <Link to={ROUTES.doctorBook} className="btn-primary flex-1 md:flex-none justify-center">
              <CalendarPlus className="w-4 h-4" /> Schedule
            </Link>
          </div>
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
            <button type="button" className="btn-secondary" onClick={() => load(range)}>
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
                value={periodStats.total ?? 0}
                icon={Calendar}
                to={ROUTES.doctorCalendar}
              />
              <StatCard
                label={singleDay ? 'Pending today' : 'Pending'}
                value={periodStats.scheduled ?? 0}
                icon={Clock}
                to={ROUTES.doctorCalendar}
              />
              <StatCard
                label={singleDay ? 'Completed today' : 'Completed'}
                value={completedCount}
                icon={CheckCircle}
                to={ROUTES.doctorCalendar}
              />
              <StatCard
                label={singleDay ? 'Patients today' : 'Patients seen'}
                value={patientCount}
                icon={Users}
                to={ROUTES.doctorPatients}
              />
            </div>
            {(periodStats.cancelled > 0 || periodStats.noShow > 0) && (
              <p className="text-xs text-ink-faint mt-2">
                Also: {periodStats.cancelled > 0 ? `${periodStats.cancelled} cancelled` : ''}
                {periodStats.cancelled > 0 && periodStats.noShow > 0 ? ' · ' : ''}
                {periodStats.noShow > 0 ? `${periodStats.noShow} no-show` : ''}
              </p>
            )}
          </section>

          <div className="grid xl:grid-cols-2 gap-6">
            <section>
              <div className="flex items-center justify-between gap-2 mb-3">
                <h3 className="text-sm font-semibold text-ink min-w-0 truncate">
                  {singleDay ? 'Today’s schedule' : `${title} schedule`}
                </h3>
                <Link to={ROUTES.doctorCalendar} className="text-xs font-semibold text-accent-700 hover:underline shrink-0">
                  Open calendar
                </Link>
              </div>
              {!scheduleAppts.length ? (
                <EmptyState
                  icon={Calendar}
                  title={`No appointments for ${title.toLowerCase()}`}
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
                            {formatApptWhen(appt, range)}
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
              <div className="flex items-center justify-between gap-2 mb-3">
                <h3 className="text-sm font-semibold text-ink min-w-0 truncate">Upcoming (from tomorrow)</h3>
                <Link
                  to={ROUTES.doctorNotifications}
                  className="text-xs font-semibold text-accent-700 hover:underline inline-flex items-center gap-1 shrink-0"
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
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <h3 className="text-sm font-semibold text-ink min-w-0 truncate">
                      {singleDay ? 'Patients today' : `Patients · ${title}`}
                    </h3>
                    <Link to={ROUTES.doctorPatients} className="text-xs font-semibold text-accent-700 hover:underline shrink-0">
                      All patients{patients.total != null ? ` (${patients.total})` : ''}
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
