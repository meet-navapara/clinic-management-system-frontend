export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-md bg-[#ebe6dc] ${className}`} aria-hidden />;
}

export function SkeletonCards({ count = 4, className = '' }) {
  return (
    <div className={`stat-grid ${className}`.trim()}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card !p-3 sm:!p-4 space-y-3">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-7 w-12" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonRows({ count = 5, className = '' }) {
  return (
    <div
      className={`card !p-0 overflow-hidden divide-y divide-line ${className}`.trim()}
      role="status"
      aria-label="Loading"
      aria-busy="true"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-3">
          <Skeleton className="h-8 w-8 sm:h-9 sm:w-9 rounded-full shrink-0" />
          <div className="flex-1 space-y-2 min-w-0">
            <Skeleton className="h-3.5 w-40 max-w-full" />
            <Skeleton className="h-3 w-24 max-w-[70%]" />
          </div>
          <Skeleton className="h-6 w-16 rounded-md shrink-0 hidden xs:block" />
        </div>
      ))}
    </div>
  );
}

/** Detail page placeholder (title + stats + body blocks). */
export function SkeletonDetail() {
  return (
    <div className="page-container space-y-4 sm:space-y-5" role="status" aria-label="Loading" aria-busy="true">
      <div className="space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-7 w-48 max-w-full" />
        <Skeleton className="h-3.5 w-64 max-w-full" />
      </div>
      <SkeletonCards count={2} className="!grid-cols-1 xs:!grid-cols-2 lg:!grid-cols-2" />
      <div className="card space-y-3">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-[90%]" />
        <Skeleton className="h-3.5 w-[75%]" />
        <Skeleton className="h-3.5 w-[85%]" />
      </div>
      <div className="card space-y-2">
        <Skeleton className="h-3 w-20" />
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

/** Full page content skeleton for overview screens. */
export default function SkeletonPage({ cards = 4, rows = 6 }) {
  return (
    <div className="page-container space-y-4 sm:space-y-5" role="status" aria-label="Loading" aria-busy="true">
      <div className="space-y-2">
        <Skeleton className="h-3 w-14" />
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-3.5 w-56 max-w-full" />
      </div>
      {cards > 0 ? <SkeletonCards count={cards} /> : null}
      <SkeletonRows count={rows} />
    </div>
  );
}
