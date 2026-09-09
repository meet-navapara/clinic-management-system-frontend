import { useEffect, useState } from 'react';
import { X, Briefcase } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { DoctorPhoto } from './DoctorMobileProfileCard';
import DoctorRatingDisplay from './DoctorRatingDisplay';
import StarRatingInput from './StarRatingInput';

export default function RatingModal({ doctor, isOpen, onClose, onSubmitted }) {
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleEscape = (event) => {
      if (event.key === 'Escape') onClose();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setScore(0);
      setComment('');
      setSubmitting(false);
    }
  }, [isOpen, doctor?._id]);

  if (!isOpen || !doctor) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (score < 1) {
      toast.error('Please select a star rating.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/ratings', {
        doctorId: doctor._id,
        score,
        comment,
      });

      toast.success(res.data.message || 'Thank you for your feedback!');
      onSubmitted?.(res.data.doctor);
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not submit your rating.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-[#1c1814]/50 backdrop-blur-sm disabled:cursor-not-allowed"
        onClick={() => !submitting && onClose()}
        disabled={submitting}
        aria-label="Close rating dialog"
      />

      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#ebe4d8] overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rating-modal-title"
      >
        <div className="bg-gradient-to-r from-[#faf7f2] to-[#fdfaf0] px-5 py-4 border-b border-[#ebe4d8]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a8841f]">
                Share Your Experience
              </p>
              <h2 id="rating-modal-title" className="text-lg font-bold text-[#2a2420] mt-1">
                Rate your consultation
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="p-2 rounded-lg text-[#6b635a] hover:bg-white/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <fieldset disabled={submitting} className="space-y-5 border-0 p-0 m-0 min-w-0">
          <div className="flex items-center gap-4 rounded-xl bg-[#faf7f2] p-4 ring-1 ring-[#ebe4d8]">
            <DoctorPhoto doctor={doctor} className="w-16 h-16 text-2xl" />
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-[#2a2420] truncate">{doctor.name}</h3>
              <p className="text-sm text-primary-600 font-medium truncate">{doctor.specialization}</p>
              <div className="flex flex-wrap items-center gap-3 mt-1.5">
                <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                  <Briefcase className="w-3.5 h-3.5 text-[#a8841f]" />
                  {doctor.experience} yrs
                </span>
                <DoctorRatingDisplay
                  averageRating={doctor.averageRating}
                  ratingCount={doctor.ratingCount}
                  size="sm"
                  showCount={false}
                />
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm font-medium text-gray-700 mb-3">How was your experience?</p>
            <StarRatingInput value={score} onChange={setScore} />
          </div>

          <div>
            <label htmlFor="rating-comment" className="block text-sm font-medium text-gray-700 mb-2">
              Tell us more (optional)
            </label>
            <textarea
              id="rating-comment"
              className="input-field min-h-[110px] resize-none bg-white"
              rows={4}
              placeholder="Share what you liked or what could be improved..."
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              maxLength={500}
            />
            <p className="text-[11px] text-gray-400 mt-1 text-right">{comment.length}/500</p>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1 !py-2.5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={score < 1}
              className="btn-primary flex-1 !py-2.5"
            >
              {submitting ? 'Submitting...' : 'Submit Rating'}
            </button>
          </div>
          </fieldset>
        </form>
      </div>
    </div>
  );
}
