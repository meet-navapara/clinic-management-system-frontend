import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { format, isValid } from 'date-fns';
import { Search } from 'lucide-react';
import api from '../utils/api';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonRows } from '../components/ui/Skeleton';
import { ROUTES } from '../constants/routes';
import { useBranch } from '../context/BranchContext';

const SECTIONS = [
  { key: 'patients', label: 'Patients' },
  { key: 'appointments', label: 'Appointments' },
  { key: 'invoices', label: 'Invoices' },
  { key: 'staff', label: 'Staff' },
];

function rowLabel(key, row) {
  if (key === 'patients') {
    return `${row.name || 'Patient'}${row.patientCode ? ` · ${row.patientCode}` : ''}${row.phone ? ` · ${row.phone}` : ''}`;
  }
  if (key === 'appointments') {
    const date = row.appointmentDate ? new Date(row.appointmentDate) : null;
    const when = date && isValid(date) ? format(date, 'dd MMM') : '';
    const who = row.patientId?.name || 'Visit';
    return `${who}${when ? ` · ${when}` : ''}${row.timeSlot ? ` · ${row.timeSlot}` : ''}`;
  }
  if (key === 'invoices') {
    const who = row.patientId?.name ? ` · ${row.patientId.name}` : '';
    return `${row.invoiceNumber || 'Invoice'}${who}${row.paymentStatus ? ` · ${row.paymentStatus.replace(/_/g, ' ')}` : ''}`;
  }
  if (key === 'staff') {
    return `${row.name || 'Staff'}${row.role ? ` · ${row.role.replace(/_/g, ' ')}` : ''}${row.specialization ? ` · ${row.specialization}` : ''}`;
  }
  return row.name || 'Record';
}

function rowLink(key, row) {
  const id = row._id || row.id;
  if (key === 'patients') return ROUTES.doctorPatientDetail(id);
  if (key === 'appointments') return ROUTES.doctorAppointmentDetail(id);
  if (key === 'invoices') return ROUTES.invoice(id);
  if (key === 'staff') return `${ROUTES.staff}?q=${encodeURIComponent(row.name || '')}`;
  return '#';
}

export default function SearchPage() {
  const { branchId } = useBranch();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get('q') || '');
  const [results, setResults] = useState({});
  const [recentPatients, setRecentPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recentLoading, setRecentLoading] = useState(true);
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  const trimmed = q.trim();
  const idle = trimmed.length < 2;

  const run = (query) => {
    const value = String(query || '').trim();
    if (value.length < 2) {
      setResults({});
      setError('');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    api
      .get('/ops/search', { params: { q: value } })
      .then((res) => setResults(res.data.results || {}))
      .catch((err) => {
        setResults({});
        setError(err.response?.data?.message || 'Search failed.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Recent patients when landing on Search (no query yet)
  useEffect(() => {
    if (!idle) return undefined;
    let cancelled = false;
    setRecentLoading(true);
    api
      .get('/patients', {
        params: { page: 1, limit: 5 },
        skipCache: true,
        skipErrorToast: true,
      })
      .then((res) => {
        if (!cancelled) setRecentPatients(res.data.patients || []);
      })
      .catch(() => {
        if (!cancelled) setRecentPatients([]);
      })
      .finally(() => {
        if (!cancelled) setRecentLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [idle, branchId]);

  useEffect(() => {
    const handle = setTimeout(() => {
      const next = q.trim();
      setParams(next ? { q: next } : {}, { replace: true });
      run(next);
    }, 250);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, branchId]);

  const total = useMemo(
    () => SECTIONS.reduce((sum, s) => sum + (results[s.key]?.length || 0), 0),
    [results]
  );
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
                  to={ROUTES.doctorPatientDetail(row._id)}
                  className="card !p-3 block text-sm hover:border-accent-400"
                >
                  {rowLabel('patients', row)}
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
        SECTIONS.map(({ key, label }) =>
          results[key]?.length ? (
            <section key={key} className="mb-5">
              <h3 className="text-sm font-semibold text-ink mb-2">{label}</h3>
              <div className="space-y-1">
                {results[key].map((row) => (
                  <Link key={row._id || row.id} to={rowLink(key, row)} className="card !p-3 block text-sm hover:border-accent-400">
                    {rowLabel(key, row)}
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
