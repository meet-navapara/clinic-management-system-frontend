import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, parse } from 'date-fns';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft, Briefcase, IndianRupee, Calendar, Clock, MessageCircle, CheckCircle,
} from 'lucide-react';
import DoctorMobileProfileCard from '../components/DoctorMobileProfileCard';
import DoctorRatingDisplay from '../components/DoctorRatingDisplay';
import ExperienceRatingPrompt from '../components/ExperienceRatingPrompt';
import RatingModal from '../components/RatingModal';
import Datepicker from '../components/Datepicker';
import PageLoader from '../components/PageLoader';

export default function DoctorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [doctor, setDoctor] = useState(null);
  const [availableDays, setAvailableDays] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState(false);
  const [whatsappUrl, setWhatsappUrl] = useState('');
  const [hasRated, setHasRated] = useState(false);
  const [ratingModalOpen, setRatingModalOpen] = useState(false);

  useEffect(() => {
    api.get(`/doctors/${id}`).then((res) => {
      setDoctor(res.data.doctor);
      setAvailableDays(res.data.doctor.availableDays);
    }).catch(() => {
      toast.error('Doctor not found.');
      navigate('/patient/dashboard');
    }).finally(() => setLoading(false));
  }, [id, navigate]);

  useEffect(() => {
    if (!id || user?.role !== 'patient') {
      setHasRated(false);
      return;
    }

    api
      .get(`/ratings/mine/${id}`)
      .then((res) => setHasRated(Boolean(res.data.hasRated)))
      .catch(() => setHasRated(false));
  }, [id, user?.role]);

  const handleExperienceClick = () => {
    if (hasRated) return;
    setRatingModalOpen(true);
  };

  const handleRatingSubmitted = (updatedDoctor) => {
    setHasRated(true);
    if (!updatedDoctor) return;

    setDoctor((prev) =>
      prev
        ? {
            ...prev,
            averageRating: updatedDoctor.averageRating,
            ratingCount: updatedDoctor.ratingCount,
          }
        : prev
    );
  };

  useEffect(() => {
    if (!selectedDate) return;
    api.get(`/doctors/${id}/availability`, { params: { date: selectedDate } })
      .then((res) => {
        setAvailableSlots(res.data.availableSlots);
        setSelectedSlot('');
      });
  }, [selectedDate, id]);

  const getMinDate = () => format(new Date(), 'yyyy-MM-dd');

  const getMaxDate = () => {
    const max = new Date();
    max.setDate(max.getDate() + 30);
    return format(max, 'yyyy-MM-dd');
  };

  const isDayAvailable = (dateStr) => {
    const parsed = parse(dateStr, 'yyyy-MM-dd', new Date());
    return availableDays.includes(format(parsed, 'EEEE'));
  };

  const getAllSlots = () => doctor?.availableSlots || [];

  const isSlotDisabled = (slot) => {
    if (!selectedDate) return true;

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    if (selectedDate === todayStr) {
      const nowTime = format(new Date(), 'HH:mm');
      if (slot <= nowTime) return true;
    }

    return !availableSlots.includes(slot);
  };

  useEffect(() => {
    if (selectedSlot && isSlotDisabled(selectedSlot)) {
      setSelectedSlot('');
    }
  }, [selectedDate, availableSlots, selectedSlot, doctor]);

  const handleDateChange = (dateStr) => {
    setSelectedDate(dateStr);
  };

  const handleInvalidDate = (dateStr) => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    if (dateStr < todayStr) {
      toast.error('Past dates cannot be selected.');
      return;
    }
    toast.error('Doctor is not available on this day.');
  };

  const renderTimeSlots = (gridClassName) => {
    if (!selectedDate) {
      return <p className="text-sm text-gray-400">Select a date to view available slots.</p>;
    }

    const slots = getAllSlots();
    if (slots.length === 0) {
      return <p className="text-sm text-red-500">No slots configured for this doctor.</p>;
    }

    return (
      <div className={gridClassName}>
        {slots.map((slot) => {
          const slotDisabled = booking || isSlotDisabled(slot);
          return (
            <button
              key={slot}
              type="button"
              disabled={slotDisabled}
              onClick={() => !booking && setSelectedSlot(slot)}
              className={`py-2.5 rounded-lg text-sm font-medium border transition-all ${
                selectedSlot === slot
                  ? 'bg-primary-600 text-white border-primary-600'
                  : slotDisabled
                    ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-primary-300'
              }`}
            >
              {slot}
            </button>
          );
        })}
      </div>
    );
  };

  const datePickerProps = {
    value: selectedDate,
    onChange: handleDateChange,
    min: getMinDate(),
    max: getMaxDate(),
    isDateAllowed: isDayAvailable,
    onInvalidSelect: handleInvalidDate,
    required: true,
    placeholder: 'Choose appointment date',
    disabled: booking,
  };

  const handleBook = async (e) => {
    e.preventDefault();
    if (!selectedDate || !selectedSlot || !reason.trim()) {
      toast.error('Please fill all fields.');
      return;
    }

    setBooking(true);
    try {
      const res = await api.post('/appointments', {
        doctorId: id,
        appointmentDate: selectedDate,
        timeSlot: selectedSlot,
        reason,
      });

      setBooked(true);
      setWhatsappUrl(res.data.whatsappUrl);
      toast.success('Appointment booked successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed.');
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <PageLoader message="Loading doctor profile..." />
      </div>
    );
  }

  if (booked) {
    return (
      <div className="max-w-lg mx-auto px-3 sm:px-4 py-10 sm:py-16 text-center">
        <div className="card">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Appointment Booked!</h2>
          <p className="text-gray-500 mb-6">
            Your appointment with {doctor.name} has been confirmed.
          </p>

          <div className="bg-gray-50 rounded-lg p-4 text-left mb-6 space-y-2 text-sm">
            <p><span className="font-medium">Doctor:</span> {doctor.name}</p>
            <p><span className="font-medium">Date:</span> {format(new Date(selectedDate), 'PPPP')}</p>
            <p><span className="font-medium">Time:</span> {selectedSlot}</p>
            <p><span className="font-medium">Reason:</span> {reason}</p>
          </div>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-whatsapp w-full justify-center mb-3"
          >
            <MessageCircle className="w-5 h-5" />
            Send Details on WhatsApp
          </a>

          <button onClick={() => navigate('/appointments')} className="btn-secondary w-full">
            View My Appointments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <button
        onClick={() => navigate('/patient/dashboard')}
        className="flex items-center gap-1 text-gray-500 hover:text-primary-600 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to doctors
      </button>

      {/* Doctor Info — mobile (matches dashboard card) */}
      <div className="card mb-4 sm:mb-6 md:hidden">
        <DoctorMobileProfileCard
          doctor={doctor}
          showExperienceLink={user?.role === 'patient'}
          hasRated={hasRated}
          onExperienceClick={handleExperienceClick}
        />
      </div>

      {/* Doctor Info — desktop */}
      <div className="card mb-4 sm:mb-6 hidden md:block">
        <div className="flex flex-row items-start gap-4 sm:gap-5 text-left">
          <div className="w-20 h-20 bg-primary-100 rounded-2xl flex items-center justify-center text-primary-800 text-2xl font-bold shrink-0 overflow-hidden">
            {doctor.profilePhoto ? (
              <img
                src={doctor.profilePhoto}
                alt={doctor.name}
                className="w-full h-full object-cover object-center block"
              />
            ) : (
              doctor.name.charAt(0)
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900">{doctor.name}</h1>
            <p className="text-primary-600 font-medium">{doctor.specialization}</p>
            <DoctorRatingDisplay
              averageRating={doctor.averageRating}
              ratingCount={doctor.ratingCount}
              size="md"
              className="mt-2"
            />
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
              <span className="flex items-center gap-2 bg-[#faf7f2] px-3 py-2 rounded-lg whitespace-nowrap ">
                <Briefcase className="w-4 h-4 text-[#a8841f] shrink-0" />
                {doctor.experience} years experience
              </span>
              <span className="flex items-center gap-2 bg-[#faf7f2] px-3 py-2 rounded-lg whitespace-nowrap">
                <IndianRupee className="w-4 h-4 text-[#a8841f] shrink-0" />
                ₹{doctor.consultationFee} consultation
              </span>
            </div>
            {doctor.bio && <p className="text-gray-600 mt-3 text-sm">{doctor.bio}</p>}
            {user?.role === 'patient' && (
              <ExperienceRatingPrompt
                hasRated={hasRated}
                onClick={handleExperienceClick}
                className="mt-4"
              />
            )}
          </div>
        </div>
      </div>

      <RatingModal
        doctor={doctor}
        isOpen={ratingModalOpen}
        onClose={() => setRatingModalOpen(false)}
        onSubmitted={handleRatingSubmitted}
      />

      {/* Booking Form */}
      <form onSubmit={handleBook} className="card p-4 sm:p-6 md:p-0 md:overflow-hidden">
        <fieldset disabled={booking} className="border-0 p-0 m-0 min-w-0">
        {/* Mobile — two sections */}
        <div className="md:hidden space-y-0">
          <div className="space-y-5 pb-5 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Book Appointment</h2>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4" /> Select Date
              </label>
              <Datepicker {...datePickerProps} />
              <p className="text-xs text-gray-400 mt-1">
                Available: {availableDays.join(', ')}
              </p>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4" /> Select Time Slot
              </label>
              {renderTimeSlots('grid grid-cols-2 gap-2')}
            </div>
          </div>

          <div className="py-5 bg-[#fdfaf0]/30 -mx-4 sm:-mx-6 px-4 sm:px-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Visit
            </label>
            <textarea
              className="input-field min-h-[140px] resize-none bg-white"
              rows={5}
              placeholder="Describe your symptoms or reason for visit..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </div>

          <div className="pt-5">
            <button
              type="submit"
              disabled={!selectedSlot}
              className="btn-primary w-full !py-3"
            >
              {booking ? 'Booking...' : 'Confirm Appointment'}
            </button>
          </div>
        </div>

        {/* Desktop — two columns like dashboard card */}
        <div className="hidden md:grid md:grid-cols-2 md:min-h-[300px] md:items-stretch">
          <div className="flex flex-col py-8 px-8 lg:px-10 border-r border-gray-100 space-y-5">
            <h2 className="text-lg font-semibold text-gray-900">Book Appointment</h2>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4" /> Select Date
              </label>
              <Datepicker {...datePickerProps} />
              <p className="text-xs text-gray-400 mt-1">
                Available: {availableDays.join(', ')}
              </p>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4" /> Select Time Slot
              </label>
              {renderTimeSlots('grid grid-cols-2 lg:grid-cols-3 gap-2')}
            </div>
          </div>

          <div className="flex flex-col py-8 px-8 lg:px-10 self-stretch">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Visit
            </label>
            <textarea
              className="input-field flex-1 min-h-[220px] resize-none bg-white"
              rows={8}
              placeholder="Describe your symptoms or reason for visit..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="hidden md:block px-8 lg:px-10 py-6 border-t border-gray-100">
          <button
            type="submit"
            disabled={!selectedSlot}
            className="btn-primary w-full !py-3"
          >
            {booking ? 'Booking...' : 'Confirm Appointment'}
          </button>
        </div>
        </fieldset>
      </form>
    </div>
  );
}
