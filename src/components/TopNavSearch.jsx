import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Loader2, Search, X } from 'lucide-react';
import useGlobalSearch from '../hooks/useGlobalSearch';
import { searchRowLabel, searchRowLink } from '../utils/globalSearch';
import { ROUTES } from '../constants/routes';

function SearchResultsPanel({
  idle,
  recentLoading,
  recentPatients,
  loading,
  error,
  total,
  trimmed,
  results,
  sections,
  onSelect,
  panelClassName = '',
}) {
  return (
    <div
      id="topnav-search-panel"
      role="listbox"
      className={panelClassName}
      onMouseDown={(e) => e.preventDefault()}
    >
      {idle ? (
        recentLoading ? (
          <p className="px-3 py-2.5 text-sm text-ink-muted">Loading recent patients…</p>
        ) : recentPatients.length === 0 ? (
          <p className="px-3 py-2.5 text-sm text-ink-muted">Type at least 2 characters to search.</p>
        ) : (
          <>
            <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Recent patients</p>
            {recentPatients.map((row) => (
              <Link
                key={row._id}
                to={searchRowLink('patients', row)}
                onClick={onSelect}
                className="block px-3 py-2 text-sm text-ink hover:bg-[#faf8f3]"
              >
                {searchRowLabel('patients', row)}
              </Link>
            ))}
          </>
        )
      ) : loading ? (
        <p className="px-3 py-2.5 text-sm text-ink-muted">Searching…</p>
      ) : error ? (
        <p className="px-3 py-2.5 text-sm text-[#9b2c2c]">{error}</p>
      ) : total === 0 ? (
        <p className="px-3 py-2.5 text-sm text-ink-muted">No matches for “{trimmed}”</p>
      ) : (
        sections.map(({ key, label }) =>
          results[key]?.length ? (
            <div key={key}>
              <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">{label}</p>
              {results[key].map((row) => (
                <Link
                  key={row._id || row.id}
                  to={searchRowLink(key, row)}
                  onClick={onSelect}
                  className="block px-3 py-2 text-sm text-ink hover:bg-[#faf8f3]"
                >
                  {searchRowLabel(key, row)}
                </Link>
              ))}
            </div>
          ) : null
        )
      )}

      {!idle && trimmed.length >= 2 && (
        <Link
          to={`${ROUTES.search}?q=${encodeURIComponent(trimmed)}`}
          onClick={onSelect}
          className="block border-t border-line px-3 py-2.5 text-sm font-medium text-accent-600 hover:bg-[#faf8f3]"
        >
          View all results for “{trimmed}”
        </Link>
      )}
    </div>
  );
}

/** @param {{ className?: string, variant?: 'field' | 'icon' }} props */
export default function TopNavSearch({ className = '', variant = 'field' }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const blurTimer = useRef(null);

  const {
    q,
    setQ,
    results,
    recentPatients,
    loading,
    recentLoading,
    error,
    trimmed,
    idle,
    total,
    sections,
  } = useGlobalSearch({ enabled: open });

  useEffect(() => {
    setOpen(false);
    setQ('');
  }, [pathname, setQ]);

  useEffect(
    () => () => {
      if (blurTimer.current) clearTimeout(blurTimer.current);
    },
    []
  );

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    if (open && variant === 'icon') {
      const t = setTimeout(() => inputRef.current?.focus(), 30);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [open, variant]);

  const handleFocus = () => {
    if (blurTimer.current) clearTimeout(blurTimer.current);
    setOpen(true);
  };

  const handleBlur = () => {
    if (variant === 'icon') return;
    blurTimer.current = setTimeout(() => setOpen(false), 160);
  };

  const handleSelect = () => {
    if (blurTimer.current) clearTimeout(blurTimer.current);
    setOpen(false);
    setQ('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (trimmed.length < 2) return;
    navigate(`${ROUTES.search}?q=${encodeURIComponent(trimmed)}`);
    setOpen(false);
  };

  const panelProps = {
    idle,
    recentLoading,
    recentPatients,
    loading,
    error,
    total,
    trimmed,
    results,
    sections,
    onSelect: handleSelect,
  };

  if (variant === 'icon') {
    return (
      <div ref={rootRef} className={`relative ${className}`}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="relative min-h-10 min-w-10 inline-flex items-center justify-center rounded-lg text-ink-muted hover:text-ink hover:bg-white"
          aria-label="Search"
          aria-expanded={open}
        >
          <Search className="w-5 h-5" />
        </button>

        {open && (
          <div className="fixed inset-x-0 top-14 z-50 border-b border-line bg-[#f6f4f0] px-3 pb-3 pt-2 shadow-panel sm:absolute sm:inset-x-auto sm:right-0 sm:top-[calc(100%+0.35rem)] sm:w-[min(22rem,calc(100vw-1.5rem))] sm:rounded-xl sm:border sm:bg-white sm:p-2 sm:shadow-panel">
            <form onSubmit={handleSubmit} className="relative mb-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
              <input
                ref={inputRef}
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onFocus={handleFocus}
                placeholder="Search patients, visits…"
                autoComplete="off"
                aria-label="Search clinic"
                className={`h-10 w-full rounded-lg border border-line bg-white pl-8 text-sm text-ink placeholder:text-ink-faint focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-400/25 ${
                  q ? 'pr-9' : 'pr-3'
                }`}
              />
              {q ? (
                <button
                  type="button"
                  onClick={() => {
                    setQ('');
                    inputRef.current?.focus();
                  }}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded-md text-ink-muted hover:bg-[#f3efe8]"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : loading ? (
                <Loader2 className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-ink-faint" />
              ) : null}
            </form>
            <SearchResultsPanel
              {...panelProps}
              panelClassName="max-h-[min(20rem,55vh)] overflow-y-auto rounded-lg bg-white sm:max-h-[min(22rem,60vh)]"
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
        <input
          ref={inputRef}
          type="text"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder="Search patients, visits, invoices…"
          autoComplete="off"
          aria-label="Search clinic"
          aria-expanded={open}
          aria-controls="topnav-search-panel"
          className={`h-9 w-full rounded-lg border border-line bg-white pl-8 text-sm text-ink placeholder:text-ink-faint focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-400/25 ${
            q ? 'pr-9' : 'pr-3'
          }`}
        />
        {q ? (
          <button
            type="button"
            onClick={() => {
              setQ('');
              setOpen(true);
              inputRef.current?.focus();
            }}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded-md text-ink-muted hover:bg-[#f3efe8]"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        ) : loading ? (
          <Loader2 className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-ink-faint" />
        ) : null}
      </form>

      {open && (
        <SearchResultsPanel
          {...panelProps}
          panelClassName="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-50 max-h-[min(24rem,70vh)] overflow-y-auto rounded-xl border border-line bg-white py-1 shadow-panel"
        />
      )}
    </div>
  );
}
