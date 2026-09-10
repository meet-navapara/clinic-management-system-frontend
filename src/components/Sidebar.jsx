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
  UserPlus,
  Inbox,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { LOGO_URL, APP_NAME, BRAND_NAME } from '../constants/branding';
import { ROUTES, getDashboardPath } from '../constants/routes';
import UserAvatar from './UserAvatar';
import api from '../utils/api';

function navClass(active, collapsed) {
  return `flex items-center ${collapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2.5 rounded-lg text-sm font-medium transition-colors min-h-10 ${
    active
      ? 'bg-[#1c2430] text-white'
      : 'text-ink-muted hover:text-ink hover:bg-[#f3efe8]'
  }`;
}

function getNavLinks(role) {
  if (role === 'doctor') {
    return [
      { to: ROUTES.doctorDashboard, label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: ROUTES.doctorCalendar, label: 'Calendar', icon: CalendarDays, end: true },
      { to: ROUTES.doctorPatients, label: 'Patients', icon: Users, match: 'patients' },
      { to: ROUTES.doctorPatientNew, label: 'Add patient', icon: UserPlus, end: true },
      { to: ROUTES.doctorBook, label: 'Schedule', icon: Calendar, end: true },
      { to: ROUTES.doctorInbox, label: 'Inbox', icon: Inbox, end: true, badge: 'inbox' },
      { to: ROUTES.doctorNotifications, label: 'Reminders', icon: Bell, end: true },
      { to: ROUTES.profile, label: 'Settings', icon: User, end: true },
    ];
  }
  if (role === 'clinic_admin' || role === 'super_admin') {
    return [
      { to: ROUTES.clinicAdminDashboard, label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: ROUTES.profile, label: 'Settings', icon: User, end: true },
    ];
  }
  return [];
}

function isLinkActive(pathname, item, navActive) {
  if (item.match === 'patients') {
    return (
      pathname === ROUTES.doctorPatients ||
      (pathname.startsWith('/doctor/patients/') && pathname !== ROUTES.doctorPatientNew)
    );
  }
  return navActive;
}

function NavList({ links, pathname, unread, collapsed, onNavigate }) {
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
            className={({ isActive }) => navClass(isLinkActive(pathname, item, isActive), collapsed)}
          >
            <span className="relative shrink-0">
              <Icon className="w-4 h-4" />
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
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [logoError, setLogoError] = useState(false);

  const links = user ? getNavLinks(user.role) : [];
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
    navigate(ROUTES.login);
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
                {user?.role === 'clinic_admin' || user?.role === 'super_admin' ? 'Admin' : 'Doctor'}
              </p>
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
