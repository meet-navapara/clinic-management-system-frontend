import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, Calendar, LayoutDashboard, Menu, X, Leaf } from 'lucide-react';
import { LOGO_URL, APP_NAME, BRAND_NAME } from '../constants/branding';
import { ROUTES } from '../constants/routes';
import UserAvatar from './UserAvatar';


const centerNavClass = ({ isActive }) =>
  `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
    isActive
      ? 'bg-[#fdfaf0] text-[#2a2420] ring-1 ring-[#d4af37]/40 shadow-sm'
      : 'text-[#5c534a] hover:text-[#2a2420] hover:bg-[#faf7f2]'
  }`;

const mobileNavLinkClass = ({ isActive }) =>
  `flex items-center gap-3 px-3 py-3 rounded-lg font-medium transition-colors text-sm ${
    isActive
      ? 'bg-[#fdfaf0] text-[#2a2420] ring-1 ring-[#d4af37]/35'
      : 'text-[#3d3530] hover:bg-[#faf7f2]'
  }`;

const ROLE_STYLES = {
  doctor: {
    label: 'Doctor',
    badge: 'bg-[#2a2420] text-[#e8c547] ring-[#d4af37]/40',
    avatarRing: 'ring-[#d4af37]/60',
    avatarBg: 'bg-gradient-to-br from-[#2a2420] to-[#3d3530]',
  },
  patient: {
    label: 'Patient',
    badge: 'bg-[#fdf6e3] text-[#876719] ring-[#d4af37]/30',
    avatarRing: 'ring-[#d4af37]/40',
    avatarBg: 'bg-gradient-to-br from-[#a8841f] to-[#876719]',
  },
};

