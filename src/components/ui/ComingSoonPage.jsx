import { Clock } from 'lucide-react';

/** Soft gate for features that stay in the codebase but are not released yet. */
export default function ComingSoonPage({
  title,
  description = 'This section is not available yet. Everything here is saved for a future release.',
}) {
  return (
    <div className="page-container !pb-0 flex flex-col min-h-0 flex-1">
      <div className="relative flex-1 w-full min-h-[calc(100dvh-8.5rem)] overflow-hidden rounded-[18px] border border-line bg-[#FFFEFE] flex items-center justify-center px-6 sm:px-10 py-16">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 55% at 50% 15%, rgba(212,175,55,0.14), transparent 62%), radial-gradient(ellipse 45% 35% at 100% 100%, rgba(28,36,48,0.04), transparent 55%)',
          }}
          aria-hidden
        />
        <div className="relative text-center w-full max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e8c547]/50 bg-[#fdfaf0] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-700">
            <Clock className="w-3.5 h-3.5" aria-hidden />
            Coming soon
          </span>
          <h1 className="mt-6 font-serif text-4xl sm:text-5xl font-bold tracking-tight text-ink">
            {title}
          </h1>
          <p className="mt-4 text-sm sm:text-base text-ink-muted leading-relaxed mx-auto max-w-xl">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
