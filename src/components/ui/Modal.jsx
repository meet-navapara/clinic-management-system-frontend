export default function Modal({ open, title, onClose, children, wide }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} aria-hidden="true" />
      <div
        className={`relative z-10 w-full min-w-0 ${wide ? 'max-w-3xl' : 'max-w-lg'} max-h-[92dvh] overflow-y-auto overflow-x-hidden bg-white rounded-t-2xl sm:rounded-xl shadow-panel border border-line p-3.5 sm:p-5`}
      >
        <div className="flex items-start justify-between gap-3 mb-3 min-w-0">
          {title && (
            <h2 className="text-sm sm:text-base font-semibold text-ink min-w-0 break-words pr-2">{title}</h2>
          )}
          <button
            type="button"
            className="btn-ghost btn-sm ml-auto shrink-0"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
