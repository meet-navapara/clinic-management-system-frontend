import { Briefcase, IndianRupee, ArrowRight, Calendar } from 'lucide-react';
import DoctorRatingDisplay from './DoctorRatingDisplay';
import ExperienceRatingPrompt from './ExperienceRatingPrompt';

export function DoctorPhoto({ doctor, className = '' }) {
  return (
    <div
      className={`rounded-2xl bg-gradient-to-br from-primary-100 to-accent-50 flex items-center justify-center text-primary-800 font-bold shadow-inner overflow-hidden ring-2 ring-[#d4af37]/20 shrink-0 ${className}`}
    >
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
  );
}

export default function DoctorMobileProfileCard({
  doctor,
  showBookCta = false,
  showExperienceLink = false,
  hasRated = false,
  onExperienceClick,
}) {
  const handleExperienceClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    onExperienceClick?.(doctor);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-4">
        <DoctorPhoto doctor={doctor} className="w-20 h-20 text-3xl" />

        <div className="flex-1 min-w-0 pt-0.5 flex flex-col gap-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#a8841f]">
            Our Ayurvedic Specialist
          </p>
          <h2 className="text-lg font-bold text-gray-900 break-words leading-tight">
            {doctor.name}
          </h2>
          <p className="text-sm text-primary-600 font-medium break-words">
            {doctor.specialization}
          </p>
          <DoctorRatingDisplay
            averageRating={doctor.averageRating}
            ratingCount={doctor.ratingCount}
            className="mt-0.5"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <span className="flex items-center justify-center gap-1.5 bg-[#faf7f2] px-2.5 py-2.5 rounded-lg text-xs text-gray-600 min-w-0">
          <Briefcase className="w-3.5 h-3.5 text-[#a8841f] shrink-0" />
          <span className="truncate">{doctor.experience} yrs experience</span>
        </span>
        <span className="flex items-center justify-center gap-1.5 bg-[#faf7f2] px-2.5 py-2 rounded-lg text-xs text-gray-600 min-w-0">
          <IndianRupee className="w-3.5 h-3.5 text-[#a8841f] shrink-0" />
          <span className="truncate">₹{doctor.consultationFee} fee</span>
        </span>
      </div>

      {doctor.bio && (
        <p className="text-sm text-gray-600 leading-relaxed">{doctor.bio}</p>
      )}

      {showExperienceLink && (
        <ExperienceRatingPrompt
          hasRated={hasRated}
          onClick={handleExperienceClick}
          className="justify-center w-full"
        />
      )}

      {showBookCta && (
        <div className="flex flex-col gap-1.5 pt-1 border-t border-gray-100">
          <span className="btn-primary inline-flex items-center justify-center gap-2 w-full !py-3 !px-5 text-sm">
            <Calendar className="w-4 h-4" />
            Book Appointment
            <ArrowRight className="w-4 h-4" />
          </span>
          <p className="text-[10px] text-gray-400 text-center">Select date &amp; time online</p>
        </div>
      )}
    </div>
  );
}
