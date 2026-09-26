import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Calendar, Receipt } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { ROUTES } from '../constants/routes';
import StatCard from '../components/ui/StatCard';
import EmptyState from '../components/ui/EmptyState';
import Badge from '../components/ui/Badge';
import Money from '../components/ui/Money';
import { can, P } from '../constants/permissions';
import { useAuth } from '../context/AuthContext';
import { useBranch } from '../context/BranchContext';
import { patientDisplayName } from '../utils/display';
import { SkeletonCards, SkeletonRows } from '../components/ui/Skeleton';

export default function DeskDashboard() {
  const { user } = useAuth();
  const { branchId } = useBranch();
  const [appts, setAppts] = useState([]);
  const [outstanding, setOutstanding] = useState([]);
  const [outstandingCount, setOutstandingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    setLoading(true);
    const tasks = [];
    if (can(user, P.APPOINTMENTS_VIEW)) {
      tasks.push(
        api
          .get('/appointments/my', { params: { date: today } })
          .then((res) => setAppts(res.data.appointments || []))
          .catch((err) => toast.error(err.response?.data?.message || 'Could not load appointments.'))
      );
    }
    if (can(user, P.BILLING_VIEW)) {
      tasks.push(
        api
          .get('/billing', { params: { status: 'due', limit: 8 } })
          .then((res) => {
            setOutstanding(res.data.invoices || []);
            setOutstandingCount(
              Number(res.data.collections?.outstandingCount ?? res.data.total ?? res.data.invoices?.length) || 0
            );
          })
          .catch((err) => toast.error(err.response?.data?.message || 'Could not load billing.'))
      );
    }
    Promise.all(tasks).finally(() => setLoading(false));
  }, [user, branchId]);

  return (
    <div className="page-container">
      <div className="mb-6">
        <p className="section-label mb-1">{format(new Date(), 'EEEE, MMMM d')}</p>
        <h2 className="page-title">Dashboard</h2>
      </div>
      {loading ? (
        <>
          <SkeletonCards count={4} className="mb-6" />
          <SkeletonRows count={8} />
        </>
      ) : (
        <>
          {!can(user, P.APPOINTMENTS_VIEW) && !can(user, P.BILLING_VIEW) ? (
            <EmptyState
              title="No desk modules enabled"
              description="Ask a doctor to grant appointments or billing access for your account."
            />
          ) : null}
          <div className="stat-grid mb-6">
            {can(user, P.APPOINTMENTS_VIEW) && <StatCard label="Today" value={appts.length} icon={Calendar} />}
            {can(user, P.BILLING_VIEW) && (
              <StatCard label="Outstanding bills" value={outstandingCount} icon={Receipt} />
            )}
          </div>
          <div className="flex flex-wrap gap-2 mb-6">
            {can(user, P.BILLING_MANAGE) && (
              <Link to={ROUTES.billingNew} className="btn-secondary">
                New bill
              </Link>
            )}
            {can(user, P.PATIENTS_MANAGE) && (
              <Link to={ROUTES.doctorPatientNew} className="btn-secondary">
                Add patient
              </Link>
            )}
            {can(user, P.APPOINTMENTS_MANAGE) && (
              <Link to={ROUTES.doctorBook} className="btn-secondary">
                Schedule
              </Link>
            )}
          </div>
          <div className="grid xl:grid-cols-2 gap-6">
            {can(user, P.APPOINTMENTS_VIEW) && (
              <section>
                <h3 className="text-sm font-semibold mb-3">Today’s appointments</h3>
                {!appts.length ? (
                  <EmptyState title="No appointments today" />
                ) : (
                  appts.slice(0, 8).map((a) => (
                    <Link
                      key={a._id}
                      to={ROUTES.doctorAppointmentDetail(a._id)}
                      className="card !p-3 mb-2 flex justify-between"
                    >
                      <span>
                        {a.timeSlot} · {patientDisplayName(a.patientId)}
                      </span>
                      <Badge value={a.status} />
                    </Link>
                  ))
                )}
              </section>
            )}
            {can(user, P.BILLING_VIEW) && (
              <section className="xl:col-span-2">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">Outstanding payments</h3>
                  <Link to={ROUTES.billing} className="text-xs font-semibold text-accent-700">
                    Open billing
                  </Link>
                </div>
                {!outstanding.length ? (
                  <EmptyState title="No unpaid or partial invoices" />
                ) : (
                  outstanding.map((inv) => (
                    <Link
                      key={inv._id}
                      to={ROUTES.invoice(inv._id)}
                      className="card !p-3 mb-2 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="font-medium truncate">
                          {inv.invoiceNumber} · {inv.patientId?.name}
                        </p>
                        <div className="mt-1">
                          <Badge value={inv.paymentStatus} />
                        </div>
                      </div>
                      <Money value={inv.dueAmount} className="shrink-0 font-semibold text-[#8a3a32]" />
                    </Link>
                  ))
                )}
              </section>
            )}
          </div>
        </>
      )}
    </div>
  );
}
