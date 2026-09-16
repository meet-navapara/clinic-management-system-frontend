import { ChevronLeft, ChevronRight } from 'lucide-react';

/** Build page tokens: numbers + 'ellipsis' for compact jump navigation. */
function pageItems(current, totalPages) {
  const total = Math.max(1, Number(totalPages) || 1);
  const cur = Math.min(Math.max(1, Number(current) || 1), total);

  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const set = new Set([1, total, cur, cur - 1, cur + 1]);
  if (cur <= 3) {
    set.add(2);
    set.add(3);
    set.add(4);
  }
  if (cur >= total - 2) {
    set.add(total - 1);
    set.add(total - 2);
    set.add(total - 3);
  }

  const sorted = [...set].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const out = [];
  for (let i = 0; i < sorted.length; i += 1) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) out.push('ellipsis');
    out.push(sorted[i]);
  }
  return out;
}

/**
 * Server-driven pagination with direct page jumps.
 * Props mirror API meta: page, pages, total (optional), limit (optional).
 */
export default function Pagination({ page = 1, pages = 1, total, limit, onPage, className = '' }) {
  if (pages <= 1) return null;

  const safePage = Math.min(Math.max(1, Number(page) || 1), pages);
  const from = total != null && limit ? Math.min(total, (safePage - 1) * limit + 1) : null;
  const to = total != null && limit ? Math.min(total, safePage * limit) : null;
  const items = pageItems(safePage, pages);

  const navBtn =
    'btn-secondary btn-sm inline-flex items-center justify-center gap-0.5 shrink-0';
  const pageBtn =
    'inline-flex items-center justify-center min-h-8 min-w-8 sm:min-h-9 sm:min-w-9 rounded-lg text-[11px] sm:text-xs font-semibold tabular-nums transition-colors shrink-0';

  return (
    <div
      className={`mt-4 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-3 ${className}`.trim()}
      role="navigation"
      aria-label="Pagination"
    >
      <p className="text-center sm:text-left text-[11px] sm:text-sm text-ink-muted tabular-nums">
        {from != null && to != null && total != null ? (
          <>
            Showing <span className="font-medium text-ink">{from}</span>–
            <span className="font-medium text-ink">{to}</span> of{' '}
            <span className="font-medium text-ink">{total}</span>
          </>
        ) : (
          <>
            Page <span className="font-medium text-ink">{safePage}</span> of{' '}
            <span className="font-medium text-ink">{pages}</span>
          </>
        )}
      </p>

      <div className="flex items-center justify-center gap-1 sm:gap-1.5 min-w-0">
        <button
          type="button"
          className={navBtn}
          disabled={safePage <= 1}
          onClick={() => onPage(safePage - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" aria-hidden />
          <span className="hidden sm:inline text-xs">Prev</span>
        </button>

        <div className="flex items-center gap-0.5 sm:gap-1 overflow-x-auto max-w-[min(100%,18rem)] sm:max-w-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {items.map((item, idx) =>
            item === 'ellipsis' ? (
              <span
                key={`e-${idx}`}
                className="inline-flex min-w-6 sm:min-w-8 justify-center text-ink-faint text-xs select-none"
                aria-hidden
              >
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                aria-label={`Go to page ${item}`}
                aria-current={item === safePage ? 'page' : undefined}
                onClick={() => onPage(item)}
                className={`${pageBtn} ${
                  item === safePage
                    ? 'bg-ink text-white'
                    : 'bg-white text-ink-muted ring-1 ring-line hover:bg-[#f3efe8] hover:text-ink'
                }`}
              >
                {item}
              </button>
            )
          )}
        </div>

        <button
          type="button"
          className={navBtn}
          disabled={safePage >= pages}
          onClick={() => onPage(safePage + 1)}
          aria-label="Next page"
        >
          <span className="hidden sm:inline text-xs">Next</span>
          <ChevronRight className="w-4 h-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
