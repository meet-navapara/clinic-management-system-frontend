import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LogOut,
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
  Search,
  IndianRupee,
  ClipboardList,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useBranch } from '../context/BranchContext';
import { LOGO_URL, APP_NAME, BRAND_NAME } from '../constants/branding';
import { ROUTES, getDashboardPath } from '../constants/routes';
import UserAvatar from './UserAvatar';
import api from '../utils/api';
import { can, P, isStaffUser } from '../constants/permissions';

function navClass(active, collapsed) {
  return `flex items-center ${collapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2.5 rounded-lg text-sm font-medium transition-colors min-h-10 ${
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
      { to: `${ROUTES.clinicAdminDashboard}?status=pending`, label: 'Doctor Approvals', icon: Users, end: false },
      { to: `${ROUTES.clinicAdminDashboard}?status=all`, label: 'Doctors', icon: IdCard, end: false },
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
      { to: ROUTES.search, label: 'Search', icon: Search, end: true },
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
    if (can(user, P.SEARCH)) links.push({ to: ROUTES.search, label: 'Search', icon: Search, end: true });
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
    return pathname === ROUTES.clinicAdminDashboard && !search;
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
  const { user, logout } = useAuth();
  const { current } = useBranch();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const [logoError, setLogoError] = useState(false);

  const links = user ? getNavLinks(user) : [];
  const brandPath = user ? getDashboardPath(user.role, user) : '/';

  useEffect(() => {
    if (user?.role !== 'doctor' || user?.approvalStatus !== 'approved') return undefined;
    let cancelled = false;
    const load = () => {
      api
        .get('/notifications/inbox')
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

  const handleLogout = () => {
    logout();
    onClose?.();
    navigate(user?.role === 'super_admin' ? ROUTES.clinicAdminLogin : ROUTES.login);
  };

  const panel = (collapsed) => (
    <aside className={`flex h-full flex-col bg-white border-r border-line ${collapsed ? 'w-[4.25rem]' : 'w-60'}`}>
      <div className={`flex items-center h-14 border-b border-line shrink-0 ${collapsed ? 'justify-center px-1' : 'gap-2 px-4'}`}>
        <Link to={brandPath} className="navbar-brand" onClick={onClose} aria-label={APP_NAME}>
          {!logoError ? (
            <img
              src={LOGO_URL}
              alt=""
              className="h-8 w-auto object-contain shrink-0"
              draggable={false}
              onError={() => setLogoError(true)}
            />
          ) : (
            <Leaf className="w-5 h-5 text-accent-600 shrink-0" />
          )}
          {!collapsed && (
            <span className="navbar-brand-name">{BRAND_NAME}</span>
          )}
        </Link>
        {!collapsed && (
          <button
            type="button"
            className="ml-auto lg:hidden p-2 rounded-lg text-ink-muted hover:bg-[#f3efe8]"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <NavList
        links={links}
        pathname={pathname}
        search={search}
        unread={unread}
        collapsed={collapsed}
        onNavigate={onClose}
      />

      <div className={`border-t border-line shrink-0 ${collapsed ? 'p-2' : 'p-3'} space-y-2`}>
        {!collapsed && (
          <div className="flex items-center gap-2.5 min-w-0 px-1">
            <UserAvatar name={user?.name} profilePhoto={user?.profilePhoto} role={user?.role} size="sm" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink truncate">{user?.name}</p>
              <p className="text-xs text-ink-faint">
                {user?.role === 'super_admin'
                  ? 'Super Admin'
                  : user?.role === 'doctor'
                    ? 'Doctor'
                    : (user?.staffType || user?.role || 'Staff').replace(/_/g, ' ')}
              </p>
              {isStaffUser(user) && (
                <p className="text-[11px] text-ink-faint truncate">
                  {user?.clinicName ? `${user.clinicName}` : 'Clinic'}
                  {current?.name ? ` · ${current.name}` : ''}
                </p>
              )}
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={handleLogout}
          title="Logout"
          className={`flex items-center min-h-10 rounded-lg text-sm font-medium text-[#9b2c2c] hover:bg-[#fef2f2] ${
            collapsed ? 'w-full justify-center' : 'w-full justify-center gap-2 px-3'
          }`}
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && 'Logout'}
        </button>
      </div>
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
