import { Link, useLocation } from 'react-router-dom';
import { Bell, Inbox } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROUTES, getPageMeta } from '../../constants/routes';
import UserAvatar from '../UserAvatar';
import BranchSwitcher from '../BranchSwitcher';
import BackButton from '../ui/BackButton';

export default function AppHeader({ unread = 0, onMenu }) {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const meta = getPageMeta(pathname);
  const isDoctor = user?.role === 'doctor';

  return (
    <header className="sticky top-0 z-20 h-14 shrink-0 bg-[#f6f4f0]/90 backdrop-blur-md border-b border-line">
      <div className="h-full w-full min-w-0 px-4 sm:px-5 lg:px-6 xl:px-8 flex items-center gap-2 sm:gap-3">
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

        {meta.backTo != null && <BackButton to={meta.backTo} />}

        <div className="min-w-0 flex-1">
          {!meta.hideTitle && (
            <>
              {meta.crumb && (
                <p className="hidden xs:block text-[11px] font-medium uppercase tracking-wider text-ink-faint leading-none mb-0.5">
                  {meta.crumb}
                </p>
              )}
              <h1 className="text-[15px] sm:text-base font-semibold text-ink truncate">{meta.title}</h1>
            </>
          )}
        </div>

        <BranchSwitcher compact />

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

        <Link
          to={ROUTES.profile}
          className="inline-flex items-center gap-2 min-h-10 pl-1 pr-1 sm:pr-2 rounded-lg hover:bg-white"
          aria-label="Settings"
        >
          <UserAvatar
            name={user?.name}
            profilePhoto={user?.profilePhoto}
            role={user?.role}
            size="sm"
          />
          <span className="hidden sm:block text-sm font-medium text-ink truncate max-w-[9rem]">
            {user?.name}
          </span>
        </Link>
      </div>
    </header>
  );
}
