export default function Pagination({ page = 1, pages = 1, onPage }) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <button
        type="button"
        className="btn-secondary !min-h-10 sm:!min-h-9 flex-1 max-w-[9rem] sm:flex-none"
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
      >
        Prev
      </button>
      <span className="text-sm text-ink-muted tabular-nums shrink-0">
        {page} / {pages}
      </span>
      <button
        type="button"
        className="btn-secondary !min-h-10 sm:!min-h-9 flex-1 max-w-[9rem] sm:flex-none"
        disabled={page >= pages}
        onClick={() => onPage(page + 1)}
      >
        Next
      </button>
    </div>
  );
}