function UserIdentity({ user, variant = 'desktop' }) {
  const roleKey = user.role === 'doctor' ? 'doctor' : 'patient';
  const roleStyle = ROLE_STYLES[roleKey];
  const isDesktop = variant === 'desktop';

  if (!isDesktop) {
    return (
      <div
        className="flex items-center gap-3 rounded-xl bg-white px-3 py-2.5 ring-1 ring-[#ebe4d8] shadow-sm min-w-0"
        aria-label={`Signed in as ${user.name}, ${roleStyle.label}`}
      >
        <UserAvatar
          name={user.name}
          profilePhoto={user.profilePhoto}
          role={user.role}
          size="md"
        />
        <div className="min-w-0">
          <p className="font-semibold text-[#2a2420] truncate text-sm leading-tight">{user.name}</p>
          <span
            className={`inline-flex items-center mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ${roleStyle.badge}`}
          >
            {roleStyle.label}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative group"
      aria-label={`Signed in as ${user.name}, ${roleStyle.label}`}
    >
      <UserAvatar
        name={user.name}
        profilePhoto={user.profilePhoto}
        role={user.role}
        size="md"
        className="cursor-default"
      />

      <div
        className="absolute mt-1 top-full left-1/2 -translate-x-1/2 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[60] pointer-events-none"
        role="tooltip"
      >
        <div className="relative rounded-xl bg-white px-3.5 py-2.5 shadow-lg ring-1 ring-[#ebe4d8] text-center min-w-[9rem] max-w-[12rem]">
          <span
            className="absolute -top-1 left-1/2 -translate-x-1/2 h-2 w-2 rotate-45 bg-white ring-1 ring-[#ebe4d8] ring-b-0 ring-r-0"
            aria-hidden="true"
          />
          <p className="font-semibold text-sm text-[#2a2420] truncate leading-tight">{user.name}</p>
          <span
            className={`inline-flex items-center mt-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ${roleStyle.badge}`}
          >
            {roleStyle.label}
          </span>
        </div>
      </div>
    </div>
  );
}

function LogoutButton({ onClick, variant = 'desktop' }) {
  if (variant === 'mobile') {
    return (
      <div className="pt-3 mt-2 border-t border-[#ebe4d8]">
        <button
          type="button"
          onClick={onClick}
          className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-semibold text-red-600 bg-red-50/90 ring-1 ring-red-200/70 hover:bg-red-100 hover:ring-red-300 transition-all"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Logout
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-2 py-2 rounded-lg text-sm font-semibold text-red-600 bg-red-50/80 ring-1 ring-red-200/60 hover:bg-red-100 hover:ring-red-300 hover:text-red-700 transition-all shrink-0 shadow-sm"
      title="Logout"
      aria-label="Logout"
    >
      <LogOut className="w-4 h-4 shrink-0" />
    </button>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate(ROUTES.login);
  };

  const closeMenu = () => setMenuOpen(false);

  const brandPath = user ? `/${user.role}/dashboard` : '/';

  const centerLinks = user
    ? [
        { to: `/${user.role}/dashboard`, label: 'Dashboard', icon: LayoutDashboard },
        { to: '/appointments', label: 'Appointments', icon: Calendar },
        { to: '/profile', label: 'Profile', icon: User },
      ]
    : [];

  return (
    <nav className="bg-white/95 backdrop-blur-sm border-b border-[#ebe4d8] sticky top-0 z-50 shadow-sm w-full">
      <div className="site-container !px-4 sm:!px-8 lg:!px-12">
        <div className="relative flex items-center justify-between h-16 sm:h-[4.25rem] lg:h-[4.75rem] xl:h-20">
          {/* Left — Logo */}
          <div className="flex-shrink-0 z-10">
            <Link to={brandPath} className="navbar-brand group" onClick={closeMenu} aria-label={APP_NAME}>
              {!logoError ? (
                <img
                  src={LOGO_URL}
                  alt=""
                  className="navbar-brand-emblem-img"
                  draggable={false}
                  onError={() => setLogoError(true)}
                />
              ) : (
                <Leaf className="w-6 h-6 sm:w-7 sm:h-7 text-[#a8841f] shrink-0" />
              )}
              <div className="flex flex-col justify-center min-w-0 gap-0 leading-none">
                <span className="navbar-brand-name group-hover:text-[#876719] transition-colors">
                  {BRAND_NAME}
                </span>
                <span className="navbar-brand-tagline">
                  <span className="h-px w-2.5 sm:w-4 lg:w-5 bg-gradient-to-r from-transparent to-[#d4af37]" />
                  <span className="text-[8px] sm:text-xs lg:text-[12px] font-semibold text-[#a8841f] uppercase tracking-[0.16em] sm:tracking-[0.28em]">
                    Ayurveda
                  </span>
                  <span className="h-px w-2.5 sm:w-4 lg:w-5 bg-gradient-to-l from-transparent to-[#d4af37]" />
                </span>
              </div>
            </Link>
          </div>

          {/* Center — Main navigation */}
          {user && (
            <nav
              className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center gap-1 lg:gap-2"
              aria-label="Main navigation"
            >
              {centerLinks.map(({ to, label, icon: Icon }) => (
                <NavLink key={to} to={to} className={centerNavClass}>
                  <Icon className="w-4 h-4 text-[#a8841f] shrink-0" />
                  {label}
                </NavLink>
              ))}
            </nav>
          )}

          {/* Right — Name, role (read-only), logout */}
          <div className="flex items-center gap-1 sm:gap-2 z-10 ml-auto">
            {user ? (
              <div className="hidden md:flex items-center gap-2 pl-3 border-l border-[#ebe4d8]">
                <UserIdentity user={user} variant="desktop" />
                <LogoutButton onClick={handleLogout} />
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <NavLink to="/login" className={centerNavClass}>
                  Login
                </NavLink>
                <Link to="/register" className="btn-primary text-sm !py-2 !px-4">
                  Sign Up
                </Link>
              </div>
            )}

            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-lg text-[#5c534a] hover:bg-[#faf7f2] transition-colors"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div
          className="md:hidden fixed inset-0 top-16 sm:top-[4.25rem] lg:top-[4.75rem] xl:top-20 bg-black/30 z-40"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}

      <div
        className={`md:hidden absolute left-0 right-0 top-full bg-white border-b border-[#ebe4d8] shadow-lg z-50 transition-all duration-200 origin-top ${
          menuOpen
            ? 'opacity-100 scale-y-100 max-h-[80vh] overflow-y-auto'
            : 'opacity-0 scale-y-0 max-h-0 overflow-hidden pointer-events-none'
        }`}
      >
        <div className="px-4 py-3 space-y-1">
          {user && (
            <div className="mb-2">
              <UserIdentity user={user} variant="mobile" />
            </div>
          )}

          {user
            ? centerLinks.map(({ to, label, icon: Icon }) => (
                <NavLink key={to} to={to} onClick={closeMenu} className={mobileNavLinkClass}>
                  <Icon className="w-5 h-5 text-[#a8841f]" />
                  {label}
                </NavLink>
              ))
            : (
              <>
                <Link
                  to="/login"
                  onClick={closeMenu}
                  className="block text-center px-4 py-3 rounded-lg font-medium transition-colors text-sm text-[#3d3530] hover:bg-[#faf7f2]"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={closeMenu}
                  className="btn-primary block text-center w-full !py-3 text-sm"
                >
                  Sign Up
                </Link>
              </>
            )}

          {user && <LogoutButton onClick={handleLogout} variant="mobile" />}
        </div>
      </div>
    </nav>
  );
}
