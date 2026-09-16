import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { format, isValid } from 'date-fns';
import { Search } from 'lucide-react';
import { ROUTES } from '../constants/routes';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonRows } from '../components/ui/Skeleton';
import { ApprovalBadge } from '../components/ui/StatusBadge';
import Pagination from '../components/ui/Pagination';
import LoadingOverlay from '../components/ui/LoadingOverlay';
import { PAGE_SIZE } from '../constants/pagination';


const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'suspended', label: 'Suspended' },
];

function ActionButtons({ doc, updatingId, setApproval, compact }) {
  const id = doc._id || doc.id;
  const busy = updatingId === id;
  const btn = compact ? 'btn-sm flex-1 min-w-[4.75rem] justify-center' : 'btn-sm';

  return (
    <>
      {doc.approvalStatus === 'pending' && (
        <>
          <button
            type="button"
            disabled={busy}
            className={`btn-primary ${btn}`}
            onClick={() => setApproval(id, 'approved')}
          >
            Approve
          </button>
          <button
            type="button"
            disabled={busy}
            className={`btn-danger ${btn}`}
            onClick={() => setApproval(id, 'rejected')}
          >
            Reject
          </button>
        </>
      )}
      {doc.approvalStatus === 'approved' && (
        <button
          type="button"
          disabled={busy}
          className={`btn-secondary ${btn}`}
          onClick={() => setApproval(id, 'suspended')}
        >
          Suspend
        </button>
      )}
      {(doc.approvalStatus === 'suspended' || doc.approvalStatus === 'rejected') && (
        <button
          type="button"
          disabled={busy}
          className={`btn-secondary ${btn}`}
          onClick={() => setApproval(id, 'approved')}
        >
          Reactivate
        </button>
      )}
    </>
  );
}

/** Super Admin doctor management — approve, reject, suspend, reactivate. */
export default function AdminDoctorsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [doctors, setDoctors] = useState([]);
  const filter = FILTERS.some((item) => item.id === searchParams.get('status'))
    ? searchParams.get('status')
    : 'all';
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const loadDoctors = async (p = 1, status = filter, q = search) => {
    setLoading(true);
    try {
      const params = { page: p, limit: PAGE_SIZE };
      if (status && status !== 'all') params.status = status;
      if (q.trim()) params.search = q.trim();
      const res = await api.get('/admin/doctors', { params });
      setDoctors(res.data.doctors || []);
      setPage(res.data.page || p);
      setPages(res.data.pages || 1);
      setTotal(res.data.total || 0);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not load doctors.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoctors(1, filter, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const setApproval = async (id, status) => {
    setUpdatingId(id);
    try {
      await api.patch(`/admin/doctors/${id}/approval`, { status });
      toast.success(`Doctor ${status}.`);
      await loadDoctors(page, filter, search);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="page-container relative">
      <LoadingOverlay show={Boolean(updatingId)} message="Updating doctor…" />
      <div className="mb-3 sm:mb-5 min-w-0">
        <p className="section-label mb-0.5 sm:mb-1">Platform</p>
        <h2 className="page-title">Doctors</h2>
        <p className="page-subtitle">
          Approve, reject, suspend, or reactivate doctor accounts.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:gap-3 mb-3 sm:mb-4">
        <div className="relative min-w-0">
          <div
            className="flex gap-1.5 sm:gap-2 overflow-x-auto touch-pan-x overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            role="tablist"
            aria-label="Doctor status filters"
          >
            {FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={filter === item.id}
                onClick={() => setSearchParams(item.id === 'all' ? {} : { status: item.id })}
                className={`tab-chip shrink-0 ${
                  filter === item.id ? 'bg-ink text-white' : 'bg-white text-ink-muted ring-1 ring-line'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <form
          className="relative w-full sm:max-w-xs sm:ml-auto"
          onSubmit={(e) => {
            e.preventDefault();
            loadDoctors(1, filter, search);
          }}
        >
          <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-ink-faint pointer-events-none" />
          <input
            className="input-field !pl-8 sm:!pl-9"
            placeholder="Search doctors"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search doctors"
          />
        </form>
      </div>

      {loading ? (
        <SkeletonRows count={PAGE_SIZE} />
      ) : doctors.length === 0 ? (
        <EmptyState title="No doctors in this filter." />
      ) : (
        <>
          <div className="hidden lg:block card !p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Doctor</th>
                    <th>Clinic</th>
                    <th>Email</th>
                    <th>Registered</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {doctors.map((doc) => (
                    <tr key={doc._id || doc.id}>
                      <td className="min-w-0 max-w-[14rem]">
                        <Link
                          to={ROUTES.clinicAdminDoctorDetail(doc._id || doc.id)}
                          className="font-medium text-ink hover:text-accent-700 break-words"
                        >
                          {doc.name}
                        </Link>
                        <p className="text-xs text-ink-muted mt-0.5 truncate">{doc.specialization || '—'}</p>
                      </td>
                      <td className="text-ink-muted max-w-[10rem] truncate">{doc.clinicName || '—'}</td>
                      <td className="text-ink-muted max-w-[12rem] truncate">{doc.email}</td>
                      <td className="text-ink-muted whitespace-nowrap">
                        {doc.createdAt && isValid(new Date(doc.createdAt))
                          ? format(new Date(doc.createdAt), 'MMM d, yyyy')
                          : '—'}
                      </td>
                      <td>
                        <ApprovalBadge status={doc.approvalStatus} />
                      </td>
                      <td>
                        <div className="flex flex-wrap justify-end gap-2">
                          <ActionButtons doc={doc} updatingId={updatingId} setApproval={setApproval} />
                          <Link
                            to={ROUTES.clinicAdminDoctorDetail(doc._id || doc.id)}
                            className="btn-ghost btn-sm text-accent-700"
                          >
                            View
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="lg:hidden space-y-2">
            {doctors.map((doc) => {
              const id = doc._id || doc.id;
              const registered =
                doc.createdAt && isValid(new Date(doc.createdAt))
                  ? format(new Date(doc.createdAt), 'MMM d, yyyy')
                  : null;
              return (
                <article key={id} className="card !p-3 sm:!p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <Link
                        to={ROUTES.clinicAdminDoctorDetail(id)}
                        className="text-sm sm:text-base font-semibold text-ink break-words hover:text-accent-700"
                      >
                        {doc.name}
                      </Link>
                      {doc.specialization ? (
                        <p className="text-[11px] sm:text-xs text-ink-muted mt-0.5 truncate">{doc.specialization}</p>
                      ) : null}
                      <p className="text-xs sm:text-sm text-ink-muted mt-0.5 break-all">{doc.email}</p>
                      <p className="text-[11px] sm:text-xs text-ink-faint mt-0.5">
                        {[doc.clinicName, registered].filter(Boolean).join(' · ') || '—'}
                      </p>
                    </div>
                    <ApprovalBadge status={doc.approvalStatus} className="!text-[10px] sm:!text-xs" />
                  </div>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    <ActionButtons doc={doc} updatingId={updatingId} setApproval={setApproval} compact />
                    <Link
                      to={ROUTES.clinicAdminDoctorDetail(id)}
                      className="btn-secondary btn-sm flex-1 min-w-[4.75rem] justify-center"
                    >
                      View
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}

      <Pagination
        page={page}
        pages={pages}
        total={total}
        limit={PAGE_SIZE}
        onPage={(p) => loadDoctors(p, filter, search)}
      />
    </div>
  );
}
