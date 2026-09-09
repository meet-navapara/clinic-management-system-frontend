import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format, parse } from 'date-fns';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft,
  Search,
  Calendar,
  Clock,
  User,
  CheckCircle,
} from 'lucide-react';
import Datepicker from '../components/Datepicker';
import PageLoader from '../components/PageLoader';
import { ROUTES } from '../constants/routes';

export default function ReceptionistBookAppointment() {
  const { user } = useAuth();
  const [patientQuery, setPatientQuery] = useState('');
  const [patientResults, setPatientResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searching, setSearching] = useState(false);

  const [doctors, setDoctors] = useState([]);
  const [doctorId, setDoctorId] = useState('');
  const [doctor, setDoctor] = useState(null);
  const [availableDays, setAvailableDays] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [reason, setReason] = useState('');
  const [booking, setBooking] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(true);

  useEffect(() => {
    const params = {};
    if (user?.clinicId) params.clinicId = user.clinicId;
    api
      .get('/doctors', { params })
      .then((res) => setDoctors(res.data.doctors || []))
      .catch(() => toast.error('Could not load doctors.'))
      .finally(() => setLoadingDoctors(false));
  }, [user?.clinicId]);

  useEffect(() => {
    if (!doctorId) {
      setDoctor(null);
      setAvailableDays([]);
      return;
    }
    api
      .get(`/doctors/${doctorId}`)
      .then((res) => {
        setDoctor(res.data.doctor);
        setAvailableDays(res.data.doctor.availableDays || []);
        setSelectedDate('');
        setSelectedSlot('');
      })
      .catch(() => toast.error('Doctor not found.'));
  }, [doctorId]);

  useEffect(() => {
    if (!doctorId || !selectedDate) return;
    api
      .get(`/doctors/${doctorId}/availability`, { params: { date: selectedDate } })
      .then((res) => {
        setAvailableSlots(res.data.availableSlots || []);
        setSelectedSlot('');
      })
      .catch(() => setAvailableSlots([]));
  }, [doctorId, selectedDate]);

  const searchPatients = async () => {
    if (patientQuery.trim().length < 3) {
      toast.error('Enter at least 3 characters.');
      return;
    }
    setSearching(true);
    try {
      const res = await api.get('/appointments/patients/search', {
        params: { q: patientQuery.trim() },
      });
      setPatientResults(res.data.patients || []);
      if ((res.data.patients || []).length === 0) {
        toast.error('No patients found in your clinic.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Search failed.');
    } finally {
      setSearching(false);
    }
  };

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

  const handleBook = async (e) => {
    e.preventDefault();
    if (!selectedPatient || !doctorId || !selectedDate || !selectedSlot || !reason.trim()) {
      toast.error('Fill all booking fields.');
      return;
    }
    setBooking(true);
    try {
      await api.post('/appointments', {
        patientId: selectedPatient._id,
        doctorId,
        appointmentDate: selectedDate,
        timeSlot: selectedSlot,
        reason: reason.trim(),
      });
      toast.success('Appointment booked.');
      setReason('');
      setSelectedSlot('');
      setSelectedDate('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed.');
    } finally {
      setBooking(false);
    }
  };

  if (loadingDoctors) {
    return (
      <div className="page-container">
        <PageLoader message="Loading..." compact />
      </div>
    );
  }

  return (
    <div className="page-container">
      <Link
        to={ROUTES.receptionistDashboard}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Back to dashboard
      </Link>

      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Book Appointment</h1>
      <p className="text-gray-500 text-sm mb-6">
        Search a clinic patient, choose a doctor, then pick an available slot.
      </p>

      <form onSubmit={handleBook} className="space-y-6 max-w-2xl">
        <div className="card space-y-3">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <User className="w-4 h-4 text-[#a8841f]" /> Patient
          </h2>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                className="input-field pl-9"
                placeholder="Phone or email"
                value={patientQuery}
                onChange={(e) => setPatientQuery(e.target.value)}
              />
            </div>
            <button type="button" className="btn-secondary shrink-0" onClick={searchPatients} disabled={searching}>
              {searching ? '...' : 'Search'}
            </button>
          </div>
          {selectedPatient && (
            <div className="flex items-center gap-2 text-sm bg-[#fdfaf0] rounded-lg px-3 py-2 ring-1 ring-[#d4af37]/30">
              <CheckCircle className="w-4 h-4 text-[#a8841f]" />
              <span className="font-medium">{selectedPatient.name}</span>
              <span className="text-gray-500">· {selectedPatient.phone}</span>
              <button
                type="button"
                className="ml-auto text-xs text-red-600"
                onClick={() => setSelectedPatient(null)}
              >
                Clear
              </button>
            </div>
          )}
          {!selectedPatient && patientResults.length > 0 && (
            <ul className="divide-y divide-gray-100 border border-gray-100 rounded-lg overflow-hidden">
              {patientResults.map((p) => (
                <li key={p._id}>
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2.5 hover:bg-[#faf7f2] text-sm"
                    onClick={() => {
                      setSelectedPatient(p);
                      setPatientResults([]);
                    }}
                  >
                    <span className="font-medium text-gray-900">{p.name}</span>
                    <span className="text-gray-500"> · {p.phone} · {p.email}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card space-y-3">
          <h2 className="font-semibold text-gray-900">Doctor</h2>
          <select
            className="input-field"
            value={doctorId}
            onChange={(e) => setDoctorId(e.target.value)}
            required
          >
            <option value="">Select doctor</option>
            {doctors.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name} — {d.specialization || 'Ayurveda'}
              </option>
            ))}
          </select>
        </div>

        {doctor && (
          <div className="card space-y-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#a8841f]" /> Date & time
            </h2>
            <Datepicker
              value={selectedDate}
              onChange={setSelectedDate}
              min={getMinDate()}
              max={getMaxDate()}
              isDateAllowed={isDayAvailable}
            />
            {selectedDate && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Available slots
                </p>
                <div className="flex flex-wrap gap-2">
                  {(doctor.availableSlots || []).map((slot) => {
                    const free = availableSlots.includes(slot);
                    return (
                      <button
                        key={slot}
                        type="button"
                        disabled={!free}
                        onClick={() => setSelectedSlot(slot)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium ring-1 transition-colors ${
                          selectedSlot === slot
                            ? 'bg-[#2a2420] text-[#e8c547] ring-[#d4af37]/50'
                            : free
                              ? 'bg-white text-gray-700 ring-gray-200 hover:bg-[#faf7f2]'
                              : 'bg-gray-50 text-gray-300 ring-gray-100 cursor-not-allowed'
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
              <textarea
                className="input-field"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
            </div>
          </div>
        )}

        <button type="submit" className="btn-primary w-full sm:w-auto !px-8" disabled={booking}>
          {booking ? 'Booking...' : 'Confirm appointment'}
        </button>
      </form>
    </div>
  );
}
