import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format, isValid } from 'date-fns';
import { MessageCircle } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonRows } from '../components/ui/Skeleton';
import { ROUTES } from '../constants/routes';

function appointmentIdOf(n) {
  const raw = n.appointmentId;
  if (!raw) return null;
  return raw._id || raw.id || raw;
}

export default function DoctorNotifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [waBusyId, setWaBusyId] = useState(null);

  useEffect(() => {
    api
      .get('/notifications')
      .then((res) => setItems(res.data.notifications || []))
      .catch(() => toast.error('Could not load reminders.'))
      .finally(() => setLoading(false));
  }, []);

  const openWhatsApp = async (n) => {
    const existing = n.metadata?.whatsappUrl;
    if (existing) {
      window.open(existing, '_blank', 'noopener,noreferrer');
      return;
    }
    const aid = appointmentIdOf(n);
    if (!aid) {
      toast.error('No appointment linked to this reminder.');
      return;
    }
    setWaBusyId(n._id);
    try {
      const res = await api.get(`/appointments/${aid}/whatsapp`);
      if (res.data.whatsappUrl) {
        window.open(res.data.whatsappUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not open WhatsApp.');
    } finally {
      setWaBusyId(null);
    }
  };

  return (
    <div className="page-container">
      {loading ? (
        <SkeletonRows />
      ) : items.length === 0 ? (
        <EmptyState title="No reminders yet" description="They appear after you schedule a visit." />
      ) : (
        <div className="card !p-0 overflow-hidden divide-y divide-line">
          {items.map((n) => {
            const scheduled = n.scheduledAt ? new Date(n.scheduledAt) : null;
            const aid = appointmentIdOf(n);
            const phone = n.recipientPhone || n.appointmentId?.patientId?.phone;
            return (
              <article key={n._id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-ink">
                      {n.recipientName || n.appointmentId?.patientId?.name || 'Patient'}
                      {phone ? ` · ${phone}` : ''}
                    </p>
                    <p className="text-sm text-ink-muted mt-0.5">{n.message}</p>
                    <p className="text-xs text-ink-faint mt-1.5">
                      {scheduled && isValid(scheduled) ? format(scheduled, 'PPp') : '—'}
                    </p>
                  </div>
                  <span className="status-badge bg-[#f3efe8] text-ink-muted ring-line capitalize shrink-0">
                    {n.status}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {aid && (
                    <Link to={ROUTES.doctorAppointmentDetail(aid)} className="btn-secondary !min-h-8 !py-1 !px-3 text-xs">
                      Open appointment
                    </Link>
                  )}
                  {(n.metadata?.whatsappUrl || phone) && (
                    <button
                      type="button"
                      className="btn-whatsapp !min-h-8 !py-1 !px-3 text-xs"
                      disabled={waBusyId === n._id}
                      onClick={() => openWhatsApp(n)}
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      {waBusyId === n._id ? 'Opening…' : 'Open WhatsApp'}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
