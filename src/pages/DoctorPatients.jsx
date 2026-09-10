import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format, isValid } from 'date-fns';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Search, UserPlus, Phone, ChevronLeft, ChevronRight } from 'lucide-react';
import { ROUTES } from '../constants/routes';
import EmptyState from '../components/ui/EmptyState';
import PageHeader from '../components/ui/PageHeader';
import { SkeletonRows } from '../components/ui/Skeleton';
import UserAvatar from '../components/UserAvatar';

const PAGE_SIZE = 20;

function visitLabel(visit) {
  if (!visit?.date) return '—';
  const d = new Date(visit.date);
  const date = isValid(d) ? format(d, 'MMM d') : '—';
  return visit.timeSlot ? `${date} · ${visit.timeSlot}` : date;
}

export default function DoctorPatients() {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = async (q = search, pageNum = page) => {
    setError(false);
    try {
      const res = await api.get('/patients', {
        params: {
          page: pageNum,
          limit: PAGE_SIZE,
          ...(q.trim() ? { search: q.trim() } : {}),
        },
      });
      setPatients(res.data.patients || []);
      setMeta({
        total: res.data.total ?? res.data.patients?.length ?? 0,
        pages: res.data.pages || 1,
      });
    } catch (err) {
      setError(true);
      toast.error(err.response?.data?.message || 'Could not load patients.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    load(search, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (page === 1) {
      setLoading(true);
      load(search, 1);
    } else {
      setPage(1);
    }
  };

  return (
    <div className="page-container">
      <PageHeader
        actions={
          <Link to={ROUTES.doctorPatientNew} className="btn-primary">
            <UserPlus className="w-4 h-4" /> Add patient
          </Link>
        }
      />

      <form onSubmit={handleSearch} className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" />
          <input
            className="input-field pl-9"
            placeholder="Search name, phone, email, or PAT-ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button type="submit" className="btn-secondary shrink-0">
          Search
        </button>
      </form>

      {loading ? (
        <SkeletonRows />
      ) : error ? (
        <EmptyState
          title="Unable to load patients"
          action={
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setLoading(true);
                load();
              }}
            >
              Try again
            </button>
          }
        />
      ) : patients.length === 0 ? (
        <EmptyState
          icon={UserPlus}
          title="No patients found"
          description="Add a patient record to start scheduling visits."
          action={
            <Link to={ROUTES.doctorPatientNew} className="btn-primary">
              Add patient
            </Link>
          }
        />
      ) : (
        <>
          <div className="hidden md:block card !p-0 overflow-hidden">
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Patient ID</th>
                    <th>Phone</th>
                    <th>Last visit</th>
                    <th>Next visit</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {patients.map((p) => (
                    <tr key={p._id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <UserAvatar name={p.name} size="sm" />
                          <div className="min-w-0">
                            <p className="font-medium text-ink truncate">{p.name}</p>
                            <p className="text-xs text-ink-faint capitalize">
                              {[p.gender, p.age != null ? `${p.age} yrs` : null].filter(Boolean).join(' · ') || '—'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="font-mono text-xs text-ink-muted">{p.patientCode || '—'}</td>
                      <td className="text-ink-muted">{p.phone || '—'}</td>
                      <td className="text-ink-muted whitespace-nowrap">{visitLabel(p.lastVisit)}</td>
                      <td className="text-ink-muted whitespace-nowrap">{visitLabel(p.nextAppointment)}</td>
                      <td className="text-right">
                        <Link
                          to={ROUTES.doctorPatientDetail(p._id)}
                          className="text-sm font-semibold text-accent-700 hover:underline"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="md:hidden space-y-2">
            {patients.map((p) => (
              <Link key={p._id} to={ROUTES.doctorPatientDetail(p._id)} className="card !p-4 block">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <UserAvatar name={p.name} size="sm" />
                    <div className="min-w-0">
                      <p className="font-semibold text-ink truncate">{p.name}</p>
                      <p className="text-xs font-mono text-ink-faint mt-0.5">{p.patientCode || '—'}</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-accent-700">View</span>
                </div>
                <p className="text-sm text-ink-muted flex items-center gap-1.5 mt-3">
                  <Phone className="w-3.5 h-3.5" /> {p.phone || '—'}
                </p>
                <p className="text-xs text-ink-faint mt-2">
                  Last {visitLabel(p.lastVisit)} · Next {visitLabel(p.nextAppointment)}
                </p>
              </Link>
            ))}
          </div>

          {meta.pages > 1 && (
            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-xs text-ink-faint">
                {meta.total} patients · page {page} of {meta.pages}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn-secondary !min-h-9"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="w-4 h-4" /> Prev
                </button>
                <button
                  type="button"
                  className="btn-secondary !min-h-9"
                  disabled={page >= meta.pages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
