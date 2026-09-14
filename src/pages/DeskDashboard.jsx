import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Calendar, Users, Receipt, ListOrdered } from 'lucide-react';
import api from '../utils/api';
import { ROUTES } from '../constants/routes';
import StatCard from '../components/ui/StatCard';
import EmptyState from '../components/ui/EmptyState';
import Badge from '../components/ui/Badge';
import Money from '../components/ui/Money';
import { can, P } from '../constants/permissions';
import { useAuth } from '../context/AuthContext';
import { useBranch } from '../context/BranchContext';
import { patientDisplayName } from '../utils/display';

export default function DeskDashboard() {
  const { user } = useAuth();
  const { branchId } = useBranch();
  const [appts, setAppts] = useState([]);
  const [queue, setQueue] = useState([]);
  const [outstanding, setOutstanding] = useState([]);

  useEffect(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    if (can(user, P.APPOINTMENTS_VIEW)) {
      api.get('/appointments/my', { params: { date: today } }).then((res) => setAppts(res.data.appointments || [])).catch(() => {});
    }
    if (can(user, P.QUEUE_MANAGE)) {
      api.get('/queue').then((res) => setQueue(res.data.tickets || [])).catch(() => {});
    }
    if (can(user, P.BILLING_VIEW)) {
      api.get('/billing', { params: { status: 'unpaid', limit: 8 } }).then((res) => setOutstanding(res.data.invoices || [])).catch(() => {});
    }
  }, [user, branchId]);

  return (
    <div className="page-container">
      <div className="mb-6">
        <p className="section-label mb-1">{format(new Date(), 'EEEE, MMMM d')}</p>
        <h2 className="page-title">Dashboard</h2>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {can(user, P.APPOINTMENTS_VIEW) && <StatCard label="Today" value={appts.length} icon={Calendar} />}
        {can(user, P.QUEUE_MANAGE) && <StatCard label="Waiting" value={queue.filter((t) => t.status === 'waiting').length} icon={ListOrdered} />}
        {can(user, P.QUEUE_MANAGE) && <StatCard label="Checked in" value={queue.length} icon={Users} />}
        {can(user, P.BILLING_VIEW) && <StatCard label="Unpaid bills" value={outstanding.length} icon={Receipt} />}
      </div>
      <div className="flex flex-wrap gap-2 mb-6">
        {can(user, P.QUEUE_MANAGE) && <Link to={ROUTES.queue} className="btn-primary">Queue</Link>}
        {can(user, P.BILLING_MANAGE) && <Link to={ROUTES.billingNew} className="btn-secondary">New bill</Link>}
        {can(user, P.PATIENTS_MANAGE) && <Link to={ROUTES.doctorPatientNew} className="btn-secondary">Add patient</Link>}
        {can(user, P.APPOINTMENTS_MANAGE) && <Link to={ROUTES.doctorBook} className="btn-secondary">Schedule</Link>}
      </div>
      <div className="grid xl:grid-cols-2 gap-6">
        {can(user, P.QUEUE_MANAGE) && (
        <section>
          <h3 className="text-sm font-semibold mb-3">Waiting queue</h3>
          {!queue.length ? <EmptyState title="No one waiting" /> : queue.slice(0, 8).map((t) => (
            <div key={t._id} className="card !p-3 mb-2 flex justify-between">
              <span className="font-medium">#{t.tokenLabel} {t.patientId?.name}</span>
              <Badge value={t.status} />
            </div>
          ))}
        </section>
        )}
        {can(user, P.APPOINTMENTS_VIEW) && (
        <section>
          <h3 className="text-sm font-semibold mb-3">Today’s appointments</h3>
          {!appts.length ? <EmptyState title="No appointments today" /> : appts.slice(0, 8).map((a) => (
            <Link key={a._id} to={ROUTES.doctorAppointmentDetail(a._id)} className="card !p-3 mb-2 flex justify-between">
              <span>{a.timeSlot} · {patientDisplayName(a.patientId)}</span>
              <Badge value={a.status} />
            </Link>
          ))}
        </section>
        )}
        {can(user, P.BILLING_VIEW) && (
          <section className="xl:col-span-2">
            <h3 className="text-sm font-semibold mb-3">Outstanding payments</h3>
            {!outstanding.length ? <EmptyState title="No unpaid invoices" /> : outstanding.map((inv) => (
              <Link key={inv._id} to={ROUTES.invoice(inv._id)} className="card !p-3 mb-2 flex justify-between">
                <span>{inv.invoiceNumber} · {inv.patientId?.name}</span>
                <Money value={inv.dueAmount} />
              </Link>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
