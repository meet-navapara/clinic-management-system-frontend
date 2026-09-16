export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="card text-center py-8 sm:py-10 px-4 sm:px-6">
      {Icon && (
        <div className="mx-auto mb-2.5 sm:mb-3 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-[#f3efe8] text-accent-600">
          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
      )}
      {title && <p className="text-xs sm:text-sm font-semibold text-ink">{title}</p>}
      {description && <p className="text-xs sm:text-sm text-ink-muted mt-1 max-w-sm mx-auto">{description}</p>}
      {action && <div className="mt-3 sm:mt-4">{action}</div>}
    </div>
  );
}
