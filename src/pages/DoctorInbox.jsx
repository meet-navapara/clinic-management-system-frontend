import { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format, isValid } from 'date-fns';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Inbox, CheckCheck } from 'lucide-react';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonRows } from '../components/ui/Skeleton';
import Pagination from '../components/ui/Pagination';
import PageHeader from '../components/ui/PageHeader';
import Dropdown from '../components/ui/Dropdown';
import { PAGE_SIZE } from '../constants/pagination';
import { ROUTES } from '../constants/routes';
import { publishInboxUnread } from '../utils/inboxUnread';
import { formatInboxItem } from '../utils/inboxDisplay';

const FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'appointment', label: 'Appointments' },
  { value: 'patient', label: 'Patients' },
  { value: 'reminder', label: 'Reminders' },
];

export default function DoctorInbox() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState('all');
  const markingRef = useRef(new Set());

  const syncUnread = (count) => {
    setUnreadCount(count);
    publishInboxUnread(count);
  };

  const load = useCallback(
    async (p = 1) => {
      setLoading(true);
      try {
        const params = { page: p, limit: PAGE_SIZE };
        if (filter !== 'all') params.filter = filter;
        const res = await api.get('/notifications/inbox', { params });
        setItems(res.data.notifications || []);
        syncUnread(res.data.unreadCount ?? 0);
        setPage(res.data.page || p);
        setPages(res.data.pages || 1);
        setTotal(res.data.total || 0);
      } catch {
        toast.error('Could not load inbox.');
      } finally {
        setLoading(false);
      }
    },
    [filter]
  );

  useEffect(() => {
    load(1);
  }, [load]);

  const markRead = async (id) => {
    if (markingRef.current.has(id)) return;
    markingRef.current.add(id);
    try {
      const res = await api.patch(`/notifications/inbox/${id}/read`);
      setItems((prev) =>
        prev.map((n) =>
          n._id === id ? { ...n, readAt: n.readAt || res.data.notification?.readAt || new Date().toISOString() } : n
        )
      );
      if (typeof res.data.unreadCount === 'number') {
        syncUnread(res.data.unreadCount);
      } else {
        setUnreadCount((c) => {
          const next = Math.max(0, c - 1);
          publishInboxUnread(next);
          return next;
        });
      }
    } catch {
      toast.error('Could not mark as read.');
    } finally {
      markingRef.current.delete(id);
    }
  };

  const markAll = async () => {
    setBusy(true);
    try {
      await api.patch('/notifications/inbox/read-all');
      setItems((prev) =>
        prev.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() }))
      );
      syncUnread(0);
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

  const visible = items;

  return (
    <div className="page-container">
      <PageHeader
        title="Inbox"
        description="Practice alerts only. Open an item for the visit. WhatsApp delivery logs are under Reminders."
        actions={
          <div className="flex flex-wrap gap-2">
            {unreadCount > 0 && (
              <button type="button" className="btn-secondary" disabled={busy} onClick={markAll}>
                <CheckCheck className="w-4 h-4" /> Mark all read
              </button>
            )}
            <Link to={ROUTES.doctorNotifications} className="btn-secondary">
              Reminders
            </Link>
          </div>
        }
      />

      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-ink-muted">
          {unreadCount ? `${unreadCount} unread` : "You're caught up"}
          {total ? ` · ${total} total` : ''}
        </p>
        <Dropdown
          value={filter}
          onChange={setFilter}
          ariaLabel="Filter inbox"
          options={FILTER_OPTIONS}
          className="sm:w-44"
        />
      </div>

      {loading ? (
        <SkeletonRows count={PAGE_SIZE} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No notifications yet"
          description="Appointments, patients, and reminder outcomes will appear here."
        />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No matches"
          description="Try another filter, or mark items as unread by waiting for new activity."
        />
      ) : (
        <div className="card !p-0 overflow-hidden divide-y divide-line">
          {visible.map((n) => {
            const unread = !n.readAt;
            const when = n.createdAt ? new Date(n.createdAt) : null;
            const view = formatInboxItem(n);
            const tone = {
              ok: 'bg-[#eef6f1] text-[#2d5a40] ring-[#c5ddd0]/80',
              bad: 'bg-[#f8eeee] text-[#8a3a32] ring-[#e4c9c6]/80',
              warn: 'bg-[#f8f1de] text-[#7a5d16] ring-[#d4af37]/30',
              neutral: 'bg-[#f3efe8] text-ink-muted ring-line',
            }[view.badgeTone] || 'bg-[#f3efe8] text-ink-muted ring-line';
            return (
              <article
                key={n._id}
                className={`px-4 py-3.5 cursor-pointer hover:bg-[#faf8f5] ${unread ? 'bg-[#fbf9f4]' : ''}`}
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
                <div className="flex items-start gap-3">
                  {unread && (
                    <span className="mt-2 w-2 h-2 rounded-full bg-accent-500 shrink-0" aria-label="Unread" />
                  )}
                  {!unread && <span className="mt-2 w-2 h-2 shrink-0" aria-hidden />}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`status-badge ${tone}`}>{view.badge}</span>
                      <p className={`text-sm truncate ${unread ? 'font-semibold text-ink' : 'font-medium text-ink'}`}>
                        {view.title}
                      </p>
                    </div>
                    {view.subtitle ? (
                      <p className="text-sm text-ink mt-1 truncate">{view.subtitle}</p>
                    ) : null}
                    {view.extra ? (
                      <p className="text-xs text-ink-muted mt-0.5 line-clamp-1">{view.extra}</p>
                    ) : null}
                    <p className="text-xs text-ink-faint mt-1.5">
                      {when && isValid(when) ? format(when, 'PPp') : '—'}
                    </p>
                  </div>
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
