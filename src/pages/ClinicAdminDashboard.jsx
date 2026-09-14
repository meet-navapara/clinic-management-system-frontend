import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { format, isValid } from 'date-fns';
import { Search } from 'lucide-react';
import { ROUTES } from '../constants/routes';
import StatCard from '../components/ui/StatCard';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonRows } from '../components/ui/Skeleton';
import { ApprovalBadge } from '../components/ui/StatusBadge';

const FILTERS = ['pending', 'approved', 'rejected', 'suspended', 'all'];

export default function ClinicAdminDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [stats, setStats] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const filter = FILTERS.includes(searchParams.get('status')) ? searchParams.get('status') : 'pending';
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const loadStats = async () => {
    try {
      const res = await api.get('/admin/dashboard');
      setStats(res.data.stats);
    } catch {
      /* optional */
    }
  };

  const loadDoctors = async (status = filter, q = search) => {
    try {
      const params = {};
      if (status && status !== 'all') params.status = status;
      if (q.trim()) params.search = q.trim();
      const res = await api.get('/admin/doctors', { params });
      setDoctors(res.data.doctors || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not load doctors.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    setLoading(true);
    loadDoctors(filter, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const setApproval = async (id, status) => {
    setUpdatingId(id);
    try {
      const res = await api.patch(`/admin/doctors/${id}/approval`, { status });
      toast.success(`Doctor ${status}.`);
      const updated = res.data.doctor;
      setDoctors((prev) => {
        if (filter !== 'all' && filter !== status) {
          return prev.filter((d) => String(d._id || d.id) !== String(id));
        }
        return prev.map((d) =>
          String(d._id || d.id) === String(id) ? { ...d, ...updated } : d
        );
      });
      await Promise.all([loadDoctors(filter, search), loadStats()]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed.');
    } finally {
      setUpdatingId(null);
    }
  };

  const d = stats?.doctors || {};

  return (
    <div className="page-container">
      <div className="mb-6">
        <p className="section-label mb-1">Platform</p>
        <h2 className="page-title">Super Admin</h2>
        <p className="text-sm text-ink-muted mt-1">Doctor registration requests and account status.</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Pending approvals" value={d.pending ?? '—'} />
        <StatCard label="Approved doctors" value={d.approved ?? '—'} />
        <StatCard label="Rejected" value={d.rejected ?? '—'} />
        <StatCard label="All doctors" value={d.total ?? '—'} />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex flex-wrap gap-2 flex-1">
          {FILTERS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setSearchParams(key === 'pending' ? {} : { status: key })}
              className={`tab-chip ${
                filter === key ? 'bg-ink text-white' : 'bg-white text-ink-muted ring-1 ring-line'
              }`}
            >
              {key}
            </button>
          ))}
        </div>
        <form
          className="relative sm:w-64"
          onSubmit={(e) => {
            e.preventDefault();
            setLoading(true);
            loadDoctors(filter, search);
          }}
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" />
          <input
            className="input-field !pl-9"
            placeholder="Search doctors"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>
      </div>

      {loading ? (
        <SkeletonRows />
      ) : doctors.length === 0 ? (
        <EmptyState title="No doctors in this filter." />
      ) : (
        <>
          <div className="hidden md:block card !p-0 overflow-hidden">
            <div className="data-table-wrap">
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
                      <td>
                        <Link
                          to={ROUTES.clinicAdminDoctorDetail(doc._id || doc.id)}
                          className="font-medium text-ink hover:text-accent-700"
                        >
                          {doc.name}
                        </Link>
                        <p className="text-xs text-ink-muted mt-0.5">
                          {doc.specialization || '—'}
                        </p>
                      </td>
                      <td className="text-ink-muted">{doc.clinicName || '—'}</td>
                      <td className="text-ink-muted">{doc.email}</td>
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
                          {doc.approvalStatus === 'pending' && (
                            <>
                              <button
                                type="button"
                                disabled={updatingId === (doc._id || doc.id)}
                                className="btn-primary !min-h-8 !py-1 !px-2.5 text-xs"
                                onClick={() => setApproval(doc._id || doc.id, 'approved')}
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                disabled={updatingId === (doc._id || doc.id)}
                                className="btn-danger !min-h-8 !py-1 !px-2.5 text-xs"
                                onClick={() => setApproval(doc._id || doc.id, 'rejected')}
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {doc.approvalStatus === 'approved' && (
                            <button
                              type="button"
                              disabled={updatingId === (doc._id || doc.id)}
                              className="btn-secondary !min-h-8 !py-1 !px-2.5 text-xs"
                              onClick={() => setApproval(doc._id || doc.id, 'suspended')}
                            >
                              Suspend
                            </button>
                          )}
                          {(doc.approvalStatus === 'suspended' || doc.approvalStatus === 'rejected') && (
                            <button
                              type="button"
                              disabled={updatingId === (doc._id || doc.id)}
                              className="btn-secondary !min-h-8 !py-1 !px-2.5 text-xs"
                              onClick={() => setApproval(doc._id || doc.id, 'approved')}
                            >
                              Reactivate
                            </button>
                          )}
                          <Link
                            to={ROUTES.clinicAdminDoctorDetail(doc._id || doc.id)}
                            className="text-xs font-semibold text-accent-700 px-2 py-1.5"
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

          <div className="md:hidden space-y-2">
            {doctors.map((doc) => (
              <article key={doc._id || doc.id} className="card !p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      to={ROUTES.clinicAdminDoctorDetail(doc._id || doc.id)}
                      className="font-semibold text-ink"
                    >
                      {doc.name}
                    </Link>
                    <p className="text-sm text-ink-muted mt-0.5 truncate">{doc.email}</p>
                  </div>
                  <ApprovalBadge status={doc.approvalStatus} />
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {doc.approvalStatus === 'pending' && (
                    <>
                      <button
                        type="button"
                        disabled={updatingId === (doc._id || doc.id)}
                        className="btn-primary !min-h-9 text-xs"
                        onClick={() => setApproval(doc._id || doc.id, 'approved')}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={updatingId === (doc._id || doc.id)}
                        className="btn-danger !min-h-9 text-xs"
                        onClick={() => setApproval(doc._id || doc.id, 'rejected')}
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {doc.approvalStatus === 'approved' && (
                    <button
                      type="button"
                      className="btn-secondary !min-h-9 text-xs"
                      onClick={() => setApproval(doc._id || doc.id, 'suspended')}
                    >
                      Suspend
                    </button>
                  )}
                  {(doc.approvalStatus === 'suspended' || doc.approvalStatus === 'rejected') && (
                    <button
                      type="button"
                      className="btn-secondary !min-h-9 text-xs"
                      onClick={() => setApproval(doc._id || doc.id, 'approved')}
                    >
                      Reactivate
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
