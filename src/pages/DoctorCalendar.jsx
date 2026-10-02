import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  addMonths,
  differenceInCalendarDays,
  differenceInCalendarMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isValid,
  max as maxDate,
  min as minDate,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { Calendar as CalendarIcon, CalendarPlus, GripVertical } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { getAppointmentStatusConfig, normalizeAppointmentStatus } from '../constants/appointmentStatus';
import { ROUTES } from '../constants/routes';
import { patientDisplayName } from '../utils/display';
import { useBranch } from '../context/BranchContext';
import { useAuth } from '../context/AuthContext';
import { can, P } from '../constants/permissions';
import { Skeleton } from '../components/ui/Skeleton';
import Modal from '../components/ui/Modal';
import DateRangeFilter from '../components/ui/DateRangeFilter';
import { filterFutureSlots } from '../utils/timeSlots';
import { parseDateKey, resolveDateRange } from '../utils/dateRangePresets';

function toDateKey(d) {
  return format(d, 'yyyy-MM-dd');
}

const DEFAULT_WORKING_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

function resolveWorkingDays(list) {
  return Array.isArray(list) && list.length ? list : DEFAULT_WORKING_DAYS;
}

function isWorkingDay(day, workingDays) {
  return resolveWorkingDays(workingDays).includes(format(day, 'EEEE'));
}

function canMoveAppointment(appt) {
  const status = normalizeAppointmentStatus(appt?.status);
  return status === 'scheduled' || status === 'confirmed';
}

function doctorIdOf(appt, user) {
  return (
    appt?.doctor?._id ||
    appt?.doctor?.id ||
    appt?.doctor ||
    (user?.role === 'doctor' ? user?._id || user?.id : '')
  );
}

