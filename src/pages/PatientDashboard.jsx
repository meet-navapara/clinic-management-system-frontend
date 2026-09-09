import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { IndianRupee, Briefcase, ArrowRight, Calendar } from 'lucide-react';
import DoctorMobileProfileCard, { DoctorPhoto } from '../components/DoctorMobileProfileCard';
import DoctorRatingDisplay from '../components/DoctorRatingDisplay';
import ExperienceRatingPrompt from '../components/ExperienceRatingPrompt';
import RatingModal from '../components/RatingModal';
import PageLoader from '../components/PageLoader';

function DoctorFeaturedCard({ doctor, hasRated, onExperienceClick }) {
  const handleExperienceClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    onExperienceClick(doctor);
  };

  return (
    <Link
      to={`/doctor/${doctor._id}`}
      className="card hover:shadow-xl hover:border-[#d4af37]/40 transition-all group block w-full p-4 sm:p-6 md:p-0 md:overflow-hidden"
    >
      <div className="md:hidden">
        <DoctorMobileProfileCard
          doctor={doctor}
          showBookCta
          showExperienceLink
          hasRated={hasRated}
          onExperienceClick={onExperienceClick}
        />
      </div>

      {/* Desktop layout */}
      <div className="hidden md:grid md:grid-cols-[220px_1fr_200px] lg:grid-cols-[240px_1fr_220px] md:min-h-[280px] lg:min-h-[300px]">
        <div className="flex flex-col items-center justify-center gap-4 py-8 px-6 lg:px-8 border-r border-gray-100">
          <DoctorPhoto doctor={doctor} className="w-36 h-36 lg:w-40 lg:h-40 text-5xl" />
          <DoctorRatingDisplay
            averageRating={doctor.averageRating}
            ratingCount={doctor.ratingCount}
            size="lg"
          />
        </div>

        <div className="flex flex-col justify-center py-8 px-8 lg:px-10 min-w-0 text-left">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#a8841f] mb-2">
            Our Ayurvedic Specialist
          </p>
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors break-words leading-tight">
            {doctor.name}
          </h2>
          <p className="text-lg text-primary-600 font-medium mt-1.5">{doctor.specialization}</p>

          <div className="flex flex-wrap max-w-[400px] items-center gap-3 lg:gap-4 mt-5 text-sm lg:text-base text-gray-600 w-full">
            <span className="flex items-center gap-2 bg-[#faf7f2] px-3 py-2 rounded-lg whitespace-nowrap ">
              <Briefcase className="w-4 h-4 text-[#a8841f] shrink-0" />
              {doctor.experience} years experience
            </span>
            <span className="flex items-center gap-2 bg-[#faf7f2] px-3 py-2 rounded-lg whitespace-nowrap">
              <IndianRupee className="w-4 h-4 text-[#a8841f] shrink-0" />
              ₹{doctor.consultationFee} consultation
            </span>
          </div>

          {doctor.bio && (
            <p className="text-sm lg:text-base text-gray-600 mt-5 leading-relaxed max-w-2xl">
              {doctor.bio}
            </p>
          )}

          <ExperienceRatingPrompt
            hasRated={hasRated}
            onClick={handleExperienceClick}
            className="mt-5"
          />
        </div>

        <div className="flex flex-col items-stretch justify-center self-stretch py-8 px-5 lg:px-6 border-l border-gray-100 bg-[#fdfaf0]/30">
          <div className="w-full flex flex-col items-stretch gap-2.5">
            <span className="btn-primary flex w-full flex-col items-center justify-center gap-2 !py-5 !px-3 text-sm leading-tight group-hover:gap-2.5 transition-all rounded-xl">
              <Calendar className="w-5 h-5 shrink-0" />
              <span className="font-semibold text-center">Book Appointment</span>
              <ArrowRight className="w-4 h-4 shrink-0 opacity-90" />
            </span>
            <p className="text-[11px] lg:text-xs text-gray-400 text-center leading-snug px-1">
              Select date &amp; time online
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function PatientDashboard() {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasRated, setHasRated] = useState(false);
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [ratingDoctor, setRatingDoctor] = useState(null);

  useEffect(() => {
    api
      .get('/doctors')
      .then((res) => {
        setDoctors(Array.isArray(res.data.doctors) ? res.data.doctors : []);
      })
      .catch(() => setError('Could not load doctor information. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  const doctor = doctors[0];

  useEffect(() => {
    if (!doctor?._id || user?.role !== 'patient') {
      setHasRated(false);
      return;
    }

    api
      .get(`/ratings/mine/${doctor._id}`)
      .then((res) => setHasRated(Boolean(res.data.hasRated)))
      .catch(() => setHasRated(false));
  }, [doctor?._id, user?.role]);

  const handleExperienceClick = (selectedDoctor) => {
    if (hasRated) return;
    setRatingDoctor(selectedDoctor);
    setRatingModalOpen(true);
  };

  const handleRatingSubmitted = (updatedDoctor) => {
    setHasRated(true);
    if (!updatedDoctor) return;

    setDoctors((prev) =>
      prev.map((item) =>
        item._id === updatedDoctor._id
          ? {
              ...item,
              averageRating: updatedDoctor.averageRating,
              ratingCount: updatedDoctor.ratingCount,
            }
          : item
      )
    );
    setRatingDoctor((prev) =>
      prev?._id === updatedDoctor._id
        ? {
            ...prev,
            averageRating: updatedDoctor.averageRating,
            ratingCount: updatedDoctor.ratingCount,
          }
        : prev
    );
  };

  return (
    <div className="page-container">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
          Hello, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-500 mt-1 text-sm sm:text-base">
          Book your Ayurvedic consultation below
        </p>
      </div>

      {loading ? (
        <PageLoader message="Loading doctor details..." compact />
      ) : error ? (
        <div className="text-center py-16 card">
          <p className="text-gray-700 mb-4">{error}</p>
          <button type="button" onClick={() => window.location.reload()} className="btn-primary text-sm">
            Retry
          </button>
        </div>
      ) : !doctor ? (
        <div className="text-center py-16 card">
          <p className="text-gray-500">No doctor is available for booking right now.</p>
        </div>
      ) : (
        <DoctorFeaturedCard
          doctor={doctor}
          hasRated={hasRated}
          onExperienceClick={handleExperienceClick}
        />
      )}

      <RatingModal
        doctor={ratingDoctor}
        isOpen={ratingModalOpen}
        onClose={() => setRatingModalOpen(false)}
        onSubmitted={handleRatingSubmitted}
      />
    </div>
  );
}
