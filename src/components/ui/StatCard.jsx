export default function StatCard({ label, value, icon: Icon, hint }) {
  return (
    <div className="card !p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="section-label">{label}</p>
          <p className="text-2xl font-semibold text-ink mt-2 tabular-nums">{value}</p>
          {hint && <p className="text-xs text-ink-faint mt-1">{hint}</p>}
        </div>
        {Icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f3efe8] text-accent-700 shrink-0">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
    </div>
  );
}
