import { MessageSquareHeart } from 'lucide-react';

export default function ExperienceRatingPrompt({ onClick, hasRated = false, className = '' }) {
  if (hasRated) {
    return (
      <p className={`text-xs text-[#876719] font-medium ${className}`}>
        Thanks for sharing your experience!
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[#876719] hover:text-[#5c4a12] transition-colors group ${className}`}
    >
      <MessageSquareHeart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#d4af37] group-hover:scale-110 transition-transform" />
      <span className="underline decoration-[#d4af37]/50 underline-offset-2 group-hover:decoration-[#d4af37]">
        How&apos;s your experience?
      </span>
    </button>
  );
}
