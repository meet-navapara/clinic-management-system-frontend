import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { IndianRupee, Briefcase, ArrowRight, Calendar, Search } from 'lucide-react';
import DoctorMobileProfileCard, { DoctorPhoto } from '../components/DoctorMobileProfileCard';
import DoctorRatingDisplay from '../components/DoctorRatingDisplay';
import ExperienceRatingPrompt from '../components/ExperienceRatingPrompt';
import RatingModal from '../components/RatingModal';
import PageLoader from '../components/PageLoader';

function DoctorListCard({ doctor, hasRated, onExperienceClick, compact = false }) {
  const handleExperienceClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    onExperienceClick(doctor);
  };

  if (compact) {
    return (
      <Link
        to={`/doctor/${doctor._id}`}
        className="card hover:shadow-xl hover:border-[#d4af37]/40 transition-all group block w-full !p-4 h-full"
      >
        <div className="flex items-start gap-3">
          <DoctorPhoto doctor={doctor} className="w-16 h-16 text-2xl" />
          <div className="min-w-0 flex-1">
            <h2 className="font-bold text-gray-900 group-hover:text-primary-600 transition-colors truncate">
              {doctor.name}
            </h2>
            <p className="text-sm text-primary-600 font-medium truncate">{doctor.specialization || 'Ayurveda'}</p>
            <DoctorRatingDisplay
              averageRating={doctor.averageRating}
              ratingCount={doctor.ratingCount}
              className="mt-1"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-gray-600">
          <span className="flex items-center gap-1.5 bg-[#faf7f2] px-2 py-2 rounded-lg">
            <Briefcase className="w-3.5 h-3.5 text-[#a8841f] shrink-0" />
            {doctor.experience || 0} yrs
          </span>
          <span className="flex items-center gap-1.5 bg-[#faf7f2] px-2 py-2 rounded-lg">
            <IndianRupee className="w-3.5 h-3.5 text-[#a8841f] shrink-0" />
            ₹{doctor.consultationFee ?? 500}
          </span>
        </div>
        <span className="mt-3 btn-primary flex w-full items-center justify-center gap-2 !py-2.5 text-sm">
          <Calendar className="w-4 h-4" />
          Book
          <ArrowRight className="w-4 h-4" />
        </span>
      </Link>
    );
  }

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

      <div className="hidden md:grid md:grid-cols-[180px_1fr_160px] lg:grid-cols-[200px_1fr_180px] md:min-h-[240px]">
        <div className="flex flex-col items-center justify-center gap-3 py-6 px-5 border-r border-gray-100">
          <DoctorPhoto doctor={doctor} className="w-28 h-28 lg:w-32 lg:h-32 text-4xl" />
          <DoctorRatingDisplay
            averageRating={doctor.averageRating}
            ratingCount={doctor.ratingCount}
            size="md"
          />
        </div>

        <div className="flex flex-col justify-center py-6 px-6 lg:px-8 min-w-0 text-left">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#a8841f] mb-2">
            Ayurvedic Doctor
          </p>
          <h2 className="text-xl lg:text-2xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors break-words leading-tight">
            {doctor.name}
          </h2>
          <p className="text-base text-primary-600 font-medium mt-1">{doctor.specialization}</p>

          <div className="flex flex-wrap items-center gap-3 mt-4 text-sm text-gray-600">
            <span className="flex items-center gap-2 bg-[#faf7f2] px-3 py-2 rounded-lg whitespace-nowrap">
              <Briefcase className="w-4 h-4 text-[#a8841f] shrink-0" />
              {doctor.experience} years experience
            </span>
            <span className="flex items-center gap-2 bg-[#faf7f2] px-3 py-2 rounded-lg whitespace-nowrap">
              <IndianRupee className="w-4 h-4 text-[#a8841f] shrink-0" />
              ₹{doctor.consultationFee} consultation
            </span>
          </div>

          {doctor.bio && (
            <p className="text-sm text-gray-600 mt-4 leading-relaxed line-clamp-2 max-w-2xl">
              {doctor.bio}
            </p>
          )}

          <ExperienceRatingPrompt
            hasRated={hasRated}
            onClick={handleExperienceClick}
            className="mt-4"
          />
        </div>

        <div className="flex flex-col items-stretch justify-center self-stretch py-6 px-4 border-l border-gray-100 bg-[#fdfaf0]/30">
          <span className="btn-primary flex w-full flex-col items-center justify-center gap-2 !py-4 !px-3 text-sm leading-tight rounded-xl">
            <Calendar className="w-5 h-5 shrink-0" />
            <span className="font-semibold text-center">Book Appointment</span>
            <ArrowRight className="w-4 h-4 shrink-0 opacity-90" />
          </span>
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
  const [search, setSearch] = useState('');
  const [ratedMap, setRatedMap] = useState({});
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [ratingDoctor, setRatingDoctor] = useState(null);

  useEffect(() => {
    const params = {};
    if (user?.clinicId) params.clinicId = user.clinicId;

    api
      .get('/doctors', { params })
      .then((res) => {
        setDoctors(Array.isArray(res.data.doctors) ? res.data.doctors : []);
      })
      .catch(() => setError('Could not load doctor information. Please try again.'))
      .finally(() => setLoading(false));
  }, [user?.clinicId]);

  useEffect(() => {
    if (user?.role !== 'patient' || doctors.length === 0) return;

    let cancelled = false;
    Promise.all(
      doctors.map((d) =>
        api
          .get(`/ratings/mine/${d._id}`)
          .then((res) => [d._id, Boolean(res.data.hasRated)])
          .catch(() => [d._id, false])
      )
    ).then((entries) => {
      if (cancelled) return;
      setRatedMap(Object.fromEntries(entries));
    });

    return () => {
      cancelled = true;
    };
  }, [doctors, user?.role]);

  const filteredDoctors = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return doctors;
    return doctors.filter(
      (d) =>
        d.name?.toLowerCase().includes(q) ||
        d.specialization?.toLowerCase().includes(q)
    );
  }, [doctors, search]);

  const handleExperienceClick = (selectedDoctor) => {
    if (ratedMap[selectedDoctor._id]) return;
    setRatingDoctor(selectedDoctor);
    setRatingModalOpen(true);
  };

  const handleRatingSubmitted = (updatedDoctor) => {
    if (!updatedDoctor) return;
    setRatedMap((prev) => ({ ...prev, [updatedDoctor._id]: true }));
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

  const useCompactGrid = filteredDoctors.length > 1;

  return (
    <div className="page-container">
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Hello, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">
            Choose a doctor and book your Ayurvedic consultation
          </p>
        </div>

        {doctors.length > 1 && (
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="search"
              className="input-field pl-9 !py-2.5"
              placeholder="Search doctor or specialty"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        )}
      </div>

      {loading ? (
        <PageLoader message="Loading doctors..." compact />
      ) : error ? (
        <div className="text-center py-16 card">
          <p className="text-gray-700 mb-4">{error}</p>
          <button type="button" onClick={() => window.location.reload()} className="btn-primary text-sm">
            Retry
          </button>
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div className="text-center py-16 card">
          <p className="text-gray-500">
            {doctors.length === 0
              ? 'No doctor is available for booking right now.'
              : 'No doctors match your search.'}
          </p>
        </div>
      ) : (
        <div
          className={
            useCompactGrid
              ? 'grid sm:grid-cols-2 xl:grid-cols-3 gap-4'
              : 'space-y-4'
          }
        >
          {filteredDoctors.map((doctor) => (
            <DoctorListCard
              key={doctor._id}
              doctor={doctor}
              hasRated={Boolean(ratedMap[doctor._id])}
              onExperienceClick={handleExperienceClick}
              compact={useCompactGrid}
            />
          ))}
        </div>
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
