export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="card text-center py-10 px-6">
      {Icon && (
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#f3efe8] text-accent-600">
          <Icon className="w-5 h-5" />
        </div>
      )}
      {title && <p className="text-sm font-semibold text-ink">{title}</p>}
      {description && <p className="text-sm text-ink-muted mt-1 max-w-sm mx-auto">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
