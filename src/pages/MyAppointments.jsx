import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { format, isValid } from 'date-fns';
import {
  Calendar,
  Clock,
  MessageCircle,
  XCircle,
  CheckCircle,
  AlertCircle,
  FileText,
} from 'lucide-react';
import UserAvatar from '../components/UserAvatar';
import Pagination from '../components/Pagination';
import { getPaginationMeta } from '../utils/pagination';
import {
  appointmentStatusConfig as statusConfig,
  defaultAppointmentStatus as defaultStatus,
} from '../constants/appointmentStatus';
import PageLoader from '../components/PageLoader';

function formatApptDate(dateStr) {
  const date = new Date(dateStr);
  return isValid(date) ? format(date, 'PPP') : 'Date unavailable';
}

function AppointmentCard({ appt, userRole, onWhatsApp, onCancel }) {
  const isPatient = userRole === 'patient';
  const person = isPatient ? appt.doctor : appt.patient;
  const personName = person?.name ?? (isPatient ? 'Doctor unavailable' : 'Patient unavailable');
  const config = statusConfig[appt.status] ?? defaultStatus;
  const StatusIcon = config.icon;

  const contactLine = !isPatient
    ? [appt.patient?.phone, appt.patient?.email].filter(Boolean).join(' · ')
    : appt.doctor?.specialization;

  return (
    <article className="card hover:shadow-lg hover:border-[#d4af37]/35 transition-all overflow-hidden !p-0 w-full min-w-0">
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2 sm:gap-4 mb-4">
          <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
            <UserAvatar
              name={personName}
              profilePhoto={person?.profilePhoto}
              role={isPatient ? 'doctor' : 'patient'}
              size="lg"
              rounded="xl"
              className="shadow-inner !h-11 !w-11 sm:!h-14 sm:!w-14"
            />

            <div className="min-w-0 flex-1 pr-1">
              <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest text-[#a8841f]">
                {isPatient ? 'Your Doctor' : 'Patient'}
              </p>
              <h3 className="font-bold text-gray-900 text-[15px] sm:text-base md:text-lg leading-tight truncate" title={personName}>
                {personName}
              </h3>
              {contactLine && (
                <p className="text-xs sm:text-sm text-primary-600 font-medium mt-0.5 break-words">
                  {contactLine}
                </p>
              )}
            </div>
          </div>

          <span
            className={`inline-flex items-center gap-0.5 sm:gap-1 self-start shrink-0 px-2 py-0.5 sm:px-2.5 sm:py-1 md:px-3 rounded-full text-[10px] sm:text-[11px] md:text-xs font-semibold capitalize ring-1 ${config.badge}`}
          >
            {appt.status}
          </span>
        </div>

        {/* Mobile — date & time in one row, reason below */}
        <div className="flex flex-col gap-2.5 sm:hidden w-full">
          <div className="grid grid-cols-2 gap-2 w-full min-w-0">
            <div className="flex items-center gap-1.5 bg-[#faf7f2] px-2.5 py-2.5 rounded-lg text-xs text-gray-600 min-w-0">
              <Calendar className="w-3.5 h-3.5 text-[#a8841f] shrink-0" />
              <span className="truncate leading-snug" title={formatApptDate(appt.appointmentDate)}>
                {formatApptDate(appt.appointmentDate)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#faf7f2] px-2.5 py-2.5 rounded-lg text-xs text-gray-600 min-w-0">
              <Clock className="w-3.5 h-3.5 text-[#a8841f] shrink-0" />
              <span className="font-medium truncate">{appt.timeSlot}</span>
            </div>
          </div>
          <div className="rounded-xl bg-[#fdfaf0]/70 border border-[#ebe4d8] px-3.5 py-3 min-w-0 w-full">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#876719] mb-1">
              <FileText className="w-3.5 h-3.5 shrink-0" />
              Reason for visit
            </p>
            <p className="text-xs text-gray-600 leading-relaxed break-words">
              {appt.reason || '—'}
            </p>
          </div>
        </div>

        {/* Tablet & desktop — date/time column + reason column */}
        <div className="hidden sm:grid sm:grid-cols-2 gap-2.5 sm:gap-3 w-full items-stretch">
          <div className="flex flex-col gap-2.5 min-w-0">
            <div className="flex items-center gap-2.5 bg-[#faf7f2] px-3 py-2.5 rounded-lg text-sm text-gray-600 min-w-0 w-full">
              <Calendar className="w-4 h-4 text-[#a8841f] shrink-0" />
              <span className="break-words leading-snug">{formatApptDate(appt.appointmentDate)}</span>
            </div>
            <div className="flex items-center gap-2.5 bg-[#faf7f2] px-3 py-2.5 rounded-lg text-sm text-gray-600 min-w-0 w-full">
              <Clock className="w-4 h-4 text-[#a8841f] shrink-0" />
              <span className="font-medium">{appt.timeSlot}</span>
            </div>
          </div>

          <div className="rounded-xl bg-[#fdfaf0]/70 border border-[#ebe4d8] px-3.5 py-3 min-w-0 w-full h-full flex flex-col">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#876719] mb-1">
              <FileText className="w-3.5 h-3.5 shrink-0" />
              Reason for visit
            </p>
            <p className="text-sm text-gray-600 leading-relaxed break-words flex-1">
              {appt.reason || '—'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-3 px-4 sm:px-5 py-3.5 sm:py-4 bg-[#faf7f2]/60 border-t border-[#ebe4d8] w-full">
        {isPatient && ['pending', 'confirmed'].includes(appt.status) && (
          <button
            type="button"
            onClick={() => onCancel(appt._id)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-sm px-4 py-2.5 rounded-lg font-medium bg-white text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
          >
            <XCircle className="w-4 h-4 shrink-0" />
            Cancel Appointment
          </button>
        )}
        <button
          type="button"
          onClick={() => onWhatsApp(appt._id)}
          className="btn-whatsapp w-full sm:w-auto !py-2.5 !px-4 text-sm"
        >
          <MessageCircle className="w-4 h-4 shrink-0" />
          WhatsApp
        </button>
      </div>
    </article>
  );
}

export default function MyAppointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    api
      .get('/appointments/my')
      .then((res) => {
        setAppointments(Array.isArray(res.data.appointments) ? res.data.appointments : []);
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Failed to load appointments. Please try again.');
        setAppointments([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const cancelAppointment = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      await api.patch(`/appointments/${id}/status`, { status: 'cancelled' });
      toast.success('Appointment cancelled.');
      setAppointments((prev) =>
        prev.map((a) => (a._id === id ? { ...a, status: 'cancelled' } : a))
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cancellation failed.');
    }
  };

  const sendWhatsApp = async (id) => {
    try {
      const res = await api.get(`/appointments/${id}/whatsapp`);
      window.open(res.data.whatsappUrl, '_blank');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not generate WhatsApp link.');
    }
  };

  const {
    paginatedItems,
    totalPages,
    currentPage: safePage,
    totalItems,
    showingFrom,
    showingTo,
  } = getPaginationMeta(appointments, currentPage);

  return (
    <div className="page-container w-full min-w-0">
      <div className="mb-6 sm:mb-8 w-full">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">My Appointments</h1>
        <p className="text-gray-500 mt-1 text-sm sm:text-base">
          {user?.role === 'doctor' ? 'All your scheduled appointments' : 'Your booking history'}
        </p>
      </div>

      {loading ? (
        <PageLoader message="Loading your appointments..." compact />
      ) : error ? (
        <div className="text-center py-16 card w-full">
          <div className="w-14 h-14 rounded-xl bg-red-50 ring-1 ring-red-100 flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-7 h-7 text-red-400" />
          </div>
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="btn-primary text-sm"
          >
            Retry
          </button>
        </div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-16 card w-full">
          <div className="w-14 h-14 rounded-xl bg-[#faf7f2] ring-1 ring-[#ebe4d8] flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-7 h-7 text-[#a8841f]" />
          </div>
          <p className="text-gray-500 mb-4">No appointments yet.</p>
          {user?.role === 'patient' && (
            <Link to="/patient/dashboard" className="btn-primary text-sm inline-block">
              Find a Doctor
            </Link>
          )}
        </div>
      ) : (
        <div className="w-full min-w-0 space-y-4 sm:space-y-5">
          {paginatedItems.map((appt) => (
            <AppointmentCard
              key={appt._id}
              appt={appt}
              userRole={user?.role}
              onWhatsApp={sendWhatsApp}
              onCancel={cancelAppointment}
            />
          ))}
          <Pagination
            currentPage={safePage}
            totalPages={totalPages}
            totalItems={totalItems}
            showingFrom={showingFrom}
            showingTo={showingTo}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}
