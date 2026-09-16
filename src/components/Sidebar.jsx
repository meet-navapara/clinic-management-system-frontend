import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  User,
  Calendar,
  CalendarDays,
  LayoutDashboard,
  Leaf,
  Bell,
  Users,
  Inbox,
  X,
  Receipt,
  Warehouse,
  Pill,
  GitBranch,
  IdCard,
  ListOrdered,
  Megaphone,
  FileText,
  Printer,
  IndianRupee,
  ClipboardList,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { LOGO_URL, APP_NAME } from '../constants/branding';
import { ROUTES, getDashboardPath } from '../constants/routes';
import BranchSwitcher from './BranchSwitcher';
import api from '../utils/api';
import { can, P, isStaffUser } from '../constants/permissions';

function navClass(active, collapsed) {
  return `nav-item ${collapsed ? '!justify-center !px-0 !gap-0' : ''} ${
    active
      ? 'bg-[#1c2430] text-white'
      : 'text-ink-muted hover:text-ink hover:bg-[#f3efe8]'
  }`;
}

function getNavLinks(user) {
  const role = user?.role;
  if (role === 'super_admin') {
    return [
      { to: ROUTES.clinicAdminDashboard, label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: ROUTES.clinicAdminDoctors, label: 'Doctors', icon: Users, end: true },
      { to: ROUTES.profile, label: 'Profile', icon: User, end: true },
    ];
  }
  if (role === 'doctor') {
    return [
      { to: ROUTES.doctorDashboard, label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: ROUTES.doctorCalendar, label: 'Appointments', icon: CalendarDays, end: true },
      { to: ROUTES.doctorPatients, label: 'Patients', icon: Users, match: 'patients' },
      { to: ROUTES.queue, label: 'Queue', icon: ListOrdered, end: true },
      { to: ROUTES.doctorBook, label: 'Schedule', icon: Calendar, end: true },
      { to: ROUTES.doctorNotifications, label: 'Follow-ups', icon: Bell, end: true },
      { to: ROUTES.branches, label: 'Branches', icon: GitBranch, end: true },
      { to: ROUTES.staff, label: 'Staff', icon: IdCard, end: true },
      { to: ROUTES.billing, label: 'Billing', icon: Receipt, end: true },
      { to: ROUTES.revenue, label: 'Revenue', icon: IndianRupee, end: true },
      { to: ROUTES.medicines, label: 'Medicines', icon: Pill, end: true },
      { to: ROUTES.inventory, label: 'Inventory', icon: Warehouse, end: true },
      { to: ROUTES.templates, label: 'Templates', icon: ClipboardList, end: true },
      { to: ROUTES.consent, label: 'Consent Forms', icon: FileText, end: true },
      { to: ROUTES.campaigns, label: 'Campaigns', icon: Megaphone, end: true },
      { to: ROUTES.printSettings, label: 'Print Settings', icon: Printer, end: true },
      { to: ROUTES.doctorInbox, label: 'Inbox', icon: Inbox, end: true, badge: 'inbox' },
      { to: ROUTES.profile, label: 'Profile', icon: User, end: true },
    ];
  }
  if (isStaffUser(user)) {
    const links = [{ to: ROUTES.deskDashboard, label: 'Dashboard', icon: LayoutDashboard, end: true }];
    if (can(user, P.APPOINTMENTS_VIEW)) links.push({ to: ROUTES.doctorCalendar, label: 'Appointments', icon: CalendarDays, end: true });
    if (can(user, P.PATIENTS_VIEW)) links.push({ to: ROUTES.doctorPatients, label: 'Patients', icon: Users, match: 'patients' });
    if (can(user, P.QUEUE_MANAGE)) links.push({ to: ROUTES.queue, label: 'Queue', icon: ListOrdered, end: true });
    if (can(user, P.APPOINTMENTS_MANAGE)) links.push({ to: ROUTES.doctorBook, label: 'Schedule', icon: Calendar, end: true });
    if (can(user, P.BILLING_VIEW)) links.push({ to: ROUTES.billing, label: 'Billing', icon: Receipt, end: true });
    if (can(user, P.REVENUE_ALL)) links.push({ to: ROUTES.revenue, label: 'Revenue', icon: IndianRupee, end: true });
    if (can(user, P.MEDICINE_USE) || can(user, P.MEDICINE_MANAGE)) links.push({ to: ROUTES.medicines, label: 'Medicines', icon: Pill, end: true });
    if (can(user, P.INVENTORY_VIEW) || can(user, P.INVENTORY_MANAGE)) links.push({ to: ROUTES.inventory, label: 'Inventory', icon: Warehouse, end: true });
    if (can(user, P.BRANCHES_VIEW)) links.push({ to: ROUTES.branches, label: 'Branches', icon: GitBranch, end: true });
    // Branch create/disable stays Doctor-only even if BRANCHES_MANAGE was granted historically.
    if (can(user, P.TEMPLATES_OWN) || can(user, P.TEMPLATES_CLINIC)) links.push({ to: ROUTES.templates, label: 'Templates', icon: ClipboardList, end: true });
    if (can(user, P.CONSENT_CAPTURE) || can(user, P.CONSENT_TEMPLATES)) links.push({ to: ROUTES.consent, label: 'Consent Forms', icon: FileText, end: true });
    if (can(user, P.CAMPAIGNS_MANAGE)) links.push({ to: ROUTES.campaigns, label: 'Campaigns', icon: Megaphone, end: true });
    if (can(user, P.PRINT_SETTINGS)) links.push({ to: ROUTES.printSettings, label: 'Print Settings', icon: Printer, end: true });
    links.push({ to: ROUTES.profile, label: 'Profile', icon: User, end: true });
    return links;
  }
  return [{ to: ROUTES.profile, label: 'Profile', icon: User, end: true }];
}

