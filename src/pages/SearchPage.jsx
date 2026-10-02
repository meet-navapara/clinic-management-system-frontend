import { useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonRows } from '../components/ui/Skeleton';
import useGlobalSearch from '../hooks/useGlobalSearch';
import { searchRowLabel, searchRowLink } from '../utils/globalSearch';

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const inputRef = useRef(null);
  const initialQuery = params.get('q') || '';

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
    run,
    sections,
  } = useGlobalSearch({ initialQuery });

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handle = setTimeout(() => {
      const next = q.trim();
      setParams(next ? { q: next } : {}, { replace: true });
    }, 250);
    return () => clearTimeout(handle);
  }, [q, setParams]);

  const empty = !idle && !loading && !error && total === 0;

  return (
    <div className="page-container">
      <PageHeader
        title="Search"
        description="Find patients, visits, invoices and staff across the clinic."
      />
      <form
        className="relative max-w-xl mb-4"
        onSubmit={(e) => {
          e.preventDefault();
          run(q);
        }}
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" />
        <input
          ref={inputRef}
          className="input-field !pl-9"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Try a patient name, phone, PAT-ID, or invoice number"
          autoComplete="off"
          aria-label="Search clinic"
        />
      </form>

      {idle ? (
        recentLoading ? (
          <SkeletonRows count={5} />
        ) : recentPatients.length === 0 ? (
          <EmptyState
            icon={Search}
            title="Search the clinic"
            description="Type at least 2 characters to find patients, visits, invoices, or staff."
          />
        ) : (
          <section>
            <h3 className="text-sm font-semibold text-ink mb-2">Recent patients</h3>
            <div className="space-y-1">
              {recentPatients.map((row) => (
                <Link
                  key={row._id}
                  to={searchRowLink('patients', row)}
                  className="card !p-3 block text-sm hover:border-accent-400"
                >
                  {searchRowLabel('patients', row)}
                </Link>
              ))}
            </div>
          </section>
        )
      ) : loading ? (
        <SkeletonRows count={8} />
      ) : error ? (
        <EmptyState
          title="Search unavailable"
          description={error}
          action={
            <button type="button" className="btn-secondary" onClick={() => run(q)}>
              Try again
            </button>
          }
        />
      ) : empty ? (
        <EmptyState
          icon={Search}
          title={`No matches for “${trimmed}”`}
          description="Search across patients in this branch. Try a name, phone, PAT-ID, or switch to All branches."
        />
      ) : (
        sections.map(({ key, label }) =>
          results[key]?.length ? (
            <section key={key} className="mb-5">
              <h3 className="text-sm font-semibold text-ink mb-2">{label}</h3>
              <div className="space-y-1">
                {results[key].map((row) => (
                  <Link key={row._id || row.id} to={searchRowLink(key, row)} className="card !p-3 block text-sm hover:border-accent-400">
                    {searchRowLabel(key, row)}
                  </Link>
                ))}
              </div>
            </section>
          ) : null
        )
      )}
    </div>
  );
}
