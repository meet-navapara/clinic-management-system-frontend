import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  addDays,
  eachDayOfInterval,
  endOfWeek,
  format,
  isSameDay,
  isValid,
  startOfDay,
  startOfWeek,
} from 'date-fns';
import { Calendar as CalendarIcon, CalendarPlus, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { getAppointmentStatusConfig, normalizeAppointmentStatus } from '../constants/appointmentStatus';
import { ROUTES } from '../constants/routes';
import { patientDisplayName } from '../utils/display';

function toDateKey(d) {
  return format(d, 'yyyy-MM-dd');
}

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

function CalendarEvent({ appointment, onOpen }) {
  const patient = appointment.patientId || appointment.patient;
  const status = normalizeAppointmentStatus(appointment.status);
  const config = getAppointmentStatusConfig(status);
  const tone = EVENT_TONE[status] || EVENT_TONE.scheduled;

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
  const [view, setView] = useState('week');
  const [anchor, setAnchor] = useState(() => startOfDay(new Date()));
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const range = useMemo(() => {
    if (view === 'day') {
      return { from: anchor, to: anchor };
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
  }, [range]);

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
    setAnchor((prev) => addDays(prev, view === 'day' ? dir : dir * 7));
  };

  const openAppointment = (id) => navigate(ROUTES.doctorAppointmentDetail(id));

  const rangeLabel =
    view === 'day'
      ? format(anchor, 'EEEE, MMMM d, yyyy')
      : `${format(range.from, 'MMM d')} – ${format(range.to, 'MMM d, yyyy')}`;

  return (
    <div className="flex flex-1 flex-col min-h-[calc(100dvh-3.5rem)] w-full max-w-app mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-5">
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
            {['day', 'week'].map((v) => (
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
          <Link
            to={ROUTES.doctorBook}
            className="inline-flex items-center gap-2 min-h-9 px-3.5 rounded-[10px] text-sm font-semibold text-white bg-[#1c2430] hover:bg-[#2a3340] hover:shadow-sm transition-all duration-150"
          >
            <CalendarPlus className="w-4 h-4" /> New Appointment
          </Link>
        </div>
      </div>

      <div className="flex-1 min-h-[28rem] min-w-0 overflow-hidden">
        <div className="h-full overflow-x-auto">
          <div
            className={`h-full min-h-[28rem] bg-white border border-[#e8eaee] rounded-[12px] overflow-hidden flex flex-col ${
              view === 'week' ? 'min-w-[52rem]' : ''
            }`}
            style={{ boxShadow: '0 1px 2px rgba(28, 36, 48, 0.04)' }}
          >
            {loading ? (
              <div className={`grid flex-1 ${view === 'week' ? 'grid-cols-7' : 'grid-cols-1'} divide-x divide-[#eef0f3]`}>
                {days.map((day) => (
                  <div key={toDateKey(day)} className="p-3 animate-pulse">
                    <div className="h-3 w-8 rounded bg-[#eceff3] mb-2" />
                    <div className="h-6 w-7 rounded-full bg-[#eceff3] mb-4" />
                    <div className="h-16 rounded-[10px] bg-[#f3f4f6]" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div
                  className={`grid shrink-0 border-b border-[#e8eaee] ${
                    view === 'week' ? 'grid-cols-7' : 'grid-cols-1'
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
                  className={`grid flex-1 min-h-0 ${view === 'week' ? 'grid-cols-7' : 'grid-cols-1'} divide-x divide-[#eef0f3]`}
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