function isLinkActive(pathname, search, item, navActive) {
  if (item.match === 'patients') {
    return (
      pathname === ROUTES.doctorPatients ||
      (pathname.startsWith('/doctor/patients/') && pathname !== ROUTES.doctorPatientNew)
    );
  }
  if (item.to.includes('?')) {
    const [path, query] = item.to.split('?');
    return pathname === path && search.replace(/^\?/, '') === query;
  }
  if (item.to === ROUTES.clinicAdminDashboard) {
    return pathname === ROUTES.clinicAdminDashboard;
  }
  if (item.to === ROUTES.clinicAdminDoctors) {
    return pathname === ROUTES.clinicAdminDoctors || pathname.startsWith('/admin/doctors/');
  }
  return navActive;
}

function NavList({ links, pathname, search, unread, collapsed, onNavigate }) {
  return (
    <nav className={`flex-1 overflow-y-auto py-3 space-y-0.5 ${collapsed ? 'px-1.5' : 'px-2.5'}`} aria-label="Main">
      {links.map((item) => {
        const { to, label, icon: Icon, end, badge } = item;
        return (
          <NavLink
            key={to}
            to={to}
            end={end}
            title={collapsed ? label : undefined}
            onClick={onNavigate}
            className={({ isActive }) => navClass(isLinkActive(pathname, search, item, isActive), collapsed)}
          >
            <span className="relative shrink-0">
              {Icon ? <Icon className="w-4 h-4" /> : null}
              {badge === 'inbox' && unread > 0 && collapsed && (
                <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-accent-400" />
              )}
            </span>
            {!collapsed && (
              <>
                <span className="flex-1 truncate">{label}</span>
                {badge === 'inbox' && unread > 0 && (
                  <span className="min-w-[1.25rem] h-5 px-1.5 rounded-full bg-accent-400/20 text-accent-700 text-[10px] font-bold flex items-center justify-center">
                    {unread > 99 ? '99+' : unread}
                  </span>
                )}
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}

export default function Sidebar({ open, onClose, unread = 0, onUnread }) {
  const { user } = useAuth();
  const { pathname, search } = useLocation();
  const [logoError, setLogoError] = useState(false);

  const links = user ? getNavLinks(user) : [];
  const brandPath = user ? getDashboardPath(user.role, user) : '/';

  useEffect(() => {
    if (user?.role !== 'doctor' || user?.approvalStatus !== 'approved') return undefined;
    let cancelled = false;
    const load = () => {
      api
        .get('/notifications/inbox', { params: { page: 1, limit: 1 } })
        .then((res) => {
          if (!cancelled) onUnread?.(res.data.unreadCount || 0);
        })
        .catch(() => {});
    };
    load();
    const id = setInterval(load, 60000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [user, pathname, onUnread]);

  const panel = (collapsed) => (
    <aside className={`flex h-full flex-col bg-white border-r border-line ${collapsed ? 'w-[4.25rem]' : 'w-60'}`}>
      <div
        className={`relative flex items-center justify-start border-b border-line shrink-0 ${
          collapsed ? 'h-14 px-1' : 'h-16 px-3'
        }`}
      >
        <Link
          to={brandPath}
          className="navbar-brand justify-center"
          onClick={onClose}
          aria-label={APP_NAME}
        >
          {!logoError ? (
            <img
              src={LOGO_URL}
              alt=""
              className={
                collapsed
                  ? 'h-10 w-auto max-w-[3rem] object-contain rounded-md'
                  : 'block h-11 w-auto max-w-[11.5rem] object-contain rounded-md'
              }
              draggable={false}
              onError={() => setLogoError(true)}
            />
          ) : (
            <Leaf className="w-7 h-7 text-accent-600 shrink-0" />
          )}
        </Link>
        {!collapsed && (
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 lg:hidden p-2 rounded-lg text-ink-muted hover:bg-[#f3efe8]"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {!collapsed && user?.role !== 'super_admin' && (
        <div className="md:hidden px-2.5 pt-3 pb-2 border-b border-line">
          <p className="px-1 mb-1.5 text-[11px] font-medium uppercase tracking-wider text-ink-faint">
            Branch
          </p>
          <BranchSwitcher />
        </div>
      )}

      <NavList
        links={links}
        pathname={pathname}
        search={search}
        unread={unread}
        collapsed={collapsed}
        onNavigate={onClose}
      />
    </aside>
  );

  return (
    <>
      <div className="hidden md:flex lg:hidden md:fixed md:inset-y-0 md:left-0 md:z-30">
        {panel(true)}
      </div>
      <div className="hidden lg:flex lg:flex-col lg:w-60 lg:shrink-0 lg:fixed lg:inset-y-0 lg:left-0 lg:z-30">
        {panel(false)}
      </div>

      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-ink/40" onClick={onClose} aria-hidden="true" />
          <div className="relative z-10 h-full shadow-panel">{panel(false)}</div>
        </div>
      )}
    </>
  );
}
