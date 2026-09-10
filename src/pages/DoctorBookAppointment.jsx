import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { format, parse } from 'date-fns';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Calendar, Clock, Search, X } from 'lucide-react';
import Datepicker from '../components/Datepicker';
import PageLoader from '../components/PageLoader';
import EmptyState from '../components/ui/EmptyState';
import UserAvatar from '../components/UserAvatar';
import { useAuth } from '../context/AuthContext';
import { ROUTES } from '../constants/routes';

function PatientPicker({ value, onChange, initialPatient }) {
  const wrapRef = useRef(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(initialPatient || null);

  useEffect(() => {
    if (initialPatient) setSelected(initialPatient);
  }, [initialPatient]);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearching(true);
      api
        .get('/patients', {
          params: {
            limit: 20,
            ...(query.trim() ? { search: query.trim() } : {}),
          },
        })
        .then((res) => setResults(res.data.patients || []))
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, query.trim() ? 250 : 0);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const onDoc = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const pick = (p) => {
    setSelected(p);
    onChange(p._id);
    setQuery('');
    setOpen(false);
  };

  const clear = () => {
    setSelected(null);
    onChange('');
    setQuery('');
    setOpen(true);
  };

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint pointer-events-none" />
        <input
          className="input-field pl-9 pr-9"
          placeholder="Search name, phone, or PAT-ID"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (results[0]) pick(results[0]);
            }
            if (e.key === 'Escape') setOpen(false);
          }}
          autoComplete="off"
        />
        {query && (
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-ink-faint hover:text-ink"
            onClick={() => setQuery('')}
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {open && (
        <ul className="absolute z-20 mt-1 w-full max-h-56 overflow-auto rounded-xl bg-white border border-line shadow-lg">
          {searching && results.length === 0 ? (
            <li className="px-3 py-3 text-sm text-ink-muted">Searching…</li>
          ) : results.length === 0 ? (
            <li className="px-3 py-3 text-sm text-ink-muted">No matching patients.</li>
          ) : (
            results.map((p) => {
              const active = value === p._id;
              return (
                <li key={p._id}>
                  <button
                    type="button"
                    onClick={() => pick(p)}
                    className={`w-full text-left px-3 py-2.5 flex items-center gap-3 hover:bg-[#faf8f3] ${
                      active ? 'bg-[#faf8f3]' : ''
                    }`}
                  >
                    <UserAvatar name={p.name} size="sm" />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-ink truncate">{p.name}</span>
                      <span className="block text-xs text-ink-faint truncate">
                        {[p.phone, p.patientCode].filter(Boolean).join(' · ')}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      )}

      {selected && (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-[#faf8f3] border border-line px-3 py-2.5">
          <div className="flex items-center gap-3 min-w-0">
            <UserAvatar name={selected.name} size="sm" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink truncate">{selected.name}</p>
              <p className="text-xs text-ink-faint truncate">
                {[selected.phone, selected.patientCode].filter(Boolean).join(' · ')}
              </p>
            </div>
          </div>
          <button type="button" className="btn-ghost !min-h-8 !px-2 text-xs" onClick={clear}>
            Change
          </button>
        </div>
      )}
    </div>
  );
}

export default function DoctorBookAppointment() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselected = searchParams.get('patientId') || '';

  const [patients, setPatients] = useState([]);
  const [patientId, setPatientId] = useState(preselected);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [availableDays, setAvailableDays] = useState(user?.availableDays || []);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const types = user?.practiceSettings?.appointmentTypes || ['Consultation', 'Follow-up', 'Procedure'];
  const [appointmentType, setAppointmentType] = useState(types[0] || 'Consultation');
  const [durationMinutes, setDurationMinutes] = useState(
    user?.practiceSettings?.defaultDurationMinutes || 30
  );
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    api
      .get('/patients', { params: { limit: 1 } })
      .then(async (res) => {
        const list = res.data.patients || [];
        setPatients(list);
        if (!preselected) return;
        const found = list.find((p) => p._id === preselected);
        if (found) {
          setSelectedPatient(found);
          setPatientId(preselected);
          return;
        }
        try {
          const one = await api.get(`/patients/${preselected}`);
          if (one.data.patient) {
            setSelectedPatient(one.data.patient);
            setPatientId(preselected);
            setPatients((prev) => (prev.length ? prev : [one.data.patient]));
          }
        } catch {
          /* ignore missing preselect */
        }
      })
      .catch(() => toast.error('Could not load patients.'))
      .finally(() => setLoading(false));

    if (user?.availableDays) setAvailableDays(user.availableDays);
  }, [preselected, user?.availableDays]);

  useEffect(() => {
    const doctorId = user?.id || user?._id;
    if (!doctorId || !selectedDate) return;
    api
      .get(`/doctors/${doctorId}/availability`, { params: { date: selectedDate } })
      .then((res) => {
        setAvailableSlots(res.data.availableSlots || []);
        setSelectedSlot('');
      })
      .catch(() => setAvailableSlots([]));
  }, [selectedDate, user]);

  const isDayAvailable = (dateStr) => {
    const parsed = parse(dateStr, 'yyyy-MM-dd', new Date());
    return availableDays.includes(format(parsed, 'EEEE'));
  };

  const getMinDate = () => format(new Date(), 'yyyy-MM-dd');
  const getMaxDate = () => {
    const max = new Date();
    max.setDate(max.getDate() + 30);
    return format(max, 'yyyy-MM-dd');
  };

  const allSlots = user?.availableSlots || [
    '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00',
  ];

  const handleBook = async (e) => {
    e.preventDefault();
    if (!patientId || !selectedDate || !selectedSlot || !reason.trim()) {
      toast.error('Fill all fields.');
      return;
    }
    setBooking(true);
    try {
      const res = await api.post('/appointments', {
        patientId,
        appointmentDate: selectedDate,
        timeSlot: selectedSlot,
        reason: reason.trim(),
        notes: notes.trim(),
        appointmentType,
        durationMinutes: Number(durationMinutes) || 30,
      });
      toast.success('Appointment booked. Reminders scheduled.');
      navigate(ROUTES.doctorAppointmentDetail(res.data.appointment._id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed.');
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <PageLoader message="Loading..." compact />
      </div>
    );
  }

  return (
    <div className="page-container">
      {patients.length === 0 ? (
        <EmptyState
          title="Add a patient first"
          description="Schedule visits against an existing patient record."
          action={
            <Link to={ROUTES.doctorPatientNew} className="btn-primary">
              Add patient
            </Link>
          }
        />
      ) : (
        <form onSubmit={handleBook} className="grid lg:grid-cols-2 gap-4 max-w-4xl">
          <div className="card space-y-3 lg:col-span-2 max-w-xl">
            <label className="label-field">Patient</label>
            <PatientPicker
              value={patientId}
              onChange={setPatientId}
              initialPatient={selectedPatient}
            />
          </div>

          <div className="card space-y-4 lg:col-span-2">
            <h2 className="text-sm font-semibold text-ink flex items-center gap-2">
              <Calendar className="w-4 h-4 text-accent-600" /> Date & time
            </h2>
            <Datepicker
              value={selectedDate}
              onChange={setSelectedDate}
              min={getMinDate()}
              max={getMaxDate()}
              isDateAllowed={isDayAvailable}
              required
            />
            {selectedDate && (
              <div>
                <p className="text-sm font-medium text-ink mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Slots
                </p>
                <div className="flex flex-wrap gap-2">
                  {allSlots.map((slot) => {
                    const free = availableSlots.includes(slot);
                    return (
                      <button
                        key={slot}
                        type="button"
                        disabled={!free}
                        onClick={() => setSelectedSlot(slot)}
                        className={`slot-chip ${
                          selectedSlot === slot
                            ? 'bg-ink text-white ring-ink'
                            : free
                              ? 'bg-white text-ink ring-line hover:ring-accent-400'
                              : 'bg-[#f4f2ee] text-ink-faint ring-transparent cursor-not-allowed'
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label-field">Type</label>
                <select
                  className="input-field"
                  value={appointmentType}
                  onChange={(e) => setAppointmentType(e.target.value)}
                >
                  {types.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label-field">Duration (min)</label>
                <input
                  type="number"
                  min="5"
                  max="240"
                  className="input-field"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="label-field">Reason</label>
              <textarea
                className="input-field"
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label-field">Notes</label>
              <textarea
                className="input-field"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="lg:col-span-2">
            <button type="submit" className="btn-primary" disabled={booking}>
              {booking ? 'Booking...' : 'Confirm appointment'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
