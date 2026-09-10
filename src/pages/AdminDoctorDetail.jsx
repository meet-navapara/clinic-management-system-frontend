import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { format, isValid } from 'date-fns';
import { CheckCircle, XCircle, Ban, RefreshCw } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import PageLoader from '../components/PageLoader';
import { ROUTES } from '../constants/routes';
import { confirmAction } from '../utils/display';
import StatCard from '../components/ui/StatCard';
import { ApprovalBadge } from '../components/ui/StatusBadge';

export default function AdminDoctorDetail() {
  const { id } = useParams();
  const [doctor, setDoctor] = useState(null);
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const res = await api.get(`/admin/doctors/${id}`);
      setDoctor(res.data.doctor);
      setActivity(res.data.activity);
    } catch {
      toast.error('Doctor not found.');
      setDoctor(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const setStatus = async (status) => {
    if (
      ['rejected', 'suspended'].includes(status) &&
      !confirmAction(`Mark this doctor as ${status}?`)
    ) {
      return;
    }
    setBusy(true);
    try {
      const res = await api.patch(`/admin/doctors/${id}/approval`, { status });
      setDoctor(res.data.doctor);
      toast.success(`Doctor ${status}.`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <PageLoader message="Loading doctor..." compact />
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="page-container">
        <div className="card text-center py-12">
          <p className="text-gray-500 mb-4">Doctor not found.</p>
          <Link to={ROUTES.clinicAdminDashboard} className="btn-primary text-sm">
            Back
          </Link>
        </div>
      </div>
    );
  }

  const status = doctor.approvalStatus || 'pending';

  return (
    <div className="page-container">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h2 className="page-title">{doctor.name}</h2>
            <ApprovalBadge status={status} />
          </div>
          <p className="text-sm text-ink-muted">
            {doctor.specialization || '—'} · {doctor.email}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <StatCard label="Patients" value={activity?.patientCount ?? 0} />
        <StatCard label="Appointments" value={activity?.appointmentCount ?? 0} />
        <StatCard label="Upcoming" value={activity?.upcomingCount ?? 0} />
      </div>

      <section className="card grid sm:grid-cols-2 gap-3 text-sm mb-5">
        <p><span className="text-ink-muted">Phone:</span> {doctor.phone || '—'}</p>
        <p><span className="text-ink-muted">Qualification:</span> {doctor.qualification || '—'}</p>
        <p><span className="text-ink-muted">License:</span> {doctor.licenseNumber || '—'}</p>
        <p><span className="text-ink-muted">Experience:</span> {doctor.experience ?? 0} years</p>
        <p className="sm:col-span-2"><span className="text-ink-muted">Clinic:</span> {doctor.clinicName || '—'}</p>
        <p className="sm:col-span-2">
          <span className="text-ink-muted">Address:</span>{' '}
          {[doctor.clinicAddress, doctor.city, doctor.state, doctor.postalCode, doctor.country]
            .filter(Boolean)
            .join(', ') || '—'}
        </p>
        <p>
          <span className="text-ink-muted">Registered:</span>{' '}
          {doctor.createdAt && isValid(new Date(doctor.createdAt))
            ? format(new Date(doctor.createdAt), 'PPP')
            : '—'}
        </p>
        {doctor.bio && (
          <p className="sm:col-span-2 pt-2 border-t border-line">
            <span className="text-ink-muted block mb-1">Bio</span>
            {doctor.bio}
          </p>
        )}
      </section>

      <section className="card">
        <p className="section-label mb-3">Actions</p>
        <div className="flex flex-wrap gap-2">
          {status !== 'approved' && (
            <button
              type="button"
              disabled={busy}
              onClick={() => setStatus('approved')}
              className="btn-primary"
            >
              <CheckCircle className="w-4 h-4" /> Approve
            </button>
          )}
          {status === 'pending' && (
            <button
              type="button"
              disabled={busy}
              onClick={() => setStatus('rejected')}
              className="btn-danger"
            >
              <XCircle className="w-4 h-4" /> Reject
            </button>
          )}
          {status === 'approved' && (
            <button
              type="button"
              disabled={busy}
              onClick={() => setStatus('suspended')}
              className="btn-secondary"
            >
              <Ban className="w-4 h-4" /> Suspend
            </button>
          )}
          {(status === 'suspended' || status === 'rejected') && (
            <button
              type="button"
              disabled={busy}
              onClick={() => setStatus('approved')}
              className="btn-secondary"
            >
              <RefreshCw className="w-4 h-4" /> Reactivate
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

