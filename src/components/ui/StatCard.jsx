import { Link } from 'react-router-dom';

export default function StatCard({ label, value, icon: Icon, hint, to }) {
  const isLong =
    typeof value === 'string' && value.length > 12 && !/^\d+(\.\d+)?$/.test(value.trim());

  const iconBox = Icon ? (
    <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-[#f3efe8] text-accent-700 shrink-0 transition-colors hover:bg-[#ebe4d8] hover:text-accent-800">
      <Icon className="w-4 h-4" />
    </div>
  ) : null;

  return (
    <div className="card !p-3 sm:!p-4 min-w-0 h-full">
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <div className="min-w-0 flex-1">
          <p className="section-label leading-snug">{label}</p>
          <p
            className={`font-semibold text-ink mt-1.5 sm:mt-2 break-words ${
              isLong
                ? 'text-base sm:text-lg leading-snug'
                : 'text-xl sm:text-2xl tabular-nums'
            }`}
          >
            {value}
          </p>
          {hint && <p className="text-xs text-ink-faint mt-1 break-words">{hint}</p>}
        </div>
        {to && iconBox ? (
          <Link to={to} aria-label={`Open ${label}`} className="shrink-0">
            {iconBox}
          </Link>
        ) : (
          iconBox
        )}
      </div>
    </div>
  );
}
