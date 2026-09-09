import { Star } from 'lucide-react';

export default function DoctorRatingDisplay({
  averageRating,
  ratingCount = 0,
  size = 'sm',
  showCount = true,
  className = '',
}) {
  const starSize = size === 'lg' ? 'w-4 h-4' : size === 'md' ? 'w-3.5 h-3.5' : 'w-3.5 h-3.5';
  const valueSize = size === 'lg' ? 'text-sm' : size === 'md' ? 'text-xs' : 'text-xs';
  const labelSize = size === 'lg' ? 'text-xs' : 'text-[10px]';

  const hasRatings = ratingCount > 0 && averageRating != null;

  return (
    <div className={`flex items-center gap-1.5 text-amber-500 ${className}`}>
      <Star className={`${starSize} fill-current shrink-0`} />
      {hasRatings ? (
        <>
          <span className={`${valueSize} font-semibold text-gray-700`}>{averageRating}</span>
          {showCount && (
            <span className={`${labelSize} text-gray-400`}>
              ({ratingCount} {ratingCount === 1 ? 'review' : 'reviews'})
            </span>
          )}
        </>
      ) : (
        <span className={`${valueSize} font-medium text-gray-400`}>No ratings yet</span>
      )}
    </div>
  );
}
