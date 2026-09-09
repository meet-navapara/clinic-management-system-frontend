import { useState } from 'react';
import { Star } from 'lucide-react';

const STAR_LABELS = ['Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

export default function StarRatingInput({ value, onChange, disabled = false }) {
  const [hoverValue, setHoverValue] = useState(0);
  const activeValue = hoverValue || value;

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="flex items-center gap-1.5"
        onMouseLeave={() => setHoverValue(0)}
        role="radiogroup"
        aria-label="Rate your experience from 1 to 5 stars"
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= activeValue;
          return (
            <button
              key={star}
              type="button"
              disabled={disabled}
              onClick={() => onChange(star)}
              onMouseEnter={() => !disabled && setHoverValue(star)}
              className={`p-1 rounded-lg transition-all duration-150 ${
                disabled ? 'cursor-not-allowed opacity-60' : 'hover:scale-110 hover:bg-[#fdf6e3]'
              }`}
              role="radio"
              aria-checked={value === star}
              aria-label={`${star} star${star > 1 ? 's' : ''}`}
            >
              <Star
                className={`w-8 h-8 sm:w-9 sm:h-9 transition-colors ${
                  filled ? 'text-[#d4af37] fill-[#d4af37]' : 'text-[#e8e0d4]'
                }`}
              />
            </button>
          );
        })}
      </div>
      <p className="text-xs font-medium text-[#876719] min-h-[1rem]">
        {activeValue ? STAR_LABELS[activeValue - 1] : 'Tap a star to rate'}
      </p>
    </div>
  );
}
