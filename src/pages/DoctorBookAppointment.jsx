import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { format, parse } from 'date-fns';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Calendar, Clock } from 'lucide-react';
import Datepicker from '../components/Datepicker';
import PageLoader from '../components/PageLoader';
import EmptyState from '../components/ui/EmptyState';
import Dropdown from '../components/ui/Dropdown';
import PatientPicker from '../components/PatientPicker';
import { useAuth } from '../context/AuthContext';
import { ROUTES } from '../constants/routes';
import RequiredMark from '../components/ui/RequiredMark';

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
  const [doctors, setDoctors] = useState([]);
  const [doctorId, setDoctorId] = useState(user?.role === 'doctor' ? (user?.id || user?._id) : '');

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
    if (user?.role !== 'doctor') {
      api
        .get('/doctors')
        .then((res) => {
          const list = res.data.doctors || [];
          setDoctors(list);
          if (!doctorId && list[0]) {
            const first = list[0];
            setDoctorId(String(first._id));
            if (first.availableDays?.length) setAvailableDays(first.availableDays);
            if (first.practiceSettings?.defaultDurationMinutes) {
              setDurationMinutes(first.practiceSettings.defaultDurationMinutes);
            }
          }
        })
        .catch(() => {});
    }
  }, [preselected, user?.availableDays, user?.role]);

  // When staff picks a doctor, load that doctor's working days / duration immediately
  useEffect(() => {
    if (user?.role === 'doctor' || !doctorId) return;
    const doc = doctors.find((d) => String(d._id) === String(doctorId));
    if (!doc) return;
    if (doc.availableDays?.length) setAvailableDays(doc.availableDays);
    if (doc.practiceSettings?.defaultDurationMinutes) {
      setDurationMinutes(doc.practiceSettings.defaultDurationMinutes);
    }
    const typesFromDoc = doc.practiceSettings?.appointmentTypes;
    if (typesFromDoc?.length) setAppointmentType(typesFromDoc[0]);
    setSelectedDate('');
    setSelectedSlot('');
    setAvailableSlots([]);
  }, [doctorId, doctors, user?.role]);

  useEffect(() => {
    const id = doctorId || (user?.role === 'doctor' ? user?.id || user?._id : '');
    if (!id || !selectedDate) return;
    const duration = Number(durationMinutes) || 30;
    api
      .get(`/doctors/${id}/availability`, {
        params: { date: selectedDate, durationMinutes: duration },
      })
      .then((res) => {
        setAvailableSlots(res.data.availableSlots || []);
        setAvailableDays(res.data.availableDays || availableDays);
        setSelectedSlot('');
      })
      .catch(() => setAvailableSlots([]));
  }, [selectedDate, user, doctorId, durationMinutes]);

  const isDayAvailable = (dateStr) => {
    const parsed = parse(dateStr, 'yyyy-MM-dd', new Date());
    const day = format(parsed, 'EEEE');
    // Empty list = not loaded yet / unset — allow Mon–Fri so staff can pick a date
    // before doctor days arrive; backend still enforces the real schedule.
    if (!availableDays?.length) {
      return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(day);
    }
    return availableDays.includes(day);
  };

  const getMinDate = () => format(new Date(), 'yyyy-MM-dd');
  const getMaxDate = () => {
    const max = new Date();
    max.setDate(max.getDate() + 30);
    return format(max, 'yyyy-MM-dd');
  };

  const handleBook = async (e) => {
    e.preventDefault();
    if (!patientId || !selectedDate || !selectedSlot || !reason.trim()) {
      toast.error('Fill all fields.');
      return;
    }
    if (user?.role !== 'doctor' && !doctorId) {
      toast.error('Select a doctor.');
      return;
    }
    setBooking(true);
    try {
      const res = await api.post('/appointments', {
        patientId,
        doctorId: user?.role === 'doctor' ? undefined : doctorId,
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
        <form onSubmit={handleBook} className="grid lg:grid-cols-2 gap-4">
          <div className="card space-y-3 lg:col-span-2">
            <label className="label-field">Patient <RequiredMark /></label>
            <PatientPicker
              value={patientId}
              onChange={setPatientId}
              initialPatient={selectedPatient}
            />
            {user?.role !== 'doctor' && (
              <div>
                <label className="label-field">Doctor <RequiredMark /></label>
                <Dropdown
                  required
                  value={doctorId}
                  onChange={setDoctorId}
                  placeholder="Select doctor"
                  ariaLabel="Doctor"
                  options={doctors.map((d) => ({ value: String(d._id), label: d.name }))}
                />
              </div>
            )}
          </div>

          <div className="card space-y-4 lg:col-span-2">
            <h2 className="text-sm font-semibold text-ink flex items-center gap-2">
              <Calendar className="w-4 h-4 text-accent-600" /> Date & time
            </h2>
            <div>
              <label className="label-field">Date <RequiredMark /></label>
              <Datepicker
                value={selectedDate}
                onChange={setSelectedDate}
                min={getMinDate()}
                max={getMaxDate()}
                isDateAllowed={isDayAvailable}
                required
              />
            </div>
            {selectedDate && (
              <div>
                <p className="text-sm font-medium text-ink mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Available slots ({durationMinutes || 30} min) <RequiredMark />
                </p>
                {!availableSlots.length ? (
                  <p className="text-sm text-ink-muted">
                    No free slots for this duration. Try another date or change duration.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={`slot-chip ${
                          selectedSlot === slot
                            ? 'bg-ink text-white ring-ink'
                            : 'bg-white text-ink ring-line hover:ring-accent-400'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                )}
                <p className="text-xs text-ink-faint mt-2">
                  Slots update automatically when you change duration (e.g. 15 / 30 / 45 min).
                </p>
              </div>
            )}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label-field">Type</label>
                <Dropdown
                  value={appointmentType}
                  onChange={setAppointmentType}
                  ariaLabel="Appointment type"
                  options={types}
                />
              </div>
              <div>
                <label className="label-field">Duration (min)</label>
                <Dropdown
                  value={String(durationMinutes)}
                  onChange={(v) => setDurationMinutes(v)}
                  ariaLabel="Duration"
                  options={[
                    { value: '15', label: '15 min' },
                    { value: '20', label: '20 min' },
                    { value: '30', label: '30 min' },
                    { value: '45', label: '45 min' },
                    { value: '60', label: '60 min' },
                    { value: '90', label: '90 min' },
                  ]}
                />
              </div>
            </div>
            <div>
              <label className="label-field">Reason <RequiredMark /></label>
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