function doctorWorkingDaysOf(appt, user) {
  const doc = appt?.doctor;
  if (doc && typeof doc === 'object' && Array.isArray(doc.availableDays)) {
    return resolveWorkingDays(doc.availableDays);
  }
  if (user?.role === 'doctor') return resolveWorkingDays(user.availableDays);
  return resolveWorkingDays(null);
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

function CalendarEvent({
  appointment,
  onOpen,
  compact = false,
  draggable = false,
  dragging = false,
  onDragStart,
  onDragEnd,
}) {
  const patient = appointment.patientId || appointment.patient;
  const status = normalizeAppointmentStatus(appointment.status);
  const config = getAppointmentStatusConfig(status);
  const tone = EVENT_TONE[status] || EVENT_TONE.scheduled;
  const movable = draggable && canMoveAppointment(appointment);

  const dragProps = movable
    ? {
        draggable: true,
        onDragStart: (e) => {
          e.dataTransfer.setData('text/appointment-id', appointment._id);
          e.dataTransfer.effectAllowed = 'move';
          onDragStart?.(appointment);
        },
        onDragEnd: () => onDragEnd?.(),
      }
    : {};

  if (compact) {
    return (
      <button
        type="button"
        {...dragProps}
        onClick={(e) => {
          e.stopPropagation();
          onOpen(appointment._id);
        }}
        className={`w-full text-left rounded-md border px-1.5 py-1 text-[11px] leading-tight transition-all ${tone.wrap} ${
          movable ? 'cursor-grab active:cursor-grabbing' : ''
        } ${dragging ? 'opacity-40' : ''}`}
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
      {...dragProps}
      onClick={() => onOpen(appointment._id)}
      className={`group relative w-full text-left rounded-[10px] border pl-3 pr-2.5 py-2.5 transition-all duration-150 ${tone.wrap} ${
        movable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
      } ${dragging ? 'opacity-40 ring-2 ring-[#c9a227]/40' : ''}`}
    >
      <span className={`absolute left-0 top-2 bottom-2 w-[3px] rounded-full ${tone.bar}`} aria-hidden="true" />
      {movable ? (
        <span className="absolute right-1.5 top-1.5 text-[#b0b7c0] opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="w-3.5 h-3.5" />
        </span>
      ) : null}
      <p className="text-[13px] font-semibold text-[#1c2430] tabular-nums leading-tight">{appointment.timeSlot}</p>
      <p className="mt-0.5 text-[14px] font-semibold text-[#1c2430] leading-snug line-clamp-2 pr-3">
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
  const canManage = can(user, P.APPOINTMENTS_MANAGE);
  const [dateRange, setDateRange] = useState(() => resolveDateRange('thisMonth'));
  const [view, setView] = useState('month');
  const [anchor, setAnchor] = useState(() => startOfDay(new Date()));
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draggingId, setDraggingId] = useState(null);
  const [dropDayKey, setDropDayKey] = useState(null);
  const [moveTarget, setMoveTarget] = useState(null); // { appointment, dayKey }
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [saving, setSaving] = useState(false);
  const leaveTimer = useRef(null);

  const filterFrom = parseDateKey(dateRange.from);
  const filterTo = parseDateKey(dateRange.to);
  const spanDays =
    filterFrom && filterTo ? differenceInCalendarDays(filterTo, filterFrom) + 1 : 0;
  const isLast7 = dateRange.preset === 'last7';
  const showMonthNav =
    Boolean(filterFrom && filterTo) &&
    differenceInCalendarMonths(startOfMonth(filterTo), startOfMonth(filterFrom)) >= 1;

  const navMonths = useMemo(() => {
    if (!showMonthNav || !filterFrom || !filterTo) return [];
    const months = [];
    let cursor = startOfMonth(filterFrom);
    const end = startOfMonth(filterTo);
    while (cursor <= end) {
      months.push(cursor);
      cursor = addMonths(cursor, 1);
    }
    return months;
  }, [showMonthNav, filterFrom, filterTo]);

  const isDayInSelectedRange = useCallback(
    (day) => {
      if (!filterFrom || !filterTo) return true;
      const d = startOfDay(day);
      return d >= startOfDay(filterFrom) && d <= startOfDay(filterTo);
    },
    [filterFrom, filterTo]
  );

  const viewRange = useMemo(() => {
    // Last 7 days / short ranges: show exactly the selected dates
    if (filterFrom && filterTo && (isLast7 || (spanDays > 1 && spanDays <= 7))) {
      return { from: startOfDay(filterFrom), to: startOfDay(filterTo) };
    }
    if (view === 'day') return { from: anchor, to: anchor };
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
    return {
      from: startOfWeek(anchor, { weekStartsOn: 1 }),
      to: endOfWeek(anchor, { weekStartsOn: 1 }),
    };
  }, [view, anchor, filterFrom, filterTo, isLast7, spanDays]);

  const range = useMemo(() => {
    if (!filterFrom || !filterTo) return viewRange;
    // Short preset ranges already match the filter exactly
    if (isLast7 || (spanDays > 1 && spanDays <= 7)) return viewRange;
    // Month / week grids stay full; appointments are already filtered by API from–to
    if (view === 'month' || view === 'week') return viewRange;
    let from = maxDate([viewRange.from, filterFrom]);
    let to = minDate([viewRange.to, filterTo]);
    if (from > to) {
      from = filterFrom;
      to = filterTo;
    }
    return {
      ...viewRange,
      from,
      to,
    };
  }, [viewRange, filterFrom, filterTo, isLast7, spanDays, view]);

  const handleDateRangeChange = (next) => {
    setDateRange(next);
    const from = parseDateKey(next.from);
    const to = parseDateKey(next.to);
    if (from) setAnchor(startOfDay(from));
    if (from && to) {
      const span = differenceInCalendarDays(to, from) + 1;
      if (span <= 1) setView('day');
      else if (span <= 7) setView('week');
      else setView('month');
    }
  };

  const goToMonth = (monthDate) => {
    setAnchor(startOfMonth(monthDate));
    setView('month');
  };

  const days = useMemo(
    () => eachDayOfInterval({ start: range.from, end: range.to }),
    [range]
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/appointments/my', {
        params: { from: dateRange.from, to: dateRange.to },
      });
      setAppointments(res.data.appointments || []);
    } catch {
      toast.error('Could not load calendar.');
    } finally {
      setLoading(false);
    }
  }, [dateRange.from, dateRange.to, branchId]);

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

  // Column background: doctor's schedule; while dragging, use that visit's doctor.
  const scheduleWorkingDays = useMemo(() => {
    if (draggingId) {
      const appt = appointments.find((a) => a._id === draggingId);
      if (appt) return doctorWorkingDaysOf(appt, user);
    }
    if (user?.role === 'doctor') return resolveWorkingDays(user.availableDays);
    return resolveWorkingDays(null);
  }, [draggingId, appointments, user]);

  const dayIsBookable = useCallback(
    (day) => isWorkingDay(day, scheduleWorkingDays),
    [scheduleWorkingDays]
  );
  useEffect(() => {
    if (!moveTarget) {
      setSlots([]);
      setSelectedSlot('');
      return undefined;
    }
    const doctorId = doctorIdOf(moveTarget.appointment, user);
    if (!doctorId) return undefined;
    const duration = moveTarget.appointment.durationMinutes || user?.practiceSettings?.defaultDurationMinutes || 30;
    setSlotsLoading(true);
    setSelectedSlot('');
    api
      .get(`/doctors/${doctorId}/availability`, {
        params: { date: moveTarget.dayKey, durationMinutes: duration },
      })
      .then((res) => setSlots(filterFutureSlots(res.data.availableSlots || [], moveTarget.dayKey)))
      .catch(() => {
        setSlots([]);
        toast.error('Could not load available times.');
      })
      .finally(() => setSlotsLoading(false));
    return undefined;
  }, [moveTarget, user]);

  const openAppointment = (id) => navigate(ROUTES.doctorAppointmentDetail(id));

  const openDay = (day) => {
    if (!isDayInSelectedRange(day)) return;
    setAnchor(startOfDay(day));
    setView('day');
  };

  const clearDrag = () => {
    setDraggingId(null);
    setDropDayKey(null);
  };

  const openMovePopup = (appointmentId, dayKey) => {
    const appointment = appointments.find((a) => a._id === appointmentId);
    if (!appointment) return;
    if (!canMoveAppointment(appointment)) {
      toast.error('Only scheduled or confirmed visits can be moved.');
      return;
    }
    const day = new Date(`${dayKey}T12:00:00`);
    if (!isWorkingDay(day, doctorWorkingDaysOf(appointment, user))) {
      toast.error(`Doctor is not available on ${format(day, 'EEEE')}.`);
      return;
    }
    const fromKey = toDateKey(new Date(appointment.appointmentDate));
    if (fromKey === dayKey) {
      // Same day — still allow picking a new time
      setMoveTarget({ appointment, dayKey, sameDay: true });
      return;
    }
    setMoveTarget({ appointment, dayKey, sameDay: false });
  };

  const handleDropOnDay = (e, dayKey, day) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/appointment-id') || draggingId;
    if (!id || !canManage) {
      clearDrag();
      return;
    }
    const appointment = appointments.find((a) => a._id === id);
    if (day && !isDayInSelectedRange(day)) {
      clearDrag();
      return;
    }
    if (day && appointment && !isWorkingDay(day, doctorWorkingDaysOf(appointment, user))) {
      clearDrag();
      toast.error(`Doctor is not available on ${format(day, 'EEEE')}.`);
      return;
    }
    clearDrag();
    openMovePopup(id, dayKey);
  };

  const allowDragOverDay = (e, day, key) => {
    if (!canManage || !draggingId) return;
    if (!isDayInSelectedRange(day) || !dayIsBookable(day)) {
      e.dataTransfer.dropEffect = 'none';
      return;
    }
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    setDropDayKey(key);
  };
  const confirmMove = async () => {
    if (!moveTarget || !selectedSlot) {
      toast.error('Select an available time.');
      return;
    }
    setSaving(true);
    try {
      await api.patch(`/appointments/${moveTarget.appointment._id}/reschedule`, {
        appointmentDate: moveTarget.dayKey,
        timeSlot: selectedSlot,
      });
      toast.success(
        `Moved to ${format(new Date(`${moveTarget.dayKey}T12:00:00`), 'EEE, MMM d')} · ${selectedSlot}`
      );
      setMoveTarget(null);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not move appointment.');
    } finally {
      setSaving(false);
    }
  };

  const rangeLabel = useMemo(() => {
    if (isLast7) return 'Last 7 days';
    if (filterFrom && filterTo) {
      if (toDateKey(filterFrom) === toDateKey(filterTo)) {
        return format(filterFrom, 'dd MMM yyyy');
      }
      return `${format(filterFrom, 'dd MMM yyyy')} – ${format(filterTo, 'dd MMM yyyy')}`;
    }
    return dateRange.label || 'Date range';
  }, [isLast7, filterFrom, filterTo, dateRange.label]);

  const isMonth = view === 'month';
  const isWeek = view === 'week' || isLast7 || (spanDays > 1 && spanDays <= 7);
  const patient = moveTarget?.appointment
    ? moveTarget.appointment.patientId || moveTarget.appointment.patient
    : null;

  return (
    <div className="page-container !py-3 min-h-[calc(100dvh-3.5rem)]">
      <div className="mb-4 shrink-0 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start justify-between gap-3 min-w-0 w-full md:w-auto">
          <div className="min-w-0 shrink">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a929c] leading-none">Practice</p>
            <h1 className="mt-0.5 text-[28px] sm:text-[30px] font-semibold tracking-tight text-[#1c2430] leading-none">
              Calendar
            </h1>
            {canManage ? (
              <p className="mt-1 text-xs text-ink-faint hidden sm:block">Drag a visit onto another day, then pick an available time.</p>
            ) : null}
          </div>
          <p className="md:hidden inline-flex items-center justify-end gap-1.5 text-xs font-medium text-[#6b7280] min-w-0 max-w-[55%] shrink-0 pt-5 text-right">
            <CalendarIcon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{rangeLabel}</span>
          </p>
        </div>

        <div className="flex flex-col gap-2 w-full md:w-auto md:items-end">
          <div className="flex flex-row flex-wrap items-center gap-2 w-full md:w-auto md:justify-end">
            <p className="hidden md:inline-flex items-center gap-2 text-sm font-medium text-[#6b7280] min-w-0 shrink">
              <CalendarIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span className="truncate whitespace-nowrap">{rangeLabel}</span>
            </p>
            {showMonthNav && navMonths.length > 0 ? (
              <div className="flex flex-wrap items-center gap-1 shrink-0 max-w-full">
                {navMonths.map((monthDate) => {
                  const active = isSameMonth(monthDate, anchor);
                  return (
                    <button
                      key={toDateKey(monthDate)}
                      type="button"
                      className={`btn-sm !px-2.5 ${active ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => goToMonth(monthDate)}
                      aria-current={active ? 'true' : undefined}
                    >
                      {format(monthDate, 'MMM yyyy')}
                    </button>
                  );
                })}
              </div>
            ) : null}
            <DateRangeFilter
              value={dateRange}
              onChange={handleDateRangeChange}
              className="min-w-[10.5rem] flex-1 sm:flex-none sm:w-[13.5rem]"
              align="end"
              defaultPreset="thisMonth"
              showReset
            />
            {canManage && (
              <Link to={ROUTES.doctorBook} className="btn-primary flex-1 sm:flex-none justify-center min-w-[9rem]">
                <CalendarPlus className="w-4 h-4" /> New Appointment
              </Link>
            )}
          </div>
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
                aria-busy="true"
              >
                {(isMonth ? Array.from({ length: 14 }) : days).map((_, i) => (
                  <div key={i} className="p-3 space-y-3">
                    <Skeleton className="h-3 w-8" />
                    <Skeleton className="h-6 w-7" />
                    <Skeleton className="h-16 rounded-[10px]" />
                  </div>
                ))}
              </div>
            ) : isMonth ? (
              <>
                <div className="grid grid-cols-7 shrink-0 border-b border-[#e8eaee]">
                  {WEEKDAY_LABELS.map((label) => (
                    <div key={label} className="px-2 py-2.5 text-center">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a929c]">{label}</p>
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
                    const isDrop = dropDayKey === key;
                    const outOfRange = !isDayInSelectedRange(day);
                    const offDay = !dayIsBookable(day);
                    const disabledDay = outOfRange || offDay;
                    return (
                      <section
                        key={key}
                        className={`min-h-[7.5rem] flex flex-col p-1.5 transition-colors ${
                          outOfRange
                            ? 'bg-[#f3f4f6] text-[#c4c9d0] opacity-60'
                            : offDay
                              ? 'bg-[#eef0f3] text-[#9ca3af]'
                              : inMonth
                                ? 'bg-white'
                                : 'bg-[#f7f8fa]'
                        } ${isToday && !disabledDay ? 'bg-[#fbfaf7]' : ''} ${
                          isDrop && !disabledDay ? 'ring-2 ring-inset ring-[#c9a227]/70 bg-[#f8f4e8]' : ''
                        } ${disabledDay ? 'cursor-not-allowed pointer-events-none' : ''}`}
                        title={
                          outOfRange
                            ? 'Outside selected date range'
                            : offDay
                              ? 'Doctor not available'
                              : undefined
                        }
                        onDragOver={disabledDay ? undefined : (e) => allowDragOverDay(e, day, key)}
                        onDragLeave={
                          disabledDay
                            ? undefined
                            : () => {
                                leaveTimer.current = setTimeout(() => setDropDayKey(null), 40);
                              }
                        }
                        onDrop={disabledDay ? undefined : (e) => handleDropOnDay(e, key, day)}
                      >
                        <button
                          type="button"
                          onClick={() => openDay(day)}
                          disabled={disabledDay}
                          className="self-start mb-1 disabled:cursor-not-allowed"
                          title={outOfRange ? 'Outside selected date range' : 'Open day view'}
                        >
                          <span
                            className={`inline-flex h-7 min-w-7 px-1 items-center justify-center text-[13px] font-semibold ${
                              isToday && !disabledDay
                                ? 'text-[#a8841f] border-b-2 border-[#c9a227]'
                                : outOfRange
                                  ? 'text-[#c4c9d0]'
                                  : offDay
                                    ? 'text-[#9ca3af]'
                                    : inMonth
                                      ? 'text-[#1c2430]'
                                      : 'text-[#9ca3af]'
                            }`}
                          >
                            {format(day, 'd')}
                          </span>
                        </button>
                        {outOfRange ? (
                          <p className="text-[10px] font-medium uppercase tracking-wide text-[#c4c9d0] px-0.5 mb-1">
                            —
                          </p>
                        ) : offDay ? (
                          <p className="text-[10px] font-medium uppercase tracking-wide text-[#9ca3af] px-0.5 mb-1">
                            Off
                          </p>
                        ) : null}
                        <div className="flex-1 min-h-0 space-y-1 overflow-hidden pointer-events-auto">
                          {!outOfRange &&
                            visible.map((appt) => (
                              <CalendarEvent
                                key={appt._id}
                                appointment={appt}
                                onOpen={openAppointment}
                                compact
                                draggable={canManage}
                                dragging={draggingId === appt._id}
                                onDragStart={(a) => setDraggingId(a._id)}
                                onDragEnd={clearDrag}
                              />
                            ))}
                          {!outOfRange && more > 0 ? (
                            <button
                              type="button"
                              onClick={() => openDay(day)}
                              className="w-full text-left px-1 text-[11px] font-semibold text-[#6b7280] hover:text-[#1c2430]"
                            >
                              +{more} more
                            </button>
                          ) : null}
                          {isDrop && !disabledDay && !list.length ? (
                            <p className="text-[11px] font-medium text-[#a8841f] px-1 py-1">Drop to move here</p>
                          ) : null}
                        </div>
                      </section>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                <div className={`grid shrink-0 border-b border-[#e8eaee] ${isWeek ? 'grid-cols-7' : 'grid-cols-1'}`}>
                  {days.map((day) => {
                    const isToday = isSameDay(day, new Date());
                    const outOfRange = !isDayInSelectedRange(day);
                    const offDay = !dayIsBookable(day);
                    const disabledDay = outOfRange || offDay;
                    return (
                      <div
                        key={`h-${toDateKey(day)}`}
                        className={`px-3 py-3 ${
                          outOfRange
                            ? 'bg-[#f3f4f6] opacity-60'
                            : offDay
                              ? 'bg-[#eef0f3]'
                              : isToday
                                ? 'bg-[#fbfaf7]'
                                : ''
                        }`}
                      >
                        <p
                          className={`text-[11px] font-semibold uppercase tracking-[0.12em] ${
                            outOfRange ? 'text-[#c4c9d0]' : offDay ? 'text-[#9ca3af]' : 'text-[#8a929c]'
                          }`}
                        >
                          {format(day, 'EEE')}
                          {outOfRange ? ' · —' : offDay ? ' · Off' : ''}
                        </p>
                        <div className="mt-1.5 flex items-center">
                          <span
                            className={`inline-flex text-[20px] font-semibold leading-none ${
                              outOfRange
                                ? 'text-[#c4c9d0]'
                                : offDay
                                  ? 'text-[#9ca3af]'
                                  : isToday
                                    ? 'text-[#a8841f] border-b-2 border-[#c9a227] pb-0.5'
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

                <div className={`grid flex-1 min-h-0 ${isWeek ? 'grid-cols-7' : 'grid-cols-1'} divide-x divide-[#eef0f3]`}>
                  {days.map((day) => {
                    const key = toDateKey(day);
                    const list = byDay[key] || [];
                    const isToday = isSameDay(day, new Date());
                    const isDrop = dropDayKey === key;
                    const outOfRange = !isDayInSelectedRange(day);
                    const offDay = !dayIsBookable(day);
                    const disabledDay = outOfRange || offDay;
                    return (
                      <section
                        key={key}
                        className={`min-h-0 flex flex-col transition-colors ${
                          outOfRange
                            ? 'bg-[#f3f4f6] opacity-60 cursor-not-allowed pointer-events-none'
                            : offDay
                              ? 'bg-[#eef0f3] cursor-not-allowed'
                              : isToday
                                ? 'bg-[#fbfaf7]'
                                : 'hover:bg-[#fafbfc]'
                        } ${isDrop && !disabledDay ? 'ring-2 ring-inset ring-[#c9a227]/70 bg-[#f8f4e8]' : ''}`}
                        title={
                          outOfRange
                            ? 'Outside selected date range'
                            : offDay
                              ? 'Doctor not available — cannot drop here'
                              : undefined
                        }
                        onDragOver={disabledDay ? undefined : (e) => allowDragOverDay(e, day, key)}
                        onDragLeave={
                          disabledDay
                            ? undefined
                            : () => {
                                leaveTimer.current = setTimeout(() => setDropDayKey(null), 40);
                              }
                        }
                        onDrop={disabledDay ? undefined : (e) => handleDropOnDay(e, key, day)}
                      >
                        <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-2 pointer-events-auto">
                          {!outOfRange &&
                            list.map((appt) => (
                              <CalendarEvent
                                key={appt._id}
                                appointment={appt}
                                onOpen={openAppointment}
                                draggable={canManage}
                                dragging={draggingId === appt._id}
                                onDragStart={(a) => setDraggingId(a._id)}
                                onDragEnd={clearDrag}
                              />
                            ))}
                          {isDrop && !disabledDay ? (
                            <p className="text-center text-[11px] font-medium text-[#a8841f] py-3 border border-dashed border-[#e2d4a8] rounded-[10px] bg-white/70">
                              Drop to pick a time
                            </p>
                          ) : null}
                          {outOfRange && !list.length ? (
                            <p className="text-center text-[11px] font-medium text-[#c4c9d0] py-3">—</p>
                          ) : null}
                          {offDay && !outOfRange && !list.length ? (
                            <p className="text-center text-[11px] font-medium text-[#9ca3af] py-3">
                              Not available
                            </p>
                          ) : null}
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

      <Modal
        open={Boolean(moveTarget)}
        title="Choose available time"
        onClose={() => !saving && setMoveTarget(null)}
      >
        {moveTarget ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-line bg-[#faf8f3] px-3 py-2.5">
              <p className="text-sm font-semibold text-ink">{patientDisplayName(patient)}</p>
              <p className="text-xs text-ink-muted mt-0.5">
                Move to{' '}
                <span className="font-semibold text-ink">
                  {format(new Date(`${moveTarget.dayKey}T12:00:00`), 'EEEE, MMM d')}
                </span>
                {moveTarget.sameDay ? ' · change time' : ''}
              </p>
              <p className="text-xs text-ink-faint mt-1">
                Current: {moveTarget.appointment.timeSlot}
              </p>
            </div>

            {slotsLoading ? (
              <p className="text-sm text-ink-muted">Loading available times…</p>
            ) : !slots.length ? (
              <EmptySlotsHint />
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-56 overflow-y-auto">
                {slots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={`min-h-10 rounded-lg border text-sm font-semibold tabular-nums transition-colors ${
                      selectedSlot === slot
                        ? 'bg-[#1c2430] text-white border-[#1c2430]'
                        : 'bg-white text-ink border-line hover:border-[#c9a227]/70'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1 border-t border-line">
              <button
                type="button"
                className="btn-secondary"
                disabled={saving}
                onClick={() => setMoveTarget(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                disabled={saving || !selectedSlot || slotsLoading}
                onClick={confirmMove}
              >
                {saving ? 'Saving…' : 'Confirm move'}
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

function EmptySlotsHint() {
  return (
    <p className="text-sm text-ink-muted rounded-lg border border-dashed border-line px-3 py-4 text-center">
      No open slots on this day. Try another day.
    </p>
  );
}
