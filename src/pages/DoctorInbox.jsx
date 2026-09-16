import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, isValid } from 'date-fns';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Inbox, CheckCheck } from 'lucide-react';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonRows } from '../components/ui/Skeleton';
import Pagination from '../components/ui/Pagination';
import { PAGE_SIZE } from '../constants/pagination';


export default function DoctorInbox() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/notifications/inbox', { params: { page: p, limit: PAGE_SIZE } });
      setItems(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount ?? 0);
      setPage(res.data.page || p);
      setPages(res.data.pages || 1);
      setTotal(res.data.total || 0);
    } catch {
      toast.error('Could not load inbox.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(1);
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
        <SkeletonRows count={PAGE_SIZE} />
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
                className={`px-4 py-3 cursor-pointer hover:bg-[#faf8f5] ${unread ? 'bg-[#fbf9f4]' : ''}`}
                onClick={() => openItem(n)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openItem(n);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className={`text-sm ${unread ? 'font-semibold text-ink' : 'font-medium text-ink'}`}>
                      {n.title || 'Notification'}
                    </p>
                    {n.body ? <p className="text-sm text-ink-muted mt-0.5 line-clamp-2">{n.body}</p> : null}
                    <p className="text-xs text-ink-faint mt-1.5">
                      {when && isValid(when) ? format(when, 'PPp') : '—'}
                    </p>
                  </div>
                  {unread && <span className="mt-1.5 w-2 h-2 rounded-full bg-accent-500 shrink-0" aria-label="Unread" />}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Pagination page={page} pages={pages} total={total} limit={PAGE_SIZE} onPage={load} />
    </div>
  );
}
