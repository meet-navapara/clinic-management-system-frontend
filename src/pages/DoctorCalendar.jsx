import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isValid,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { Calendar as CalendarIcon, CalendarPlus, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { getAppointmentStatusConfig, normalizeAppointmentStatus } from '../constants/appointmentStatus';
import { ROUTES } from '../constants/routes';
import { patientDisplayName } from '../utils/display';
import { useBranch } from '../context/BranchContext';
import { useAuth } from '../context/AuthContext';
import { can, P } from '../constants/permissions';
import { Skeleton } from '../components/ui/Skeleton';

function toDateKey(d) {
  return format(d, 'yyyy-MM-dd');
}

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const EVENT_TONE = {
  scheduled: {
    wrap: 'bg-[#f2f4f8] border-[#d8dee8] hover:bg-white hover:border-[#c5cedb]',
    bar: 'bg-[#3d5a80]',
    dot: 'bg-[#3d5a80]',
  },
  confirmed: {
    wrap: 'bg-[#eef5f1] border-[#d4e3da] hover:bg-white hover:border-[#c5d8ce]',
    bar: 'bg-[#3d6b4f]',
    dot: 'bg-[#3d6b4f]',
  },
  completed: {
    wrap: 'bg-[#f1f6f3] border-[#d5e3da] hover:bg-white hover:border-[#c5d8ce]',
    bar: 'bg-[#3d6b4f]',
    dot: 'bg-[#3d6b4f]',
  },
  cancelled: {
    wrap: 'bg-[#f7f4f4] border-[#e4dcdc] hover:bg-white hover:border-[#d5cccc]',
    bar: 'bg-[#9a8b8b]',
    dot: 'bg-[#9a8b8b]',
  },
  no_show: {
    wrap: 'bg-[#f5f5f5] border-[#e2e2e2] hover:bg-white hover:border-[#d4d4d4]',
    bar: 'bg-[#8a8a8a]',
    dot: 'bg-[#8a8a8a]',
  },
};

function CalendarEvent({ appointment, onOpen, compact = false }) {
  const patient = appointment.patientId || appointment.patient;
  const status = normalizeAppointmentStatus(appointment.status);
  const config = getAppointmentStatusConfig(status);
  const tone = EVENT_TONE[status] || EVENT_TONE.scheduled;

  if (compact) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onOpen(appointment._id);
        }}
        className={`w-full text-left rounded-md border px-1.5 py-1 text-[11px] leading-tight transition-colors ${tone.wrap}`}
        title={`${appointment.timeSlot} · ${patientDisplayName(patient)}`}
      >
        <span className="font-semibold tabular-nums">{appointment.timeSlot}</span>
        <span className="ml-1 truncate inline">{patientDisplayName(patient)}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onOpen(appointment._id)}
      className={`group relative w-full text-left rounded-[10px] border pl-3 pr-2.5 py-2.5 transition-all duration-150 cursor-pointer ${tone.wrap}`}
    >
      <span className={`absolute left-0 top-2 bottom-2 w-[3px] rounded-full ${tone.bar}`} aria-hidden="true" />
      <p className="text-[13px] font-semibold text-[#1c2430] tabular-nums leading-tight">{appointment.timeSlot}</p>
      <p className="mt-0.5 text-[14px] font-semibold text-[#1c2430] leading-snug line-clamp-2">
        {patientDisplayName(patient)}
      </p>
      {appointment.appointmentType ? (
        <p className="mt-0.5 text-[12px] text-[#6b7280] truncate">{appointment.appointmentType}</p>
      ) : null}
      {config.label && (
        <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-[#6b7280]">
          <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${tone.dot}`} />
          {config.label}
        </p>
      )}
    </button>
  );
}

export default function DoctorCalendar() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { branchId } = useBranch();
  const [view, setView] = useState('week');
  const [anchor, setAnchor] = useState(() => startOfDay(new Date()));
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const range = useMemo(() => {
    if (view === 'day') {
      return { from: anchor, to: anchor };
    }
    if (view === 'month') {
      const monthStart = startOfMonth(anchor);
      const monthEnd = endOfMonth(anchor);
      return {
        from: startOfWeek(monthStart, { weekStartsOn: 1 }),
        to: endOfWeek(monthEnd, { weekStartsOn: 1 }),
        monthStart,
        monthEnd,
      };
    }
    const from = startOfWeek(anchor, { weekStartsOn: 1 });
    const to = endOfWeek(anchor, { weekStartsOn: 1 });
    return { from, to };
  }, [view, anchor]);

  const days = useMemo(
    () => eachDayOfInterval({ start: range.from, end: range.to }),
    [range]
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/appointments/my', {
        params: {
          from: toDateKey(range.from),
          to: toDateKey(range.to),
        },
      });
      setAppointments(res.data.appointments || []);
    } catch {
      toast.error('Could not load calendar.');
    } finally {
      setLoading(false);
    }
  }, [range, branchId]);

  useEffect(() => {
    load();
  }, [load]);

  const byDay = useMemo(() => {
    const map = {};
    days.forEach((d) => {
      map[toDateKey(d)] = [];
    });
    appointments.forEach((a) => {
      const d = new Date(a.appointmentDate);
      if (!isValid(d)) return;
      const key = toDateKey(d);
      if (!map[key]) map[key] = [];
      map[key].push(a);
    });
    Object.values(map).forEach((list) =>
      list.sort((a, b) => String(a.timeSlot).localeCompare(String(b.timeSlot)))
    );
    return map;
  }, [appointments, days]);

  const shift = (dir) => {
    setAnchor((prev) => {
      if (view === 'day') return addDays(prev, dir);
      if (view === 'month') return addMonths(prev, dir);
      return addDays(prev, dir * 7);
    });
  };

  const openAppointment = (id) => navigate(ROUTES.doctorAppointmentDetail(id));

  const openDay = (day) => {
    setAnchor(startOfDay(day));
    setView('day');
  };

  const rangeLabel =
    view === 'day'
      ? format(anchor, 'EEEE, MMMM d, yyyy')
      : view === 'month'
        ? format(anchor, 'MMMM yyyy')
        : `${format(range.from, 'MMM d')} – ${format(range.to, 'MMM d, yyyy')}`;

  const isMonth = view === 'month';
  const isWeek = view === 'week';

  return (
    <div className="page-container !py-3 min-h-[calc(100dvh-3.5rem)]">
      <div className="mb-3 shrink-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a929c] leading-none">Practice</p>
        <h1 className="mt-0.5 text-[28px] sm:text-[30px] font-semibold tracking-tight text-[#1c2430] leading-none">
          Calendar
        </h1>
      </div>

      <div className="mb-4 shrink-0 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
        <p className="inline-flex items-center gap-2 text-[18px] sm:text-[20px] font-semibold text-[#1c2430]">
          <CalendarIcon className="w-5 h-5 text-[#8a929c] shrink-0" aria-hidden="true" />
          <span>{rangeLabel}</span>
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="min-h-9 px-3 rounded-[10px] text-sm font-medium text-[#1c2430] bg-white border border-[#e5e7eb] hover:bg-[#f8f9fb] transition-colors duration-150"
            onClick={() => setAnchor(startOfDay(new Date()))}
          >
            Today
          </button>
          <div className="inline-flex rounded-[10px] border border-[#e5e7eb] bg-white overflow-hidden">
            <button
              type="button"
              className="min-h-9 w-9 inline-flex items-center justify-center text-[#4b5563] hover:bg-[#f8f9fb] transition-colors duration-150"
              onClick={() => shift(-1)}
              aria-label="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="min-h-9 w-9 inline-flex items-center justify-center text-[#4b5563] hover:bg-[#f8f9fb] border-l border-[#e5e7eb] transition-colors duration-150"
              onClick={() => shift(1)}
              aria-label="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="inline-flex rounded-[10px] border border-[#e5e7eb] bg-white p-0.5">
            {['day', 'week', 'month'].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={`min-h-8 px-3 rounded-[8px] text-sm font-medium capitalize transition-colors duration-150 ${
                  view === v ? 'bg-[#1c2430] text-white' : 'text-[#6b7280] hover:text-[#1c2430]'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          {can(user, P.APPOINTMENTS_MANAGE) && (
            <Link
              to={ROUTES.doctorBook}
              className="inline-flex items-center gap-2 min-h-9 px-3.5 rounded-[10px] text-sm font-semibold text-white bg-[#1c2430] hover:bg-[#2a3340] hover:shadow-sm transition-all duration-150"
            >
              <CalendarPlus className="w-4 h-4" /> New Appointment
            </Link>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-[28rem] min-w-0 overflow-hidden">
        <div className="h-full overflow-x-auto">
          <div
            className={`h-full min-h-[28rem] bg-white border border-[#e8eaee] rounded-[12px] overflow-hidden flex flex-col ${
              isWeek || isMonth ? 'min-w-[52rem]' : ''
            }`}
            style={{ boxShadow: '0 1px 2px rgba(28, 36, 48, 0.04)' }}
          >
            {loading ? (
              <div
                className={`grid flex-1 ${isWeek || isMonth ? 'grid-cols-7' : 'grid-cols-1'} divide-x divide-[#eef0f3]`}
                role="status"
                aria-label="Loading"
                aria-busy="true"
              >
                {(isMonth ? Array.from({ length: 14 }) : days).map((_, i) => (
                  <div key={i} className="p-3 space-y-3">
                    <Skeleton className="h-3 w-8" />
                    <Skeleton className="h-6 w-7 rounded-full" />
                    <Skeleton className="h-16 rounded-[10px]" />
                  </div>
                ))}
              </div>
            ) : isMonth ? (
              <>
                <div className="grid grid-cols-7 shrink-0 border-b border-[#e8eaee]">
                  {WEEKDAY_LABELS.map((label) => (
                    <div key={label} className="px-2 py-2.5 text-center">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a929c]">
                        {label}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 flex-1 min-h-0 auto-rows-fr divide-x divide-y divide-[#eef0f3]">
                  {days.map((day) => {
                    const key = toDateKey(day);
                    const list = byDay[key] || [];
                    const isToday = isSameDay(day, new Date());
                    const inMonth = isSameMonth(day, range.monthStart || anchor);
                    const visible = list.slice(0, 3);
                    const more = list.length - visible.length;
                    return (
                      <section
                        key={key}
                        className={`min-h-[7.5rem] flex flex-col p-1.5 transition-colors ${
                          inMonth ? 'bg-white hover:bg-[#fafbfc]' : 'bg-[#f7f8fa]'
                        } ${isToday ? 'bg-[#f6f7f9]' : ''}`}
                        aria-label={format(day, 'EEEE, MMMM d')}
                      >
                        <button
                          type="button"
                          onClick={() => openDay(day)}
                          className="self-start mb-1"
                          title="Open day view"
                        >
                          <span
                            className={`inline-flex h-7 w-7 items-center justify-center text-[13px] font-semibold leading-none ${
                              isToday
                                ? 'rounded-full bg-[#1c2430] text-white'
                                : inMonth
                                  ? 'text-[#1c2430]'
                                  : 'text-[#9ca3af]'
                            }`}
                          >
                            {format(day, 'd')}
                          </span>
                        </button>
                        <div className="flex-1 min-h-0 space-y-1 overflow-hidden">
                          {visible.map((appt) => (
                            <CalendarEvent
                              key={appt._id}
                              appointment={appt}
                              onOpen={openAppointment}
                              compact
                            />
                          ))}
                          {more > 0 ? (
                            <button
                              type="button"
                              onClick={() => openDay(day)}
                              className="w-full text-left px-1 text-[11px] font-semibold text-[#6b7280] hover:text-[#1c2430]"
                            >
                              +{more} more
                            </button>
                          ) : null}
                        </div>
                      </section>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                <div
                  className={`grid shrink-0 border-b border-[#e8eaee] ${
                    isWeek ? 'grid-cols-7' : 'grid-cols-1'
                  }`}
                >
                  {days.map((day) => {
                    const isToday = isSameDay(day, new Date());
                    return (
                      <div
                        key={`h-${toDateKey(day)}`}
                        className={`px-3 py-3 ${isToday ? 'bg-[#f6f7f9]' : ''}`}
                      >
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a929c]">
                          {format(day, 'EEE')}
                        </p>
                        <div className="mt-1.5 flex items-center">
                          <span
                            className={`inline-flex h-8 w-8 items-center justify-center text-[20px] font-semibold leading-none ${
                              isToday
                                ? 'rounded-full bg-[#1c2430] text-white'
                                : 'text-[#1c2430]'
                            }`}
                          >
                            {format(day, 'd')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div
                  className={`grid flex-1 min-h-0 ${isWeek ? 'grid-cols-7' : 'grid-cols-1'} divide-x divide-[#eef0f3]`}
                >
                  {days.map((day) => {
                    const key = toDateKey(day);
                    const list = byDay[key] || [];
                    const isToday = isSameDay(day, new Date());
                    return (
                      <section
                        key={key}
                        className={`min-h-0 flex flex-col transition-colors duration-150 ${
                          isToday ? 'bg-[#f6f7f9]' : 'hover:bg-[#fafbfc]'
                        }`}
                        aria-label={format(day, 'EEEE, MMMM d')}
                      >
                        <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-2">
                          {list.map((appt) => (
                            <CalendarEvent
                              key={appt._id}
                              appointment={appt}
                              onOpen={openAppointment}
                            />
                          ))}
                        </div>
                      </section>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
