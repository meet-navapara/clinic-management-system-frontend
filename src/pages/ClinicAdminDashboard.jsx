import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { ROUTES } from '../constants/routes';
import StatCard from '../components/ui/StatCard';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonRows, SkeletonCards } from '../components/ui/Skeleton';
import { ApprovalBadge } from '../components/ui/StatusBadge';
import Pagination from '../components/ui/Pagination';
import { PAGE_SIZE } from '../constants/pagination';


/** Super Admin overview — stats cards + simple doctor name/status list. */
export default function ClinicAdminDashboard() {
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [doctors, setDoctors] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadDoctors = async (p = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/admin/doctors', { params: { page: p, limit: PAGE_SIZE } });
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
    let cancelled = false;
    setStatsLoading(true);
    (async () => {
      try {
        const statsRes = await api.get('/admin/dashboard');
        if (!cancelled) setStats(statsRes.data.stats);
      } catch {
        /* optional */
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    })();
    loadDoctors(1);
    return () => {
      cancelled = true;
    };
  }, []);

  const d = stats?.doctors || {};

  return (
    <div className="page-container">
      <div className="mb-4 sm:mb-6 flex flex-col gap-2.5 sm:gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="section-label mb-0.5 sm:mb-1">Platform</p>
          <h2 className="page-title">Super Admin</h2>
          <p className="page-subtitle">
            Overview of doctor registrations. Manage approvals on the Doctors tab.
          </p>
        </div>
        <Link
          to={ROUTES.clinicAdminDoctors}
          className="btn-primary w-full sm:w-auto justify-center shrink-0"
        >
          Manage doctors
        </Link>
      </div>

      {statsLoading ? (
        <SkeletonCards count={4} className="mb-5 sm:mb-6" />
      ) : (
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 mb-5 sm:mb-6">
          <StatCard label="Pending" value={d.pending ?? '—'} />
          <StatCard label="Approved" value={d.approved ?? '—'} />
          <StatCard label="Rejected" value={d.rejected ?? '—'} />
          <StatCard label="All doctors" value={d.total ?? '—'} />
        </div>
      )}

      <div className="mb-3 flex items-center justify-between gap-2 min-w-0">
        <h3 className="text-sm font-semibold text-ink">Doctors</h3>
        <Link
          to={ROUTES.clinicAdminDoctors}
          className="text-xs font-semibold text-accent-700 hover:underline shrink-0"
        >
          View all actions
        </Link>
      </div>

      {loading ? (
        <SkeletonRows count={PAGE_SIZE} />
      ) : doctors.length === 0 ? (
        <EmptyState title="No doctors yet" description="New doctor signups will appear here." />
      ) : (
        <>
          <div className="hidden md:block card !p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table !min-w-0">
                <thead>
                  <tr>
                    <th>Doctor</th>
                    <th className="w-36">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {doctors.map((doc) => (
                    <tr key={doc._id || doc.id}>
                      <td className="min-w-0">
                        <Link
                          to={ROUTES.clinicAdminDoctorDetail(doc._id || doc.id)}
                          className="font-medium text-ink hover:text-accent-700 break-words"
                        >
                          {doc.name}
                        </Link>
                      </td>
                      <td>
                        <ApprovalBadge status={doc.approvalStatus} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="md:hidden space-y-2">
            {doctors.map((doc) => (
              <Link
                key={doc._id || doc.id}
                to={ROUTES.clinicAdminDoctorDetail(doc._id || doc.id)}
                className="card !p-3 sm:!p-4 flex items-center justify-between gap-3 min-h-0"
              >
                <p className="text-sm sm:text-base font-semibold text-ink truncate min-w-0">{doc.name}</p>
                <ApprovalBadge status={doc.approvalStatus} className="!text-[10px] sm:!text-xs" />
              </Link>
            ))}
          </div>
        </>
      )}

      <Pagination page={page} pages={pages} total={total} limit={PAGE_SIZE} onPage={loadDoctors} />
    </div>
  );
}
