import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, isValid } from 'date-fns';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Inbox, CheckCheck } from 'lucide-react';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonRows } from '../components/ui/Skeleton';

export default function DoctorInbox() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/notifications/inbox');
      setItems(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount ?? 0);
    } catch {
      toast.error('Could not load inbox.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const markRead = async (id) => {
    try {
      await api.patch(`/notifications/inbox/${id}/read`);
      setItems((prev) =>
        prev.map((n) => (n._id === id ? { ...n, readAt: n.readAt || new Date().toISOString() } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      toast.error('Could not mark as read.');
    }
  };

  const markAll = async () => {
    setBusy(true);
    try {
      await api.patch('/notifications/inbox/read-all');
      setItems((prev) =>
        prev.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() }))
      );
      setUnreadCount(0);
      toast.success('All marked as read.');
    } catch {
      toast.error('Could not update inbox.');
    } finally {
      setBusy(false);
    }
  };

  const openItem = async (n) => {
    if (!n.readAt) await markRead(n._id);
    if (n.link) {
      navigate(n.link);
    }
  };

  return (
    <div className="page-container">
      <div className="mb-5 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <p className="page-subtitle !mt-0">
          {unreadCount ? `${unreadCount} unread` : "You're caught up"}
        </p>
        {unreadCount > 0 && (
          <button
            type="button"
            className="btn-secondary"
            disabled={busy}
            onClick={markAll}
          >
            <CheckCheck className="w-4 h-4" /> Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <SkeletonRows />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No notifications yet"
          description="Activity from appointments and patients will appear here."
        />
      ) : (
        <div className="card !p-0 overflow-hidden divide-y divide-line">
          {items.map((n) => {
            const unread = !n.readAt;
            const when = n.createdAt ? new Date(n.createdAt) : null;
            return (
              <article
                key={n._id}
                className={`px-4 py-3 cursor-pointer ${unread ? 'bg-[#fdfaf0]' : 'bg-white hover:bg-[#faf8f3]'}`}
                onClick={() => openItem(n)}
                onKeyDown={(e) => e.key === 'Enter' && openItem(n)}
                role="button"
                tabIndex={0}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className={`text-sm ${unread ? 'font-semibold text-ink' : 'font-medium text-ink'}`}>
                      {n.title}
                    </p>
                    {n.body && <p className="text-sm text-ink-muted mt-0.5 line-clamp-2">{n.body}</p>}
                    <p className="text-xs text-ink-faint mt-1.5">
                      {when && isValid(when) ? format(when, 'PPp') : ''}
                    </p>
                  </div>
                  {unread && (
                    <button
                      type="button"
                      className="text-xs font-semibold text-accent-700 shrink-0 min-h-9"
                      onClick={(e) => {
                        e.stopPropagation();
                        markRead(n._id);
                      }}
                    >
                      Mark read
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

