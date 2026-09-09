import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { format, isValid } from 'date-fns';
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageCircle,
  FileText,
  Users,
  Filter,
} from 'lucide-react';
import UserAvatar from '../components/UserAvatar';
import Pagination from '../components/Pagination';
import { getPaginationMeta } from '../utils/pagination';
import PageLoader from '../components/PageLoader';
import {
  appointmentStatusConfig as statusConfig,
  defaultAppointmentStatus as defaultStatus,
} from '../constants/appointmentStatus';

const filterTabs = [
  { id: 'all', label: 'All', icon: Calendar, getCount: (s) => s.total },
  { id: 'pending', label: 'Pending', icon: AlertCircle, getCount: (s) => s.pending },
  { id: 'confirmed', label: 'Confirmed', icon: CheckCircle, getCount: (s) => s.confirmed },
  { id: 'completed', label: 'Completed', icon: CheckCircle, getCount: (s) => s.completed },
  { id: 'cancelled', label: 'Cancelled', icon: XCircle, getCount: (s) => s.cancelled },
];

function getFilterTabClass(id, isActive) {
  if (isActive) {
    if (id === 'all') {
      return 'bg-[#fdf6e3] text-[#876719] ring-2 ring-[#d4af37]/45 shadow-sm font-semibold';
    }
    return `${statusConfig[id].badge} ring-2 shadow-sm font-semibold`;
  }
  return 'bg-white text-gray-600 ring-1 ring-[#ebe4d8] hover:bg-[#faf7f2] hover:ring-[#d4af37]/30 hover:text-gray-800';
}

