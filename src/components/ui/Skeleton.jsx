export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-md bg-[#ebe6dc] ${className}`} />;
}

export function SkeletonCards({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card !p-4 space-y-3">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-7 w-12" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonRows({ count = 5 }) {
  return (
    <div className="card !p-0 overflow-hidden divide-y divide-line">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="px-4 py-3 flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-40 max-w-full" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SkeletonPage() {
  return (
    <div className="page-container space-y-5">
      <Skeleton className="h-6 w-40" />
      <SkeletonCards />
      <SkeletonRows />
    </div>
  );
}
