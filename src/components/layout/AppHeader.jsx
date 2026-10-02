import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, Inbox, LogOut, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../constants/routes';
import BranchSwitcher from '../BranchSwitcher';
import TopNavSearch from '../TopNavSearch';
import UserAvatar, { getInitials } from '../UserAvatar';
import { can, P } from '../../constants/permissions';

export default function AppHeader({ unread = 0, onMenu }) {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isDoctor = user?.role === 'doctor';
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const hoverCloseTimer = useRef(null);

  useEffect(() => {
    setProfileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!profileOpen) return undefined;
    const onPointerDown = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setProfileOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [profileOpen]);

  useEffect(
    () => () => {
      if (hoverCloseTimer.current) clearTimeout(hoverCloseTimer.current);
    },
    []
  );

  const openProfileMenu = () => {
    if (hoverCloseTimer.current) clearTimeout(hoverCloseTimer.current);
    setProfileOpen(true);
  };

  const scheduleCloseProfileMenu = () => {
    if (hoverCloseTimer.current) clearTimeout(hoverCloseTimer.current);
    hoverCloseTimer.current = setTimeout(() => setProfileOpen(false), 140);
  };

  const handleLogout = async () => {
    setProfileOpen(false);
    await logout();
    navigate(ROUTES.login);
  };

  const displayName = String(user?.name || 'Account')
    .replace(/^Dr\.?\s*/i, '')
    .trim();
  const initial = getInitials(displayName).slice(0, 1) || 'U';
  const showSearch = can(user, P.SEARCH);

  return (
    <header className="sticky top-0 z-20 h-14 shrink-0 bg-[#f6f4f0]/90 backdrop-blur-md border-b border-line relative">
      <div className="h-full w-full min-w-0 px-4 sm:px-5 lg:px-6 xl:px-8 flex items-center gap-1.5 sm:gap-2.5">
        <button
          type="button"
          className="md:hidden min-h-10 min-w-10 inline-flex items-center justify-center rounded-lg text-ink-muted hover:bg-white"
          onClick={onMenu}
          aria-label="Open menu"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>

        {showSearch && (
          <div className="hidden md:block min-w-0 flex-1 max-w-md mr-auto">
            <TopNavSearch variant="field" className="w-full" />
          </div>
        )}

        {!showSearch && <div className="min-w-0 flex-1" />}
        {showSearch && <div className="md:hidden min-w-0 flex-1" />}

        {user?.role !== 'super_admin' && (
          <div className="hidden md:block">
            <BranchSwitcher compact />
          </div>
        )}

        {showSearch && (
          <div className="md:hidden">
            <TopNavSearch variant="icon" />
          </div>
        )}

        {isDoctor && (
          <>
            <Link
              to={ROUTES.doctorInbox}
              className="relative min-h-10 min-w-10 inline-flex items-center justify-center rounded-lg text-ink-muted hover:text-ink hover:bg-white"
              aria-label="Inbox"
            >
              <Inbox className="w-5 h-5" />
              {unread > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[1rem] h-4 px-1 rounded-full bg-ink text-[10px] font-bold text-accent-300 flex items-center justify-center">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </Link>
            <Link
              to={ROUTES.doctorNotifications}
              className="hidden xs:inline-flex relative min-h-10 min-w-10 items-center justify-center rounded-lg text-ink-muted hover:text-ink hover:bg-white"
              aria-label="Reminders"
            >
              <Bell className="w-5 h-5" />
            </Link>
          </>
        )}

        <div
          className="relative"
          ref={profileRef}
          onMouseEnter={openProfileMenu}
          onMouseLeave={scheduleCloseProfileMenu}
        >
          <button
            type="button"
            onClick={() => setProfileOpen((v) => !v)}
            onFocus={openProfileMenu}
            className="inline-flex items-center justify-center rounded-full hover:opacity-90 transition-opacity focus-visible:outline-none"
            aria-label="Profile menu"
            aria-expanded={profileOpen}
            aria-haspopup="menu"
          >
            {user?.profilePhoto ? (
              <UserAvatar
                name={displayName}
                profilePhoto={user.profilePhoto}
                role={user.role}
                size="sm"
                className="!h-9 !w-9 !ring-0"
              />
            ) : (
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#c0267a] text-white text-sm font-bold select-none">
                {initial}
              </span>
            )}
          </button>

          {profileOpen && (
            <div
              role="menu"
              className="absolute right-0 top-[calc(100%+0.4rem)] z-40 w-52 rounded-xl border border-line bg-white py-1 shadow-panel"
            >
              <div className="px-3 py-2 border-b border-line">
                <p className="text-sm font-semibold text-ink truncate">{displayName || 'Account'}</p>
                <p className="text-xs text-ink-faint truncate">{user?.email || ''}</p>
              </div>
              <Link
                role="menuitem"
                to={ROUTES.profile}
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-ink hover:bg-[#faf8f3]"
              >
                <User className="w-4 h-4 text-ink-muted" />
                Profile
              </Link>
              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-[#9b2c2c] hover:bg-[#fef2f2]"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
