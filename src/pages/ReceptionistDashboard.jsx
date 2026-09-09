import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { format, isValid } from 'date-fns';
import {
  ClipboardList,
  UserPlus,
  CalendarDays,
  CalendarPlus,
  Filter,
} from 'lucide-react';
import PageLoader from '../components/PageLoader';
import { ROUTES } from '../constants/routes';
import {
  appointmentStatusConfig as statusConfig,
  defaultAppointmentStatus as defaultStatus,
} from '../constants/appointmentStatus';

function formatApptDate(dateStr) {
  const date = new Date(dateStr);
  return isValid(date) ? format(date, 'PPP') : 'Date unavailable';
}

export default function ReceptionistDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [doctorFilter, setDoctorFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const load = async () => {
    try {
      const params = {};
      if (doctorFilter) params.doctorId = doctorFilter;
      if (statusFilter) params.status = statusFilter;
      const [apptRes, docRes] = await Promise.all([
        api.get('/appointments/my', { params }),
        api.get('/doctors', { params: user?.clinicId ? { clinicId: user.clinicId } : {} }),
      ]);
      setAppointments(apptRes.data.appointments || []);
      setDoctors(docRes.data.doctors || []);
    } catch {
      toast.error('Could not load clinic appointments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorFilter, statusFilter, user?.clinicId]);

  const updateStatus = async (id, status) => {
    setUpdatingId(id);
    try {
      await api.patch(`/appointments/${id}/status`, { status });
      toast.success(`Appointment ${status}.`);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="page-container">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[#a8841f] uppercase tracking-wide">Reception</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
            Welcome{user?.name ? `, ${user.name}` : ''}
          </h1>
          <p className="text-gray-500 mt-2 max-w-xl text-sm sm:text-base">
            Clinic appointments and booking. Revenue is not available for this role.
          </p>
        </div>
        <Link to={ROUTES.receptionistBook} className="btn-primary inline-flex items-center gap-2 !py-2.5">
          <CalendarPlus className="w-4 h-4" />
          Book appointment
        </Link>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="card">
          <UserPlus className="w-7 h-7 text-[#a8841f] mb-2" />
          <h2 className="font-semibold text-gray-900">Patients</h2>
          <p className="text-sm text-gray-500 mt-1">Search by phone/email when booking.</p>
        </div>
        <div className="card">
          <CalendarDays className="w-7 h-7 text-[#a8841f] mb-2" />
          <h2 className="font-semibold text-gray-900">Appointments</h2>
          <p className="text-sm text-gray-500 mt-1">{appointments.length} shown with current filters</p>
        </div>
        <div className="card">
          <ClipboardList className="w-7 h-7 text-[#a8841f] mb-2" />
          <h2 className="font-semibold text-gray-900">Doctors</h2>
          <p className="text-sm text-gray-500 mt-1">{doctors.length} active in your clinic</p>
        </div>
      </div>

      <div className="card mb-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <span className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
            <Filter className="w-4 h-4 text-[#a8841f]" /> Filters
          </span>
          <select
            className="input-field sm:max-w-xs"
            value={doctorFilter}
            onChange={(e) => setDoctorFilter(e.target.value)}
          >
            <option value="">All doctors</option>
            {doctors.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name}
              </option>
            ))}
          </select>
          <select
            className="input-field sm:max-w-xs"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All statuses</option>
            {['pending', 'confirmed', 'completed', 'cancelled'].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <PageLoader message="Loading appointments..." compact />
      ) : appointments.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">No appointments match these filters.</div>
      ) : (
        <div className="space-y-3">
          {appointments.map((appt) => {
            const config = statusConfig[appt.status] ?? defaultStatus;
            return (
              <article key={appt._id} className="card !p-4 sm:!p-5">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-[#a8841f]">
                      {appt.doctor?.name || 'Doctor'} · {appt.patient?.name || 'Patient'}
                    </p>
                    <p className="font-semibold text-gray-900 mt-0.5">
                      {formatApptDate(appt.appointmentDate)} · {appt.timeSlot}
                    </p>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{appt.reason}</p>
                    {appt.patient?.phone && (
                      <p className="text-xs text-gray-400 mt-1">{appt.patient.phone}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-stretch sm:items-end gap-2 shrink-0">
                    <span
                      className={`inline-flex self-start sm:self-end px-2.5 py-1 rounded-full text-xs font-semibold capitalize ring-1 ${config.badge}`}
                    >
                      {appt.status}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {appt.status === 'pending' && (
                        <button
                          type="button"
                          className="btn-secondary !py-1.5 !px-3 text-xs"
                          disabled={updatingId === appt._id}
                          onClick={() => updateStatus(appt._id, 'confirmed')}
                        >
                          Confirm
                        </button>
                      )}
                      {['pending', 'confirmed'].includes(appt.status) && (
                        <button
                          type="button"
                          className="text-xs font-semibold text-red-600 px-2 py-1.5"
                          disabled={updatingId === appt._id}
                          onClick={() => updateStatus(appt._id, 'cancelled')}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