function StatusFilterTabs({ filter, stats, onSelect, className = '' }) {
  return (
    <div className={className}>
      {filterTabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = filter === tab.id;
        const count = tab.getCount(stats);

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelect(tab.id)}
            aria-pressed={isActive}
            className={`inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-full text-xs sm:text-sm font-medium capitalize transition-all duration-200 ${getFilterTabClass(tab.id, isActive)}`}
          >
            <Icon className="w-3.5 h-3.5 shrink-0 opacity-90" />
            <span>{tab.label}</span>
            <span
              className={`inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-[10px] font-bold tabular-nums ${
                isActive
                  ? 'bg-white/70 text-inherit'
                  : 'bg-[#faf7f2] text-gray-500'
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function MobileStatusFilterMenu({ filter, stats, open, onSelect, onClose }) {
  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/20 sm:hidden"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="absolute top-full right-0 z-50 mt-2 w-56 rounded-xl border border-[#ebe4d8] bg-white shadow-lg overflow-hidden sm:hidden"
        role="menu"
      >
        {filterTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = filter === tab.id;
          const count = tab.getCount(stats);

          return (
            <button
              key={tab.id}
              type="button"
              role="menuitem"
              onClick={() => {
                onSelect(tab.id);
                onClose();
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium capitalize transition-colors border-b border-[#ebe4d8]/60 last:border-b-0 ${
                isActive
                  ? 'bg-[#faf7f2] text-[#876719]'
                  : 'text-gray-700 hover:bg-[#faf7f2]/70'
              }`}
            >
              <span className={`shrink-0 p-1.5 rounded-lg ${isActive ? getFilterTabClass(tab.id, true) : 'bg-[#faf7f2]'}`}>
                <Icon className="w-4 h-4" />
              </span>
              <span className="flex-1">{tab.label}</span>
              <span className="text-xs font-bold tabular-nums text-gray-500">{count}</span>
              {isActive && (
                <CheckCircle className="w-4 h-4 text-[#a8841f] shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}

const statCards = (stats) => [
  {
    label: "Today's Visits",
    shortLabel: 'Today',
    value: stats.today,
    icon: Clock,
    gradient: 'from-[#ecfeff] to-[#cffafe]',
    iconBg: 'bg-cyan-100/80',
    iconColor: 'text-cyan-700',
    valueColor: 'text-cyan-800',
  },
  {
    label: 'Total Appointments',
    shortLabel: 'Total',
    value: stats.total,
    icon: Calendar,
    gradient: 'from-[#fdfaf0] to-[#faf7f2]',
    iconBg: 'bg-[#d4af37]/15',
    iconColor: 'text-[#a8841f]',
    valueColor: 'text-[#876719]',
  },
  {
    label: 'Pending Review',
    shortLabel: 'Pending',
    value: stats.pending,
    icon: AlertCircle,
    gradient: 'from-[#fffbeb] to-[#fdf6e3]',
    iconBg: 'bg-amber-100/80',
    iconColor: 'text-amber-700',
    valueColor: 'text-amber-700',
  },
  {
    label: 'Confirmed',
    shortLabel: 'Confirmed',
    value: stats.confirmed,
    icon: CheckCircle,
    gradient: statusConfig.confirmed.gradient,
    iconBg: statusConfig.confirmed.iconBg,
    iconColor: statusConfig.confirmed.iconColor,
    valueColor: statusConfig.confirmed.valueColor,
  },
  {
    label: 'Completed',
    shortLabel: 'Completed',
    value: stats.completed,
    icon: CheckCircle,
    gradient: statusConfig.completed.gradient,
    iconBg: statusConfig.completed.iconBg,
    iconColor: statusConfig.completed.iconColor,
    valueColor: statusConfig.completed.valueColor,
  },
  {
    label: 'Cancelled',
    shortLabel: 'Cancelled',
    value: stats.cancelled,
    icon: XCircle,
    gradient: 'from-[#fef2f2] to-[#fff5f5]',
    iconBg: 'bg-red-100/80',
    iconColor: 'text-red-700',
    valueColor: 'text-[#b42318]',
  },
];

function formatApptDate(dateStr) {
  const date = new Date(dateStr);
  return isValid(date) ? format(date, 'PPP') : 'Date unavailable';
}

function PatientAppointmentCard({ appt, onUpdateStatus, onWhatsApp }) {
  const config = statusConfig[appt.status] ?? defaultStatus;
  const StatusIcon = config.icon;
  const patientName = appt.patient?.name ?? 'Patient unavailable';
  const contactLine = [appt.patient?.phone, appt.patient?.email].filter(Boolean).join(' · ');

  return (
    <article className="card hover:shadow-lg hover:border-[#d4af37]/35 transition-all overflow-hidden !p-0 w-full min-w-0">
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2 sm:gap-4 mb-4">
          <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
            <UserAvatar
              name={patientName}
              profilePhoto={appt.patient?.profilePhoto}
              role="patient"
              size="lg"
              rounded="xl"
              className="shadow-inner !h-11 !w-11 sm:!h-14 sm:!w-14"
            />

            <div className="min-w-0 flex-1 pr-1">
              <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest text-[#a8841f]">
                Patient
              </p>
              <h3
                className="font-bold text-gray-900 text-[15px] sm:text-base md:text-lg leading-tight truncate"
                title={patientName}
              >
                {patientName}
              </h3>
              {contactLine ? (
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5 break-words">{contactLine}</p>
              ) : (
                <p className="text-xs sm:text-sm text-gray-400 mt-0.5 italic">Contact unavailable</p>
              )}
            </div>
          </div>

          <span
            className={`inline-flex items-center gap-0.5 sm:gap-1 self-start shrink-0 px-2 py-0.5 sm:px-2.5 sm:py-1 md:px-3 rounded-full text-[10px] sm:text-[11px] md:text-xs font-semibold capitalize ring-1 ${config.badge}`}
          >
            <StatusIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 hidden xs:inline" />
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
        {['pending', 'confirmed'].includes(appt.status) && (
          <button
            type="button"
            onClick={() => onUpdateStatus(appt._id, 'cancelled')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-sm px-4 py-2.5 rounded-lg font-medium bg-white text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
          >
            <XCircle className="w-4 h-4" />
            Cancel
          </button>
        )}

        {appt.status === 'pending' && (
          <button
            type="button"
            onClick={() => onUpdateStatus(appt._id, 'confirmed')}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-sm px-4 py-2.5 rounded-lg font-medium transition-colors ${statusConfig.confirmed.actionClass}`}
          >
            <CheckCircle className="w-4 h-4" />
            Confirm
          </button>
        )}

        {appt.status === 'confirmed' && (
          <button
            type="button"
            onClick={() => onUpdateStatus(appt._id, 'completed')}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-sm px-4 py-2.5 rounded-lg font-medium transition-colors ${statusConfig.completed.actionClass}`}
          >
            <CheckCircle className="w-4 h-4" />
            Mark Complete
          </button>
        )}

        <button
          type="button"
          onClick={() => onWhatsApp(appt._id)}
          className="w-full sm:w-auto btn-whatsapp inline-flex items-center justify-center gap-1.5 text-sm px-4 py-2.5 rounded-lg font-medium"
        >
          <MessageCircle className="w-4 h-4" />
          WhatsApp
        </button>
      </div>
    </article>
  );
}

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const filterRef = useRef(null);

  useEffect(() => {
    if (!filterMenuOpen) return undefined;

    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setFilterMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [filterMenuOpen]);

  const fetchAppointments = () => {
    setLoading(true);
    setError(null);
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
  };

  useEffect(() => { fetchAppointments(); }, []);

  const handleFilterChange = (nextFilter) => {
    setFilter(nextFilter);
    setCurrentPage(1);
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/appointments/${id}/status`, { status });
      toast.success(`Appointment ${status}.`);
      fetchAppointments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed.');
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

  const filtered = filter === 'all'
    ? appointments
    : appointments.filter((a) => a.status === filter);

  const {
    paginatedItems,
    totalPages,
    currentPage: safePage,
    totalItems: filteredTotal,
    showingFrom,
    showingTo,
  } = getPaginationMeta(filtered, currentPage);

  const stats = {
    total: appointments.length,
    pending: appointments.filter((a) => a.status === 'pending').length,
    confirmed: appointments.filter((a) => a.status === 'confirmed').length,
    completed: appointments.filter((a) => a.status === 'completed').length,
    cancelled: appointments.filter((a) => a.status === 'cancelled').length,
    today: appointments.filter((a) => {
      const d = new Date(a.appointmentDate);
      if (!isValid(d)) return false;
      const today = new Date().toDateString();
      return d.toDateString() === today && a.status !== 'cancelled';
    }).length,
  };

  return (
    <div className="page-container">
      <div className="mb-6 sm:mb-8">
        <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-[#a8841f] mb-1">
          Doctor Panel
        </p>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
          Dr. {user?.name?.replace('Dr. ', '')}
        </h1>
        <p className="text-gray-500 mt-1 text-sm sm:text-base">
          {user?.specialization} — Appointment Dashboard
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {statCards(stats).map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.shortLabel}
              className={`relative overflow-hidden rounded-xl border border-[#ebe4d8] bg-gradient-to-br ${s.gradient} p-4 sm:p-5 shadow-sm hover:shadow-md hover:border-[#d4af37]/40 transition-all`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className={`text-2xl sm:text-3xl font-bold tabular-nums ${s.valueColor}`}>
                    {s.value}
                  </p>
                  <p className="text-xs sm:text-sm font-medium text-gray-600 mt-1 leading-snug">
                    <span className="sm:hidden">{s.shortLabel}</span>
                    <span className="hidden sm:inline">{s.label}</span>
                  </p>
                </div>
                <div className={`shrink-0 p-2.5 sm:p-3 rounded-xl ${s.iconBg}`}>
                  <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${s.iconColor}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop status filter tabs */}
      <StatusFilterTabs
        filter={filter}
        stats={stats}
        onSelect={handleFilterChange}
        className="hidden sm:flex flex-wrap gap-2 mb-6 sm:mb-8"
      />

      {/* Mobile filter — top of patient cards */}
      <div ref={filterRef} className="sm:hidden relative flex items-center justify-end mb-3">
        <button
          type="button"
          onClick={() => setFilterMenuOpen((open) => !open)}
          aria-label="Filter appointments"
          aria-expanded={filterMenuOpen}
          className={`inline-flex items-center justify-center w-10 h-10 rounded-xl border shadow-sm transition-all ${
            filter !== 'all' || filterMenuOpen
              ? 'bg-[#fdf6e3] border-[#d4af37]/50 text-[#876719] ring-2 ring-[#d4af37]/25'
              : 'bg-white border-[#ebe4d8] text-gray-600 hover:border-[#d4af37]/40 hover:bg-[#faf7f2]'
          }`}
        >
          <Filter className="w-5 h-5" />
        </button>
        <MobileStatusFilterMenu
          filter={filter}
          stats={stats}
          open={filterMenuOpen}
          onSelect={handleFilterChange}
          onClose={() => setFilterMenuOpen(false)}
        />
      </div>

      {loading ? (
        <PageLoader message="Loading appointments..." compact />
      ) : error ? (
        <div className="text-center py-16 card border-[#ebe4d8]">
          <Calendar className="w-12 h-12 text-red-300 mx-auto mb-3" />
          <p className="text-gray-700 mb-2">{error}</p>
          <button type="button" onClick={fetchAppointments} className="btn-primary text-sm">
            Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 card border-[#ebe4d8]">
          <Users className="w-12 h-12 text-[#d4af37]/40 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No appointments found</p>
          <p className="text-sm text-gray-400 mt-1">
            {filter === 'all' ? 'New patient bookings will appear here.' : `No ${filter} appointments.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedItems.map((appt) => (
            <PatientAppointmentCard
              key={appt._id}
              appt={appt}
              onUpdateStatus={updateStatus}
              onWhatsApp={sendWhatsApp}
            />
          ))}
          <Pagination
            currentPage={safePage}
            totalPages={totalPages}
            totalItems={filteredTotal}
            showingFrom={showingFrom}
            showingTo={showingTo}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}
