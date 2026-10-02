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

function inboxBadgeClass(badge, tone) {
  const key = String(badge || '').toLowerCase();
  if (key === 'confirmation') {
    return 'bg-[#ecf7f1] text-[#18794a] border-[#b9dfc8]';
  }
  if (key === 'reminder' || key === 'whatsapp') {
    return 'bg-[#eef3f9] text-[#2f5f8f] border-[#c5d5e8]';
  }
  if (tone === 'ok') return 'bg-[#ecf7f1] text-[#18794a] border-[#b9dfc8]';
  if (tone === 'bad') return 'bg-[#fdf0ee] text-[#9b2c2c] border-[#e8c5c0]';
  if (tone === 'warn') return 'bg-[#fbf6ea] text-[#8a6a1f] border-[#e6d7a8]';
  return 'bg-[#f5f3ef] text-[#5c564c] border-[#e2ddd4]';
}

function Chip({ children, className = '' }) {
  return (
    <span
      className={`inline-flex items-center justify-center w-[7.25rem] h-7 px-2 rounded-full text-[10px] font-bold uppercase tracking-[0.08em] border ${className}`}
    >
      {children}
    </span>
  );
}

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
    if (n.link) navigate(n.link);
  };

  const visible = items;

  return (
    <div className="page-container">
      <PageHeader
        title="Inbox"
        description="Practice alerts. WhatsApp delivery history is in Reminders."
        toolbar={
          <div className="w-full min-w-0 sm:w-44">
            <Dropdown
              value={filter}
              onChange={setFilter}
              ariaLabel="Filter inbox"
              options={FILTER_OPTIONS}
            />
          </div>
        }
        actions={
          <div className="flex flex-row flex-nowrap items-center gap-2 shrink-0 ml-auto sm:ml-0">
            {unreadCount > 0 && (
              <button type="button" className="btn-secondary whitespace-nowrap" disabled={busy} onClick={markAll}>
                <CheckCheck className="w-4 h-4" /> Mark all read
              </button>
            )}
            <Link to={ROUTES.doctorNotifications} className="btn-secondary whitespace-nowrap">
              Reminders
            </Link>
          </div>
        }
      />

      {loading ? (
        <SkeletonRows count={PAGE_SIZE} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No notifications yet"
          description="Appointments, patients, and reminder outcomes will appear here."
        />
      ) : visible.length === 0 ? (
        <EmptyState icon={Inbox} title="No matches" description="Try another filter." />
      ) : (
        <>
          <div className="hidden md:block overflow-hidden rounded-xl border border-[#d8d2c8] bg-white shadow-[0_1px_2px_rgba(28,36,48,0.04)]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[56rem] table-fixed border-collapse text-sm">
                <colgroup>
                  <col className="w-[20%]" />
                  <col className="w-[28%]" />
                  <col className="w-[14%]" />
                  <col className="w-[16%]" />
                  <col className="w-[12%]" />
                  <col className="w-[10%]" />
                </colgroup>
                <thead>
                  <tr className="bg-[#f3efe8]">
                    {['Alert', 'Details', 'Type', 'Received', 'Status', 'Action'].map((label) => (
                      <th
                        key={label}
                        className="px-3 py-3 text-left text-[11px] font-bold uppercase tracking-[0.1em] text-[#6b6254] border-b border-[#d8d2c8] border-r border-[#e4dfd6] last:border-r-0 whitespace-nowrap"
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visible.map((n, idx) => {
                    const unread = !n.readAt;
                    const when = n.createdAt ? new Date(n.createdAt) : null;
                    const view = formatInboxItem(n);
                    const chipClass = inboxBadgeClass(view.badge, view.badgeTone);
                    const rowBg = unread ? 'bg-[#faf8f3]' : idx % 2 === 0 ? 'bg-white' : 'bg-[#faf8f4]';

                    return (
                      <tr
                        key={n._id}
                        className={`${rowBg} hover:bg-[#f5f1ea] transition-colors cursor-pointer`}
                        onClick={() => openItem(n)}
                      >
                        <td className="px-3 py-2.5 border-b border-r border-[#e4dfd6] align-middle text-left">
                          <div className="flex items-center gap-2 min-w-0">
                            {unread ? (
                              <span className="w-1.5 h-1.5 rounded-full bg-[#c9a227] shrink-0" aria-label="Unread" />
                            ) : (
                              <span className="w-1.5 h-1.5 shrink-0" aria-hidden />
                            )}
                            <p
                              className={`truncate ${unread ? 'font-semibold text-ink' : 'font-medium text-ink'}`}
                              title={view.title}
                            >
                              {view.title}
                            </p>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 border-b border-r border-[#e4dfd6] align-middle text-left text-ink-muted">
                          <p className="truncate" title={view.subtitle || view.extra || ''}>
                            {view.subtitle || view.extra || '—'}
                          </p>
                          {view.subtitle && view.extra ? (
                            <p className="text-[11px] text-ink-faint mt-0.5 line-clamp-1">{view.extra}</p>
                          ) : null}
                        </td>
                        <td className="px-3 py-2.5 border-b border-r border-[#e4dfd6] align-middle text-left">
                          <Chip className={chipClass}>{view.badge}</Chip>
                        </td>
                        <td className="px-3 py-2.5 border-b border-r border-[#e4dfd6] align-middle text-left text-ink-muted whitespace-nowrap">
                          {when && isValid(when) ? format(when, 'MMM d · h:mm a') : '—'}
                        </td>
                        <td className="px-3 py-2.5 border-b border-r border-[#e4dfd6] align-middle text-left">
                          <Chip
                            className={
                              unread
                                ? 'bg-[#fbf6ea] text-[#8a6a1f] border-[#e6d7a8]'
                                : 'bg-[#f3f3f4] text-[#6b7280] border-[#e0e0e3]'
                            }
                          >
                            {unread ? 'Unread' : 'Read'}
                          </Chip>
                        </td>
                        <td className="px-3 py-2.5 border-b border-[#e4dfd6] align-middle text-left">
                          <button
                            type="button"
                            className="inline-flex items-center justify-center h-8 min-w-[4.5rem] px-2 rounded-md text-[11px] font-semibold text-ink bg-white border border-[#d8d2c8] hover:border-[#c9a227]/60"
                            onClick={(e) => {
                              e.stopPropagation();
                              openItem(n);
                            }}
                          >
                            Open →
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="md:hidden space-y-2">
            {visible.map((n) => {
              const unread = !n.readAt;
              const when = n.createdAt ? new Date(n.createdAt) : null;
              const view = formatInboxItem(n);
              const chipClass = inboxBadgeClass(view.badge, view.badgeTone);

              return (
                <article
                  key={n._id}
                  className={`card !p-3.5 cursor-pointer ${unread ? 'bg-[#faf8f3]' : ''}`}
                  onClick={() => openItem(n)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className={`text-sm truncate ${unread ? 'font-semibold text-ink' : 'font-medium text-ink'}`}>
                        {view.title}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-muted truncate">{view.subtitle || '—'}</p>
                      <p className="mt-1 text-[11px] text-ink-faint">
                        {when && isValid(when) ? format(when, 'MMM d · h:mm a') : '—'}
                      </p>
                    </div>
                    <Chip className={chipClass}>{view.badge}</Chip>
                  </div>
                  <div className="mt-3 flex items-center gap-1.5">
                    <Chip
                      className={
                        unread
                          ? 'bg-[#fbf6ea] text-[#8a6a1f] border-[#e6d7a8]'
                          : 'bg-[#f3f3f4] text-[#6b7280] border-[#e0e0e3]'
                      }
                    >
                      {unread ? 'Unread' : 'Read'}
                    </Chip>
                    <span className="ml-auto inline-flex items-center h-8 px-2 rounded-md text-[11px] font-semibold text-ink bg-white border border-[#d8d2c8]">
                      Open →
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}

      <Pagination page={page} pages={pages} total={total} limit={PAGE_SIZE} onPage={load} />
    </div>
  );
}
