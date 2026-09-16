import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format, isValid } from 'date-fns';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Search, UserPlus, Phone } from 'lucide-react';
import { ROUTES } from '../constants/routes';
import EmptyState from '../components/ui/EmptyState';
import PageHeader from '../components/ui/PageHeader';
import Pagination from '../components/ui/Pagination';
import { SkeletonRows } from '../components/ui/Skeleton';
import UserAvatar from '../components/UserAvatar';
import { useBranch } from '../context/BranchContext';
import { useAuth } from '../context/AuthContext';
import { can, P } from '../constants/permissions';
import useDebouncedValue from '../hooks/useDebouncedValue';

const PAGE_SIZE = 20;

function visitLabel(visit) {
  if (!visit?.date) return '—';
  const d = new Date(visit.date);
  const date = isValid(d) ? format(d, 'MMM d') : '—';
  return visit.timeSlot ? `${date} · ${visit.timeSlot}` : date;
}

export default function DoctorPatients() {
  const { user } = useAuth();
  const { branchId } = useBranch();
  const canManage = can(user, P.PATIENTS_MANAGE);
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = async (q = debouncedSearch, pageNum = page) => {
    setError(false);
    try {
      const res = await api.get('/patients', {
        params: {
          page: pageNum,
          limit: PAGE_SIZE,
          ...(q.trim() ? { search: q.trim() } : {}),
        },
        skipErrorToast: true,
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
    setPage(1);
  }, [debouncedSearch, branchId]);

  useEffect(() => {
    setLoading(true);
    load(debouncedSearch, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, branchId, debouncedSearch]);

  const addPatientLink = canManage ? (
    <Link to={ROUTES.doctorPatientNew} className="btn-primary">
      <UserPlus className="w-4 h-4" /> Add patient
    </Link>
  ) : null;

  return (
    <div className="page-container">
      <PageHeader actions={addPatientLink} />

      <div className="mb-4">
        <label htmlFor="patient-search" className="sr-only">
          Search patients
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" aria-hidden />
          <input
            id="patient-search"
            className="input-field pl-9"
            placeholder="Search name, phone, email, or PAT-ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

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
          title={debouncedSearch.trim() ? 'No matching patients' : 'No patients found'}
          description={
            debouncedSearch.trim()
              ? 'Try a different name, phone, or patient ID.'
              : 'Add a patient record to start scheduling visits.'
          }
          action={
            canManage && !debouncedSearch.trim() ? (
              <Link to={ROUTES.doctorPatientNew} className="btn-primary">
                Add patient
              </Link>
            ) : null
          }
        />
      ) : (
        <>
          <p className="text-xs text-ink-faint mb-2">
            {meta.total} patient{meta.total === 1 ? '' : 's'}
            {meta.pages > 1 ? ` · page ${page} of ${meta.pages}` : ''}
          </p>
          <div className="hidden md:block card !p-0 overflow-hidden">
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Patient ID</th>
                    <th>Phone</th>
                    <th>Registered</th>
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
                          <UserAvatar name={p.name} profilePhoto={p.profilePhoto} size="sm" />
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
                      <td className="text-ink-muted whitespace-nowrap">
                        {p.createdAt && isValid(new Date(p.createdAt))
                          ? format(new Date(p.createdAt), 'MMM d, yyyy')
                          : '—'}
                      </td>
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
                    <UserAvatar name={p.name} profilePhoto={p.profilePhoto} size="sm" />
                    <div className="min-w-0">
                      <p className="font-semibold text-ink truncate">{p.name}</p>
                      <p className="text-xs font-mono text-ink-faint mt-0.5">{p.patientCode || '—'}</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-accent-700">View</span>
                </div>
                <p className="text-sm text-ink-muted flex items-center gap-1.5 mt-3">
                  <Phone className="w-3.5 h-3.5" aria-hidden /> {p.phone || '—'}
                </p>
                <p className="text-xs text-ink-faint mt-2">
                  Registered{' '}
                  {p.createdAt && isValid(new Date(p.createdAt))
                    ? format(new Date(p.createdAt), 'MMM d, yyyy')
                    : '—'}{' '}
                  · Last {visitLabel(p.lastVisit)}
                </p>
              </Link>
            ))}
          </div>

          <Pagination page={page} pages={meta.pages} onPage={setPage} />
        </>
      )}
    </div>
  );
}
