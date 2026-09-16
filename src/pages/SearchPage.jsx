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

const EXAMPLES = ['Aarav', 'Ashwagandha', 'INV-', 'Anita', 'Diya', 'panchakarma'];
const SECTIONS = [
  { key: 'patients', label: 'Patients' },
  { key: 'appointments', label: 'Appointments' },
  { key: 'invoices', label: 'Invoices' },
  { key: 'staff', label: 'Staff' },
  { key: 'medicines', label: 'Medicines' },
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
  if (key === 'medicines') {
    return `${row.name || 'Medicine'}${row.strength ? ` · ${row.strength}` : ''}${row.genericName ? ` · ${row.genericName}` : ''}`;
  }
  return row.name || 'Record';
}

function rowLink(key, row) {
  const id = row._id || row.id;
  if (key === 'patients') return ROUTES.doctorPatientDetail(id);
  if (key === 'appointments') return ROUTES.doctorAppointmentDetail(id);
  if (key === 'invoices') return ROUTES.invoice(id);
  if (key === 'medicines') return ROUTES.medicines;
  if (key === 'staff') return ROUTES.staff;
  return '#';
}

export default function SearchPage() {
  const { branchId } = useBranch();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get('q') || '');
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  const trimmed = q.trim();

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
  const idle = trimmed.length < 2;
  const empty = !idle && !loading && !error && total === 0;

  return (
    <div className="page-container">
      <PageHeader
        title="Search"
        description="Find patients, visits, invoices, staff and medicines across the clinic."
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
          placeholder="Try Aarav, Ashwagandha, INV- or a phone number"
          autoComplete="off"
          aria-label="Search clinic"
        />
      </form>

      {idle && (
        <div className="flex flex-wrap gap-2 mb-6">
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              className="tab-chip bg-white text-ink-muted ring-1 ring-line"
              onClick={() => setQ(example)}
            >
              {example}
            </button>
          ))}
        </div>
      )}

      {idle ? (
        <EmptyState
          icon={Search}
          title="Search the clinic"
          description="Type at least 2 characters. Try a patient name, medicine, invoice number, or staff member from the chips above."
        />
      ) : loading ? (
        <SkeletonRows />
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
