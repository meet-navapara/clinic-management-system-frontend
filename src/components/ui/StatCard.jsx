export default function StatCard({ label, value, icon: Icon, hint }) {
  const isLong =
    typeof value === 'string' && value.length > 12 && !/^\d+(\.\d+)?$/.test(value.trim());

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
        {Icon && (
          <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-[#f3efe8] text-accent-700 shrink-0">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
    </div>
  );
}
